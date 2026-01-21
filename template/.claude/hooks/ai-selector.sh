#!/bin/bash
# claude-symphony AI Selector Hook
# Dynamic AI model selection

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/models.yaml"
BENCHMARKS_DIR="$PROJECT_ROOT/state/ai_benchmarks"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# Color definitions
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Log functions
log_info() { echo -e "${BLUE}[AI-SELECT]${NC} $1"; }
log_success() { echo -e "${GREEN}[AI-SELECT]${NC} $1"; }
log_suggest() { echo -e "${YELLOW}[AI-SELECT]${NC} $1"; }

# Get current stage
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# Stage-based model selection
get_stage_model() {
    local stage="$1"

    case "$stage" in
        "01-brainstorm")
            echo "gemini"
            ;;
        "02-research")
            echo "claude"
            ;;
        "03-planning"|"04-ui-ux")
            echo "gemini"
            ;;
        "05-task-management"|"06-implementation"|"08-qa"|"10-deployment")
            echo "claudecode"
            ;;
        "07-refactoring"|"09-testing")
            echo "codex"
            ;;
        *)
            echo "claudecode"
            ;;
    esac
}

# Task type-based model selection
get_task_model() {
    local task_type="$1"

    case "$task_type" in
        "brainstorming"|"creative"|"ideation")
            echo "gemini"
            ;;
        "research"|"analysis"|"documentation")
            echo "claude"
            ;;
        "implementation"|"debugging"|"review")
            echo "claudecode"
            ;;
        "refactoring"|"testing"|"optimization")
            echo "codex"
            ;;
        *)
            echo "claudecode"
            ;;
    esac
}

# Performance-based model selection
get_performance_model() {
    local task_type="$1"
    local benchmark_file="$BENCHMARKS_DIR/latest.json"

    if [ -f "$benchmark_file" ]; then
        # Extract best performing model from recent benchmark results
        local best_model=$(cat "$benchmark_file" 2>/dev/null | grep -o '"best_model"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

        if [ -n "$best_model" ]; then
            echo "$best_model"
            return
        fi
    fi

    # Default if no benchmark available
    echo "claudecode"
}

# Complexity-based model selection
get_complexity_model() {
    local complexity="$1"

    case "$complexity" in
        "simple"|"low")
            echo "claudecode"  # Fast response
            ;;
        "moderate"|"medium")
            echo "claudecode"
            ;;
        "complex"|"high")
            echo "claudecode"  # Complex logic handling
            ;;
        *)
            echo "claudecode"
            ;;
    esac
}

# Select best model (comprehensive)
select_best_model() {
    local stage="$1"
    local task_type="$2"
    local complexity="$3"

    # Weights
    local stage_weight=0.4
    local task_weight=0.3
    local perf_weight=0.2
    local complexity_weight=0.1

    # Models per criterion
    local stage_model=$(get_stage_model "$stage")
    local task_model=$(get_task_model "$task_type")
    local perf_model=$(get_performance_model "$task_type")
    local comp_model=$(get_complexity_model "$complexity")

    log_info "Model selection analysis:"
    log_info "  Stage-based: $stage_model (weight: $stage_weight)"
    log_info "  Task-based: $task_model (weight: $task_weight)"
    log_info "  Performance-based: $perf_model (weight: $perf_weight)"
    log_info "  Complexity-based: $comp_model (weight: $complexity_weight)"

    # Stage-based has highest weight, so prioritize it
    # In actual implementation, score calculation needed
    local selected_model="$stage_model"

    log_success "Selected model: $selected_model"
    echo "$selected_model"
}

# Print model info
print_model_info() {
    local model="$1"

    case "$model" in
        "claudecode")
            echo "Claude Code - Accurate code generation, complex logic analysis"
            ;;
        "claude")
            echo "Claude - Deep research, document analysis and summarization"
            ;;
        "gemini")
            echo "Gemini - Creative ideas, diverse perspective exploration"
            ;;
        "codex")
            echo "Codex - Code analysis, refactoring, test generation"
            ;;
    esac
}

# Main execution
main() {
    local action="$1"
    shift

    case "$action" in
        "stage")
            local stage="${1:-$(get_current_stage)}"
            local model=$(get_stage_model "$stage")
            echo "$model"
            ;;
        "task")
            local task_type="$1"
            local model=$(get_task_model "$task_type")
            echo "$model"
            ;;
        "select")
            local stage="${1:-$(get_current_stage)}"
            local task_type="${2:-implementation}"
            local complexity="${3:-moderate}"
            select_best_model "$stage" "$task_type" "$complexity"
            ;;
        "info")
            local model="$1"
            print_model_info "$model"
            ;;
        "current")
            local stage=$(get_current_stage)
            local model=$(get_stage_model "$stage")
            log_info "Current stage: $stage"
            log_info "Recommended model: $model"
            print_model_info "$model"
            ;;
        *)
            echo "Usage: $0 {stage|task|select|info|current} [args]"
            echo ""
            echo "Commands:"
            echo "  stage [stage_id]     - Stage-based model selection"
            echo "  task [task_type]     - Task type-based model selection"
            echo "  select [stage] [task] [complexity] - Comprehensive model selection"
            echo "  info [model]         - Print model info"
            echo "  current              - Recommended model for current stage"
            exit 1
            ;;
    esac
}

# Call main only when executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
