#!/bin/bash
# stop.sh - Auto context management after Claude response
# claude-symphony workflow pipeline
#
# Stop hook: Runs after Claude response completes
# If context is 50% or below, automatically runs /compact

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TRIGGER_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"
COOLDOWN_FILE="$PROJECT_ROOT/state/context/.last-compact"
CONTEXT_DIR="$PROJECT_ROOT/state/context"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# Cooldown time (seconds) - 5 minutes
COOLDOWN_SECONDS=300

# Ensure context directory
mkdir -p "$CONTEXT_DIR"

# jq required
if ! command -v jq &> /dev/null; then
    exit 0
fi

# Read hook data from stdin
input=$(cat)

# 1. Check trigger file (created by statusline.sh)
if [ ! -f "$TRIGGER_FILE" ]; then
    exit 0  # No trigger - normal state
fi

TRIGGERED=$(jq -r '.triggered // false' "$TRIGGER_FILE" 2>/dev/null || echo "false")
if [ "$TRIGGERED" != "true" ]; then
    exit 0
fi

REMAINING=$(jq -r '.remaining // 100' "$TRIGGER_FILE" 2>/dev/null || echo "100")
LEVEL=$(jq -r '.level // "warning"' "$TRIGGER_FILE" 2>/dev/null || echo "warning")

# Skip if not 50% or below
if [ "$REMAINING" -gt 50 ]; then
    exit 0
fi

# 2. Check cooldown (prevent re-run within 5 minutes)
if [ -f "$COOLDOWN_FILE" ]; then
    LAST_COMPACT=$(cat "$COOLDOWN_FILE" 2>/dev/null || echo "0")
    NOW=$(date +%s)
    ELAPSED=$((NOW - LAST_COMPACT))

    if [ "$ELAPSED" -lt "$COOLDOWN_SECONDS" ]; then
        # In cooldown - skip
        REMAINING_COOLDOWN=$((COOLDOWN_SECONDS - ELAPSED))
        exit 0
    fi
fi

# 3. Check tmux session
if [ -z "$TMUX" ]; then
    # Not in tmux session - provide manual guidance only
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  Context ${REMAINING}% - Running /compact is recommended"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# 4. Verify snapshot saved (should be saved by statusline.sh already)
LATEST_SNAPSHOT=$(ls -1t "$CONTEXT_DIR"/auto-snapshot-*.md 2>/dev/null | head -1)
if [ -z "$LATEST_SNAPSHOT" ]; then
    # No snapshot - save first
    "$PROJECT_ROOT/scripts/context-manager.sh" --auto-compact "$LEVEL" 2>/dev/null || true
    LATEST_SNAPSHOT=$(ls -1t "$CONTEXT_DIR"/auto-snapshot-*.md 2>/dev/null | head -1)
fi

# Skip for safety if snapshot still doesn't exist
if [ -z "$LATEST_SNAPSHOT" ]; then
    echo ""
    echo "⚠️  Snapshot save failed - Auto /compact cancelled"
    exit 0
fi

# 5. Pre-notification
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Context ${REMAINING}% - Running auto /compact..."
echo "   Snapshot: $(basename "$LATEST_SNAPSHOT")"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 6. Record cooldown timer
date +%s > "$COOLDOWN_FILE"

# 7. Mark compact scheduled in trigger file
jq '. + {"compact_scheduled": true, "compact_time": "'"$(date -Iseconds)"'"}' \
    "$TRIGGER_FILE" > "$TRIGGER_FILE.tmp" && mv "$TRIGGER_FILE.tmp" "$TRIGGER_FILE"

# 8. Run /compact via tmux send-keys (to current pane)
sleep 1  # Brief wait (for output to be visible)
tmux send-keys "/compact" Enter

exit 0
