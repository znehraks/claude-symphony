#!/bin/bash
# show-status.sh - Pipeline status display
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONFIG_FILE="$PROJECT_ROOT/config/pipeline.yaml"

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
OUTPUT_JSON=false
OUTPUT_BRIEF=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --json) OUTPUT_JSON=true ;;
        --brief) OUTPUT_BRIEF=true ;;
        *) ;;
    esac
    shift
done

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error:${NC} jq is required."
    exit 1
fi

# Check progress.json
if [ ! -f "$PROGRESS_FILE" ]; then
    echo -e "${RED}Error:${NC} Cannot find progress.json."
    echo "  Please run /init-project first."
    exit 1
fi

# Extract data
PROJECT_NAME=$(jq -r '.project_name // "unnamed"' "$PROGRESS_FILE")
CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE")
CHECKPOINT_COUNT=$(jq -r '.checkpoints | length' "$PROGRESS_FILE")

# Stage info arrays
declare -a STAGE_IDS=("01-brainstorm" "02-research" "03-planning" "04-ui-ux" "05-task-management" "06-implementation" "07-refactoring" "08-qa" "09-testing" "10-deployment")
declare -a STAGE_NAMES=("brainstorm" "research" "planning" "ui-ux" "task-mgmt" "implementation" "refactoring" "qa" "testing" "deployment")
declare -a STAGE_AI=("Gemini+Claude" "Claude+MCP" "Gemini" "Gemini" "ClaudeCode" "ClaudeCode" "Codex" "ClaudeCode" "Codex" "ClaudeCode")

# Calculate completed stages
COMPLETED=0
CURRENT_NUM=0
for i in "${!STAGE_IDS[@]}"; do
    STATUS=$(jq -r ".stages.\"${STAGE_IDS[$i]}\".status // \"pending\"" "$PROGRESS_FILE")
    if [ "$STATUS" == "completed" ]; then
        ((COMPLETED++))
    fi
    if [ "${STAGE_IDS[$i]}" == "$CURRENT_STAGE" ]; then
        CURRENT_NUM=$((i + 1))
    fi
done

TOTAL=10
PERCENT=$((COMPLETED * 100 / TOTAL))

# JSON output
if [ "$OUTPUT_JSON" = true ]; then
    jq -n \
        --arg project "$PROJECT_NAME" \
        --arg current "$CURRENT_STAGE" \
        --argjson completed "$COMPLETED" \
        --argjson total "$TOTAL" \
        --argjson checkpoints "$CHECKPOINT_COUNT" \
        '{project: $project, current_stage: $current, completed: $completed, total: $total, checkpoints: $checkpoints}'
    exit 0
fi

# Brief output
if [ "$OUTPUT_BRIEF" = true ]; then
    echo "[$PROJECT_NAME] $COMPLETED/$TOTAL completed | Current: $CURRENT_STAGE | Checkpoints: $CHECKPOINT_COUNT"
    exit 0
fi

# Generate progress bar
progress_bar() {
    local percent=$1
    local width=20
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    printf "["
    printf "%0.s█" $(seq 1 $filled) 2>/dev/null || true
    printf "%0.s░" $(seq 1 $empty) 2>/dev/null || true
    printf "]"
}

# Return status icon
status_icon() {
    case $1 in
        completed) echo "✅" ;;
        in_progress) echo "🔄" ;;
        pending) echo "⏳" ;;
        failed) echo "❌" ;;
        paused) echo "⏸️" ;;
        *) echo "⏳" ;;
    esac
}

# Status text
status_text() {
    case $1 in
        completed) echo "done" ;;
        in_progress) echo "active" ;;
        pending) echo "pending" ;;
        failed) echo "failed" ;;
        paused) echo "paused" ;;
        *) echo "pending" ;;
    esac
}

# Output
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📊 ${WHITE}Pipeline Status:${NC} ${CYAN}$PROJECT_NAME${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Progress: $(progress_bar $PERCENT) ${GREEN}$PERCENT%${NC} ($COMPLETED/$TOTAL)"
echo ""

# Stage list
for i in "${!STAGE_IDS[@]}"; do
    STAGE_ID="${STAGE_IDS[$i]}"
    STAGE_NAME="${STAGE_NAMES[$i]}"
    AI="${STAGE_AI[$i]}"

    STATUS=$(jq -r ".stages.\"$STAGE_ID\".status // \"pending\"" "$PROGRESS_FILE")
    ICON=$(status_icon "$STATUS")
    STATUS_TXT=$(status_text "$STATUS")

    NUM=$(printf "%02d" $((i + 1)))

    # Mark current stage
    if [ "$STAGE_ID" == "$CURRENT_STAGE" ]; then
        ARROW=" ${YELLOW}←${NC}"
    else
        ARROW=""
    fi

    # Color setting
    if [ "$STATUS" == "completed" ]; then
        NAME_COLOR=$GREEN
    elif [ "$STATUS" == "in_progress" ]; then
        NAME_COLOR=$YELLOW
    else
        NAME_COLOR=$GRAY
    fi

    printf " %s %s ${NAME_COLOR}%-14s${NC} %-8s ${GRAY}[%s]${NC}%b\n" \
        "$NUM" "$ICON" "$STAGE_NAME" "$STATUS_TXT" "$AI" "$ARROW"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find last handoff
LAST_HANDOFF=""
for ((i=${#STAGE_IDS[@]}-1; i>=0; i--)); do
    STAGE_ID="${STAGE_IDS[$i]}"
    if [ -f "$PROJECT_ROOT/stages/$STAGE_ID/HANDOFF.md" ]; then
        LAST_HANDOFF="$STAGE_ID"
        break
    fi
done

if [ -n "$LAST_HANDOFF" ]; then
    echo -e "Checkpoints: ${CYAN}${CHECKPOINT_COUNT}${NC} | Last handoff: ${GREEN}${LAST_HANDOFF}${NC}"
else
    echo -e "Checkpoints: ${CYAN}${CHECKPOINT_COUNT}${NC} | Handoff: None"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
