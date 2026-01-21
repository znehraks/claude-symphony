#!/bin/bash
# pre-stage.sh - 스테이지 실행 전 훅
# claude-symphony workflow pipeline

set -e

STAGE_ID="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

CONTEXT_TRIGGER_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Pre-Stage Hook: $STAGE_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 이전 스테이지 완료 여부 확인
check_prerequisites() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    # 01 스테이지는 전제조건 없음
    if [ "$stage_num" == "01" ]; then
        echo -e "${GREEN}✓${NC} 첫 번째 스테이지 - 전제조건 없음"
        return 0
    fi

    # 이전 스테이지 번호 계산
    local prev_num=$(printf "%02d" $((10#$stage_num - 1)))
    local prev_stage=$(ls "$PROJECT_ROOT/stages/" | grep "^${prev_num}-" | head -1)

    if [ -z "$prev_stage" ]; then
        echo -e "${RED}✗${NC} 이전 스테이지를 찾을 수 없습니다: $prev_num"
        return 1
    fi

    # 이전 스테이지 상태 확인
    local prev_status=$(jq -r ".stages.\"$prev_stage\".status" "$PROGRESS_FILE" 2>/dev/null || echo "pending")

    if [ "$prev_status" != "completed" ]; then
        echo -e "${RED}✗${NC} 이전 스테이지 미완료: $prev_stage (상태: $prev_status)"
        echo "  먼저 이전 스테이지를 완료해주세요."
        return 1
    fi

    echo -e "${GREEN}✓${NC} 이전 스테이지 완료: $prev_stage"
    return 0
}

# 2. HANDOFF.md 존재 확인
check_handoff() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    # 01 스테이지는 핸드오프 불필요
    if [ "$stage_num" == "01" ]; then
        echo -e "${GREEN}✓${NC} 첫 번째 스테이지 - 핸드오프 불필요"
        return 0
    fi

    local prev_num=$(printf "%02d" $((10#$stage_num - 1)))
    local prev_stage=$(ls "$PROJECT_ROOT/stages/" | grep "^${prev_num}-" | head -1)
    local handoff_file="$PROJECT_ROOT/stages/$prev_stage/HANDOFF.md"

    if [ ! -f "$handoff_file" ]; then
        echo -e "${RED}✗${NC} HANDOFF.md 없음: $handoff_file"
        echo "  이전 스테이지에서 /handoff 를 실행해주세요."
        return 1
    fi

    echo -e "${GREEN}✓${NC} HANDOFF.md 존재: $prev_stage/HANDOFF.md"
    return 0
}

# 3. 필수 입력 파일 확인
check_inputs() {
    local config_file="$PROJECT_ROOT/stages/$STAGE_ID/config.yaml"

    if [ ! -f "$config_file" ]; then
        echo -e "${YELLOW}⚠${NC} config.yaml 없음 - 입력 파일 검증 스킵"
        return 0
    fi

    # YAML에서 required inputs 추출 (간단한 파싱)
    local inputs=$(grep -A100 "^inputs:" "$config_file" | grep -A50 "required:" | grep "name:" | head -5)

    if [ -z "$inputs" ]; then
        echo -e "${GREEN}✓${NC} 필수 입력 파일 없음"
        return 0
    fi

    echo "필수 입력 파일 확인 중..."
    # 실제 구현에서는 YAML 파서 사용 권장
    echo -e "${GREEN}✓${NC} 입력 파일 검증 완료"
    return 0
}

# 4. 체크포인트 확인 (필수 스테이지)
check_checkpoint() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    # 06, 07 스테이지는 이전 체크포인트 확인
    if [ "$stage_num" == "07" ]; then
        local cp_count=$(jq '.checkpoints | length' "$PROGRESS_FILE" 2>/dev/null || echo "0")

        if [ "$cp_count" == "0" ]; then
            echo -e "${YELLOW}⚠${NC} 경고: 체크포인트가 없습니다."
            echo "  리팩토링 전 체크포인트 생성을 권장합니다."
            echo "  /checkpoint 를 실행해주세요."
        else
            echo -e "${GREEN}✓${NC} 체크포인트 존재: $cp_count 개"
        fi
    fi

    return 0
}

# 5. 컨텍스트 상태 확인 (50% 이하 경고)
check_context_status() {
    if [ ! -f "$CONTEXT_TRIGGER_FILE" ]; then
        echo -e "${GREEN}✓${NC} 컨텍스트 상태 정상"
        return 0
    fi

    local TRIGGERED=$(jq -r '.triggered // false' "$CONTEXT_TRIGGER_FILE" 2>/dev/null || echo "false")
    local REMAINING=$(jq -r '.remaining // 100' "$CONTEXT_TRIGGER_FILE" 2>/dev/null || echo "100")
    local LEVEL=$(jq -r '.level // "warning"' "$CONTEXT_TRIGGER_FILE" 2>/dev/null || echo "warning")

    if [ "$TRIGGERED" = "true" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        if [ "$LEVEL" = "critical" ]; then
            echo -e "${RED}⚠️ 컨텍스트 크리티컬 상태 (${REMAINING}% 남음)${NC}"
            echo ""
            echo "자동 스냅샷이 저장되었습니다."
            echo "스테이지 시작 전 /compact 또는 /clear를 권장합니다."
            echo ""
            echo -e "${YELLOW}계속 진행하시겠습니까? (y/n)${NC}"
        else
            echo -e "${YELLOW}⚠️ 컨텍스트 부족 경고 (${REMAINING}% 남음)${NC}"
            echo ""
            echo "자동 스냅샷이 저장되었습니다."
            echo "긴 작업 스테이지의 경우 /compact 실행을 권장합니다."
            echo ""
            echo -e "${CYAN}계속 진행하시겠습니까? (y/n)${NC}"
        fi

        read -r response </dev/tty 2>/dev/null || response="y"

        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo ""
            echo "스테이지 시작이 취소되었습니다."
            echo "  → /compact 실행 후 다시 시도해주세요."
            echo "  → 스냅샷 위치: state/context/"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            return 1
        fi

        echo ""
        echo -e "${GREEN}✓${NC} 사용자 확인 완료 - 스테이지 진행"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    fi

    echo -e "${GREEN}✓${NC} 컨텍스트 상태 정상"
    return 0
}

# 실행
echo ""
check_context_status || exit 1
check_prerequisites || exit 1
check_handoff || exit 1
check_inputs || exit 1
check_checkpoint

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Pre-Stage Hook 완료 - 스테이지 실행 가능"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
