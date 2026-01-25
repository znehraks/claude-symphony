#!/bin/bash
# gemini-wrapper.sh - tmux-based Gemini CLI wrapper
# claude-symphony workflow pipeline
# tmux wait-for channel-based synchronization (no polling, immediate response)

# Source common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SESSION_NAME="ax-gemini"
CHANNEL="ax-gemini-done-$$"
OUTPUT_FILE="/tmp/ax-gemini-output-$$"
PROMPT="$1"
TIMEOUT="${2:-300}"  # Default 5 minute timeout

# Usage
if [ -z "$PROMPT" ]; then
    echo "Usage: $0 \"<prompt>\" [timeout_seconds]"
    echo "Example: $0 \"Find Claude Code related posts on Reddit\" 300"
    exit 1
fi

# Check tmux
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}Error:${NC} tmux is not installed."
    echo "Install: brew install tmux (macOS) or apt install tmux (Ubuntu)"
    exit 1
fi

# Check Gemini CLI - if not available, signal fallback
if ! command -v gemini &> /dev/null; then
    echo -e "${YELLOW}Warning:${NC} gemini CLI is not installed."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}🔄 FALLBACK REQUIRED${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Primary AI: gemini"
    echo "  Fallback AI: claudecode"
    echo "  Reason: CLI not installed"
    echo ""
    echo "Prompt to execute with ClaudeCode:"
    echo "---"
    echo "$PROMPT"
    echo "---"
    echo ""
    echo "FALLBACK_SIGNAL: GEMINI_CLI_NOT_FOUND"
    # Exit code 100 = fallback required (non-zero but specific)
    exit 100
fi

# Cleanup temporary files
cleanup() {
    rm -f "$OUTPUT_FILE"
}
trap cleanup EXIT

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🤖 Gemini CLI Call${NC}"
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

# Execute Gemini CLI + signal channel on completion
echo -e "${BLUE}Calling Gemini...${NC}"
tmux send-keys -t "$SESSION_NAME" "gemini \"$ESCAPED_PROMPT\" 2>&1 | tee $OUTPUT_FILE; tmux wait-for -S $CHANNEL" Enter

# Background timer for timeout handling
(sleep "$TIMEOUT" && tmux wait-for -S "$CHANNEL" 2>/dev/null) &
TIMER_PID=$!

# Wait for channel signal (blocking)
tmux wait-for "$CHANNEL"
kill $TIMER_PID 2>/dev/null || true

# Output results
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📄 Gemini Response:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ -f "$OUTPUT_FILE" ]]; then
    OUTPUT_CONTENT=$(cat "$OUTPUT_FILE")

    # Check for empty output (possible timeout)
    if [[ -z "$OUTPUT_CONTENT" ]]; then
        echo -e "${RED}Error:${NC} Empty response received (possible timeout)."
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${YELLOW}🔄 FALLBACK REQUIRED${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Primary AI: gemini"
        echo "  Fallback AI: claudecode"
        echo "  Reason: API timeout or empty response"
        echo "FALLBACK_SIGNAL: GEMINI_TIMEOUT"
        exit 101
    fi

    # Check for error patterns in output
    if echo "$OUTPUT_CONTENT" | grep -qi "error\|failed\|rate.limit\|quota"; then
        echo "$OUTPUT_CONTENT"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${YELLOW}🔄 FALLBACK RECOMMENDED${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Primary AI: gemini"
        echo "  Fallback AI: claudecode"
        echo "  Reason: API error detected in response"
        echo "FALLBACK_SIGNAL: GEMINI_API_ERROR"
        exit 102
    fi

    echo "$OUTPUT_CONTENT"
else
    echo -e "${RED}Error:${NC} Failed to capture output."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}🔄 FALLBACK REQUIRED${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Primary AI: gemini"
    echo "  Fallback AI: claudecode"
    echo "  Reason: Output capture failed"
    echo "FALLBACK_SIGNAL: GEMINI_OUTPUT_FAILED"
    exit 103
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Gemini call completed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
