#!/bin/bash
# pre-run-check.sh - 파이프라인 실행 전 사전 점검 스크립트
# claude-symphony workflow pipeline
#
# 이 스크립트는 파이프라인 실행 전에 모든 필수 도구와 설정이 올바른지 확인합니다.

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 카운터
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 결과 저장
RESULTS=()

# 헤더 출력
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🔍 claude-symphony Pre-Run Checklist${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 섹션 헤더
print_section() {
    echo ""
    echo -e "${BLUE}▸ $1${NC}"
    echo -e "${BLUE}──────────────────────────────────────${NC}"
}

# 결과 출력 함수
check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    PASS_COUNT=$((PASS_COUNT + 1))
    RESULTS+=("PASS: $1")
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RESULTS+=("FAIL: $1")
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    WARN_COUNT=$((WARN_COUNT + 1))
    RESULTS+=("WARN: $1")
}

# =============================================================================
# 1. AI CLI 설치 확인
# =============================================================================
check_ai_cli() {
    print_section "AI CLI 설치 확인"

    # Gemini CLI
    if command -v gemini &> /dev/null; then
        GEMINI_PATH=$(which gemini)
        check_pass "Gemini CLI 설치됨: $GEMINI_PATH"
    else
        check_fail "Gemini CLI 미설치 - 01, 03, 04 스테이지에서 문제 발생 예상"
    fi

    # Codex CLI
    if command -v codex &> /dev/null; then
        CODEX_PATH=$(which codex)
        check_pass "Codex CLI 설치됨: $CODEX_PATH"
    else
        check_fail "Codex CLI 미설치 - 07, 09 스테이지에서 문제 발생 예상"
    fi

    # Claude Code (현재 환경)
    check_pass "Claude Code: 현재 실행 중"
}

# =============================================================================
# 2. tmux 확인
# =============================================================================
check_tmux() {
    print_section "tmux 환경 확인"

    if command -v tmux &> /dev/null; then
        TMUX_VERSION=$(tmux -V)
        check_pass "tmux 설치됨: $TMUX_VERSION"
    else
        check_fail "tmux 미설치 - 외부 AI 호출 불가"
        return
    fi

    # 기존 세션 확인
    if tmux has-session -t ax-gemini 2>/dev/null; then
        check_pass "tmux 세션 'ax-gemini' 활성"
    else
        check_warn "tmux 세션 'ax-gemini' 없음 - 필요시 자동 생성됨"
    fi

    if tmux has-session -t ax-codex 2>/dev/null; then
        check_pass "tmux 세션 'ax-codex' 활성"
    else
        check_warn "tmux 세션 'ax-codex' 없음 - 필요시 자동 생성됨"
    fi
}

# =============================================================================
# 3. 래퍼 스크립트 확인
# =============================================================================
check_wrapper_scripts() {
    print_section "래퍼 스크립트 확인"

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # gemini-wrapper.sh
    if [[ -x "$SCRIPT_DIR/gemini-wrapper.sh" ]]; then
        check_pass "gemini-wrapper.sh 실행 가능"
    elif [[ -f "$SCRIPT_DIR/gemini-wrapper.sh" ]]; then
        check_warn "gemini-wrapper.sh 존재하나 실행 권한 없음"
        echo -e "      ${YELLOW}해결: chmod +x $SCRIPT_DIR/gemini-wrapper.sh${NC}"
    else
        check_fail "gemini-wrapper.sh 없음"
    fi

    # codex-wrapper.sh
    if [[ -x "$SCRIPT_DIR/codex-wrapper.sh" ]]; then
        check_pass "codex-wrapper.sh 실행 가능"
    elif [[ -f "$SCRIPT_DIR/codex-wrapper.sh" ]]; then
        check_warn "codex-wrapper.sh 존재하나 실행 권한 없음"
        echo -e "      ${YELLOW}해결: chmod +x $SCRIPT_DIR/codex-wrapper.sh${NC}"
    else
        check_fail "codex-wrapper.sh 없음"
    fi
}

# =============================================================================
# 4. 설정 파일 확인
# =============================================================================
check_config_files() {
    print_section "설정 파일 확인"

    CONFIG_DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/config"

    required_configs=(
        "pipeline.yaml"
        "models.yaml"
        "ai_collaboration.yaml"
        "mcp_fallbacks.yaml"
        "output_validation.yaml"
    )

    for config in "${required_configs[@]}"; do
        if [[ -f "$CONFIG_DIR/$config" ]]; then
            check_pass "$config 존재"
        else
            check_fail "$config 없음"
        fi
    done
}

# =============================================================================
# 5. 상태 파일 확인
# =============================================================================
check_state_files() {
    print_section "상태 파일 확인"

    STATE_DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/state"

    if [[ -f "$STATE_DIR/progress.json" ]]; then
        CURRENT_STAGE=$(grep -o '"current_stage"[^,]*' "$STATE_DIR/progress.json" 2>/dev/null | cut -d'"' -f4)
        check_pass "progress.json 존재 (현재 스테이지: ${CURRENT_STAGE:-알 수 없음})"
    else
        check_warn "progress.json 없음 - 새 파이프라인으로 시작"
    fi

    # 체크포인트 디렉토리
    if [[ -d "$STATE_DIR/checkpoints" ]]; then
        CP_COUNT=$(ls -1 "$STATE_DIR/checkpoints" 2>/dev/null | wc -l | tr -d ' ')
        check_pass "체크포인트 디렉토리 존재 ($CP_COUNT개 체크포인트)"
    else
        check_warn "체크포인트 디렉토리 없음"
    fi
}

# =============================================================================
# 6. 스테이지 파일 확인
# =============================================================================
check_stage_files() {
    print_section "스테이지 파일 확인"

    STAGES_DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/stages"

    stages=(
        "01-brainstorm"
        "02-research"
        "03-planning"
        "04-ui-ux"
        "05-task-management"
        "06-implementation"
        "07-refactoring"
        "08-qa"
        "09-testing"
        "10-deployment"
    )

    for stage in "${stages[@]}"; do
        if [[ -f "$STAGES_DIR/$stage/CLAUDE.md" ]]; then
            check_pass "$stage/CLAUDE.md"
        else
            check_fail "$stage/CLAUDE.md 없음"
        fi
    done
}

# =============================================================================
# 7. AI CLI 간단 테스트 (선택적)
# =============================================================================
test_ai_cli() {
    print_section "AI CLI 연결 테스트 (선택적)"

    echo -e "  ${YELLOW}이 테스트는 실제 API 호출을 수행합니다.${NC}"
    echo -e "  ${YELLOW}건너뛰려면 Enter, 실행하려면 'y' 입력:${NC}"
    read -r -t 10 response

    if [[ "$response" != "y" ]]; then
        check_warn "AI 연결 테스트 건너뜀"
        return
    fi

    # Gemini 테스트
    if command -v gemini &> /dev/null; then
        echo -e "  ${BLUE}Gemini 테스트 중...${NC}"
        if timeout 30 gemini "Say 'Hello'" &>/dev/null; then
            check_pass "Gemini API 연결 성공"
        else
            check_fail "Gemini API 연결 실패"
        fi
    fi

    # Codex 테스트
    if command -v codex &> /dev/null; then
        echo -e "  ${BLUE}Codex 테스트 중...${NC}"
        if timeout 30 codex --help &>/dev/null; then
            check_pass "Codex CLI 정상"
        else
            check_fail "Codex CLI 오류"
        fi
    fi
}

# =============================================================================
# 결과 요약
# =============================================================================
print_summary() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  📊 점검 결과 요약${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${GREEN}통과: $PASS_COUNT${NC}"
    echo -e "  ${YELLOW}경고: $WARN_COUNT${NC}"
    echo -e "  ${RED}실패: $FAIL_COUNT${NC}"
    echo ""

    if [[ $FAIL_COUNT -eq 0 ]]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  ✅ 모든 필수 점검 통과! 파이프라인 실행 준비 완료${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    else
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}  ❌ $FAIL_COUNT개 항목 실패. 위의 문제를 해결하세요.${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi

    # 실패 항목 상세
    if [[ $FAIL_COUNT -gt 0 ]]; then
        echo ""
        echo -e "${RED}실패 항목 상세:${NC}"
        for result in "${RESULTS[@]}"; do
            if [[ $result == FAIL:* ]]; then
                echo -e "  ${RED}•${NC} ${result#FAIL: }"
            fi
        done
    fi

    echo ""
}

# =============================================================================
# 권장 조치 출력
# =============================================================================
print_recommendations() {
    if [[ $FAIL_COUNT -gt 0 || $WARN_COUNT -gt 0 ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}  💡 권장 조치${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        # Gemini 미설치 시
        if ! command -v gemini &> /dev/null; then
            echo -e "  ${YELLOW}Gemini CLI 설치:${NC}"
            echo "    pip install google-generativeai"
            echo "    # 또는 공식 문서 참조"
            echo ""
        fi

        # Codex 미설치 시
        if ! command -v codex &> /dev/null; then
            echo -e "  ${YELLOW}Codex CLI 설치:${NC}"
            echo "    npm install -g @openai/codex-cli"
            echo ""
        fi

        # tmux 미설치 시
        if ! command -v tmux &> /dev/null; then
            echo -e "  ${YELLOW}tmux 설치:${NC}"
            echo "    brew install tmux  # macOS"
            echo "    apt install tmux   # Ubuntu"
            echo ""
        fi

        echo ""
    fi
}

# =============================================================================
# 메인 실행
# =============================================================================
main() {
    print_header

    check_ai_cli
    check_tmux
    check_wrapper_scripts
    check_config_files
    check_state_files
    check_stage_files

    # 선택적 테스트
    if [[ "$1" == "--test" ]]; then
        test_ai_cli
    fi

    print_summary
    print_recommendations

    # 종료 코드
    if [[ $FAIL_COUNT -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# 실행
main "$@"
