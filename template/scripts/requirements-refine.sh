#!/bin/bash
# requirements-refine.sh - Requirements Refinement Manager
# Manages the 4-level requirements breakdown process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONFIG_FILE="$PROJECT_ROOT/config/requirements_refinement.yaml"
REFINEMENT_LOG="$PROJECT_ROOT/state/refinement_log.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq."
        exit 1
    fi
}

# Initialize refinement log if not exists
init_refinement_log() {
    if [[ ! -f "$REFINEMENT_LOG" ]]; then
        echo '{"refinements": [], "last_updated": null}' > "$REFINEMENT_LOG"
    fi
}

# Show refinement status
show_status() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}              Requirements Refinement Status                ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    # Get state from progress.json
    local active=$(jq -r '.requirements_refinement.active // false' "$PROGRESS_FILE" 2>/dev/null || echo "false")
    local iteration=$(jq -r '.requirements_refinement.current_iteration // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0")
    local max_iter=$(jq -r '.requirements_refinement.max_iterations // 5' "$PROGRESS_FILE" 2>/dev/null || echo "5")
    local under_refinement=$(jq -r '.requirements_refinement.requirements_under_refinement | length' "$PROGRESS_FILE" 2>/dev/null || echo "0")

    if [[ "$active" == "true" ]]; then
        echo -e "  Status:          ${GREEN}ACTIVE${NC}"
    else
        echo -e "  Status:          ${YELLOW}INACTIVE${NC}"
    fi

    echo -e "  Iteration:       ${BLUE}$iteration${NC} / $max_iter"
    echo -e "  Under Refinement: $under_refinement requirements"
    echo ""

    # Show granularity levels
    echo -e "${CYAN}  Granularity Levels:${NC}"
    echo "    1. Epic     - Large theme (2-8 weeks)"
    echo "    2. Feature  - User capability (3-5 days, max 40h)"
    echo "    3. Task     - Implementation unit (4-8h, max 8h)"
    echo "    4. Subtask  - Atomic step (30min-2h, max 2h)"
    echo ""

    # Show refinement history count
    if [[ -f "$REFINEMENT_LOG" ]]; then
        local history_count=$(jq -r '.refinements | length' "$REFINEMENT_LOG" 2>/dev/null || echo "0")
        echo -e "  Total Refinements: $history_count"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Start refinement session
start_refinement() {
    log_info "Starting requirements refinement session..."

    # Update state
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local iteration=$(jq -r '.requirements_refinement.current_iteration // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0")
    iteration=$((iteration + 1))

    jq --argjson iter "$iteration" \
       --arg timestamp "$timestamp" \
       '.requirements_refinement.active = true |
        .requirements_refinement.current_iteration = $iter |
        .requirements_refinement.last_refinement_at = $timestamp' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}            Requirements Refinement Wizard                  ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "This wizard helps break down requirements into implementable units."
    echo ""
    echo -e "${YELLOW}Step 1: Identify${NC} - Find requirements needing refinement"
    echo ""
    echo "Look for:"
    echo "  - Vague language: 'should be able to', 'might need', 'etc.'"
    echo "  - Large scope: Estimates > 40 hours"
    echo "  - Missing acceptance criteria"
    echo "  - Unclear dependencies"
    echo ""
    echo -e "Claude should scan requirements and identify candidates."
    echo ""
}

# Add requirement to refinement queue
add_to_refinement() {
    local requirement="$1"
    local level="${2:-feature}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    jq --arg req "$requirement" \
       --arg level "$level" \
       --arg timestamp "$timestamp" \
       '.requirements_refinement.requirements_under_refinement += [{
           "requirement": $req,
           "current_level": $level,
           "added_at": $timestamp,
           "status": "pending"
       }]' "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Added to refinement queue: $requirement (level: $level)"
}

# Record refinement action
record_refinement() {
    local requirement="$1"
    local from_level="$2"
    local to_level="$3"
    local children="$4"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    init_refinement_log

    jq --arg req "$requirement" \
       --arg from "$from_level" \
       --arg to "$to_level" \
       --arg children "$children" \
       --arg timestamp "$timestamp" \
       '.refinements += [{
           "requirement": $req,
           "from_level": $from,
           "to_level": $to,
           "children_created": ($children | tonumber),
           "timestamp": $timestamp
       }] |
        .last_updated = $timestamp' \
       "$REFINEMENT_LOG" > "${REFINEMENT_LOG}.tmp" && mv "${REFINEMENT_LOG}.tmp" "$REFINEMENT_LOG"

    # Also add to progress.json history
    jq --arg req "$requirement" \
       --arg from "$from_level" \
       --arg to "$to_level" \
       --arg children "$children" \
       --arg timestamp "$timestamp" \
       '.refinement_history += [{
           "requirement": $req,
           "from_level": $from,
           "to_level": $to,
           "children_created": ($children | tonumber),
           "timestamp": $timestamp
       }]' "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Recorded refinement: $requirement ($from_level → $to_level, $children children)"
}

# Show refinement history
show_history() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}              Refinement History                            ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    if [[ ! -f "$REFINEMENT_LOG" ]]; then
        echo "  No refinement history found."
        echo ""
        return
    fi

    local count=$(jq -r '.refinements | length' "$REFINEMENT_LOG")

    if [[ "$count" == "0" ]]; then
        echo "  No refinements recorded yet."
    else
        echo -e "  ${MAGENTA}Total Refinements:${NC} $count"
        echo ""

        jq -r '.refinements | sort_by(.timestamp) | reverse | .[:10][] |
            "  \(.timestamp | split("T")[0]) \(.timestamp | split("T")[1] | split(".")[0]):\n    \(.requirement)\n    \(.from_level) → \(.to_level) (\(.children_created) children)\n"' \
            "$REFINEMENT_LOG" 2>/dev/null || echo "  Error reading history"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Run validation
run_validation() {
    log_info "Validating refined requirements..."

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}              Requirements Validation                       ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Validation Checks:"
    echo ""
    echo "  INVEST Criteria:"
    echo "    [ ] Independent - Can be developed alone"
    echo "    [ ] Negotiable  - Details are flexible"
    echo "    [ ] Valuable    - Delivers user value"
    echo "    [ ] Estimable   - Has hour estimate"
    echo "    [ ] Small       - ≤ 8 hours for tasks"
    echo "    [ ] Testable    - Has acceptance criteria"
    echo ""
    echo "  Size Thresholds:"
    echo "    [ ] Features    ≤ 40 hours"
    echo "    [ ] Tasks       ≤ 8 hours"
    echo "    [ ] Subtasks    ≤ 2 hours"
    echo ""
    echo "  Documentation:"
    echo "    [ ] All items have acceptance criteria"
    echo "    [ ] Dependencies are mapped"
    echo "    [ ] No circular dependencies"
    echo ""
    echo -e "Claude should evaluate requirements against these criteria."
    echo ""
}

# Complete refinement session
complete_refinement() {
    log_info "Completing refinement session..."

    jq '.requirements_refinement.active = false |
        .requirements_refinement.requirements_under_refinement = []' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Refinement session completed"
}

# List requirements status
list_requirements() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}              Requirements List                             ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Check the following files for requirements:"
    echo ""
    echo "  - stages/01-brainstorm/outputs/requirements_analysis.md"
    echo "  - stages/03-planning/outputs/refined_requirements.md"
    echo "  - stages/05-task-management/outputs/tasks.md"
    echo ""
    echo "Under Refinement:"

    local queue=$(jq -r '.requirements_refinement.requirements_under_refinement[]? | "  - \(.requirement) [\(.current_level)]"' "$PROGRESS_FILE" 2>/dev/null)

    if [[ -z "$queue" ]]; then
        echo "  (none)"
    else
        echo "$queue"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Show usage
show_usage() {
    echo ""
    echo "Usage: requirements-refine.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status                Show refinement status"
    echo "  start                 Start refinement wizard"
    echo "  add <req> [level]     Add requirement to refinement queue"
    echo "  record <req> <from> <to> <n>  Record a refinement"
    echo "  validate              Run validation checks"
    echo "  list                  List requirements"
    echo "  history               Show refinement history"
    echo "  complete              Complete refinement session"
    echo ""
    echo "Levels: epic, feature, task, subtask"
    echo ""
    echo "Examples:"
    echo "  requirements-refine.sh start"
    echo "  requirements-refine.sh add \"User authentication\" epic"
    echo "  requirements-refine.sh record \"User auth\" epic feature 4"
    echo "  requirements-refine.sh validate"
    echo ""
}

# Main
main() {
    check_dependencies

    local command="${1:-status}"

    case "$command" in
        status)
            show_status
            ;;
        start)
            start_refinement
            ;;
        add)
            if [[ -z "$2" ]]; then
                log_error "Requirement text required"
                exit 1
            fi
            add_to_refinement "$2" "${3:-feature}"
            ;;
        record)
            if [[ -z "$2" || -z "$3" || -z "$4" || -z "$5" ]]; then
                log_error "Usage: record <requirement> <from_level> <to_level> <children_count>"
                exit 1
            fi
            record_refinement "$2" "$3" "$4" "$5"
            ;;
        validate)
            run_validation
            ;;
        list)
            list_requirements
            ;;
        history)
            show_history
            ;;
        complete)
            complete_refinement
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
