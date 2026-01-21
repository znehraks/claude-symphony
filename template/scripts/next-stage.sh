#!/bin/bash
# next-stage.sh - 다음 스테이지로 전환
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
STAGES_DIR="$PROJECT_ROOT/stages"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 옵션 처리
FORCE_MODE=false
PREVIEW_MODE=false
NO_HANDOFF=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --force) FORCE_MODE=true ;;
        --preview) PREVIEW_MODE=true ;;
        --no-handoff) NO_HANDOFF=true ;;
        *) ;;
    esac
    shift
done

# jq 확인
if ! command -v jq &> /dev/null; then
    echo -e "${RED}오류:${NC} jq가 필요합니다."
    exit 1
fi

# progress.json 확인
if [ ! -f "$PROGRESS_FILE" ]; then
    echo -e "${RED}오류:${NC} progress.json을 찾을 수 없습니다."
    echo "  먼저 /init-project를 실행하세요."
    exit 1
fi

# 스테이지 정보
declare -a STAGE_IDS=("01-brainstorm" "02-research" "03-planning" "04-ui-ux" "05-task-management" "06-implementation" "07-refactoring" "08-qa" "09-testing" "10-deployment")
declare -a CHECKPOINT_REQUIRED=("false" "false" "false" "false" "false" "true" "true" "false" "false" "false")

# 현재 스테이지 확인
CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE")

if [ "$CURRENT_STAGE" == "none" ] || [ -z "$CURRENT_STAGE" ]; then
    echo -e "${RED}오류:${NC} 진행 중인 스테이지가 없습니다."
    echo "  /run-stage 01 또는 /brainstorm으로 시작하세요."
    exit 1
fi

# 현재 스테이지 인덱스 찾기
CURRENT_IDX=-1
for i in "${!STAGE_IDS[@]}"; do
    if [ "${STAGE_IDS[$i]}" == "$CURRENT_STAGE" ]; then
        CURRENT_IDX=$i
        break
    fi
done

if [ $CURRENT_IDX -eq -1 ]; then
    echo -e "${RED}오류:${NC} 알 수 없는 스테이지: $CURRENT_STAGE"
    exit 1
fi

# 다음 스테이지 확인
NEXT_IDX=$((CURRENT_IDX + 1))
if [ $NEXT_IDX -ge ${#STAGE_IDS[@]} ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🎉 ${GREEN}파이프라인 완료!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "모든 10개 스테이지가 완료되었습니다."
    echo ""
    echo "최종 검토:"
    echo "  - /status 로 전체 상태 확인"
    echo "  - state/handoffs/ 에서 핸드오프 문서 검토"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

NEXT_STAGE="${STAGE_IDS[$NEXT_IDX]}"
CURRENT_STAGE_DIR="$STAGES_DIR/$CURRENT_STAGE"
NEXT_STAGE_DIR="$STAGES_DIR/$NEXT_STAGE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🔄 ${WHITE}스테이지 전환${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "현재: ${CYAN}$CURRENT_STAGE${NC} → 다음: ${GREEN}$NEXT_STAGE${NC}"
echo ""

# 완료 조건 검증
echo -e "${BLUE}[완료 조건 검증]${NC}"
VALIDATION_FAILED=false

# outputs 디렉토리 확인
if [ -d "$CURRENT_STAGE_DIR/outputs" ]; then
    OUTPUT_COUNT=$(find "$CURRENT_STAGE_DIR/outputs" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$OUTPUT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} outputs 파일 존재 (${OUTPUT_COUNT}개)"
    else
        echo -e "${RED}✗${NC} outputs 파일 없음"
        VALIDATION_FAILED=true
    fi
else
    echo -e "${RED}✗${NC} outputs 디렉토리 없음"
    VALIDATION_FAILED=true
fi

# 체크포인트 필수 여부 확인
NEEDS_CHECKPOINT="${CHECKPOINT_REQUIRED[$CURRENT_IDX]}"
if [ "$NEEDS_CHECKPOINT" == "true" ]; then
    # 현재 스테이지의 체크포인트가 있는지 확인
    STAGE_NUM=$(echo "$CURRENT_STAGE" | cut -d'-' -f1)
    CP_EXISTS=$(ls -d "$PROJECT_ROOT/state/checkpoints/CP-$STAGE_NUM-"* 2>/dev/null | head -1 || true)

    if [ -n "$CP_EXISTS" ]; then
        echo -e "${GREEN}✓${NC} 체크포인트 존재"
    else
        echo -e "${RED}✗${NC} 체크포인트 필수 (미생성)"
        VALIDATION_FAILED=true
    fi
fi

echo ""

# 검증 실패 시
if [ "$VALIDATION_FAILED" = true ] && [ "$FORCE_MODE" = false ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}⚠️  스테이지 전환 조건 미충족${NC}"
    echo ""
    echo "다음 단계:"
    if [ "$NEEDS_CHECKPOINT" == "true" ]; then
        echo "  1. /checkpoint 실행"
    fi
    echo "  2. outputs 파일 생성 확인"
    echo "  3. /next --force 로 강제 전환 (비권장)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# 미리보기 모드
if [ "$PREVIEW_MODE" = true ]; then
    echo -e "${YELLOW}[PREVIEW] 실제 전환을 실행하지 않습니다.${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# HANDOFF.md 생성
if [ "$NO_HANDOFF" = false ]; then
    echo -e "${BLUE}[HANDOFF.md 생성]${NC}"

    HANDOFF_FILE="$CURRENT_STAGE_DIR/HANDOFF.md"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    TIMESTAMP_READABLE=$(date "+%Y-%m-%d %H:%M")

    cat > "$HANDOFF_FILE" << EOF
# Handoff: $CURRENT_STAGE → $NEXT_STAGE

생성일: $TIMESTAMP_READABLE

## 완료된 작업

- [x] $CURRENT_STAGE 스테이지 실행
- [x] outputs 파일 생성

## 핵심 산출물

$(find "$CURRENT_STAGE_DIR/outputs" -type f -name "*.md" -o -name "*.json" -o -name "*.yaml" 2>/dev/null | while read -r f; do echo "- $(basename "$f")"; done)

## 다음 단계

다음 스테이지 ($NEXT_STAGE) 시작을 위한 지침:
1. stages/$NEXT_STAGE/CLAUDE.md 참조
2. 입력 파일 확인: stages/$CURRENT_STAGE/outputs/

## 참고사항

- 자동 생성된 핸드오프 문서입니다.
- 필요시 수동으로 보완해 주세요.
EOF

    echo -e "${GREEN}✓${NC} $HANDOFF_FILE 생성됨"

    # 핸드오프 아카이브에 복사
    mkdir -p "$PROJECT_ROOT/state/handoffs"
    cp "$HANDOFF_FILE" "$PROJECT_ROOT/state/handoffs/${CURRENT_STAGE}-HANDOFF.md"
fi

# 상태 업데이트
echo ""
echo -e "${BLUE}[상태 업데이트]${NC}"

# progress.json 업데이트
jq ".current_stage = \"$NEXT_STAGE\" | \
    .stages.\"$CURRENT_STAGE\".status = \"completed\" | \
    .stages.\"$CURRENT_STAGE\".completed_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\" | \
    .stages.\"$NEXT_STAGE\".status = \"in_progress\" | \
    .stages.\"$NEXT_STAGE\".started_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" \
    "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

echo -e "${GREEN}✓${NC} $CURRENT_STAGE: completed"
echo -e "${GREEN}✓${NC} $NEXT_STAGE: in_progress"
echo -e "${GREEN}✓${NC} progress.json 업데이트됨"

# 완료 메시지
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅${NC} ${WHITE}$NEXT_STAGE${NC} 스테이지 시작!"
echo ""
echo "다음 작업:"
echo "  1. stages/$NEXT_STAGE/CLAUDE.md 참조"
echo "  2. 입력 파일: stages/$CURRENT_STAGE/outputs/"

# 단축 명령어 안내
declare -a SHORTCUTS=("brainstorm" "research" "planning" "ui-ux" "tasks" "implement" "refactor" "qa" "test" "deploy")
echo "  3. 단축 명령어: /${SHORTCUTS[$NEXT_IDX]}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
