#!/bin/bash
# list-stages.sh - Stage list and details display
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
STAGES_DIR="$PROJECT_ROOT/stages"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Options and arguments handling
OUTPUT_JSON=false
FILTER_PENDING=false
FILTER_COMPLETED=false
STAGE_NUM=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --json) OUTPUT_JSON=true ;;
        --pending) FILTER_PENDING=true ;;
        --completed) FILTER_COMPLETED=true ;;
        [0-9]*) STAGE_NUM="$1" ;;
        *) ;;
    esac
    shift
done

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error:${NC} jq is required."
    exit 1
fi

# Stage info arrays
declare -a STAGE_IDS=("01-brainstorm" "02-research" "03-planning" "04-ui-ux" "05-task-management" "06-implementation" "07-refactoring" "08-qa" "09-testing" "10-deployment")
declare -a STAGE_NAMES=("brainstorm" "research" "planning" "ui-ux" "task-management" "implementation" "refactoring" "qa" "testing" "deployment")
declare -a STAGE_AI=("Gemini+Claude" "Claude+MCP" "Gemini" "Gemini" "ClaudeCode" "ClaudeCode" "Codex" "ClaudeCode" "Codex" "ClaudeCode")
declare -a STAGE_MODES=("YOLO" "Plan Mode" "Plan Mode" "Plan Mode" "Plan Mode" "Plan+Sandbox" "Deep Dive" "Plan+Sandbox" "Playwright" "Headless")
declare -a STAGE_SHORTCUTS=("brainstorm" "research" "planning" "ui-ux" "tasks" "implement" "refactor" "qa" "test" "deploy")

# Get current stage
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE")
else
    CURRENT_STAGE="none"
fi

# Return status icon
status_icon() {
    case $1 in
        completed) echo "✅" ;;
        in_progress) echo "🔄" ;;
        pending) echo "⏳" ;;
        failed) echo "❌" ;;
        *) echo "⏳" ;;
    esac
}

# Show specific stage details
show_stage_detail() {
    local num=$1
    local idx=$((num - 1))

    if [ $idx -lt 0 ] || [ $idx -ge 10 ]; then
        echo -e "${RED}Error:${NC} Please enter a valid stage number (01-10)"
        exit 1
    fi

    local STAGE_ID="${STAGE_IDS[$idx]}"
    local STAGE_NAME="${STAGE_NAMES[$idx]}"
    local AI="${STAGE_AI[$idx]}"
    local MODE="${STAGE_MODES[$idx]}"
    local SHORTCUT="${STAGE_SHORTCUTS[$idx]}"
    local STAGE_PATH="$STAGES_DIR/$STAGE_ID"
    local CONFIG_PATH="$STAGE_PATH/config.yaml"

    # Get status
    if [ -f "$PROGRESS_FILE" ]; then
        STATUS=$(jq -r ".stages.\"$STAGE_ID\".status // \"pending\"" "$PROGRESS_FILE")
    else
        STATUS="pending"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "📋 ${WHITE}Stage %02d: %s${NC}\n" "$num" "${STAGE_NAME^}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "AI Model:    ${CYAN}$AI${NC}"
    echo -e "Mode:        ${CYAN}$MODE${NC}"
    echo -e "Status:      $(status_icon $STATUS) $STATUS"

    # Get additional info from config.yaml
    if [ -f "$CONFIG_PATH" ]; then
        # Extract timeout (use yq if available, otherwise grep)
        if command -v yq &> /dev/null; then
            TIMEOUT=$(yq -r '.timeout // "60"' "$CONFIG_PATH")
            CHECKPOINT=$(yq -r '.checkpoint_required // false' "$CONFIG_PATH")
        else
            TIMEOUT=$(grep "timeout:" "$CONFIG_PATH" 2>/dev/null | head -1 | awk '{print $2}' || echo "60")
            CHECKPOINT=$(grep "checkpoint_required:" "$CONFIG_PATH" 2>/dev/null | head -1 | awk '{print $2}' || echo "false")
        fi
        echo -e "Timeout:     ${TIMEOUT}min"
        if [ "$CHECKPOINT" == "true" ]; then
            echo -e "Checkpoint:  ${YELLOW}Required${NC}"
        fi
    fi

    echo ""

    # Inputs
    echo -e "${BLUE}[Inputs]${NC}"
    if [ -d "$STAGE_PATH/inputs" ]; then
        find "$STAGE_PATH/inputs" -type f -name "*.md" -o -name "*.json" -o -name "*.yaml" 2>/dev/null | while read -r f; do
            echo " • $(basename "$f")"
        done
    fi
    if [ $idx -gt 0 ]; then
        PREV_IDX=$((idx - 1))
        PREV_STAGE="${STAGE_IDS[$PREV_IDX]}"
        echo -e " ${GRAY}• $PREV_STAGE/outputs/*${NC}"
    fi
    if [ -z "$(find "$STAGE_PATH/inputs" -type f 2>/dev/null)" ] && [ $idx -eq 0 ]; then
        echo " (None - first stage)"
    fi

    echo ""

    # Outputs
    echo -e "${BLUE}[Outputs]${NC}"
    if [ -d "$STAGE_PATH/outputs" ]; then
        for f in "$STAGE_PATH/outputs"/*; do
            if [ -e "$f" ]; then
                echo " • $(basename "$f")"
            fi
        done
    fi
    if [ -d "$STAGE_PATH/templates" ]; then
        echo -e " ${GRAY}(Reference templates: templates/)${NC}"
    fi

    echo ""

    # Quick Commands
    echo -e "${BLUE}[Quick Commands]${NC}"
    echo " • /$SHORTCUT      - Start this stage directly"
    printf " • /run-stage %02d  - Start after checking prerequisites\n" "$num"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Show specific stage details
if [ -n "$STAGE_NUM" ]; then
    # Remove leading zeros
    STAGE_NUM=$((10#$STAGE_NUM))
    show_stage_detail "$STAGE_NUM"
    exit 0
fi

# JSON output
if [ "$OUTPUT_JSON" = true ]; then
    echo "["
    for i in "${!STAGE_IDS[@]}"; do
        STAGE_ID="${STAGE_IDS[$i]}"
        STATUS="pending"
        if [ -f "$PROGRESS_FILE" ]; then
            STATUS=$(jq -r ".stages.\"$STAGE_ID\".status // \"pending\"" "$PROGRESS_FILE")
        fi

        if [ $i -gt 0 ]; then echo ","; fi
        printf '{"id":"%s","name":"%s","ai":"%s","mode":"%s","status":"%s"}' \
            "$STAGE_ID" "${STAGE_NAMES[$i]}" "${STAGE_AI[$i]}" "${STAGE_MODES[$i]}" "$STATUS"
    done
    echo "]"
    exit 0
fi

# Display list
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📋 ${WHITE}Pipeline Stages${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf " ${GRAY}##  %-16s %-14s %-12s Status${NC}\n" "Stage" "AI Model" "Mode"
echo "─────────────────────────────────────────────────────────────"

for i in "${!STAGE_IDS[@]}"; do
    STAGE_ID="${STAGE_IDS[$i]}"
    STAGE_NAME="${STAGE_NAMES[$i]}"
    AI="${STAGE_AI[$i]}"
    MODE="${STAGE_MODES[$i]}"

    # Get status
    STATUS="pending"
    if [ -f "$PROGRESS_FILE" ]; then
        STATUS=$(jq -r ".stages.\"$STAGE_ID\".status // \"pending\"" "$PROGRESS_FILE")
    fi

    # Filtering
    if [ "$FILTER_PENDING" = true ] && [ "$STATUS" != "pending" ]; then
        continue
    fi
    if [ "$FILTER_COMPLETED" = true ] && [ "$STATUS" != "completed" ]; then
        continue
    fi

    ICON=$(status_icon "$STATUS")
    NUM=$(printf "%02d" $((i + 1)))

    # Mark current stage
    if [ "$STAGE_ID" == "$CURRENT_STAGE" ]; then
        ARROW=" ${YELLOW}←${NC}"
    else
        ARROW=""
    fi

    printf " %s  %-16s %-14s %-12s %s%b\n" "$NUM" "$STAGE_NAME" "$AI" "$MODE" "$ICON" "$ARROW"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Next step guidance
if [ "$CURRENT_STAGE" != "none" ] && [ -n "$CURRENT_STAGE" ]; then
    CURRENT_NUM=$(echo "$CURRENT_STAGE" | cut -d'-' -f1)
    CURRENT_NUM=$((10#$CURRENT_NUM))
    NEXT_NUM=$((CURRENT_NUM + 1))

    if [ $NEXT_NUM -le 10 ]; then
        NEXT_SHORTCUT="${STAGE_SHORTCUTS[$((NEXT_NUM - 1))]}"
        printf "Current: ${CYAN}%s${NC} | Next: ${GREEN}/run-stage %02d${NC} or ${GREEN}/%s${NC}\n" \
            "$CURRENT_STAGE" "$NEXT_NUM" "$NEXT_SHORTCUT"
    else
        echo -e "Current: ${CYAN}$CURRENT_STAGE${NC} | ${GREEN}Pipeline complete!${NC}"
    fi
else
    echo -e "Start: ${GREEN}/init-project [name]${NC} or ${GREEN}/run-stage 01${NC}"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
