#!/bin/bash
# context-manager.sh - Context state management
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Defaults
WARNING_THRESHOLD=50000
LIMIT_THRESHOLD=80000

# Load thresholds from settings file
if [ -f "$SETTINGS_FILE" ] && command -v jq &> /dev/null; then
    WARNING_THRESHOLD=$(jq -r '.context.warning_threshold // 50000' "$SETTINGS_FILE")
    LIMIT_THRESHOLD=$(jq -r '.context.limit_threshold // 80000' "$SETTINGS_FILE")
fi

# Create context directory
mkdir -p "$CONTEXT_DIR"

# Option handling
ACTION="status"
DESCRIPTION=""
RESTORE_FILE=""
OUTPUT_JSON=false

TRIGGER_LEVEL=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --save) ACTION="save"; shift; DESCRIPTION="$1" ;;
        --compress) ACTION="compress" ;;
        --restore) ACTION="restore"; shift; RESTORE_FILE="$1" ;;
        --list) ACTION="list" ;;
        --clean) ACTION="clean" ;;
        --json) OUTPUT_JSON=true ;;
        --auto-compact) ACTION="auto_compact"; shift; TRIGGER_LEVEL="$1" ;;
        *) if [ -z "$DESCRIPTION" ]; then DESCRIPTION="$1"; fi ;;
    esac
    shift 2>/dev/null || true
done

# Get current stage
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        jq -r '.current_stage // "none"' "$PROGRESS_FILE"
    else
        echo "unknown"
    fi
}

# Estimate tokens (simple estimation)
estimate_tokens() {
    # In practice, conversation logs should be analyzed, but this is a placeholder
    # Actual implementation would reference Claude API or log files
    echo "45000"  # placeholder
}

# Generate progress bar
progress_bar() {
    local percent=$1
    local width=20
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    printf "["
    for ((i=0; i<filled; i++)); do printf "█"; done
    for ((i=0; i<empty; i++)); do printf "░"; done
    printf "]"
}

# Show status
show_status() {
    local CURRENT_STAGE=$(get_current_stage)
    local ESTIMATED_TOKENS=$(estimate_tokens)
    local PERCENT=$((ESTIMATED_TOKENS * 100 / LIMIT_THRESHOLD))

    # Determine status
    local STATUS_TEXT="Normal"
    local STATUS_COLOR=$GREEN
    if [ "$ESTIMATED_TOKENS" -ge "$LIMIT_THRESHOLD" ]; then
        STATUS_TEXT="Limit Exceeded"
        STATUS_COLOR=$RED
    elif [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        STATUS_TEXT="Warning"
        STATUS_COLOR=$YELLOW
    fi

    if [ "$OUTPUT_JSON" = true ]; then
        echo "{\"tokens\":$ESTIMATED_TOKENS,\"limit\":$LIMIT_THRESHOLD,\"warning\":$WARNING_THRESHOLD,\"stage\":\"$CURRENT_STAGE\",\"percent\":$PERCENT}"
        return
    fi

    if [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "⚠️ ${WHITE}Context Status${NC} - ${STATUS_COLOR}${STATUS_TEXT}${NC}"
    else
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "📊 ${WHITE}Context Status${NC}"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "Token usage: ${CYAN}~${ESTIMATED_TOKENS}${NC} / ${LIMIT_THRESHOLD}"
    echo -e "Status: $(progress_bar $PERCENT) ${PERCENT}% [${STATUS_COLOR}${STATUS_TEXT}${NC}]"
    echo ""
    echo "Thresholds:"
    if [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        echo -e "• Warning (${WARNING_THRESHOLD}): ${YELLOW}Exceeded${NC}"
    else
        echo -e "• Warning (${WARNING_THRESHOLD}): Within limit"
    fi
    echo -e "• Limit (${LIMIT_THRESHOLD}): ~$((LIMIT_THRESHOLD - ESTIMATED_TOKENS)) tokens remaining"
    echo ""
    echo -e "Current stage: ${CYAN}$CURRENT_STAGE${NC}"

    # List saved snapshots
    if [ -d "$CONTEXT_DIR" ]; then
        SNAPSHOTS=$(ls -1 "$CONTEXT_DIR"/state-*.md 2>/dev/null | wc -l | tr -d ' ')
        if [ "$SNAPSHOTS" -gt 0 ]; then
            echo ""
            echo "[Saved Snapshots]"
            ls -1t "$CONTEXT_DIR"/state-*.md 2>/dev/null | head -3 | while read -r f; do
                echo "• $(basename "$f")"
            done
        fi
    fi

    echo ""

    # Recommended actions when warning
    if [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        echo -e "${YELLOW}⚠️ Warning threshold exceeded!${NC}"
        echo ""
        echo "Recommended actions:"
        echo "1. Compress with /context --compress"
        echo "2. /context --save then /clear"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Save snapshot
save_snapshot() {
    local CURRENT_STAGE=$(get_current_stage)
    local TIMESTAMP=$(date +%Y%m%d-%H%M)
    local TIMESTAMP_READABLE=$(date "+%Y-%m-%d %H:%M")
    local FILENAME="state-$TIMESTAMP.md"
    local FILEPATH="$CONTEXT_DIR/$FILENAME"

    if [ -z "$DESCRIPTION" ]; then
        DESCRIPTION="Context snapshot"
    fi

    cat > "$FILEPATH" << EOF
# Work State Save - $TIMESTAMP_READABLE

## Description
$DESCRIPTION

## Current Stage
$CURRENT_STAGE

## Progress
EOF

    # Extract info from progress.json
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        echo "" >> "$FILEPATH"
        echo "### Stage Status" >> "$FILEPATH"
        jq -r '.stages | to_entries[] | "- \(.key): \(.value.status // "pending")"' "$PROGRESS_FILE" >> "$FILEPATH" 2>/dev/null || true
    fi

    cat >> "$FILEPATH" << EOF

## Recovery Instructions
1. Read this file
2. Reference stages/$CURRENT_STAGE/CLAUDE.md
3. Resume work

## Reference Files
- state/progress.json
- stages/$CURRENT_STAGE/outputs/
EOF

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "💾 ${WHITE}Context Snapshot Saved${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "File: ${CYAN}$FILEPATH${NC}"
    echo -e "Description: $DESCRIPTION"
    echo -e "Stage: $CURRENT_STAGE"
    echo ""
    echo "[Saved Contents]"
    echo "✓ Current stage info"
    echo "✓ Progress status"
    echo "✓ Recovery instructions"
    echo ""
    echo -e "Restore: ${GREEN}/context --restore $FILENAME${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# List snapshots
list_snapshots() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "📂 ${WHITE}Context Snapshots${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ ! -d "$CONTEXT_DIR" ] || [ -z "$(ls -A "$CONTEXT_DIR"/*.md 2>/dev/null)" ]; then
        echo -e "  ${GRAY}No saved snapshots.${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return
    fi

    printf " ${GRAY}%-25s %-15s %s${NC}\n" "File" "Size" "Modified"
    echo "─────────────────────────────────────────────────"

    ls -1t "$CONTEXT_DIR"/*.md 2>/dev/null | while read -r f; do
        SIZE=$(du -h "$f" | cut -f1)
        MODIFIED=$(date -r "$f" "+%Y-%m-%d %H:%M" 2>/dev/null || stat -c %y "$f" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
        printf " %-25s %-15s %s\n" "$(basename "$f")" "$SIZE" "$MODIFIED"
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Restore: ${GREEN}/context --restore [filename]${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Restore snapshot
restore_snapshot() {
    local FILE="$RESTORE_FILE"

    if [ -z "$FILE" ]; then
        # Find latest snapshot
        FILE=$(ls -1t "$CONTEXT_DIR"/state-*.md 2>/dev/null | head -1)
        if [ -z "$FILE" ]; then
            echo -e "${RED}Error:${NC} No snapshot to restore."
            exit 1
        fi
        FILE=$(basename "$FILE")
    fi

    local FILEPATH="$CONTEXT_DIR/$FILE"
    if [ ! -f "$FILEPATH" ]; then
        FILEPATH="$CONTEXT_DIR/state-$FILE"
    fi
    if [ ! -f "$FILEPATH" ]; then
        echo -e "${RED}Error:${NC} File not found: $FILE"
        echo "  Check the list with /context --list."
        exit 1
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "📂 ${WHITE}Context Restore${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "File: ${CYAN}$(basename "$FILEPATH")${NC}"
    echo ""
    echo "[Content Preview]"
    echo "─────────────────────────────────────────────────"
    head -20 "$FILEPATH"
    echo "..."
    echo "─────────────────────────────────────────────────"
    echo ""
    echo "Reference this file's contents to continue work."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Run compression (placeholder - actually handled by AI)
compress_context() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🗜️ ${WHITE}Context Compression${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Running context compression."
    echo ""
    echo "This operation analyzes conversation content to:"
    echo "• Preserve key decisions"
    echo "• Summarize long discussions"
    echo "• Remove unnecessary content"
    echo ""
    echo "The context-compression skill will be activated."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Auto context management (Statusline API trigger)
auto_compact() {
    local LEVEL="${TRIGGER_LEVEL:-warning}"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local SNAPSHOT_FILE="$CONTEXT_DIR/auto-snapshot-$TIMESTAMP.md"
    local CURRENT_STAGE=$(get_current_stage)
    local TRIGGER_FILE="$CONTEXT_DIR/auto-trigger.json"

    # Read trigger info
    local REMAINING="50"
    if [ -f "$TRIGGER_FILE" ]; then
        REMAINING=$(jq -r '.remaining // 50' "$TRIGGER_FILE" 2>/dev/null || echo "50")
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🔄 ${WHITE}Auto Context Management${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ "$LEVEL" = "critical" ]; then
        echo -e "${RED}⚠️ Critical: Remaining context below 40%${NC}"
    else
        echo -e "${YELLOW}⚠️ Warning: Remaining context below 50% (${REMAINING}%)${NC}"
    fi
    echo ""

    # Step 1: Save snapshot
    echo "📸 Saving snapshot..."

    cat > "$SNAPSHOT_FILE" << EOF
# Auto-saved Context Snapshot
- Save time: $(date "+%Y-%m-%d %H:%M:%S")
- Current stage: $CURRENT_STAGE
- Trigger: Remaining context ${REMAINING}% (level: $LEVEL)

## Current Progress
EOF

    # Extract stage status from progress.json
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        echo "" >> "$SNAPSHOT_FILE"
        echo "### Stage Status" >> "$SNAPSHOT_FILE"
        jq -r '.stages | to_entries[] | select(.value.status != "pending") | "- \(.key): \(.value.status)"' "$PROGRESS_FILE" >> "$SNAPSHOT_FILE" 2>/dev/null || true

        # Recent checkpoint info
        local CHECKPOINTS=$(jq -r '.checkpoints // [] | length' "$PROGRESS_FILE" 2>/dev/null || echo "0")
        if [ "$CHECKPOINTS" -gt 0 ]; then
            echo "" >> "$SNAPSHOT_FILE"
            echo "### Checkpoints" >> "$SNAPSHOT_FILE"
            echo "- Total checkpoints: $CHECKPOINTS" >> "$SNAPSHOT_FILE"
            jq -r '.checkpoints[-1] // empty | "- Recent: \(.name // .timestamp)"' "$PROGRESS_FILE" >> "$SNAPSHOT_FILE" 2>/dev/null || true
        fi
    fi

    cat >> "$SNAPSHOT_FILE" << EOF

## Recovery Instructions
1. Read this file
2. Reference stages/$CURRENT_STAGE/CLAUDE.md
3. Reference stages/$CURRENT_STAGE/HANDOFF.md (if exists)
4. Resume work

## Reference Files
- state/progress.json
- stages/$CURRENT_STAGE/outputs/
EOF

    echo -e "${GREEN}✓${NC} Snapshot saved: $(basename "$SNAPSHOT_FILE")"
    echo ""

    # Record snapshot in progress.json
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        # Create context_snapshots array if not exists
        local HAS_SNAPSHOTS=$(jq 'has("context_snapshots")' "$PROGRESS_FILE" 2>/dev/null || echo "false")
        if [ "$HAS_SNAPSHOTS" = "false" ]; then
            jq '. + {"context_snapshots": []}' "$PROGRESS_FILE" > "$PROGRESS_FILE.tmp" && mv "$PROGRESS_FILE.tmp" "$PROGRESS_FILE"
        fi

        # Add snapshot info
        jq ".context_snapshots += [{\"file\": \"$SNAPSHOT_FILE\", \"reason\": \"auto-${LEVEL}\", \"remaining\": $REMAINING, \"timestamp\": \"$(date -Iseconds)\"}]" \
            "$PROGRESS_FILE" > "$PROGRESS_FILE.tmp" && mv "$PROGRESS_FILE.tmp" "$PROGRESS_FILE"
    fi

    # Step 2: Guide recommended actions
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$LEVEL" = "critical" ]; then
        echo -e "${RED}⚠️ Context threshold reached (below 40%)${NC}"
        echo ""
        echo -e "Snapshot auto-saved: ${CYAN}$(basename "$SNAPSHOT_FILE")${NC}"
        echo ""

        # User confirmation prompt
        echo -e "${WHITE}Would you like to clear the context?${NC}"
        echo ""
        echo "  [y] Run /clear (recoverable from snapshot)"
        echo "  [c] Run /compact (summarize and continue)"
        echo "  [n] Cancel (handle manually)"
        echo ""
        read -p "Choice [y/c/n]: " -n 1 -r CLEAR_CHOICE
        echo ""
        echo ""

        case $CLEAR_CHOICE in
            [Yy])
                echo -e "${GREEN}✓${NC} Running /clear..."
                echo ""

                # Save recovery info
                echo "{\"action\": \"clear\", \"snapshot\": \"$SNAPSHOT_FILE\", \"timestamp\": \"$(date -Iseconds)\"}" > "$CONTEXT_DIR/pending-clear.json"

                # Auto-run /clear via tmux
                if [ -n "$TMUX" ]; then
                    # Run in current tmux session
                    sleep 1
                    tmux send-keys "/clear" Enter
                    echo -e "${GREEN}✓${NC} /clear command sent."
                elif tmux list-sessions 2>/dev/null | grep -q "claude"; then
                    # Find and send to claude session
                    CLAUDE_SESSION=$(tmux list-sessions 2>/dev/null | grep "claude" | head -1 | cut -d: -f1)
                    tmux send-keys -t "$CLAUDE_SESSION" "/clear" Enter
                    echo -e "${GREEN}✓${NC} /clear command sent to '$CLAUDE_SESSION' session."
                else
                    echo -e "${YELLOW}⚠️${NC} Cannot find tmux session."
                    echo "Please run the following command manually:"
                    echo -e "${CYAN}/clear${NC}"
                fi

                echo ""
                echo "To restore:"
                echo -e "${CYAN}/context --restore $(basename "$SNAPSHOT_FILE")${NC}"
                ;;
            [Cc])
                echo -e "${GREEN}✓${NC} Running /compact..."
                echo ""

                # Auto-run /compact via tmux
                if [ -n "$TMUX" ]; then
                    sleep 1
                    tmux send-keys "/compact" Enter
                    echo -e "${GREEN}✓${NC} /compact command sent."
                elif tmux list-sessions 2>/dev/null | grep -q "claude"; then
                    CLAUDE_SESSION=$(tmux list-sessions 2>/dev/null | grep "claude" | head -1 | cut -d: -f1)
                    tmux send-keys -t "$CLAUDE_SESSION" "/compact" Enter
                    echo -e "${GREEN}✓${NC} /compact command sent to '$CLAUDE_SESSION' session."
                else
                    echo -e "${YELLOW}⚠️${NC} Cannot find tmux session."
                    echo "Please run the following command manually:"
                    echo -e "${CYAN}/compact${NC}"
                fi
                ;;
            *)
                echo "Cancelled. Please run /clear or /compact manually."
                ;;
        esac
    else
        echo -e "${YELLOW}⚠️ Recommend running /compact${NC}"
        echo ""
        echo "Will auto-recover from snapshot after execution."
        echo "Saved snapshot: $(basename "$SNAPSHOT_FILE")"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Terminal bell (notification)
    echo -e "\a"
}

# Clean old snapshots
clean_snapshots() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🧹 ${WHITE}Clean Old Snapshots${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Find snapshots older than 7 days
    OLD_FILES=$(find "$CONTEXT_DIR" -name "state-*.md" -mtime +7 2>/dev/null)

    if [ -z "$OLD_FILES" ]; then
        echo "No old snapshots to clean."
    else
        echo "The following files will be deleted (older than 7 days):"
        echo "$OLD_FILES" | while read -r f; do
            echo "  - $(basename "$f")"
        done
        echo ""
        read -p "Delete? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$OLD_FILES" | xargs rm -f
            echo -e "${GREEN}✓${NC} Cleanup complete"
        else
            echo "Cancelled."
        fi
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main logic
case $ACTION in
    status)
        show_status
        ;;
    save)
        save_snapshot
        ;;
    compress)
        compress_context
        ;;
    restore)
        restore_snapshot
        ;;
    list)
        list_snapshots
        ;;
    clean)
        clean_snapshots
        ;;
    auto_compact)
        auto_compact
        ;;
    *)
        show_status
        ;;
esac
