#!/bin/bash
# validate-config.sh - Configuration Validation Script
# claude-symphony workflow pipeline
#
# Validates cross-file YAML consistency across configuration files.
# Exit codes: 0 (pass), 1 (critical errors), 2 (warnings only)

set -e

# Source common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# Configuration
# =============================================================================
VERSION="1.0.0"

# Counters
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
PASS_COUNT=0
FIX_COUNT=0

# Options
FIX_MODE=false
VERBOSE=false
OUTPUT_JSON=false
STAGE_FILTER=""
RULE_FILTER=""
SHOW_RECOVERY=false

# Results storage
declare -a RESULTS=()
declare -a FIXES=()

# =============================================================================
# Usage
# =============================================================================
usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Validates configuration consistency across claude-symphony YAML files.

Options:
  --fix           Auto-fix correctable issues
  --verbose       Show detailed validation output
  --json          Output results as JSON
  --stage STAGE   Validate specific stage only (e.g., 01-brainstorm)
  --rule RULE     Run specific rule only (see rules below)
  --help          Show this help message

Validation Rules:
  model_references        [CRITICAL] Model references exist in models.yaml
  parallel_alignment      [CRITICAL] Parallel stage config alignment
  collaboration_consistency [CRITICAL] Parallel stages have 2+ models
  file_references         [HIGH] Required input/output files exist
  auto_invoke            [HIGH] Wrapper scripts and fallback validation
  execution_mode         [HIGH] Stage mode aligns with model capabilities
  ai_wrapper_health      [HIGH] AI wrapper scripts are executable
  mcp_servers            [MEDIUM] MCP server fallback configs exist
  epic_cycles            [MEDIUM] Epic cycles configuration validation
  requirements_refinement [MEDIUM] Requirements refinement settings
  implementation_order   [MEDIUM] Implementation order configuration
  notion_integration     [MEDIUM] Notion integration and fallback settings
  prerequisites          [MEDIUM] Stage prerequisites are valid

Recovery Guide:
  --recovery-guide       Show detailed recovery instructions for all errors

Exit Codes:
  0 - All validations passed
  1 - Critical errors found
  2 - Warnings only (non-critical)

Examples:
  $(basename "$0")                    # Run all validations
  $(basename "$0") --fix              # Auto-fix correctable issues
  $(basename "$0") --stage 09-testing # Validate specific stage
  $(basename "$0") --rule model_references --verbose
EOF
    exit 0
}

# =============================================================================
# Output Functions
# =============================================================================
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🔧 claude-symphony Configuration Validator v${VERSION}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}▸ $1${NC}"
    echo -e "${BLUE}────────────────────────────────────────────────────${NC}"
}

result_critical() {
    echo -e "  ${RED}✗ [CRITICAL]${NC} $1"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
    RESULTS+=("CRITICAL: $1")
}

result_high() {
    echo -e "  ${YELLOW}⚠ [HIGH]${NC} $1"
    HIGH_COUNT=$((HIGH_COUNT + 1))
    RESULTS+=("HIGH: $1")
}

result_medium() {
    echo -e "  ${MAGENTA}○ [MEDIUM]${NC} $1"
    MEDIUM_COUNT=$((MEDIUM_COUNT + 1))
    RESULTS+=("MEDIUM: $1")
}

result_pass() {
    if [ "$VERBOSE" = true ]; then
        echo -e "  ${GREEN}✓${NC} $1"
    fi
    PASS_COUNT=$((PASS_COUNT + 1))
}

result_fixed() {
    echo -e "  ${GREEN}⚡ [FIXED]${NC} $1"
    FIX_COUNT=$((FIX_COUNT + 1))
    FIXES+=("$1")
}

verbose_log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "    ${GRAY}$1${NC}"
    fi
}

# =============================================================================
# Helper Functions
# =============================================================================
check_yq() {
    if ! command -v yq &> /dev/null; then
        echo -e "${RED}Error:${NC} yq is required for YAML parsing."
        echo "Install with: brew install yq (macOS) or snap install yq (Linux)"
        exit 1
    fi
}

get_all_stages() {
    echo "01-brainstorm 02-research 03-planning 04-ui-ux 05-task-management 06-implementation 07-refactoring 08-qa 09-testing 10-deployment"
}

get_parallel_stages() {
    yq '.execution_policy.stage_classification.parallel_capable[]' "$CONFIG_DIR/ai_collaboration.yaml" 2>/dev/null | tr '\n' ' '
}

get_sequential_stages() {
    yq '.execution_policy.stage_classification.sequential_only[]' "$CONFIG_DIR/ai_collaboration.yaml" 2>/dev/null | tr '\n' ' '
}

get_defined_models() {
    yq '.models | keys | .[]' "$CONFIG_DIR/models.yaml" 2>/dev/null
}

# =============================================================================
# Rule 1: Model References (CRITICAL)
# Every model in stage config must exist in models.yaml
# =============================================================================
validate_model_references() {
    print_section "Rule: model_references [CRITICAL]"
    verbose_log "Checking that all model references exist in models.yaml"

    local defined_models
    defined_models=$(get_defined_models)

    local stages
    if [ -n "$STAGE_FILTER" ]; then
        stages="$STAGE_FILTER"
    else
        stages=$(get_all_stages)
    fi

    for stage in $stages; do
        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            verbose_log "Skipping $stage - no config.yaml"
            continue
        fi

        # Check primary model
        local primary
        primary=$(yq '.models.primary // ""' "$stage_config" 2>/dev/null)
        if [ -n "$primary" ] && [ "$primary" != "null" ]; then
            if echo "$defined_models" | grep -qw "$primary"; then
                result_pass "$stage: primary model '$primary' valid"
            else
                result_critical "$stage: primary model '$primary' not defined in models.yaml"
            fi
        fi

        # Check secondary model
        local secondary
        secondary=$(yq '.models.secondary // ""' "$stage_config" 2>/dev/null)
        if [ -n "$secondary" ] && [ "$secondary" != "null" ]; then
            if echo "$defined_models" | grep -qw "$secondary"; then
                result_pass "$stage: secondary model '$secondary' valid"
            else
                result_critical "$stage: secondary model '$secondary' not defined in models.yaml"
            fi
        fi

        # Check auto_invoke model
        local auto_model
        auto_model=$(yq '.auto_invoke.model // ""' "$stage_config" 2>/dev/null)
        if [ -n "$auto_model" ] && [ "$auto_model" != "null" ]; then
            if echo "$defined_models" | grep -qw "$auto_model"; then
                result_pass "$stage: auto_invoke model '$auto_model' valid"
            else
                result_critical "$stage: auto_invoke model '$auto_model' not defined in models.yaml"
            fi
        fi

        # Check fallback model
        local fallback_model
        fallback_model=$(yq '.auto_invoke.fallback.model // ""' "$stage_config" 2>/dev/null)
        if [ -n "$fallback_model" ] && [ "$fallback_model" != "null" ]; then
            if echo "$defined_models" | grep -qw "$fallback_model"; then
                result_pass "$stage: fallback model '$fallback_model' valid"
            else
                result_critical "$stage: fallback model '$fallback_model' not defined in models.yaml"
            fi
        fi
    done
}

# =============================================================================
# Rule 2: Parallel Alignment (CRITICAL)
# parallel_capable stages must match config.yaml collaboration settings
# =============================================================================
validate_parallel_alignment() {
    print_section "Rule: parallel_alignment [CRITICAL]"
    verbose_log "Checking parallel stage classification matches stage configs"

    local parallel_stages
    parallel_stages=$(get_parallel_stages)

    local stages
    if [ -n "$STAGE_FILTER" ]; then
        stages="$STAGE_FILTER"
    else
        stages=$(get_all_stages)
    fi

    for stage in $stages; do
        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            continue
        fi

        local collab_mode
        collab_mode=$(yq '.models.collaboration // ""' "$stage_config" 2>/dev/null)
        local is_parallel_capable=false

        if echo "$parallel_stages" | grep -qw "$stage"; then
            is_parallel_capable=true
        fi

        if [ "$is_parallel_capable" = true ]; then
            if [ "$collab_mode" = "parallel" ]; then
                result_pass "$stage: parallel classification matches config (parallel)"
            else
                result_critical "$stage: listed as parallel_capable but config has collaboration='$collab_mode'"

                if [ "$FIX_MODE" = true ]; then
                    # Auto-fix: update stage config to parallel
                    yq -i '.models.collaboration = "parallel"' "$stage_config"
                    result_fixed "$stage: set collaboration to 'parallel'"
                fi
            fi
        else
            if [ "$collab_mode" = "parallel" ]; then
                result_critical "$stage: has parallel collaboration but not in parallel_capable list"
            else
                result_pass "$stage: sequential classification matches config"
            fi
        fi
    done
}

# =============================================================================
# Rule 3: Collaboration Consistency (CRITICAL)
# Parallel stages need 2+ models configured
# =============================================================================
validate_collaboration_consistency() {
    print_section "Rule: collaboration_consistency [CRITICAL]"
    verbose_log "Checking parallel stages have sufficient model configuration"

    local parallel_stages
    parallel_stages=$(get_parallel_stages)

    for stage in $parallel_stages; do
        if [ -n "$STAGE_FILTER" ] && [ "$STAGE_FILTER" != "$stage" ]; then
            continue
        fi

        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            result_critical "$stage: parallel stage missing config.yaml"
            continue
        fi

        local primary secondary
        primary=$(yq '.models.primary // ""' "$stage_config" 2>/dev/null)
        secondary=$(yq '.models.secondary // ""' "$stage_config" 2>/dev/null)

        local model_count=0
        [ -n "$primary" ] && [ "$primary" != "null" ] && model_count=$((model_count + 1))
        [ -n "$secondary" ] && [ "$secondary" != "null" ] && model_count=$((model_count + 1))

        if [ "$model_count" -ge 2 ]; then
            result_pass "$stage: has $model_count models for parallel execution"
        else
            result_critical "$stage: parallel stage needs 2+ models, has $model_count"
        fi
    done
}

# =============================================================================
# Rule 4: File References (HIGH)
# Required input/output files exist
# =============================================================================
validate_file_references() {
    print_section "Rule: file_references [HIGH]"
    verbose_log "Checking required input/output files exist"

    local stages
    if [ -n "$STAGE_FILTER" ]; then
        stages="$STAGE_FILTER"
    else
        stages=$(get_all_stages)
    fi

    for stage in $stages; do
        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            continue
        fi

        # Check required input files
        local required_inputs
        required_inputs=$(yq '.inputs.required[]' "$stage_config" 2>/dev/null || echo "")

        for input in $required_inputs; do
            if [ -z "$input" ] || [ "$input" = "null" ]; then
                continue
            fi

            local input_path="$STAGES_DIR/$stage/$input"
            if [ -f "$input_path" ]; then
                result_pass "$stage: input file exists: $input"
            else
                # Check if it's a reference to another stage
                if [[ "$input" == "../"* ]]; then
                    local ref_path="$STAGES_DIR/$stage/$input"
                    if [ -f "$ref_path" ]; then
                        result_pass "$stage: cross-stage input exists: $input"
                    else
                        result_high "$stage: required input missing: $input"
                    fi
                else
                    result_high "$stage: required input missing: $input"
                fi
            fi
        done

        # Check required output templates exist
        local templates_dir="$STAGES_DIR/$stage/templates"
        if [ -d "$templates_dir" ]; then
            local template_count=$(find "$templates_dir" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
            if [ "$template_count" -gt 0 ]; then
                result_pass "$stage: $template_count output template(s) found"
            fi
        fi

        # Check CLAUDE.md exists (essential for stage execution)
        local claude_md="$STAGES_DIR/$stage/CLAUDE.md"
        if [ -f "$claude_md" ]; then
            result_pass "$stage: CLAUDE.md exists"
        else
            result_high "$stage: CLAUDE.md missing (stage cannot execute properly)"
        fi
    done
}

# =============================================================================
# Rule 5: Auto-Invoke (HIGH)
# Wrapper scripts exist, fallback model defined
# =============================================================================
validate_auto_invoke() {
    print_section "Rule: auto_invoke [HIGH]"
    verbose_log "Checking auto-invoke configurations"

    local stages
    if [ -n "$STAGE_FILTER" ]; then
        stages="$STAGE_FILTER"
    else
        stages=$(get_all_stages)
    fi

    for stage in $stages; do
        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            continue
        fi

        local auto_enabled
        auto_enabled=$(yq '.auto_invoke.enabled // false' "$stage_config" 2>/dev/null)

        if [ "$auto_enabled" != "true" ]; then
            verbose_log "$stage: auto_invoke disabled, skipping"
            continue
        fi

        # Check wrapper script exists
        local wrapper
        wrapper=$(yq '.auto_invoke.wrapper // ""' "$stage_config" 2>/dev/null)
        if [ -n "$wrapper" ] && [ "$wrapper" != "null" ]; then
            local wrapper_path="$PROJECT_ROOT/$wrapper"
            if [ -f "$wrapper_path" ]; then
                if [ -x "$wrapper_path" ]; then
                    result_pass "$stage: wrapper script exists and executable"
                else
                    result_high "$stage: wrapper script exists but not executable: $wrapper"
                    if [ "$FIX_MODE" = true ]; then
                        chmod +x "$wrapper_path"
                        result_fixed "$stage: made $wrapper executable"
                    fi
                fi
            else
                result_high "$stage: wrapper script not found: $wrapper"
            fi
        fi

        # Check prompt file exists
        local prompt_file
        prompt_file=$(yq '.auto_invoke.prompt_file // ""' "$stage_config" 2>/dev/null)
        if [ -n "$prompt_file" ] && [ "$prompt_file" != "null" ]; then
            local prompt_path="$STAGES_DIR/$stage/$prompt_file"
            if [ -f "$prompt_path" ]; then
                result_pass "$stage: prompt file exists: $prompt_file"
            else
                result_high "$stage: auto_invoke prompt file missing: $prompt_file"
            fi
        fi

        # Check fallback configuration
        local fallback_enabled
        fallback_enabled=$(yq '.auto_invoke.fallback.enabled // false' "$stage_config" 2>/dev/null)
        if [ "$fallback_enabled" = "true" ]; then
            local fallback_model
            fallback_model=$(yq '.auto_invoke.fallback.model // ""' "$stage_config" 2>/dev/null)
            if [ -n "$fallback_model" ] && [ "$fallback_model" != "null" ]; then
                result_pass "$stage: fallback model configured: $fallback_model"
            else
                result_high "$stage: fallback enabled but no model specified"
            fi
        fi
    done
}

# =============================================================================
# Rule 5: Execution Mode (HIGH)
# Stage mode aligns with model capabilities
# =============================================================================
validate_execution_mode() {
    print_section "Rule: execution_mode [HIGH]"
    verbose_log "Checking execution modes align with model capabilities"

    local stages
    if [ -n "$STAGE_FILTER" ]; then
        stages="$STAGE_FILTER"
    else
        stages=$(get_all_stages)
    fi

    for stage in $stages; do
        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            continue
        fi

        local exec_mode primary
        exec_mode=$(yq '.execution.mode // ""' "$stage_config" 2>/dev/null)
        primary=$(yq '.models.primary // ""' "$stage_config" 2>/dev/null)

        if [ -z "$exec_mode" ] || [ "$exec_mode" = "null" ]; then
            verbose_log "$stage: no execution mode defined"
            continue
        fi

        # Check model supports the execution mode
        local model_modes
        model_modes=$(yq ".models.$primary.modes | keys | .[]" "$CONFIG_DIR/models.yaml" 2>/dev/null || echo "")

        # Map execution modes to model mode keys
        local mode_key=""
        case "$exec_mode" in
            "plan") mode_key="plan" ;;
            "plan_sandbox") mode_key="plan_sandbox" ;;
            "yolo") mode_key="yolo" ;;
            "sandbox_playwright") mode_key="sandbox_playwright" ;;
            "deep_dive") mode_key="deep_dive" ;;
            "headless") mode_key="headless" ;;
        esac

        if [ -n "$mode_key" ]; then
            if echo "$model_modes" | grep -qw "$mode_key"; then
                result_pass "$stage: execution mode '$exec_mode' supported by $primary"
            else
                result_high "$stage: execution mode '$exec_mode' may not be supported by $primary"
            fi
        fi
    done
}

# =============================================================================
# Rule 6: AI Wrapper Health (HIGH)
# AI wrapper scripts are executable and functional
# =============================================================================
validate_ai_wrapper_health() {
    print_section "Rule: ai_wrapper_health [HIGH]"
    verbose_log "Checking AI wrapper scripts are functional"

    local wrappers=("ai-call.sh" "gemini-wrapper.sh" "codex-wrapper.sh")

    for wrapper in "${wrappers[@]}"; do
        local wrapper_path="$PROJECT_ROOT/scripts/$wrapper"

        if [ ! -f "$wrapper_path" ]; then
            result_high "Wrapper script not found: scripts/$wrapper"
            continue
        fi

        if [ ! -x "$wrapper_path" ]; then
            result_high "Wrapper script not executable: scripts/$wrapper"
            if [ "$FIX_MODE" = true ]; then
                chmod +x "$wrapper_path"
                result_fixed "Made scripts/$wrapper executable"
            fi
            continue
        fi

        # Check script syntax (bash -n)
        if bash -n "$wrapper_path" 2>/dev/null; then
            result_pass "Wrapper script valid: scripts/$wrapper"
        else
            result_high "Wrapper script has syntax errors: scripts/$wrapper"
        fi
    done

    # Check if required CLI tools are available
    verbose_log "Checking external CLI availability"

    # Check tmux (required for wrappers)
    if command -v tmux &> /dev/null; then
        result_pass "tmux is installed (required for AI wrappers)"
    else
        result_high "tmux not installed - AI wrappers will not function"
    fi

    # Check optional AI CLIs (info only)
    for cli in gemini codex; do
        if command -v "$cli" &> /dev/null; then
            result_pass "$cli CLI is installed"
        else
            verbose_log "$cli CLI not installed - will use ClaudeCode fallback"
        fi
    done
}

# =============================================================================
# Rule 7: MCP Servers (MEDIUM)
# Referenced MCP servers have fallback configs
# =============================================================================
validate_mcp_servers() {
    print_section "Rule: mcp_servers [MEDIUM]"
    verbose_log "Checking MCP server configurations"

    local fallback_config="$CONFIG_DIR/mcp_fallbacks.yaml"
    if [ ! -f "$fallback_config" ]; then
        result_medium "mcp_fallbacks.yaml not found, cannot validate MCP fallbacks"
        return
    fi

    local stages
    if [ -n "$STAGE_FILTER" ]; then
        stages="$STAGE_FILTER"
    else
        stages=$(get_all_stages)
    fi

    for stage in $stages; do
        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            continue
        fi

        local mcp_servers
        mcp_servers=$(yq '.mcp_servers[]' "$stage_config" 2>/dev/null || echo "")

        if [ -z "$mcp_servers" ]; then
            verbose_log "$stage: no MCP servers configured"
            continue
        fi

        for server in $mcp_servers; do
            local has_fallback
            has_fallback=$(yq ".servers.$server // null" "$fallback_config" 2>/dev/null)

            if [ "$has_fallback" != "null" ] && [ -n "$has_fallback" ]; then
                result_pass "$stage: MCP server '$server' has fallback config"
            else
                result_medium "$stage: MCP server '$server' has no fallback configuration"
            fi
        done
    done
}

# =============================================================================
# Rule 8: Epic Cycles Configuration (MEDIUM)
# Validate epic_cycles.yaml structure and settings
# =============================================================================
validate_epic_cycles() {
    print_section "Rule: epic_cycles [MEDIUM]"
    verbose_log "Checking epic_cycles.yaml configuration"

    local epic_config="$CONFIG_DIR/epic_cycles.yaml"
    if [ ! -f "$epic_config" ]; then
        result_medium "epic_cycles.yaml not found"
        return
    fi

    # Check required fields
    local cycle_config_keys=("max_cycles" "default_preset" "preserve_outputs")
    for key in "${cycle_config_keys[@]}"; do
        local value
        value=$(yq ".epic_cycles.cycle_config.$key // null" "$epic_config" 2>/dev/null)
        if [ "$value" != "null" ] && [ -n "$value" ]; then
            result_pass "epic_cycles: cycle_config.$key is defined"
        else
            result_medium "epic_cycles: cycle_config.$key is missing"
        fi
    done

    # Check presets are defined
    local preset_count
    preset_count=$(yq '.epic_cycles.presets | keys | length' "$epic_config" 2>/dev/null || echo "0")
    if [ "$preset_count" -gt 0 ]; then
        result_pass "epic_cycles: $preset_count preset(s) defined"
    else
        result_medium "epic_cycles: no presets defined"
    fi

    # Check that enabled field is NOT present (should be in progress.json)
    local enabled_present
    enabled_present=$(yq '.epic_cycles.enabled // "not_found"' "$epic_config" 2>/dev/null)
    if [ "$enabled_present" != "not_found" ]; then
        result_medium "epic_cycles: 'enabled' field should be in progress.json, not epic_cycles.yaml"
        if [ "$FIX_MODE" = true ]; then
            yq -i 'del(.epic_cycles.enabled)' "$epic_config"
            result_fixed "epic_cycles: removed 'enabled' field"
        fi
    else
        result_pass "epic_cycles: no conflicting 'enabled' field"
    fi
}

# =============================================================================
# Rule 9: Requirements Refinement Configuration (MEDIUM)
# Validate requirements_refinement.yaml structure
# =============================================================================
validate_requirements_refinement() {
    print_section "Rule: requirements_refinement [MEDIUM]"
    verbose_log "Checking requirements_refinement.yaml configuration"

    local req_config="$CONFIG_DIR/requirements_refinement.yaml"
    if [ ! -f "$req_config" ]; then
        result_medium "requirements_refinement.yaml not found"
        return
    fi

    # Check INVEST criteria weights exist
    local invest_fields=("independent" "negotiable" "valuable" "estimable" "small" "testable")
    for field in "${invest_fields[@]}"; do
        local weight
        weight=$(yq ".invest_criteria.$field.weight // null" "$req_config" 2>/dev/null)
        if [ "$weight" != "null" ] && [ -n "$weight" ]; then
            result_pass "requirements_refinement: INVEST.$field weight defined"
        else
            result_medium "requirements_refinement: INVEST.$field weight missing"
        fi
    done

    # Check breakdown rules exist
    local breakdown_rules
    breakdown_rules=$(yq '.breakdown_rules // null' "$req_config" 2>/dev/null)
    if [ "$breakdown_rules" != "null" ] && [ -n "$breakdown_rules" ]; then
        result_pass "requirements_refinement: breakdown_rules defined"
    else
        result_medium "requirements_refinement: breakdown_rules missing"
    fi

    # Check refinement workflow stages
    local workflow_stages
    workflow_stages=$(yq '.refinement_workflow.stages | length' "$req_config" 2>/dev/null || echo "0")
    if [ "$workflow_stages" -gt 0 ]; then
        result_pass "requirements_refinement: $workflow_stages workflow stage(s) defined"
    else
        result_medium "requirements_refinement: no workflow stages defined"
    fi
}

# =============================================================================
# Rule 10: Implementation Order Configuration (MEDIUM)
# Validate implementation_order.yaml structure
# =============================================================================
validate_implementation_order() {
    print_section "Rule: implementation_order [MEDIUM]"
    verbose_log "Checking implementation_order.yaml configuration"

    local impl_config="$CONFIG_DIR/implementation_order.yaml"
    if [ ! -f "$impl_config" ]; then
        result_medium "implementation_order.yaml not found"
        return
    fi

    # Check available orders are defined
    local orders=("frontend_first" "backend_first" "parallel")
    for order in "${orders[@]}"; do
        local order_def
        order_def=$(yq ".implementation_order.orders.$order // null" "$impl_config" 2>/dev/null)
        if [ "$order_def" != "null" ] && [ -n "$order_def" ]; then
            result_pass "implementation_order: order '$order' defined"
        else
            result_medium "implementation_order: order '$order' missing"
        fi
    done

    # Check current_order is valid (can be null for initial state)
    local current
    current=$(yq '.implementation_order.current_order // "null"' "$impl_config" 2>/dev/null)
    if [ "$current" = "null" ]; then
        verbose_log "implementation_order: current_order is null (will prompt user in Stage 06)"
    elif echo "frontend_first backend_first parallel" | grep -qw "$current"; then
        result_pass "implementation_order: current_order '$current' is valid"
    else
        result_medium "implementation_order: current_order '$current' is not a valid option"
    fi

    # Check phases are defined for each order
    for order in "${orders[@]}"; do
        local phase_count
        phase_count=$(yq ".implementation_order.orders.$order.phases | length" "$impl_config" 2>/dev/null || echo "0")
        if [ "$phase_count" -gt 0 ]; then
            result_pass "implementation_order: $order has $phase_count phase(s)"
        else
            result_medium "implementation_order: $order has no phases defined"
        fi
    done
}

# =============================================================================
# Rule 11: Notion Integration Configuration (MEDIUM)
# Validate Notion settings in mcp_fallbacks.yaml
# =============================================================================
validate_notion_integration() {
    print_section "Rule: notion_integration [MEDIUM]"
    verbose_log "Checking Notion integration configuration"

    local fallback_config="$CONFIG_DIR/mcp_fallbacks.yaml"
    if [ ! -f "$fallback_config" ]; then
        result_medium "mcp_fallbacks.yaml not found, cannot validate Notion integration"
        return
    fi

    # Check Notion section exists
    local notion_config
    notion_config=$(yq '.servers.notion // null' "$fallback_config" 2>/dev/null)
    if [ "$notion_config" = "null" ] || [ -z "$notion_config" ]; then
        result_medium "Notion configuration missing in mcp_fallbacks.yaml"
        return
    fi

    # Check fallbacks are defined (should have JSON fallback)
    local fallback_count
    fallback_count=$(yq '.servers.notion.fallbacks | length' "$fallback_config" 2>/dev/null || echo "0")
    if [ "$fallback_count" -gt 0 ]; then
        result_pass "Notion: $fallback_count fallback(s) configured"
    else
        result_medium "Notion: no fallbacks configured (may fail if Notion unavailable)"
    fi

    # Check JSON fallback is enabled
    local json_enabled
    json_enabled=$(yq '.servers.notion.json_fallback.enabled // false' "$fallback_config" 2>/dev/null)
    if [ "$json_enabled" = "true" ]; then
        result_pass "Notion: JSON file fallback enabled"

        # Check JSON file path is defined
        local json_path
        json_path=$(yq '.servers.notion.json_fallback.file_path // ""' "$fallback_config" 2>/dev/null)
        if [ -n "$json_path" ] && [ "$json_path" != "null" ]; then
            result_pass "Notion: JSON fallback path defined: $json_path"
        else
            result_medium "Notion: JSON fallback enabled but file_path not defined"
        fi
    else
        result_medium "Notion: JSON file fallback not enabled (recommended for offline support)"
    fi

    # Check on_error action is defined
    local on_error
    on_error=$(yq '.servers.notion.on_error.action // ""' "$fallback_config" 2>/dev/null)
    if [ -n "$on_error" ] && [ "$on_error" != "null" ]; then
        result_pass "Notion: on_error action defined: $on_error"
    else
        result_medium "Notion: on_error action not defined"
    fi
}

# =============================================================================
# Rule 12: Prerequisites (MEDIUM)
# Stage prerequisites are valid stage IDs
# =============================================================================
validate_prerequisites() {
    print_section "Rule: prerequisites [MEDIUM]"
    verbose_log "Checking stage prerequisites are valid"

    local all_stages
    all_stages=$(get_all_stages)

    local stages
    if [ -n "$STAGE_FILTER" ]; then
        stages="$STAGE_FILTER"
    else
        stages="$all_stages"
    fi

    for stage in $stages; do
        local stage_config="$STAGES_DIR/$stage/config.yaml"
        if [ ! -f "$stage_config" ]; then
            continue
        fi

        local prereqs
        prereqs=$(yq '.transition.prerequisites[]' "$stage_config" 2>/dev/null || echo "")

        if [ -z "$prereqs" ]; then
            verbose_log "$stage: no prerequisites defined"
            continue
        fi

        for prereq in $prereqs; do
            if echo "$all_stages" | grep -qw "$prereq"; then
                result_pass "$stage: prerequisite '$prereq' is valid"
            else
                result_medium "$stage: prerequisite '$prereq' is not a valid stage ID"
            fi
        done
    done
}

# =============================================================================
# Recovery Guide
# =============================================================================
show_recovery_guide() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🔧 Error Recovery Guide${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${RED}[CRITICAL] Model not defined in models.yaml${NC}"
    echo "  Problem: Stage config references a model that doesn't exist"
    echo "  Recovery:"
    echo "    1. Open config/models.yaml"
    echo "    2. Add the missing model definition under 'models:'"
    echo "    3. Or update the stage config to use an existing model"
    echo "  Example:"
    echo "    models:"
    echo "      gemini:"
    echo "        cli_command: \"gemini\""
    echo "        wrapper: \"scripts/gemini-wrapper.sh\""
    echo ""

    echo -e "${RED}[CRITICAL] Parallel alignment mismatch${NC}"
    echo "  Problem: Stage is listed as parallel_capable but config has different mode"
    echo "  Recovery:"
    echo "    1. Open stages/XX-stage/config.yaml"
    echo "    2. Set models.collaboration to 'parallel'"
    echo "    3. Or remove stage from parallel_capable list in ai_collaboration.yaml"
    echo "  Auto-fix: Run with --fix flag"
    echo ""

    echo -e "${RED}[CRITICAL] Parallel stage missing models${NC}"
    echo "  Problem: Parallel stage needs 2+ models but has fewer configured"
    echo "  Recovery:"
    echo "    1. Open stages/XX-stage/config.yaml"
    echo "    2. Add both primary and secondary models:"
    echo "       models:"
    echo "         primary: \"gemini\""
    echo "         secondary: \"claudecode\""
    echo ""

    echo -e "${YELLOW}[HIGH] Required input file missing${NC}"
    echo "  Problem: Stage config requires an input file that doesn't exist"
    echo "  Recovery:"
    echo "    1. Check if previous stage was completed"
    echo "    2. Generate missing output from previous stage"
    echo "    3. Or update inputs.required in stage config"
    echo ""

    echo -e "${YELLOW}[HIGH] CLAUDE.md missing${NC}"
    echo "  Problem: Stage cannot execute without CLAUDE.md instructions"
    echo "  Recovery:"
    echo "    1. Create stages/XX-stage/CLAUDE.md"
    echo "    2. Copy from template: cp stages/01-brainstorm/CLAUDE.md stages/XX-stage/"
    echo "    3. Customize for the specific stage"
    echo ""

    echo -e "${YELLOW}[HIGH] Wrapper script not executable${NC}"
    echo "  Problem: AI wrapper script exists but is not executable"
    echo "  Recovery:"
    echo "    chmod +x scripts/ai-call.sh"
    echo "    chmod +x scripts/gemini-wrapper.sh"
    echo "    chmod +x scripts/codex-wrapper.sh"
    echo "  Auto-fix: Run with --fix flag"
    echo ""

    echo -e "${YELLOW}[HIGH] Wrapper script syntax error${NC}"
    echo "  Problem: Bash script has syntax errors"
    echo "  Recovery:"
    echo "    1. Check script: bash -n scripts/wrapper-name.sh"
    echo "    2. Fix reported syntax errors"
    echo "    3. Common issues: unclosed quotes, missing 'fi', 'done'"
    echo ""

    echo -e "${YELLOW}[HIGH] tmux not installed${NC}"
    echo "  Problem: AI wrapper scripts require tmux"
    echo "  Recovery:"
    echo "    macOS:  brew install tmux"
    echo "    Ubuntu: sudo apt install tmux"
    echo "    Note: Without tmux, external AI calls will fall back to ClaudeCode"
    echo ""

    echo -e "${YELLOW}[HIGH] Prompt file missing${NC}"
    echo "  Problem: auto_invoke references a prompt file that doesn't exist"
    echo "  Recovery:"
    echo "    1. Create the prompt file in stages/XX-stage/prompts/"
    echo "    2. Or disable auto_invoke in stage config"
    echo "    3. Or update prompt_file path in config.yaml"
    echo ""

    echo -e "${MAGENTA}[MEDIUM] MCP server no fallback${NC}"
    echo "  Problem: Stage uses MCP server without fallback configuration"
    echo "  Recovery:"
    echo "    1. Open config/mcp_fallbacks.yaml"
    echo "    2. Add fallback for the MCP server:"
    echo "       servers:"
    echo "         server_name:"
    echo "           fallback_chain: [\"alternative1\", \"manual\"]"
    echo ""

    echo -e "${MAGENTA}[MEDIUM] Invalid prerequisite${NC}"
    echo "  Problem: Stage prerequisite references non-existent stage"
    echo "  Recovery:"
    echo "    1. Open stages/XX-stage/config.yaml"
    echo "    2. Update transition.prerequisites to valid stage IDs"
    echo "    3. Valid stages: 01-brainstorm through 10-deployment"
    echo ""

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# =============================================================================
# Summary Output
# =============================================================================
print_summary() {
    local total=$((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + PASS_COUNT))

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  📊 Validation Summary${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    printf "  %-12s %s\n" "Severity" "Count"
    printf "  %-12s %s\n" "────────────" "─────"
    printf "  ${RED}%-12s${NC} %d\n" "CRITICAL" "$CRITICAL_COUNT"
    printf "  ${YELLOW}%-12s${NC} %d\n" "HIGH" "$HIGH_COUNT"
    printf "  ${MAGENTA}%-12s${NC} %d\n" "MEDIUM" "$MEDIUM_COUNT"
    printf "  ${GREEN}%-12s${NC} %d\n" "PASSED" "$PASS_COUNT"

    if [ "$FIX_COUNT" -gt 0 ]; then
        echo ""
        printf "  ${GREEN}%-12s${NC} %d\n" "FIXED" "$FIX_COUNT"
    fi

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo -e "${RED}  ❌ $CRITICAL_COUNT critical issues found. Please fix before running pipeline.${NC}"
        echo ""
        echo -e "  ${GRAY}Run with --recovery-guide to see detailed fix instructions${NC}"
    elif [ "$HIGH_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}  ⚠ $HIGH_COUNT high-severity warnings. Review recommended.${NC}"
        echo ""
        echo -e "  ${GRAY}Run with --recovery-guide to see detailed fix instructions${NC}"
    elif [ "$MEDIUM_COUNT" -gt 0 ]; then
        echo -e "${MAGENTA}  ○ $MEDIUM_COUNT medium-severity notices. Optional improvements available.${NC}"
    else
        echo -e "${GREEN}  ✅ All validations passed!${NC}"
    fi

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_json_output() {
    local exit_code=0
    [ "$CRITICAL_COUNT" -gt 0 ] && exit_code=1
    [ "$CRITICAL_COUNT" -eq 0 ] && [ "$HIGH_COUNT" -gt 0 ] && exit_code=2

    jq -n \
        --argjson critical "$CRITICAL_COUNT" \
        --argjson high "$HIGH_COUNT" \
        --argjson medium "$MEDIUM_COUNT" \
        --argjson passed "$PASS_COUNT" \
        --argjson fixed "$FIX_COUNT" \
        --argjson exit_code "$exit_code" \
        --arg stage_filter "$STAGE_FILTER" \
        --arg rule_filter "$RULE_FILTER" \
        '{
            summary: {
                critical: $critical,
                high: $high,
                medium: $medium,
                passed: $passed,
                fixed: $fixed
            },
            exit_code: $exit_code,
            filters: {
                stage: (if $stage_filter == "" then null else $stage_filter end),
                rule: (if $rule_filter == "" then null else $rule_filter end)
            }
        }'
}

# =============================================================================
# Main
# =============================================================================
main() {
    # Parse arguments
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            --fix) FIX_MODE=true ;;
            --verbose) VERBOSE=true ;;
            --json) OUTPUT_JSON=true ;;
            --stage) STAGE_FILTER="$2"; shift ;;
            --rule) RULE_FILTER="$2"; shift ;;
            --recovery-guide) SHOW_RECOVERY=true ;;
            --help|-h) usage ;;
            *) echo "Unknown option: $1"; usage ;;
        esac
        shift
    done

    # Show recovery guide if requested
    if [ "$SHOW_RECOVERY" = true ]; then
        show_recovery_guide
        exit 0
    fi

    # Check dependencies
    check_yq

    # Validate stage filter
    if [ -n "$STAGE_FILTER" ]; then
        if [ ! -d "$STAGES_DIR/$STAGE_FILTER" ]; then
            echo -e "${RED}Error:${NC} Invalid stage: $STAGE_FILTER"
            exit 1
        fi
    fi

    if [ "$OUTPUT_JSON" != true ]; then
        print_header
    fi

    # Run validations
    local rules="model_references parallel_alignment collaboration_consistency file_references auto_invoke execution_mode ai_wrapper_health mcp_servers epic_cycles requirements_refinement implementation_order notion_integration prerequisites"

    if [ -n "$RULE_FILTER" ]; then
        if ! echo "$rules" | grep -qw "$RULE_FILTER"; then
            echo -e "${RED}Error:${NC} Invalid rule: $RULE_FILTER"
            echo "Valid rules: $rules"
            exit 1
        fi
        rules="$RULE_FILTER"
    fi

    for rule in $rules; do
        case $rule in
            model_references) validate_model_references ;;
            parallel_alignment) validate_parallel_alignment ;;
            collaboration_consistency) validate_collaboration_consistency ;;
            file_references) validate_file_references ;;
            auto_invoke) validate_auto_invoke ;;
            execution_mode) validate_execution_mode ;;
            ai_wrapper_health) validate_ai_wrapper_health ;;
            mcp_servers) validate_mcp_servers ;;
            epic_cycles) validate_epic_cycles ;;
            requirements_refinement) validate_requirements_refinement ;;
            implementation_order) validate_implementation_order ;;
            notion_integration) validate_notion_integration ;;
            prerequisites) validate_prerequisites ;;
        esac
    done

    # Output results
    if [ "$OUTPUT_JSON" = true ]; then
        print_json_output
    else
        print_summary
    fi

    # Exit code
    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        exit 1
    elif [ "$HIGH_COUNT" -gt 0 ] || [ "$MEDIUM_COUNT" -gt 0 ]; then
        exit 2
    else
        exit 0
    fi
}

main "$@"
