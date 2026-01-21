#!/bin/bash
# show-status.sh - 파이프라인 상태 표시
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONFIG_FILE="$PROJECT_ROOT/config/pipeline.yaml"

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
OUTPUT_JSON=false
OUTPUT_BRIEF=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --json) OUTPUT_JSON=true ;;
        --brief) OUTPUT_BRIEF=true ;;
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

# 데이터 추출
PROJECT_NAME=$(jq -r '.project_name // "unnamed"' "$PROGRESS_FILE")
CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE")
CHECKPOINT_COUNT=$(jq -r '.checkpoints | length' "$PROGRESS_FILE")

# 스테이지 정보 배열
declare -a STAGE_IDS=("01-brainstorm" "02-research" "03-planning" "04-ui-ux" "05-task-management" "06-implementation" "07-refactoring" "08-qa" "09-testing" "10-deployment")
declare -a STAGE_NAMES=("brainstorm" "research" "planning" "ui-ux" "task-mgmt" "implementation" "refactoring" "qa" "testing" "deployment")
declare -a STAGE_AI=("Gemini+Claude" "Claude+MCP" "Gemini" "Gemini" "ClaudeCode" "ClaudeCode" "Codex" "ClaudeCode" "Codex" "ClaudeCode")

# 완료된 스테이지 수 계산
COMPLETED=0
CURRENT_NUM=0
for i in "${!STAGE_IDS[@]}"; do
    STATUS=$(jq -r ".stages.\"${STAGE_IDS[$i]}\".status // \"pending\"" "$PROGRESS_FILE")
    if [ "$STATUS" == "completed" ]; then
        ((COMPLETED++))
    fi
    if [ "${STAGE_IDS[$i]}" == "$CURRENT_STAGE" ]; then
        CURRENT_NUM=$((i + 1))
    fi
done

TOTAL=10
PERCENT=$((COMPLETED * 100 / TOTAL))

# JSON 출력
if [ "$OUTPUT_JSON" = true ]; then
    jq -n \
        --arg project "$PROJECT_NAME" \
        --arg current "$CURRENT_STAGE" \
        --argjson completed "$COMPLETED" \
        --argjson total "$TOTAL" \
        --argjson checkpoints "$CHECKPOINT_COUNT" \
        '{project: $project, current_stage: $current, completed: $completed, total: $total, checkpoints: $checkpoints}'
    exit 0
fi

# 간략 출력
if [ "$OUTPUT_BRIEF" = true ]; then
    echo "[$PROJECT_NAME] $COMPLETED/$TOTAL 완료 | 현재: $CURRENT_STAGE | 체크포인트: $CHECKPOINT_COUNT"
    exit 0
fi

# 진행률 바 생성
progress_bar() {
    local percent=$1
    local width=20
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    printf "["
    printf "%0.s█" $(seq 1 $filled) 2>/dev/null || true
    printf "%0.s░" $(seq 1 $empty) 2>/dev/null || true
    printf "]"
}

# 상태 아이콘 반환
status_icon() {
    case $1 in
        completed) echo "✅" ;;
        in_progress) echo "🔄" ;;
        pending) echo "⏳" ;;
        failed) echo "❌" ;;
        paused) echo "⏸️" ;;
        *) echo "⏳" ;;
    esac
}

# 상태 텍스트 (한글)
status_text() {
    case $1 in
        completed) echo "완료" ;;
        in_progress) echo "진행중" ;;
        pending) echo "대기" ;;
        failed) echo "실패" ;;
        paused) echo "중지" ;;
        *) echo "대기" ;;
    esac
}

# 출력
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📊 ${WHITE}Pipeline Status:${NC} ${CYAN}$PROJECT_NAME${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Progress: $(progress_bar $PERCENT) ${GREEN}$PERCENT%${NC} ($COMPLETED/$TOTAL)"
echo ""

# 스테이지 목록
for i in "${!STAGE_IDS[@]}"; do
    STAGE_ID="${STAGE_IDS[$i]}"
    STAGE_NAME="${STAGE_NAMES[$i]}"
    AI="${STAGE_AI[$i]}"

    STATUS=$(jq -r ".stages.\"$STAGE_ID\".status // \"pending\"" "$PROGRESS_FILE")
    ICON=$(status_icon "$STATUS")
    STATUS_TXT=$(status_text "$STATUS")

    NUM=$(printf "%02d" $((i + 1)))

    # 현재 스테이지 표시
    if [ "$STAGE_ID" == "$CURRENT_STAGE" ]; then
        ARROW=" ${YELLOW}←${NC}"
    else
        ARROW=""
    fi

    # 색상 설정
    if [ "$STATUS" == "completed" ]; then
        NAME_COLOR=$GREEN
    elif [ "$STATUS" == "in_progress" ]; then
        NAME_COLOR=$YELLOW
    else
        NAME_COLOR=$GRAY
    fi

    printf " %s %s ${NAME_COLOR}%-14s${NC} %-8s ${GRAY}[%s]${NC}%b\n" \
        "$NUM" "$ICON" "$STAGE_NAME" "$STATUS_TXT" "$AI" "$ARROW"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 마지막 핸드오프 찾기
LAST_HANDOFF=""
for ((i=${#STAGE_IDS[@]}-1; i>=0; i--)); do
    STAGE_ID="${STAGE_IDS[$i]}"
    if [ -f "$PROJECT_ROOT/stages/$STAGE_ID/HANDOFF.md" ]; then
        LAST_HANDOFF="$STAGE_ID"
        break
    fi
done

if [ -n "$LAST_HANDOFF" ]; then
    echo -e "체크포인트: ${CYAN}${CHECKPOINT_COUNT}개${NC} | 마지막 핸드오프: ${GREEN}${LAST_HANDOFF}${NC}"
else
    echo -e "체크포인트: ${CYAN}${CHECKPOINT_COUNT}개${NC} | 핸드오프: 없음"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
