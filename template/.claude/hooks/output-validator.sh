#!/bin/bash
# claude-symphony Output Validator Hook
# 스테이지 산출물 검증

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/output_validation.yaml"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
VALIDATIONS_DIR="$PROJECT_ROOT/state/validations"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 결과 아이콘
PASS="✅"
FAIL="❌"
WARN="⚠️"
INFO="ℹ️"

# 로그 함수
log_pass() { echo -e "${GREEN}${PASS}${NC} $1"; }
log_fail() { echo -e "${RED}${FAIL}${NC} $1"; }
log_warn() { echo -e "${YELLOW}${WARN}${NC} $1"; }
log_info() { echo -e "${BLUE}${INFO}${NC} $1"; }

# 검증 결과 저장
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# 현재 스테이지 확인
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# 파일 존재 확인
check_file_exists() {
    local file_path="$1"
    local required="$2"
    local full_path="$PROJECT_ROOT/$file_path"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ -e "$full_path" ]; then
        log_pass "$file_path 존재"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [ "$required" = "true" ]; then
            log_fail "$file_path 누락"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        else
            log_warn "$file_path 누락 (선택사항)"
            WARNINGS=$((WARNINGS + 1))
            return 0
        fi
    fi
}

# 디렉토리 확인
check_directory_exists() {
    local dir_path="$1"
    local full_path="$PROJECT_ROOT/$dir_path"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ -d "$full_path" ]; then
        log_pass "$dir_path 디렉토리 존재"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        log_fail "$dir_path 디렉토리 누락"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# 파일 최소 크기 확인
check_file_size() {
    local file_path="$1"
    local min_size="$2"
    local full_path="$PROJECT_ROOT/$file_path"

    if [ -f "$full_path" ]; then
        local size=$(wc -c < "$full_path")
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

        if [ "$size" -ge "$min_size" ]; then
            log_pass "$file_path 크기 충족 (${size} bytes >= ${min_size})"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            log_fail "$file_path 크기 미달 (${size} bytes < ${min_size})"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    fi
}

# 마크다운 섹션 확인
check_markdown_sections() {
    local file_path="$1"
    shift
    local sections=("$@")
    local full_path="$PROJECT_ROOT/$file_path"

    if [ -f "$full_path" ]; then
        for section in "${sections[@]}"; do
            TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

            if grep -q "^#.*$section" "$full_path" || grep -q "^##.*$section" "$full_path"; then
                log_pass "$file_path: '$section' 섹션 존재"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                log_fail "$file_path: '$section' 섹션 누락"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
        done
    fi
}

# 명령어 실행 검증
run_validation_command() {
    local name="$1"
    local command="$2"
    local required="$3"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    log_info "실행 중: $name ($command)"

    if eval "$command" > /dev/null 2>&1; then
        log_pass "$name 통과"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [ "$required" = "true" ]; then
            log_fail "$name 실패"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        else
            log_warn "$name 실패 (선택사항)"
            WARNINGS=$((WARNINGS + 1))
            return 0
        fi
    fi
}

# 스테이지별 검증
validate_stage() {
    local stage="$1"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local outputs_dir="$stage_dir/outputs"

    echo ""
    echo "=========================================="
    echo "  산출물 검증: $stage"
    echo "=========================================="
    echo ""

    # HANDOFF.md 확인 (모든 스테이지 공통)
    check_file_exists "stages/$stage/HANDOFF.md" "true"

    case "$stage" in
        "01-brainstorm")
            check_file_exists "stages/$stage/outputs/ideas.md" "true"
            check_file_size "stages/$stage/outputs/ideas.md" 500
            check_file_exists "stages/$stage/outputs/requirements_analysis.md" "true"
            check_markdown_sections "stages/$stage/outputs/requirements_analysis.md" "기능" "비기능"
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

            # 빌드 검증
            if [ -f "$PROJECT_ROOT/package.json" ]; then
                run_validation_command "lint" "npm run lint --prefix $PROJECT_ROOT" "true"
                run_validation_command "typecheck" "npm run typecheck --prefix $PROJECT_ROOT" "true"
            fi
            ;;

        "09-testing")
            check_directory_exists "stages/$stage/outputs/tests"
            check_file_exists "stages/$stage/outputs/test_report.md" "true"
            check_file_exists "stages/$stage/outputs/coverage_report.md" "true"

            # 테스트 검증
            if [ -f "$PROJECT_ROOT/package.json" ]; then
                run_validation_command "test" "npm run test --prefix $PROJECT_ROOT" "true"
            fi
            ;;

        *)
            log_info "스테이지 $stage에 대한 특정 검증 규칙 없음"
            ;;
    esac
}

# 결과 요약 출력
print_summary() {
    echo ""
    echo "=========================================="
    echo "  검증 결과 요약"
    echo "=========================================="
    echo ""
    echo "총 검사: $TOTAL_CHECKS"
    echo -e "${GREEN}통과: $PASSED_CHECKS${NC}"
    echo -e "${RED}실패: $FAILED_CHECKS${NC}"
    echo -e "${YELLOW}경고: $WARNINGS${NC}"
    echo ""

    # 점수 계산
    if [ "$TOTAL_CHECKS" -gt 0 ]; then
        local score=$(echo "scale=2; $PASSED_CHECKS / $TOTAL_CHECKS" | bc)
        echo "점수: $score"

        if [ "$FAILED_CHECKS" -eq 0 ]; then
            echo -e "${GREEN}${PASS} 검증 통과${NC}"
            return 0
        else
            echo -e "${RED}${FAIL} 검증 실패 - 스테이지 전환 차단됨${NC}"
            return 1
        fi
    fi
}

# 결과 저장
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

# 메인 실행
main() {
    local stage="${1:-$(get_current_stage)}"
    local verbose="${2:-false}"

    if [ "$stage" = "unknown" ]; then
        log_fail "현재 스테이지를 확인할 수 없습니다."
        exit 1
    fi

    validate_stage "$stage"
    save_results "$stage"
    print_summary
}

# 직접 실행 시에만 main 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
