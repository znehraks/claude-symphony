#!/bin/bash
# claude-symphony AI Selector Hook
# 동적 AI 모델 선택

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/models.yaml"
BENCHMARKS_DIR="$PROJECT_ROOT/state/ai_benchmarks"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# 색상 정의
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 로그 함수
log_info() { echo -e "${BLUE}[AI-SELECT]${NC} $1"; }
log_success() { echo -e "${GREEN}[AI-SELECT]${NC} $1"; }
log_suggest() { echo -e "${YELLOW}[AI-SELECT]${NC} $1"; }

# 현재 스테이지 확인
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# 스테이지 기반 모델 선택
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

# 태스크 유형 기반 모델 선택
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

# 이전 성능 기반 모델 선택
get_performance_model() {
    local task_type="$1"
    local benchmark_file="$BENCHMARKS_DIR/latest.json"

    if [ -f "$benchmark_file" ]; then
        # 최근 벤치마크 결과에서 최고 성능 모델 추출
        local best_model=$(cat "$benchmark_file" 2>/dev/null | grep -o '"best_model"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

        if [ -n "$best_model" ]; then
            echo "$best_model"
            return
        fi
    fi

    # 벤치마크 없으면 기본값
    echo "claudecode"
}

# 복잡도 기반 모델 선택
get_complexity_model() {
    local complexity="$1"

    case "$complexity" in
        "simple"|"low")
            echo "claudecode"  # 빠른 응답
            ;;
        "moderate"|"medium")
            echo "claudecode"
            ;;
        "complex"|"high")
            echo "claudecode"  # 복잡한 로직 처리
            ;;
        *)
            echo "claudecode"
            ;;
    esac
}

# 최적 모델 선택 (종합)
select_best_model() {
    local stage="$1"
    local task_type="$2"
    local complexity="$3"

    # 가중치
    local stage_weight=0.4
    local task_weight=0.3
    local perf_weight=0.2
    local complexity_weight=0.1

    # 각 기준별 모델
    local stage_model=$(get_stage_model "$stage")
    local task_model=$(get_task_model "$task_type")
    local perf_model=$(get_performance_model "$task_type")
    local comp_model=$(get_complexity_model "$complexity")

    log_info "모델 선택 분석:"
    log_info "  스테이지 기반: $stage_model (가중치: $stage_weight)"
    log_info "  태스크 기반: $task_model (가중치: $task_weight)"
    log_info "  성능 기반: $perf_model (가중치: $perf_weight)"
    log_info "  복잡도 기반: $comp_model (가중치: $complexity_weight)"

    # 스테이지 기반이 가장 높은 가중치이므로 우선 선택
    # 실제 구현에서는 점수 계산 필요
    local selected_model="$stage_model"

    log_success "선택된 모델: $selected_model"
    echo "$selected_model"
}

# 모델 정보 출력
print_model_info() {
    local model="$1"

    case "$model" in
        "claudecode")
            echo "Claude Code - 정확한 코드 생성, 복잡한 로직 분석"
            ;;
        "claude")
            echo "Claude - 심층 리서치, 문서 분석 및 요약"
            ;;
        "gemini")
            echo "Gemini - 창의적 아이디어, 다양한 관점 탐색"
            ;;
        "codex")
            echo "Codex - 코드 분석, 리팩토링, 테스트 생성"
            ;;
    esac
}

# 메인 실행
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
            log_info "현재 스테이지: $stage"
            log_info "권장 모델: $model"
            print_model_info "$model"
            ;;
        *)
            echo "사용법: $0 {stage|task|select|info|current} [args]"
            echo ""
            echo "명령어:"
            echo "  stage [stage_id]     - 스테이지 기반 모델 선택"
            echo "  task [task_type]     - 태스크 유형 기반 모델 선택"
            echo "  select [stage] [task] [complexity] - 종합 모델 선택"
            echo "  info [model]         - 모델 정보 출력"
            echo "  current              - 현재 스테이지 권장 모델"
            exit 1
            ;;
    esac
}

# 직접 실행 시에만 main 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
