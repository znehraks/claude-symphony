#!/bin/bash
# create-checkpoint.sh - 체크포인트 생성
# claude-symphony workflow pipeline

set -e

DESCRIPTION="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
TIMESTAMP=$(date +%Y%m%d-%H%M)
TIMESTAMP_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 스테이지 확인
if command -v jq &> /dev/null; then
    CURRENT_STAGE=$(jq -r '.current_stage' "$PROGRESS_FILE")
else
    echo -e "${RED}오류:${NC} jq가 필요합니다."
    exit 1
fi

if [ -z "$CURRENT_STAGE" ] || [ "$CURRENT_STAGE" == "null" ]; then
    echo -e "${RED}오류:${NC} 현재 진행 중인 스테이지가 없습니다."
    exit 1
fi

# 기본 설명
if [ -z "$DESCRIPTION" ]; then
    DESCRIPTION="체크포인트 - $CURRENT_STAGE"
fi

# 체크포인트 ID 생성
STAGE_NUM=$(echo "$CURRENT_STAGE" | cut -d'-' -f1)
CP_ID="CP-$STAGE_NUM-$TIMESTAMP"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 체크포인트 생성: $CP_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  스테이지: $CURRENT_STAGE"
echo "  설명: $DESCRIPTION"
echo ""

# 체크포인트 디렉토리 생성
CP_DIR="$PROJECT_ROOT/state/checkpoints/$CP_ID"
mkdir -p "$CP_DIR"

# 1. 상태 파일 복사
echo -e "${BLUE}[1/4] 상태 파일 복사${NC}"
cp "$PROGRESS_FILE" "$CP_DIR/progress.json"
echo -e "${GREEN}✓${NC} progress.json 복사됨"

# 2. 스테이지 outputs 복사
echo -e "${BLUE}[2/4] 스테이지 출력 파일 복사${NC}"
STAGE_DIR="$PROJECT_ROOT/stages/$CURRENT_STAGE"
if [ -d "$STAGE_DIR/outputs" ]; then
    cp -r "$STAGE_DIR/outputs" "$CP_DIR/outputs"
    FILE_COUNT=$(find "$CP_DIR/outputs" -type f | wc -l)
    echo -e "${GREEN}✓${NC} outputs 복사됨 ($FILE_COUNT 파일)"
else
    mkdir -p "$CP_DIR/outputs"
    echo -e "${YELLOW}⚠${NC} outputs 디렉토리 없음 (빈 디렉토리 생성)"
fi

# 3. HANDOFF.md 복사 (있는 경우)
echo -e "${BLUE}[3/4] HANDOFF.md 복사${NC}"
if [ -f "$STAGE_DIR/HANDOFF.md" ]; then
    cp "$STAGE_DIR/HANDOFF.md" "$CP_DIR/"
    echo -e "${GREEN}✓${NC} HANDOFF.md 복사됨"
else
    echo -e "${YELLOW}⚠${NC} HANDOFF.md 없음"
fi

# 4. 메타데이터 생성
echo -e "${BLUE}[4/4] 메타데이터 생성${NC}"
cat > "$CP_DIR/metadata.json" << EOF
{
    "id": "$CP_ID",
    "stage": "$CURRENT_STAGE",
    "description": "$DESCRIPTION",
    "created_at": "$TIMESTAMP_ISO",
    "files": []
}
EOF

# 파일 목록 추가
if command -v jq &> /dev/null; then
    FILES=$(find "$CP_DIR" -type f -not -name "metadata.json" | jq -R -s -c 'split("\n") | map(select(length > 0))')
    jq ".files = $FILES" "$CP_DIR/metadata.json" > "$CP_DIR/metadata.json.tmp" && mv "$CP_DIR/metadata.json.tmp" "$CP_DIR/metadata.json"
fi
echo -e "${GREEN}✓${NC} 메타데이터 생성됨"

# 5. progress.json에 체크포인트 추가
echo ""
echo -e "${BLUE}상태 업데이트${NC}"
jq ".checkpoints += [{\"id\": \"$CP_ID\", \"stage\": \"$CURRENT_STAGE\", \"description\": \"$DESCRIPTION\", \"created_at\": \"$TIMESTAMP_ISO\"}] | \
    .stages.\"$CURRENT_STAGE\".checkpoint_id = \"$CP_ID\"" \
    "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
echo -e "${GREEN}✓${NC} progress.json 업데이트됨"

# 완료 메시지
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} 체크포인트 생성 완료!"
echo ""
echo "  ID: $CP_ID"
echo "  위치: state/checkpoints/$CP_ID/"
echo ""
echo -e "${BLUE}복구 명령어:${NC}"
echo "  scripts/restore-checkpoint.sh $CP_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
