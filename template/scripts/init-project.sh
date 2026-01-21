#!/bin/bash
# init-project.sh - 새 프로젝트 초기화
# claude-symphony workflow pipeline

set -e

PROJECT_NAME="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 사용법
if [ -z "$PROJECT_NAME" ]; then
    echo "사용법: $0 <project-name>"
    echo "예시: $0 my-saas-app"
    exit 1
fi

# 프로젝트 이름 검증
if ! [[ "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}오류:${NC} 프로젝트 이름은 영문 소문자, 숫자, 하이픈만 허용됩니다."
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 프로젝트 초기화: $PROJECT_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 프로젝트 디렉토리 생성
PROJECT_DIR="$PROJECT_ROOT/projects/$PROJECT_NAME"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${RED}오류:${NC} 프로젝트 '$PROJECT_NAME'이(가) 이미 존재합니다."
    exit 1
fi

mkdir -p "$PROJECT_DIR"
echo -e "${GREEN}✓${NC} 프로젝트 디렉토리 생성: $PROJECT_DIR"

# 2. 상태 파일 초기화
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

if command -v jq &> /dev/null; then
    jq ".pipeline.project_name = \"$PROJECT_NAME\" | \
        .pipeline.started_at = \"$TIMESTAMP\" | \
        .pipeline.updated_at = \"$TIMESTAMP\" | \
        .current_stage = \"01-brainstorm\"" \
        "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
    echo -e "${GREEN}✓${NC} 상태 파일 업데이트됨"
else
    echo -e "${YELLOW}⚠${NC} jq 미설치 - 상태 파일 수동 업데이트 필요"
fi

# 3. 입력 파일 템플릿 생성
BRAINSTORM_DIR="$PROJECT_ROOT/stages/01-brainstorm"
mkdir -p "$BRAINSTORM_DIR/inputs"

cat > "$BRAINSTORM_DIR/inputs/project_brief.md" << 'EOF'
# Project Brief

## 프로젝트 이름
{{PROJECT_NAME}}

## 한 줄 설명
[프로젝트를 한 줄로 설명해주세요]

## 문제 정의
[해결하려는 문제는 무엇인가요?]

## 타겟 사용자
[주요 사용자는 누구인가요?]

## 핵심 기능 (초안)
1. [기능 1]
2. [기능 2]
3. [기능 3]

## 성공 기준
[프로젝트가 성공했다고 판단하는 기준은?]

## 제약조건
- 일정:
- 예산:
- 기술:

## 참고 자료
- [URL 또는 문서]
EOF

sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$BRAINSTORM_DIR/inputs/project_brief.md" 2>/dev/null || \
sed -i "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$BRAINSTORM_DIR/inputs/project_brief.md"

echo -e "${GREEN}✓${NC} 프로젝트 브리프 템플릿 생성: stages/01-brainstorm/inputs/project_brief.md"

# 4. 완료 메시지
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} 프로젝트 '$PROJECT_NAME' 초기화 완료!"
echo ""
echo -e "${BLUE}다음 단계:${NC}"
echo "1. stages/01-brainstorm/inputs/project_brief.md 작성"
echo "2. /run-stage 01-brainstorm 실행"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
