#!/bin/bash
# restore-checkpoint.sh - Checkpoint restoration
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CHECKPOINTS_DIR="$PROJECT_ROOT/state/checkpoints"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Option handling
LIST_MODE=false
LATEST_MODE=false
FORCE_MODE=false
BACKUP_MODE=false
DRY_RUN=false
CP_ID=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --list) LIST_MODE=true ;;
        --latest) LATEST_MODE=true ;;
        --force) FORCE_MODE=true ;;
        --backup) BACKUP_MODE=true ;;
        --dry-run) DRY_RUN=true ;;
        CP-*) CP_ID="$1" ;;
        *) ;;
    esac
    shift
done

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error:${NC} jq is required."
    exit 1
fi

# List checkpoints function
list_checkpoints() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "💾 ${WHITE}Checkpoint List${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -d "$CHECKPOINTS_DIR" ] || [ -z "$(ls -A "$CHECKPOINTS_DIR" 2>/dev/null)" ]; then
        echo ""
        echo -e "  ${GRAY}No checkpoints available.${NC}"
        echo -e "  ${GRAY}Create one with /checkpoint command.${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    fi

    printf " ${GRAY}%-22s %-18s %-20s${NC}\n" "ID" "Stage" "Created"
    echo "─────────────────────────────────────────────────────────"

    COUNT=0
    for cp_dir in "$CHECKPOINTS_DIR"/CP-*; do
        if [ -d "$cp_dir" ]; then
            CP_NAME=$(basename "$cp_dir")
            META_FILE="$cp_dir/metadata.json"

            if [ -f "$META_FILE" ]; then
                STAGE=$(jq -r '.stage // "unknown"' "$META_FILE")
                CREATED=$(jq -r '.created_at // "unknown"' "$META_FILE")
                DESC=$(jq -r '.description // ""' "$META_FILE")

                # Date formatting
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    CREATED_FMT=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CREATED" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$CREATED")
                else
                    CREATED_FMT=$(date -d "$CREATED" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$CREATED")
                fi

                printf " %-22s %-18s %s\n" "$CP_NAME" "$STAGE" "$CREATED_FMT"
                if [ -n "$DESC" ] && [ "$DESC" != "null" ]; then
                    printf "   ${GRAY}└─ %s${NC}\n" "$DESC"
                fi
                ((COUNT++))
            fi
        fi
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Total ${CYAN}${COUNT}${NC} checkpoints | Restore with ${GREEN}/restore [ID]${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Find latest checkpoint
find_latest_checkpoint() {
    local latest=""
    local latest_time=0

    for cp_dir in "$CHECKPOINTS_DIR"/CP-*; do
        if [ -d "$cp_dir" ]; then
            META_FILE="$cp_dir/metadata.json"
            if [ -f "$META_FILE" ]; then
                CREATED=$(jq -r '.created_at // ""' "$META_FILE")
                if [ -n "$CREATED" ]; then
                    # Timestamp comparison (simple string comparison)
                    if [[ "$CREATED" > "$latest_time" ]]; then
                        latest_time="$CREATED"
                        latest=$(basename "$cp_dir")
                    fi
                fi
            fi
        fi
    done

    echo "$latest"
}

# Restore function
restore_checkpoint() {
    local cp_id=$1
    local cp_dir="$CHECKPOINTS_DIR/$cp_id"

    if [ ! -d "$cp_dir" ]; then
        echo -e "${RED}Error:${NC} Checkpoint not found: $cp_id"
        echo "  Use /restore --list to see available checkpoints."
        exit 1
    fi

    META_FILE="$cp_dir/metadata.json"
    STAGE=$(jq -r '.stage // "unknown"' "$META_FILE")
    DESC=$(jq -r '.description // ""' "$META_FILE")
    CREATED=$(jq -r '.created_at // "unknown"' "$META_FILE")

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "⚠️  ${WHITE}Checkpoint Restoration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Checkpoint: ${CYAN}$cp_id${NC}"
    echo -e "Stage:      ${CYAN}$STAGE${NC}"
    if [ -n "$DESC" ] && [ "$DESC" != "null" ]; then
        echo -e "Description: $DESC"
    fi
    echo -e "Created:    $CREATED"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] Not executing actual restoration.${NC}"
        echo ""
        echo "Files to be restored:"
        find "$cp_dir" -type f | while read -r f; do
            echo "  - $(basename "$f")"
        done
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    fi

    if [ "$FORCE_MODE" = false ]; then
        echo -e "${YELLOW}⚠️  Warning: Current state will be restored to that point.${NC}"
        echo -e "   Current changes may be lost."
        echo ""
        read -p "Proceed with restoration? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Cancelled.${NC}"
            exit 0
        fi
    fi

    echo ""
    echo "Restoring..."

    # Backup current state (optional)
    if [ "$BACKUP_MODE" = true ]; then
        BACKUP_ID="BACKUP-$(date +%Y%m%d-%H%M%S)"
        BACKUP_DIR="$CHECKPOINTS_DIR/$BACKUP_ID"
        mkdir -p "$BACKUP_DIR"
        cp "$PROGRESS_FILE" "$BACKUP_DIR/progress.json" 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Current state backed up: $BACKUP_ID"
    fi

    # Restore progress.json
    if [ -f "$cp_dir/progress.json" ]; then
        cp "$cp_dir/progress.json" "$PROGRESS_FILE"
        echo -e "${GREEN}✓${NC} progress.json restored"
    fi

    # Restore outputs
    STAGE_DIR="$PROJECT_ROOT/stages/$STAGE"
    if [ -d "$cp_dir/outputs" ]; then
        rm -rf "$STAGE_DIR/outputs" 2>/dev/null || true
        cp -r "$cp_dir/outputs" "$STAGE_DIR/"
        FILE_COUNT=$(find "$cp_dir/outputs" -type f | wc -l | tr -d ' ')
        echo -e "${GREEN}✓${NC} Output files restored (${FILE_COUNT} files)"
    fi

    # Restore HANDOFF.md
    if [ -f "$cp_dir/HANDOFF.md" ]; then
        cp "$cp_dir/HANDOFF.md" "$STAGE_DIR/"
        echo -e "${GREEN}✓${NC} HANDOFF.md restored"
    fi

    # Update current stage in progress.json
    jq ".current_stage = \"$STAGE\" | .stages.\"$STAGE\".status = \"in_progress\"" \
        "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅${NC} Checkpoint restoration complete!"
    echo -e "Current stage: ${CYAN}$STAGE${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main logic
if [ "$LIST_MODE" = true ]; then
    list_checkpoints
    exit 0
fi

if [ "$LATEST_MODE" = true ]; then
    CP_ID=$(find_latest_checkpoint)
    if [ -z "$CP_ID" ]; then
        echo -e "${RED}Error:${NC} No checkpoints available to restore."
        exit 1
    fi
    echo -e "Latest checkpoint: ${CYAN}$CP_ID${NC}"
    restore_checkpoint "$CP_ID"
    exit 0
fi

if [ -n "$CP_ID" ]; then
    restore_checkpoint "$CP_ID"
    exit 0
fi

# Show help if no arguments
echo "Usage:"
echo "  /restore --list          View checkpoint list"
echo "  /restore --latest        Restore to latest checkpoint"
echo "  /restore [CP-ID]         Restore to specific checkpoint"
echo ""
echo "Options:"
echo "  --force     Restore without confirmation"
echo "  --backup    Backup current state before restoration"
echo "  --dry-run   Preview without actual restoration"
