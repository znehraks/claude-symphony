#!/bin/bash
# post-stage.sh - Post-stage completion hook
# claude-symphony workflow pipeline

set -e

STAGE_ID="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Post-Stage Hook: $STAGE_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Validate completion criteria
validate_completion() {
    local stage_dir="$PROJECT_ROOT/stages/$STAGE_ID"
    local config_file="$stage_dir/config.yaml"

    echo "Validating completion criteria..."

    # Check outputs directory
    if [ -d "$stage_dir/outputs" ]; then
        local output_count=$(ls -1 "$stage_dir/outputs" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✓${NC} Output files: $output_count"
    fi

    return 0
}

# 2. HANDOFF.md generation notification
check_handoff() {
    local handoff_file="$PROJECT_ROOT/stages/$STAGE_ID/HANDOFF.md"

    if [ ! -f "$handoff_file" ]; then
        echo -e "  ${YELLOW}⚠${NC} HANDOFF.md not generated"
        echo "     Please run /handoff to generate the handoff document."
        return 1
    fi

    echo -e "  ${GREEN}✓${NC} HANDOFF.md exists"

    # Archive handoff
    local archive_name="${STAGE_ID}-$(date +%Y%m%d-%H%M).md"
    cp "$handoff_file" "$PROJECT_ROOT/state/handoffs/$archive_name"
    echo -e "  ${GREEN}✓${NC} Handoff archived: state/handoffs/$archive_name"

    return 0
}

# 3. Update progress.json
update_progress() {
    echo "Updating status..."

    # Update status with jq
    if command -v jq &> /dev/null; then
        local tmp_file=$(mktemp)
        jq ".stages.\"$STAGE_ID\".status = \"completed\" | \
            .stages.\"$STAGE_ID\".completed_at = \"$TIMESTAMP\" | \
            .stages.\"$STAGE_ID\".handoff_generated = true | \
            .pipeline.updated_at = \"$TIMESTAMP\"" \
            "$PROGRESS_FILE" > "$tmp_file" && mv "$tmp_file" "$PROGRESS_FILE"

        echo -e "  ${GREEN}✓${NC} progress.json updated"
    else
        echo -e "  ${YELLOW}⚠${NC} jq not installed - Manual update required"
    fi

    return 0
}

# 4. Checkpoint creation reminder (required stages)
remind_checkpoint() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    if [ "$stage_num" == "06" ] || [ "$stage_num" == "07" ]; then
        echo ""
        echo -e "${BLUE}📌 Checkpoint Reminder${NC}"
        echo "  Checkpoint creation is recommended for this stage."
        echo "  Please run /checkpoint \"Stage completed\""
    fi
}

# 5. Show next stage guidance
show_next_stage() {
    local config_file="$PROJECT_ROOT/stages/$STAGE_ID/config.yaml"
    local next_stage=""

    if [ -f "$config_file" ]; then
        next_stage=$(grep "next_stage:" "$config_file" | cut -d'"' -f2 | head -1)
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -z "$next_stage" ] || [ "$next_stage" == "null" ]; then
        echo -e "${GREEN}🎉 Pipeline Complete!${NC}"
        echo "  All stages have been completed."
    else
        echo -e "${GREEN}✓${NC} Stage $STAGE_ID completed"
        echo ""
        echo -e "${BLUE}Next stage: $next_stage${NC}"
        echo "  Run: /run-stage $next_stage"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Execute
echo ""
validate_completion
check_handoff
update_progress
remind_checkpoint
show_next_stage
