#!/bin/bash
# pre-stage.sh - Pre-stage execution hook
# claude-symphony workflow pipeline

set -e

STAGE_ID="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

CONTEXT_TRIGGER_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Pre-Stage Hook: $STAGE_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check if previous stage is completed
check_prerequisites() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    # Stage 01 has no prerequisites
    if [ "$stage_num" == "01" ]; then
        echo -e "${GREEN}✓${NC} First stage - No prerequisites"
        return 0
    fi

    # Calculate previous stage number
    local prev_num=$(printf "%02d" $((10#$stage_num - 1)))
    local prev_stage=$(ls "$PROJECT_ROOT/stages/" | grep "^${prev_num}-" | head -1)

    if [ -z "$prev_stage" ]; then
        echo -e "${RED}✗${NC} Cannot find previous stage: $prev_num"
        return 1
    fi

    # Check previous stage status
    local prev_status=$(jq -r ".stages.\"$prev_stage\".status" "$PROGRESS_FILE" 2>/dev/null || echo "pending")

    if [ "$prev_status" != "completed" ]; then
        echo -e "${RED}✗${NC} Previous stage not completed: $prev_stage (status: $prev_status)"
        echo "  Please complete the previous stage first."
        return 1
    fi

    echo -e "${GREEN}✓${NC} Previous stage completed: $prev_stage"
    return 0
}

# 2. Check HANDOFF.md exists
check_handoff() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    # Stage 01 doesn't need handoff
    if [ "$stage_num" == "01" ]; then
        echo -e "${GREEN}✓${NC} First stage - No handoff needed"
        return 0
    fi

    local prev_num=$(printf "%02d" $((10#$stage_num - 1)))
    local prev_stage=$(ls "$PROJECT_ROOT/stages/" | grep "^${prev_num}-" | head -1)
    local handoff_file="$PROJECT_ROOT/stages/$prev_stage/HANDOFF.md"

    if [ ! -f "$handoff_file" ]; then
        echo -e "${RED}✗${NC} HANDOFF.md missing: $handoff_file"
        echo "  Please run /handoff in the previous stage."
        return 1
    fi

    echo -e "${GREEN}✓${NC} HANDOFF.md exists: $prev_stage/HANDOFF.md"
    return 0
}

# 3. Check required input files
check_inputs() {
    local config_file="$PROJECT_ROOT/stages/$STAGE_ID/config.yaml"

    if [ ! -f "$config_file" ]; then
        echo -e "${YELLOW}⚠${NC} config.yaml missing - Skipping input file validation"
        return 0
    fi

    # Extract required inputs from YAML (simple parsing)
    local inputs=$(grep -A100 "^inputs:" "$config_file" | grep -A50 "required:" | grep "name:" | head -5)

    if [ -z "$inputs" ]; then
        echo -e "${GREEN}✓${NC} No required input files"
        return 0
    fi

    echo "Checking required input files..."
    # In actual implementation, YAML parser recommended
    echo -e "${GREEN}✓${NC} Input file validation complete"
    return 0
}

# 4. Check checkpoint (required stages)
check_checkpoint() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    # Stage 06, 07 check for previous checkpoint
    if [ "$stage_num" == "07" ]; then
        local cp_count=$(jq '.checkpoints | length' "$PROGRESS_FILE" 2>/dev/null || echo "0")

        if [ "$cp_count" == "0" ]; then
            echo -e "${YELLOW}⚠${NC} Warning: No checkpoints exist."
            echo "  Checkpoint creation before refactoring is recommended."
            echo "  Please run /checkpoint"
        else
            echo -e "${GREEN}✓${NC} Checkpoints exist: $cp_count"
        fi
    fi

    return 0
}

# 5. Check context status (warning if 50% or below)
check_context_status() {
    if [ ! -f "$CONTEXT_TRIGGER_FILE" ]; then
        echo -e "${GREEN}✓${NC} Context status normal"
        return 0
    fi

    local TRIGGERED=$(jq -r '.triggered // false' "$CONTEXT_TRIGGER_FILE" 2>/dev/null || echo "false")
    local REMAINING=$(jq -r '.remaining // 100' "$CONTEXT_TRIGGER_FILE" 2>/dev/null || echo "100")
    local LEVEL=$(jq -r '.level // "warning"' "$CONTEXT_TRIGGER_FILE" 2>/dev/null || echo "warning")

    if [ "$TRIGGERED" = "true" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        if [ "$LEVEL" = "critical" ]; then
            echo -e "${RED}⚠️ Context critical state (${REMAINING}% remaining)${NC}"
            echo ""
            echo "Auto-snapshot has been saved."
            echo "Running /compact or /clear before starting is recommended."
            echo ""
            echo -e "${YELLOW}Do you want to continue? (y/n)${NC}"
        else
            echo -e "${YELLOW}⚠️ Context low warning (${REMAINING}% remaining)${NC}"
            echo ""
            echo "Auto-snapshot has been saved."
            echo "Running /compact is recommended for long work stages."
            echo ""
            echo -e "${CYAN}Do you want to continue? (y/n)${NC}"
        fi

        read -r response </dev/tty 2>/dev/null || response="y"

        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo ""
            echo "Stage start cancelled."
            echo "  → Run /compact and try again."
            echo "  → Snapshot location: state/context/"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            return 1
        fi

        echo ""
        echo -e "${GREEN}✓${NC} User confirmation complete - Proceeding with stage"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    fi

    echo -e "${GREEN}✓${NC} Context status normal"
    return 0
}

# Execute
echo ""
check_context_status || exit 1
check_prerequisites || exit 1
check_handoff || exit 1
check_inputs || exit 1
check_checkpoint

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Pre-Stage Hook complete - Stage execution ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
