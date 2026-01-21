#!/bin/bash
# claude-symphony Output Validator Hook
# Stage output validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/output_validation.yaml"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
VALIDATIONS_DIR="$PROJECT_ROOT/state/validations"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Result icons
PASS="✅"
FAIL="❌"
WARN="⚠️"
INFO="ℹ️"

# Log functions
log_pass() { echo -e "${GREEN}${PASS}${NC} $1"; }
log_fail() { echo -e "${RED}${FAIL}${NC} $1"; }
log_warn() { echo -e "${YELLOW}${WARN}${NC} $1"; }
log_info() { echo -e "${BLUE}${INFO}${NC} $1"; }

# Validation results storage
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Get current stage
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# Check file exists
check_file_exists() {
    local file_path="$1"
    local required="$2"
    local full_path="$PROJECT_ROOT/$file_path"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ -e "$full_path" ]; then
        log_pass "$file_path exists"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [ "$required" = "true" ]; then
            log_fail "$file_path missing"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        else
            log_warn "$file_path missing (optional)"
            WARNINGS=$((WARNINGS + 1))
            return 0
        fi
    fi
}

# Check directory exists
check_directory_exists() {
    local dir_path="$1"
    local full_path="$PROJECT_ROOT/$dir_path"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ -d "$full_path" ]; then
        log_pass "$dir_path directory exists"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        log_fail "$dir_path directory missing"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Check file minimum size
check_file_size() {
    local file_path="$1"
    local min_size="$2"
    local full_path="$PROJECT_ROOT/$file_path"

    if [ -f "$full_path" ]; then
        local size=$(wc -c < "$full_path")
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

        if [ "$size" -ge "$min_size" ]; then
            log_pass "$file_path size met (${size} bytes >= ${min_size})"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            log_fail "$file_path size insufficient (${size} bytes < ${min_size})"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    fi
}

# Check markdown sections
check_markdown_sections() {
    local file_path="$1"
    shift
    local sections=("$@")
    local full_path="$PROJECT_ROOT/$file_path"

    if [ -f "$full_path" ]; then
        for section in "${sections[@]}"; do
            TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

            if grep -q "^#.*$section" "$full_path" || grep -q "^##.*$section" "$full_path"; then
                log_pass "$file_path: '$section' section exists"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                log_fail "$file_path: '$section' section missing"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
        done
    fi
}

# Run validation command
run_validation_command() {
    local name="$1"
    local command="$2"
    local required="$3"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    log_info "Running: $name ($command)"

    if eval "$command" > /dev/null 2>&1; then
        log_pass "$name passed"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [ "$required" = "true" ]; then
            log_fail "$name failed"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        else
            log_warn "$name failed (optional)"
            WARNINGS=$((WARNINGS + 1))
            return 0
        fi
    fi
}

# Stage-specific validation
validate_stage() {
    local stage="$1"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local outputs_dir="$stage_dir/outputs"

    echo ""
    echo "=========================================="
    echo "  Output Validation: $stage"
    echo "=========================================="
    echo ""

    # HANDOFF.md check (common for all stages)
    check_file_exists "stages/$stage/HANDOFF.md" "true"

    case "$stage" in
        "01-brainstorm")
            check_file_exists "stages/$stage/outputs/ideas.md" "true"
            check_file_size "stages/$stage/outputs/ideas.md" 500
            check_file_exists "stages/$stage/outputs/requirements_analysis.md" "true"
            check_markdown_sections "stages/$stage/outputs/requirements_analysis.md" "Functional" "Non-functional"
            ;;

        "02-research")
            check_file_exists "stages/$stage/outputs/tech_research.md" "true"
            check_file_size "stages/$stage/outputs/tech_research.md" 2000
            check_file_exists "stages/$stage/outputs/feasibility_report.md" "true"
            ;;

        "03-planning")
            check_file_exists "stages/$stage/outputs/architecture.md" "true"
            check_file_exists "stages/$stage/outputs/tech_stack.md" "true"
            check_file_exists "stages/$stage/outputs/project_plan.md" "true"
            ;;

        "06-implementation")
            check_directory_exists "stages/$stage/outputs/source_code"
            check_file_exists "stages/$stage/outputs/implementation_log.md" "true"

            # Build validation
            if [ -f "$PROJECT_ROOT/package.json" ]; then
                run_validation_command "lint" "npm run lint --prefix $PROJECT_ROOT" "true"
                run_validation_command "typecheck" "npm run typecheck --prefix $PROJECT_ROOT" "true"
            fi
            ;;

        "09-testing")
            check_directory_exists "stages/$stage/outputs/tests"
            check_file_exists "stages/$stage/outputs/test_report.md" "true"
            check_file_exists "stages/$stage/outputs/coverage_report.md" "true"

            # Test validation
            if [ -f "$PROJECT_ROOT/package.json" ]; then
                run_validation_command "test" "npm run test --prefix $PROJECT_ROOT" "true"
            fi
            ;;

        *)
            log_info "No specific validation rules for stage $stage"
            ;;
    esac
}

# Print result summary
print_summary() {
    echo ""
    echo "=========================================="
    echo "  Validation Result Summary"
    echo "=========================================="
    echo ""
    echo "Total checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
    echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo ""

    # Calculate score
    if [ "$TOTAL_CHECKS" -gt 0 ]; then
        local score=$(echo "scale=2; $PASSED_CHECKS / $TOTAL_CHECKS" | bc)
        echo "Score: $score"

        if [ "$FAILED_CHECKS" -eq 0 ]; then
            echo -e "${GREEN}${PASS} Validation passed${NC}"
            return 0
        else
            echo -e "${RED}${FAIL} Validation failed - Stage transition blocked${NC}"
            return 1
        fi
    fi
}

# Save results
save_results() {
    local stage="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)

    mkdir -p "$VALIDATIONS_DIR"

    cat > "$VALIDATIONS_DIR/${stage}_${timestamp}.json" << EOF
{
    "stage": "$stage",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_checks": $TOTAL_CHECKS,
    "passed": $PASSED_CHECKS,
    "failed": $FAILED_CHECKS,
    "warnings": $WARNINGS,
    "score": $(echo "scale=2; $PASSED_CHECKS / $TOTAL_CHECKS" | bc 2>/dev/null || echo "0")
}
EOF
}

# Main execution
main() {
    local stage="${1:-$(get_current_stage)}"
    local verbose="${2:-false}"

    if [ "$stage" = "unknown" ]; then
        log_fail "Cannot determine current stage."
        exit 1
    fi

    validate_stage "$stage"
    save_results "$stage"
    print_summary
}

# Call main only when executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
