#!/bin/bash
# codex-wrapper.sh - tmux-based Codex CLI wrapper
# claude-symphony workflow pipeline
# tmux wait-for channel-based synchronization (no polling, immediate response)

SESSION_NAME="ax-codex"
CHANNEL="ax-codex-done-$$"
OUTPUT_FILE="/tmp/ax-codex-output-$$"
PROMPT="$1"
TIMEOUT="${2:-300}"  # Default 5 minute timeout

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usage
if [ -z "$PROMPT" ]; then
    echo "Usage: $0 \"<prompt>\" [timeout_seconds]"
    echo "Example: $0 \"Refactor this function\" 300"
    exit 1
fi

# Check tmux
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}Error:${NC} tmux is not installed."
    echo "Install: brew install tmux (macOS) or apt install tmux (Ubuntu)"
    exit 1
fi

# Check Codex CLI
if ! command -v codex &> /dev/null; then
    echo -e "${YELLOW}Warning:${NC} codex CLI is not installed."
    echo "Running in simulation mode without Codex CLI."
    echo ""
    echo "[Simulation] Codex response:"
    echo "---"
    echo "Actual response will be displayed when Codex CLI is installed."
    echo "Prompt: $PROMPT"
    exit 0
fi

# Cleanup temporary files
cleanup() {
    rm -f "$OUTPUT_FILE"
}
trap cleanup EXIT

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🤖 Codex CLI Call${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Session: $SESSION_NAME"
echo "  Timeout: ${TIMEOUT}s"
echo ""

# Check/create tmux session
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Creating new tmux session: $SESSION_NAME"
    tmux new-session -d -s "$SESSION_NAME"
    sleep 1
fi

# Escape prompt
ESCAPED_PROMPT=$(printf '%s' "$PROMPT" | sed 's/"/\\"/g' | sed "s/'/'\\\\''/g")

# Execute Codex CLI + signal channel on completion
# Issue #2, #13 resolution: --full-auto option added by default
echo -e "${BLUE}Calling Codex... (--full-auto mode)${NC}"
tmux send-keys -t "$SESSION_NAME" "codex --full-auto \"$ESCAPED_PROMPT\" 2>&1 | tee $OUTPUT_FILE; tmux wait-for -S $CHANNEL" Enter

# Background timer for timeout handling
(sleep "$TIMEOUT" && tmux wait-for -S "$CHANNEL" 2>/dev/null) &
TIMER_PID=$!

# Wait for channel signal (blocking)
tmux wait-for "$CHANNEL"
kill $TIMER_PID 2>/dev/null || true

# Output results
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📄 Codex Response:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ -f "$OUTPUT_FILE" ]]; then
    cat "$OUTPUT_FILE"
else
    echo -e "${RED}Error:${NC} Failed to capture output."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Codex call completed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
