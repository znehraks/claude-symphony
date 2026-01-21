#!/bin/bash
# session-start.sh - Session start auto-recovery
# claude-symphony workflow pipeline
#
# SessionStart hook: Runs when Claude Code session starts/resumes
# If snapshot exists from /compact, provides auto context recovery guidance

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TRIGGER_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# Ensure context directory
mkdir -p "$CONTEXT_DIR"

# jq required
if ! command -v jq &> /dev/null; then
    exit 0
fi

# 1. Check trigger file - if compact was executed
if [ ! -f "$TRIGGER_FILE" ]; then
    exit 0  # No recovery needed
fi

COMPACT_SCHEDULED=$(jq -r '.compact_scheduled // false' "$TRIGGER_FILE" 2>/dev/null || echo "false")
if [ "$COMPACT_SCHEDULED" != "true" ]; then
    exit 0  # compact not scheduled
fi

# 2. Find latest snapshot
LATEST_SNAPSHOT=$(ls -1t "$CONTEXT_DIR"/auto-snapshot-*.md 2>/dev/null | head -1)
if [ -z "$LATEST_SNAPSHOT" ]; then
    # No snapshot - cleanup trigger file
    rm -f "$TRIGGER_FILE"
    exit 0
fi

# 3. Get current stage info
CURRENT_STAGE="none"
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE" 2>/dev/null || echo "none")
fi

# 4. Create recovery context (passed to Claude)
RECOVERY_CONTEXT=$(cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Session Recovery - Restart after auto /compact
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Recovery Information
- Snapshot: $(basename "$LATEST_SNAPSHOT")
- Stage: $CURRENT_STAGE
- Save time: $(jq -r '.timestamp // "unknown"' "$TRIGGER_FILE" 2>/dev/null)

## Snapshot Contents
$(cat "$LATEST_SNAPSHOT" 2>/dev/null | head -50)

## Recovery Instructions
1. Review snapshot contents above to understand work context
2. Check stages/$CURRENT_STAGE/CLAUDE.md
3. Resume from interrupted work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
)

# 5. JSON output (passing context to Claude)
# Claude receives recovery info through additionalContext
cat << EOF
{
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": $(echo "$RECOVERY_CONTEXT" | jq -Rs .)
    }
}
EOF

# 6. Cleanup trigger file (mark recovery complete)
jq '. + {"recovered": true, "recovery_time": "'"$(date -Iseconds)"'"}' \
    "$TRIGGER_FILE" > "$TRIGGER_FILE.tmp" && mv "$TRIGGER_FILE.tmp" "$TRIGGER_FILE"

# Delete trigger file after some time (prevent duplicate recovery in next session)
# Delete in background after 5 minutes
(sleep 300 && rm -f "$TRIGGER_FILE" 2>/dev/null) &

exit 0
