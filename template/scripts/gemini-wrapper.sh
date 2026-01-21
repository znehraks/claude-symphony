#!/bin/bash
# gemini-wrapper.sh - tmux 기반 Gemini CLI 래퍼
# claude-symphony workflow pipeline
# tmux wait-for 채널 기반 동기화 방식 (폴링 없음, 즉시 반응)

SESSION_NAME="ax-gemini"
CHANNEL="ax-gemini-done-$$"
OUTPUT_FILE="/tmp/ax-gemini-output-$$"
PROMPT="$1"
TIMEOUT="${2:-300}"  # 기본 5분 타임아웃

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 사용법
if [ -z "$PROMPT" ]; then
    echo "사용법: $0 \"<prompt>\" [timeout_seconds]"
    echo "예시: $0 \"Reddit에서 Claude Code 관련 게시물을 찾아줘\" 300"
    exit 1
fi

# tmux 확인
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}오류:${NC} tmux가 설치되어 있지 않습니다."
    echo "설치: brew install tmux (macOS) 또는 apt install tmux (Ubuntu)"
    exit 1
fi

# Gemini CLI 확인
if ! command -v gemini &> /dev/null; then
    echo -e "${YELLOW}경고:${NC} gemini CLI가 설치되어 있지 않습니다."
    echo "Gemini CLI 없이 시뮬레이션 모드로 실행합니다."
    echo ""
    echo "[시뮬레이션] Gemini 응답:"
    echo "---"
    echo "Gemini CLI가 설치되면 실제 응답이 표시됩니다."
    echo "프롬프트: $PROMPT"
    exit 0
fi

# 임시 파일 정리
cleanup() {
    rm -f "$OUTPUT_FILE"
}
trap cleanup EXIT

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🤖 Gemini CLI 호출${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  세션: $SESSION_NAME"
echo "  타임아웃: ${TIMEOUT}초"
echo ""

# tmux 세션 확인/생성
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} 새 tmux 세션 생성: $SESSION_NAME"
    tmux new-session -d -s "$SESSION_NAME"
    sleep 1
fi

# 프롬프트 이스케이프
ESCAPED_PROMPT=$(printf '%s' "$PROMPT" | sed 's/"/\\"/g' | sed "s/'/'\\\\''/g")

# Gemini CLI 실행 + 완료 시 채널에 시그널
echo -e "${BLUE}Gemini 호출 중...${NC}"
tmux send-keys -t "$SESSION_NAME" "gemini \"$ESCAPED_PROMPT\" 2>&1 | tee $OUTPUT_FILE; tmux wait-for -S $CHANNEL" Enter

# 타임아웃 처리를 위해 백그라운드 타이머
(sleep "$TIMEOUT" && tmux wait-for -S "$CHANNEL" 2>/dev/null) &
TIMER_PID=$!

# 채널 시그널 대기 (블로킹)
tmux wait-for "$CHANNEL"
kill $TIMER_PID 2>/dev/null || true

# 결과 출력
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📄 Gemini 응답:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ -f "$OUTPUT_FILE" ]]; then
    cat "$OUTPUT_FILE"
else
    echo -e "${RED}오류:${NC} 출력을 캡처하지 못했습니다."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Gemini 호출 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
