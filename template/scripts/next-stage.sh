#!/bin/bash
# next-stage.sh - Transition to next stage
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

# Option handling
FORCE_MODE=false
PREVIEW_MODE=false
NO_HANDOFF=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --force) FORCE_MODE=true ;;
        --preview) PREVIEW_MODE=true ;;
        --no-handoff) NO_HANDOFF=true ;;
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

# Stage info
declare -a STAGE_IDS=("01-brainstorm" "02-research" "03-planning" "04-ui-ux" "05-task-management" "06-implementation" "07-refactoring" "08-qa" "09-testing" "10-deployment")
declare -a CHECKPOINT_REQUIRED=("false" "false" "false" "false" "false" "true" "true" "false" "false" "false")

# Check current stage
CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE")

if [ "$CURRENT_STAGE" == "none" ] || [ -z "$CURRENT_STAGE" ]; then
    echo -e "${RED}Error:${NC} No stage in progress."
    echo "  Start with /run-stage 01 or /brainstorm."
    exit 1
fi

# Find current stage index
CURRENT_IDX=-1
for i in "${!STAGE_IDS[@]}"; do
    if [ "${STAGE_IDS[$i]}" == "$CURRENT_STAGE" ]; then
        CURRENT_IDX=$i
        break
    fi
done

if [ $CURRENT_IDX -eq -1 ]; then
    echo -e "${RED}Error:${NC} Unknown stage: $CURRENT_STAGE"
    exit 1
fi

# Check next stage
NEXT_IDX=$((CURRENT_IDX + 1))
if [ $NEXT_IDX -ge ${#STAGE_IDS[@]} ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🎉 ${GREEN}Pipeline Complete!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "All 10 stages have been completed."
    echo ""
    echo "Final review:"
    echo "  - Check overall status with /status"
    echo "  - Review handoff documents in state/handoffs/"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

NEXT_STAGE="${STAGE_IDS[$NEXT_IDX]}"
CURRENT_STAGE_DIR="$STAGES_DIR/$CURRENT_STAGE"
NEXT_STAGE_DIR="$STAGES_DIR/$NEXT_STAGE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🔄 ${WHITE}Stage Transition${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Current: ${CYAN}$CURRENT_STAGE${NC} → Next: ${GREEN}$NEXT_STAGE${NC}"
echo ""

# Validate completion conditions
echo -e "${BLUE}[Completion Validation]${NC}"
VALIDATION_FAILED=false

# Check outputs directory
if [ -d "$CURRENT_STAGE_DIR/outputs" ]; then
    OUTPUT_COUNT=$(find "$CURRENT_STAGE_DIR/outputs" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$OUTPUT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Output files exist (${OUTPUT_COUNT} files)"
    else
        echo -e "${RED}✗${NC} No output files"
        VALIDATION_FAILED=true
    fi
else
    echo -e "${RED}✗${NC} No outputs directory"
    VALIDATION_FAILED=true
fi

# Check if checkpoint is required
NEEDS_CHECKPOINT="${CHECKPOINT_REQUIRED[$CURRENT_IDX]}"
if [ "$NEEDS_CHECKPOINT" == "true" ]; then
    # Check if checkpoint exists for current stage
    STAGE_NUM=$(echo "$CURRENT_STAGE" | cut -d'-' -f1)
    CP_EXISTS=$(ls -d "$PROJECT_ROOT/state/checkpoints/CP-$STAGE_NUM-"* 2>/dev/null | head -1 || true)

    if [ -n "$CP_EXISTS" ]; then
        echo -e "${GREEN}✓${NC} Checkpoint exists"
    else
        echo -e "${RED}✗${NC} Checkpoint required (not created)"
        VALIDATION_FAILED=true
    fi
fi

echo ""

# On validation failure
if [ "$VALIDATION_FAILED" = true ] && [ "$FORCE_MODE" = false ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}⚠️  Stage transition conditions not met${NC}"
    echo ""
    echo "Next steps:"
    if [ "$NEEDS_CHECKPOINT" == "true" ]; then
        echo "  1. Run /checkpoint"
    fi
    echo "  2. Verify output files are generated"
    echo "  3. Force transition with /next --force (not recommended)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# Preview mode
if [ "$PREVIEW_MODE" = true ]; then
    echo -e "${YELLOW}[PREVIEW] Not executing actual transition.${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# Generate HANDOFF.md
if [ "$NO_HANDOFF" = false ]; then
    echo -e "${BLUE}[Generating HANDOFF.md]${NC}"

    HANDOFF_FILE="$CURRENT_STAGE_DIR/HANDOFF.md"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    TIMESTAMP_READABLE=$(date "+%Y-%m-%d %H:%M")

    cat > "$HANDOFF_FILE" << EOF
# Handoff: $CURRENT_STAGE → $NEXT_STAGE

Created: $TIMESTAMP_READABLE

## Completed Tasks

- [x] Executed $CURRENT_STAGE stage
- [x] Generated output files

## Key Deliverables

$(find "$CURRENT_STAGE_DIR/outputs" -type f -name "*.md" -o -name "*.json" -o -name "*.yaml" 2>/dev/null | while read -r f; do echo "- $(basename "$f")"; done)

## Next Steps

Instructions for starting next stage ($NEXT_STAGE):
1. Reference stages/$NEXT_STAGE/CLAUDE.md
2. Input files: stages/$CURRENT_STAGE/outputs/

## Notes

- This is an auto-generated handoff document.
- Please supplement manually if needed.
EOF

    echo -e "${GREEN}✓${NC} $HANDOFF_FILE generated"

    # Copy to handoff archive
    mkdir -p "$PROJECT_ROOT/state/handoffs"
    cp "$HANDOFF_FILE" "$PROJECT_ROOT/state/handoffs/${CURRENT_STAGE}-HANDOFF.md"
fi

# Update status
echo ""
echo -e "${BLUE}[Status Update]${NC}"

# Update progress.json
jq ".current_stage = \"$NEXT_STAGE\" | \
    .stages.\"$CURRENT_STAGE\".status = \"completed\" | \
    .stages.\"$CURRENT_STAGE\".completed_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\" | \
    .stages.\"$NEXT_STAGE\".status = \"in_progress\" | \
    .stages.\"$NEXT_STAGE\".started_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" \
    "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

echo -e "${GREEN}✓${NC} $CURRENT_STAGE: completed"
echo -e "${GREEN}✓${NC} $NEXT_STAGE: in_progress"
echo -e "${GREEN}✓${NC} progress.json updated"

# Completion message
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅${NC} ${WHITE}$NEXT_STAGE${NC} stage started!"
echo ""
echo "Next tasks:"
echo "  1. Reference stages/$NEXT_STAGE/CLAUDE.md"
echo "  2. Input files: stages/$CURRENT_STAGE/outputs/"

# Shortcut command guidance
declare -a SHORTCUTS=("brainstorm" "research" "planning" "ui-ux" "tasks" "implement" "refactor" "qa" "test" "deploy")
echo "  3. Shortcut command: /${SHORTCUTS[$NEXT_IDX]}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
