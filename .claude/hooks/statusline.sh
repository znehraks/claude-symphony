#!/bin/bash
# statusline.sh - Real-time context monitoring via Claude Code Statusline API
# claude-symphony workflow pipeline
#
# Claude Code passes JSON to stdin every ~300ms.
# This script analyzes remaining_percentage and performs auto actions when thresholds are reached.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"

# Ensure context directory
mkdir -p "$CONTEXT_DIR"

# Read JSON from stdin
input=$(cat)

# JSON parsing (jq required)
if ! command -v jq &> /dev/null; then
    echo "[CTX] jq required"
    exit 0
fi

# Extract context data
REMAINING=$(echo "$input" | jq -r '.context_window.remaining_percentage // 100' 2>/dev/null || echo "100")
USED=$(echo "$input" | jq -r '.context_window.used_percentage // 0' 2>/dev/null || echo "0")
MODEL=$(echo "$input" | jq -r '.model.display_name // "Claude"' 2>/dev/null || echo "Claude")
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000' 2>/dev/null || echo "200000")

# Get current stage
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE" 2>/dev/null || echo "none")
else
    CURRENT_STAGE="none"
fi

# Convert to integer for numeric comparison
REMAINING_INT=$(printf "%.0f" "$REMAINING" 2>/dev/null || echo "100")

# Determine status and color
# Thresholds: 60% warning, 50% auto-save, 40% critical
if [ "$REMAINING_INT" -le 40 ]; then
    # 40% or below: Critical - recommend /clear
    STATUS_ICON="🔴"
    STATUS_TEXT="CTX≤40%"
    NEEDS_ACTION="critical"
elif [ "$REMAINING_INT" -le 50 ]; then
    # 50% or below: Auto snapshot trigger
    STATUS_ICON="⚠️"
    STATUS_TEXT="CTX≤50%"
    NEEDS_ACTION="warning"
elif [ "$REMAINING_INT" -le 60 ]; then
    # 60% or below: Warning display
    STATUS_ICON="⚡"
    STATUS_TEXT="CTX≤60%"
    NEEDS_ACTION="notice"
else
    # Normal
    STATUS_ICON="✓"
    STATUS_TEXT=""
    NEEDS_ACTION="none"
fi

# Auto action when 50% or below
if [ "$NEEDS_ACTION" = "warning" ] || [ "$NEEDS_ACTION" = "critical" ]; then
    # Check if already triggered (prevent duplicates)
    ALREADY_TRIGGERED=false
    if [ -f "$STATE_FILE" ]; then
        TRIGGERED=$(jq -r '.triggered // false' "$STATE_FILE" 2>/dev/null || echo "false")
        TRIGGER_REMAINING=$(jq -r '.remaining // 100' "$STATE_FILE" 2>/dev/null || echo "100")

        # Skip if already triggered at same level
        if [ "$TRIGGERED" = "true" ]; then
            # Re-trigger if dropped to lower level
            if [ "$REMAINING_INT" -lt "$TRIGGER_REMAINING" ]; then
                ALREADY_TRIGGERED=false
            else
                ALREADY_TRIGGERED=true
            fi
        fi
    fi

    if [ "$ALREADY_TRIGGERED" = false ]; then
        # Record trigger state
        cat > "$STATE_FILE" << EOF
{
    "triggered": true,
    "timestamp": "$(date -Iseconds)",
    "remaining": $REMAINING_INT,
    "level": "$NEEDS_ACTION",
    "stage": "$CURRENT_STAGE"
}
EOF

        # Create auto snapshot (background)
        if [ -x "$PROJECT_ROOT/scripts/context-manager.sh" ]; then
            "$PROJECT_ROOT/scripts/context-manager.sh" --auto-compact "$NEEDS_ACTION" 2>/dev/null &
        fi
    fi
fi

# Reset trigger state when context is sufficient (70% or above)
if [ "$REMAINING_INT" -ge 70 ] && [ -f "$STATE_FILE" ]; then
    rm -f "$STATE_FILE"
fi

# Output statusline
if [ -n "$STATUS_TEXT" ]; then
    echo "[$MODEL] $STATUS_ICON $STATUS_TEXT ${REMAINING_INT}% | Stage: $CURRENT_STAGE"
else
    echo "[$MODEL] $STATUS_ICON ${REMAINING_INT}% | Stage: $CURRENT_STAGE"
fi
