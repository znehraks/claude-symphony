#!/bin/bash
# epic-cycle.sh - Epic Cycle Management Script
# Manages epic cycles for iterative development workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONFIG_FILE="$PROJECT_ROOT/config/epic_cycles.yaml"
ARCHIVE_DIR="$PROJECT_ROOT/state/epic_archives"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Check if jq is available
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq."
        exit 1
    fi
}

# Get epic cycle status from progress.json
get_epic_status() {
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        log_error "Progress file not found: $PROGRESS_FILE"
        exit 1
    fi

    local enabled=$(jq -r '.epic_cycle.enabled' "$PROGRESS_FILE")
    local current=$(jq -r '.epic_cycle.current_cycle' "$PROGRESS_FILE")
    local total=$(jq -r '.epic_cycle.total_cycles' "$PROGRESS_FILE")
    local completed=$(jq -r '.epic_cycle.completed_cycles' "$PROGRESS_FILE")
    local start_stage=$(jq -r '.epic_cycle.scope.start_stage' "$PROGRESS_FILE")
    local end_stage=$(jq -r '.epic_cycle.scope.end_stage' "$PROGRESS_FILE")

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                    Epic Cycle Status                       ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    if [[ "$enabled" == "true" ]]; then
        echo -e "  Status:          ${GREEN}ENABLED${NC}"
    else
        echo -e "  Status:          ${YELLOW}DISABLED${NC}"
    fi

    echo -e "  Current Cycle:   ${BLUE}$current${NC} / ${total}"
    echo -e "  Completed:       ${completed} cycles"
    echo -e "  Scope:           ${start_stage} → ${end_stage}"
    echo ""

    # Show current stage progress
    local current_stage=$(jq -r '.current_stage' "$PROGRESS_FILE")
    if [[ "$current_stage" != "null" ]]; then
        echo -e "  Current Stage:   ${YELLOW}$current_stage${NC}"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Start a new epic cycle
start_new_epic() {
    local scope="${1:-design}"

    log_info "Starting new epic cycle with scope: $scope"

    # Determine scope based on preset or custom
    local start_stage=""
    local end_stage=""

    case "$scope" in
        ideation)
            start_stage="01-brainstorm"
            end_stage="03-planning"
            ;;
        design)
            start_stage="01-brainstorm"
            end_stage="05-task-management"
            ;;
        full)
            start_stage="01-brainstorm"
            end_stage="10-deployment"
            ;;
        implementation)
            start_stage="06-implementation"
            end_stage="09-testing"
            ;;
        *)
            log_error "Unknown scope: $scope. Use: ideation, design, full, or implementation"
            exit 1
            ;;
    esac

    # Archive current cycle if one exists
    local enabled=$(jq -r '.epic_cycle.enabled' "$PROGRESS_FILE")
    if [[ "$enabled" == "true" ]]; then
        archive_current_cycle
    fi

    # Get current cycle number and increment
    local current=$(jq -r '.epic_cycle.current_cycle // 1' "$PROGRESS_FILE")
    local total=$(jq -r '.epic_cycle.total_cycles // 1' "$PROGRESS_FILE")
    local completed=$(jq -r '.epic_cycle.completed_cycles // 0' "$PROGRESS_FILE")
    local new_cycle=$((current + 1))

    # If this is truly a new epic (not just enabling), increment
    if [[ "$enabled" == "true" ]]; then
        completed=$((completed + 1))
    fi

    # Update progress.json
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    jq --arg start "$start_stage" \
       --arg end "$end_stage" \
       --argjson cycle "$new_cycle" \
       --argjson completed "$completed" \
       --arg timestamp "$timestamp" \
       '.epic_cycle.enabled = true |
        .epic_cycle.current_cycle = $cycle |
        .epic_cycle.completed_cycles = $completed |
        .epic_cycle.scope.start_stage = $start |
        .epic_cycle.scope.end_stage = $end |
        .epic_cycle.cycle_start_time = $timestamp |
        .current_iteration.epic_context.enabled = true |
        .current_iteration.epic_context.current_cycle = $cycle' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    # Reset stages within scope
    reset_stages_in_scope "$start_stage" "$end_stage"

    log_success "New epic cycle $new_cycle started!"
    echo ""
    echo -e "  Scope: ${BLUE}$start_stage${NC} → ${BLUE}$end_stage${NC}"
    echo ""
    echo "Run '/run-stage $start_stage' to begin the cycle."
}

# Archive current cycle
archive_current_cycle() {
    log_info "Archiving current epic cycle..."

    local current=$(jq -r '.epic_cycle.current_cycle' "$PROGRESS_FILE")
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local archive_path="$ARCHIVE_DIR/cycle_${current}_${timestamp}"

    mkdir -p "$archive_path"

    # Copy relevant files to archive
    if [[ -d "$PROJECT_ROOT/stages" ]]; then
        # Archive handoffs
        find "$PROJECT_ROOT/stages" -name "HANDOFF.md" -exec cp --parents {} "$archive_path/" \; 2>/dev/null || true

        # Archive key outputs
        for stage_dir in "$PROJECT_ROOT/stages"/*; do
            if [[ -d "$stage_dir/outputs" ]]; then
                cp -r "$stage_dir/outputs" "$archive_path/$(basename "$stage_dir")_outputs" 2>/dev/null || true
            fi
        done
    fi

    # Save cycle metadata
    jq '.epic_cycle' "$PROGRESS_FILE" > "$archive_path/cycle_metadata.json"

    # Add to epic history
    jq --arg cycle "$current" \
       --arg timestamp "$timestamp" \
       --arg path "$archive_path" \
       '.epic_history += [{"cycle": ($cycle | tonumber), "archived_at": $timestamp, "archive_path": $path}]' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Cycle $current archived to: $archive_path"
}

# Reset stages within scope for new cycle
reset_stages_in_scope() {
    local start="$1"
    local end="$2"
    local in_scope=false

    log_info "Resetting stages from $start to $end..."

    # Get all stages from progress.json
    local stages=$(jq -r '.stages | keys[]' "$PROGRESS_FILE")

    for stage in $stages; do
        if [[ "$stage" == "$start" ]]; then
            in_scope=true
        fi

        if [[ "$in_scope" == true ]]; then
            jq --arg stage "$stage" \
               '.stages[$stage].status = "pending" |
                .stages[$stage].started_at = null |
                .stages[$stage].completed_at = null |
                .stages[$stage].handoff_generated = false |
                .stages[$stage].outputs = [] |
                .stages[$stage].errors = []' \
               "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
        fi

        if [[ "$stage" == "$end" ]]; then
            in_scope=false
        fi
    done

    log_success "Stages reset for new cycle"
}

# Set total cycle count
set_cycle_count() {
    local count="$1"

    if [[ ! "$count" =~ ^[1-9][0-9]*$ ]]; then
        log_error "Invalid cycle count: $count. Must be a positive integer."
        exit 1
    fi

    if [[ "$count" -gt 5 ]]; then
        log_warning "Setting cycle count to $count (max recommended is 5)"
    fi

    jq --argjson count "$count" \
       '.epic_cycle.total_cycles = $count |
        .current_iteration.epic_context.total_cycles = $count' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Total epic cycles set to: $count"
}

# Set custom scope
set_scope() {
    local start="$1"
    local end="$2"

    # Validate stages exist
    local valid_stages=("01-brainstorm" "02-research" "03-planning" "04-ui-ux" "05-task-management"
                        "06-implementation" "07-refactoring" "08-qa" "09-testing" "10-deployment")

    local start_valid=false
    local end_valid=false

    for stage in "${valid_stages[@]}"; do
        if [[ "$stage" == "$start" ]]; then
            start_valid=true
        fi
        if [[ "$stage" == "$end" ]]; then
            end_valid=true
        fi
    done

    if [[ "$start_valid" != true ]]; then
        log_error "Invalid start stage: $start"
        exit 1
    fi

    if [[ "$end_valid" != true ]]; then
        log_error "Invalid end stage: $end"
        exit 1
    fi

    # Record modification
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    jq --arg start "$start" \
       --arg end "$end" \
       --arg timestamp "$timestamp" \
       '.epic_cycle.scope.start_stage = $start |
        .epic_cycle.scope.end_stage = $end |
        .epic_cycle.modification_history += [{"action": "scope_change", "start": $start, "end": $end, "timestamp": $timestamp}]' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Epic scope set: $start → $end"
}

# Show epic history
show_history() {
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        log_error "Progress file not found"
        exit 1
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                    Epic Cycle History                      ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    local history=$(jq -r '.epic_history | length' "$PROGRESS_FILE")

    if [[ "$history" == "0" ]]; then
        echo "  No epic history found."
    else
        jq -r '.epic_history[] | "  Cycle \(.cycle): Archived at \(.archived_at)"' "$PROGRESS_FILE"
        echo ""
        echo "  Archives location: $ARCHIVE_DIR"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Enable epic cycles
enable_epic() {
    jq '.epic_cycle.enabled = true | .current_iteration.epic_context.enabled = true' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Epic cycles enabled"
}

# Disable epic cycles
disable_epic() {
    jq '.epic_cycle.enabled = false | .current_iteration.epic_context.enabled = false' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Epic cycles disabled"
}

# Show usage
show_usage() {
    echo ""
    echo "Usage: epic-cycle.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status              Show current epic cycle status"
    echo "  new [scope]         Start a new epic cycle"
    echo "                      Scopes: ideation, design, full, implementation"
    echo "  set-count <n>       Set total number of cycles"
    echo "  set-scope <s> <e>   Set custom scope (start and end stages)"
    echo "  history             Show epic cycle history"
    echo "  enable              Enable epic cycles"
    echo "  disable             Disable epic cycles"
    echo "  archive             Archive current cycle"
    echo ""
    echo "Examples:"
    echo "  epic-cycle.sh status"
    echo "  epic-cycle.sh new design"
    echo "  epic-cycle.sh set-count 3"
    echo "  epic-cycle.sh set-scope 01-brainstorm 04-ui-ux"
    echo ""
}

# Main
main() {
    check_dependencies

    local command="${1:-status}"

    case "$command" in
        status)
            get_epic_status
            ;;
        new)
            start_new_epic "${2:-design}"
            ;;
        set-count)
            if [[ -z "$2" ]]; then
                log_error "Cycle count required"
                show_usage
                exit 1
            fi
            set_cycle_count "$2"
            ;;
        set-scope)
            if [[ -z "$2" || -z "$3" ]]; then
                log_error "Start and end stages required"
                show_usage
                exit 1
            fi
            set_scope "$2" "$3"
            ;;
        history)
            show_history
            ;;
        enable)
            enable_epic
            ;;
        disable)
            disable_epic
            ;;
        archive)
            archive_current_cycle
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
