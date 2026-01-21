#!/bin/bash
# run-stage.sh - 스테이지 실행
# claude-symphony workflow pipeline

set -e

STAGE_ID="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 사용법
if [ -z "$STAGE_ID" ]; then
    echo "사용법: $0 <stage-id>"
    echo ""
    echo "사용 가능한 스테이지:"
    echo "  01-brainstorm    브레인스토밍"
    echo "  02-research      리서치"
    echo "  03-planning      기획"
    echo "  04-ui-ux         UI/UX 설계"
    echo "  05-task-management 태스크 관리"
    echo "  06-implementation 구현"
    echo "  07-refactoring   리팩토링"
    echo "  08-qa            QA"
    echo "  09-testing       테스팅"
    echo "  10-deployment    배포"
    exit 1
fi

# 스테이지 디렉토리 확인
STAGE_DIR="$PROJECT_ROOT/stages/$STAGE_ID"

if [ ! -d "$STAGE_DIR" ]; then
    echo -e "${RED}오류:${NC} 스테이지를 찾을 수 없습니다: $STAGE_ID"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 스테이지 실행: $STAGE_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Pre-stage 훅 실행
echo ""
echo -e "${BLUE}[1/3] Pre-Stage 훅 실행${NC}"
if [ -f "$PROJECT_ROOT/.claude/hooks/pre-stage.sh" ]; then
    bash "$PROJECT_ROOT/.claude/hooks/pre-stage.sh" "$STAGE_ID"
else
    echo -e "${YELLOW}⚠${NC} Pre-stage 훅이 없습니다."
fi

# 2. 상태 업데이트
echo ""
echo -e "${BLUE}[2/3] 상태 업데이트${NC}"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

if command -v jq &> /dev/null; then
    jq ".current_stage = \"$STAGE_ID\" | \
        .stages.\"$STAGE_ID\".status = \"in_progress\" | \
        .stages.\"$STAGE_ID\".started_at = \"$TIMESTAMP\" | \
        .pipeline.updated_at = \"$TIMESTAMP\"" \
        "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
    echo -e "${GREEN}✓${NC} progress.json 업데이트됨"
else
    echo -e "${YELLOW}⚠${NC} jq 미설치 - 수동 업데이트 필요"
fi

# 3. 모델 강제 실행 확인 (Issue #12, #14 해결)
echo ""
echo -e "${BLUE}[3/5] AI 모델 강제 실행 확인${NC}"
STAGE_CONFIG="$STAGE_DIR/config.yaml"
MODEL_ENFORCEMENT="$PROJECT_ROOT/config/model_enforcement.yaml"

if command -v yq &> /dev/null && [ -f "$STAGE_CONFIG" ]; then
    AUTO_INVOKE_ENABLED=$(yq '.auto_invoke.enabled // false' "$STAGE_CONFIG" 2>/dev/null)
    AUTO_INVOKE_MODEL=$(yq '.auto_invoke.model // ""' "$STAGE_CONFIG" 2>/dev/null)
    AUTO_INVOKE_MSG=$(yq '.auto_invoke.message // ""' "$STAGE_CONFIG" 2>/dev/null)
    AUTO_INVOKE_REQUIRED=$(yq '.auto_invoke.required // false' "$STAGE_CONFIG" 2>/dev/null)

    if [ "$AUTO_INVOKE_ENABLED" = "true" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${YELLOW}🤖 AI 모델 자동 호출 설정${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  모델: $AUTO_INVOKE_MODEL"
        echo "  필수: $AUTO_INVOKE_REQUIRED"
        if [ -n "$AUTO_INVOKE_MSG" ] && [ "$AUTO_INVOKE_MSG" != "null" ]; then
            echo ""
            echo -e "  ${GREEN}$AUTO_INVOKE_MSG${NC}"
        fi

        if [ "$AUTO_INVOKE_REQUIRED" = "true" ]; then
            echo ""
            echo -e "  ${YELLOW}⚠️  이 스테이지는 ${AUTO_INVOKE_MODEL} 사용이 필수입니다.${NC}"
            echo -e "  ${BLUE}→ /${AUTO_INVOKE_MODEL} 명령어로 호출하세요.${NC}"
        fi
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
else
    echo -e "${YELLOW}⚠${NC} yq 미설치 또는 config.yaml 없음 - 모델 강제 확인 건너뜀"
fi

# 4. CLAUDE.md 표시
echo ""
echo -e "${BLUE}[4/5] 스테이지 지침 로드${NC}"
CLAUDE_MD="$STAGE_DIR/CLAUDE.md"

if [ -f "$CLAUDE_MD" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}스테이지 CLAUDE.md:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$CLAUDE_MD"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} CLAUDE.md가 없습니다."
fi

# 5. 다음 단계 안내
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} 스테이지 $STAGE_ID 시작됨"
echo ""
echo -e "${BLUE}작업 완료 후:${NC}"
echo "  /handoff - 핸드오프 문서 생성"
echo "  /checkpoint [설명] - 체크포인트 생성 (06, 07 스테이지)"

# AI 모델 호출 안내 추가
if [ -n "$AUTO_INVOKE_MODEL" ] && [ "$AUTO_INVOKE_MODEL" != "null" ]; then
    echo ""
    echo -e "${YELLOW}AI 모델 사용:${NC}"
    echo "  /${AUTO_INVOKE_MODEL} \"프롬프트\" - ${AUTO_INVOKE_MODEL} 호출"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
