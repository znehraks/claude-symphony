#!/bin/bash
# post-stage.sh - 스테이지 완료 후 훅
# claude-symphony workflow pipeline

set -e

STAGE_ID="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Post-Stage Hook: $STAGE_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 완료 조건 검증
validate_completion() {
    local stage_dir="$PROJECT_ROOT/stages/$STAGE_ID"
    local config_file="$stage_dir/config.yaml"

    echo "완료 조건 검증 중..."

    # outputs 디렉토리 확인
    if [ -d "$stage_dir/outputs" ]; then
        local output_count=$(ls -1 "$stage_dir/outputs" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✓${NC} 출력 파일: $output_count 개"
    fi

    return 0
}

# 2. HANDOFF.md 생성 알림
check_handoff() {
    local handoff_file="$PROJECT_ROOT/stages/$STAGE_ID/HANDOFF.md"

    if [ ! -f "$handoff_file" ]; then
        echo -e "  ${YELLOW}⚠${NC} HANDOFF.md 미생성"
        echo "     /handoff 를 실행하여 핸드오프 문서를 생성해주세요."
        return 1
    fi

    echo -e "  ${GREEN}✓${NC} HANDOFF.md 존재"

    # 핸드오프 아카이브
    local archive_name="${STAGE_ID}-$(date +%Y%m%d-%H%M).md"
    cp "$handoff_file" "$PROJECT_ROOT/state/handoffs/$archive_name"
    echo -e "  ${GREEN}✓${NC} 핸드오프 아카이브: state/handoffs/$archive_name"

    return 0
}

# 3. progress.json 업데이트
update_progress() {
    echo "상태 업데이트 중..."

    # jq로 상태 업데이트
    if command -v jq &> /dev/null; then
        local tmp_file=$(mktemp)
        jq ".stages.\"$STAGE_ID\".status = \"completed\" | \
            .stages.\"$STAGE_ID\".completed_at = \"$TIMESTAMP\" | \
            .stages.\"$STAGE_ID\".handoff_generated = true | \
            .pipeline.updated_at = \"$TIMESTAMP\"" \
            "$PROGRESS_FILE" > "$tmp_file" && mv "$tmp_file" "$PROGRESS_FILE"

        echo -e "  ${GREEN}✓${NC} progress.json 업데이트됨"
    else
        echo -e "  ${YELLOW}⚠${NC} jq 미설치 - 수동 업데이트 필요"
    fi

    return 0
}

# 4. 체크포인트 생성 알림 (필수 스테이지)
remind_checkpoint() {
    local stage_num=$(echo "$STAGE_ID" | cut -d'-' -f1)

    if [ "$stage_num" == "06" ] || [ "$stage_num" == "07" ]; then
        echo ""
        echo -e "${BLUE}📌 체크포인트 알림${NC}"
        echo "  이 스테이지는 체크포인트 생성이 권장됩니다."
        echo "  /checkpoint \"스테이지 완료\" 를 실행해주세요."
    fi
}

# 5. 다음 스테이지 안내
show_next_stage() {
    local config_file="$PROJECT_ROOT/stages/$STAGE_ID/config.yaml"
    local next_stage=""

    if [ -f "$config_file" ]; then
        next_stage=$(grep "next_stage:" "$config_file" | cut -d'"' -f2 | head -1)
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -z "$next_stage" ] || [ "$next_stage" == "null" ]; then
        echo -e "${GREEN}🎉 파이프라인 완료!${NC}"
        echo "  모든 스테이지가 완료되었습니다."
    else
        echo -e "${GREEN}✓${NC} 스테이지 $STAGE_ID 완료"
        echo ""
        echo -e "${BLUE}다음 스테이지: $next_stage${NC}"
        echo "  실행: /run-stage $next_stage"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 실행
echo ""
validate_completion
check_handoff
update_progress
remind_checkpoint
show_next_stage
