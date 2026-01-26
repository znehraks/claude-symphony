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
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)
    local missing_files=()
    local warning_files=()

    echo "Checking required input files for $STAGE_ID..."

    # Stage-specific input requirements
    case "$stage_num" in
        "01")
            # Stage 01: project_brief.md required
            local brief="$PROJECT_ROOT/stages/01-brainstorm/inputs/project_brief.md"
            if [ ! -f "$brief" ]; then
                missing_files+=("project_brief.md")
            fi
            ;;
        "02")
            # Stage 02: requirements_analysis.md from Stage 01
            local req="$PROJECT_ROOT/stages/01-brainstorm/outputs/requirements_analysis.md"
            if [ ! -f "$req" ]; then
                warning_files+=("01-brainstorm/outputs/requirements_analysis.md")
            fi
            ;;
        "03")
            # Stage 03: tech_research.md, feasibility_report.md from Stage 02
            local tech="$PROJECT_ROOT/stages/02-research/outputs/tech_research.md"
            local feas="$PROJECT_ROOT/stages/02-research/outputs/feasibility_report.md"
            [ ! -f "$tech" ] && missing_files+=("02-research/outputs/tech_research.md")
            [ ! -f "$feas" ] && warning_files+=("02-research/outputs/feasibility_report.md")
            ;;
        "04")
            # Stage 04: architecture.md from Stage 03
            local arch="$PROJECT_ROOT/stages/03-planning/outputs/architecture.md"
            [ ! -f "$arch" ] && missing_files+=("03-planning/outputs/architecture.md")
            ;;
        "05")
            # Stage 05: project_plan.md, architecture.md from previous stages
            local plan="$PROJECT_ROOT/stages/03-planning/outputs/project_plan.md"
            local arch="$PROJECT_ROOT/stages/03-planning/outputs/architecture.md"
            [ ! -f "$plan" ] && missing_files+=("03-planning/outputs/project_plan.md")
            [ ! -f "$arch" ] && warning_files+=("03-planning/outputs/architecture.md")
            ;;
        "06")
            # Stage 06: tasks.md, implementation.yaml required
            local tasks="$PROJECT_ROOT/stages/05-task-management/outputs/tasks.md"
            local impl="$PROJECT_ROOT/stages/03-planning/outputs/implementation.yaml"
            [ ! -f "$tasks" ] && missing_files+=("05-task-management/outputs/tasks.md")
            [ ! -f "$impl" ] && missing_files+=("03-planning/outputs/implementation.yaml")
            ;;
        "07")
            # Stage 07: source_code from Stage 06
            local src="$PROJECT_ROOT/stages/06-implementation/outputs/source_code"
            [ ! -d "$src" ] && missing_files+=("06-implementation/outputs/source_code/")
            ;;
        "08")
            # Stage 08: refactored_code from Stage 07
            local ref="$PROJECT_ROOT/stages/07-refactoring/outputs/refactored_code"
            [ ! -d "$ref" ] && warning_files+=("07-refactoring/outputs/refactored_code/")
            ;;
        "09")
            # Stage 09: source_code, qa_report.md
            local src="$PROJECT_ROOT/stages/06-implementation/outputs/source_code"
            local qa="$PROJECT_ROOT/stages/08-qa/outputs/qa_report.md"
            [ ! -d "$src" ] && missing_files+=("source_code/")
            [ ! -f "$qa" ] && warning_files+=("08-qa/outputs/qa_report.md")
            ;;
        "10")
            # Stage 10: tests/, test_report.md
            local tests="$PROJECT_ROOT/stages/09-testing/outputs/tests"
            [ ! -d "$tests" ] && warning_files+=("09-testing/outputs/tests/")
            ;;
    esac

    # Report missing files (blocking)
    if [ ${#missing_files[@]} -gt 0 ]; then
        echo -e "${RED}✗${NC} Missing required input files:"
        for f in "${missing_files[@]}"; do
            echo "     - $f"
        done
        echo ""
        echo "  Please complete the previous stage(s) or create these files."
        return 1
    fi

    # Report warning files (non-blocking)
    if [ ${#warning_files[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} Recommended input files not found (non-blocking):"
        for f in "${warning_files[@]}"; do
            echo "     - $f"
        done
    fi

    echo -e "${GREEN}✓${NC} Input file validation complete"
    return 0
}

# 4. Check required prompts for current stage
check_required_prompts() {
    local stage_dir="$PROJECT_ROOT/stages/$STAGE_ID"
    local config_file="$stage_dir/config.yaml"

    if [ ! -f "$config_file" ]; then
        echo -e "${YELLOW}⚠${NC} config.yaml missing - Skipping prompt validation"
        return 0
    fi

    # Check if yq is available
    if ! command -v yq &> /dev/null; then
        echo -e "${YELLOW}⚠${NC} yq not installed - Skipping prompt validation"
        return 0
    fi

    # Check auto_invoke prompt_file
    local prompt_file=$(yq '.auto_invoke.prompt_file // ""' "$config_file" 2>/dev/null)

    if [ -n "$prompt_file" ] && [ "$prompt_file" != "null" ]; then
        local full_path="$stage_dir/$prompt_file"

        if [ ! -f "$full_path" ]; then
            echo -e "${YELLOW}⚠${NC} Required prompt not found: $prompt_file"
            echo "     Full path: $full_path"
            echo ""
            echo "  This prompt should have been generated by the previous stage."
            echo "  Options:"
            echo "    1. Go back to previous stage and generate the required outputs"
            echo "    2. Create the prompt file manually"
            echo "    3. Continue without auto_invoke (manual execution required)"
            echo ""

            # Check if this is a critical prompt (blocking)
            local auto_enabled=$(yq '.auto_invoke.enabled // false' "$config_file" 2>/dev/null)
            if [ "$auto_enabled" == "true" ]; then
                echo -e "${YELLOW}Note:${NC} auto_invoke is enabled for this stage."
                echo "       Stage may not function correctly without this prompt."
            fi
        else
            echo -e "${GREEN}✓${NC} Required prompt exists: $prompt_file"
        fi
    fi

    # Check prompts directory for expected files
    local prompts_dir="$stage_dir/prompts"
    if [ -d "$prompts_dir" ]; then
        local prompt_count=$(find "$prompts_dir" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$prompt_count" -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Prompts directory has $prompt_count file(s)"
        else
            echo -e "${YELLOW}⚠${NC} Prompts directory is empty"
        fi
    fi

    return 0
}

# 5. Check checkpoint (required stages)
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

# 6. Check Moodboard requirement for design stages
check_moodboard() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    # Moodboard is relevant for stages 01 and 04
    if [ "$stage_num" != "01" ] && [ "$stage_num" != "04" ]; then
        return 0
    fi

    # Check if moodboard is enabled in config
    local ui_config="$PROJECT_ROOT/config/ui-ux.yaml"
    local moodboard_enabled="true"

    if [ -f "$ui_config" ] && command -v yq &> /dev/null; then
        moodboard_enabled=$(yq '.moodboard.collection_flow.enabled // true' "$ui_config" 2>/dev/null)
    fi

    if [ "$moodboard_enabled" != "true" ]; then
        echo -e "${YELLOW}⚠${NC} Moodboard collection disabled - Skipping"
        return 0
    fi

    # Check if moodboard directory exists and has content
    local moodboard_dir="$PROJECT_ROOT/stages/$STAGE_ID/moodboard"

    if [ ! -d "$moodboard_dir" ] || [ -z "$(ls -A "$moodboard_dir" 2>/dev/null | grep -v '.gitkeep')" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${CYAN}🎨 Moodboard Collection${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""

        if [ "$stage_num" == "01" ]; then
            echo "  Stage 01 (Brainstorm) can benefit from design references."
            echo "  Collect inspiration images, UI references, and visual ideas."
        else
            echo "  Stage 04 (UI/UX) requires design references for better results."
            echo "  Collect colors, typography, layouts, and component references."
        fi

        echo ""
        echo "  Options:"
        echo "    1. Run /moodboard        - Collect design references interactively"
        echo "    2. Run /moodboard skip   - Skip and use AI-generated design tokens"
        echo "    3. Add files manually to: stages/$STAGE_ID/moodboard/"
        echo ""
        echo -e "${YELLOW}Do you want to continue without moodboard? (y/n)${NC}"

        read -r response </dev/tty 2>/dev/null || response="y"

        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo ""
            echo "  → Run /moodboard to collect design references"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            return 1
        fi

        echo ""
        echo -e "${YELLOW}⚠${NC} Continuing without moodboard - AI will generate design tokens"
    else
        local file_count=$(ls -A "$moodboard_dir" 2>/dev/null | grep -v '.gitkeep' | wc -l | tr -d ' ')
        echo -e "${GREEN}✓${NC} Moodboard found: $file_count reference(s)"
    fi

    return 0
}

# Execute
echo ""
check_context_status || exit 1
check_prerequisites || exit 1
check_handoff || exit 1
check_inputs || exit 1
check_required_prompts
check_checkpoint
check_moodboard || exit 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Pre-Stage Hook complete - Stage execution ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
