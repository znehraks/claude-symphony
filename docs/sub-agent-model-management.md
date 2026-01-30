# Sub-Agent 모델 관리 분석

> 작성일: 2026-01-30
> 대상: claude-symphony 프레임워크 개발자

## 요약

claude-symphony의 sub-agent 시스템은 에이전트별 모델 지정 구조를 갖추고 있으나,
TypeScript 런타임에서 Claude Code Task tool을 직접 호출할 수 없는 구조적 한계로
실제 실행 경로가 stub(빈 껍데기) 상태이다.

이 문서는 현재 상태를 분석하고, 실제로 모델 선택을 강제할 수 있는 방법을 정리한다.

---

## 1. 현재 아키텍처

### 1.1 관련 파일 구조

```
src/core/agents/
├── task-spawner.ts   # Task tool wrapper (stub)
├── registry.ts       # agent.json 로더
├── types.ts          # 타입 정의
└── index.ts          # Public exports

template/.claude/agents/
├── validation-agent/
│   └── agent.json    # { "model": "sonnet", ... }
├── checkpoint-manager-agent/
│   └── agent.json    # { "model": "haiku", ... }
└── ...
```

### 1.2 에이전트별 모델 현황

| 에이전트 | model | 용도 |
|----------|-------|------|
| validation-agent | sonnet | 스테이지 출력물 검증 |
| handoff-generator-agent | sonnet | HANDOFF.md 생성 |
| output-synthesis-agent | sonnet | 병렬 AI 출력 통합 |
| research-analysis-agent | sonnet | 리서치 분석 |
| architecture-review-agent | sonnet | 아키텍처 리뷰 |
| refactoring-analysis-agent | sonnet | 리팩토링 분석 |
| qa-analysis-agent | sonnet | QA 분석 |
| checkpoint-manager-agent | **haiku** | 체크포인트 관리 |
| benchmark-analyzer-agent | sonnet | AI 벤치마크 분석 |
| test-execution-agent | sonnet | 테스트 실행 |
| requirements-validation-agent | sonnet | 요구사항 검증 |
| task-decomposition-agent | sonnet | 태스크 분해 |
| moodboard-analysis-agent | sonnet | 무드보드 분석 |
| cicd-validation-agent | sonnet | CI/CD 검증 |
| smart-rollback-agent | sonnet | 스마트 롤백 |

허용 값: `sonnet`, `opus`, `haiku`, `inherit` (부모 세션 모델 상속)

### 1.3 models.jsonc와의 관계

`template/config/models.jsonc`는 스테이지-모델 매핑을 정의하며,
`src/core/config/validator.ts`에서 config 검증 용도로만 사용된다.

**sub-agent 시스템은 models.jsonc를 참조하지 않는다.**
에이전트 모델은 오직 각 에이전트의 `agent.json` → `model` 필드로 관리된다.

---

## 2. Stub 문제 상세

### 2.1 의도된 실행 흐름

```
agent.json (model: "opus")
       ↓
  registry.ts — agent.json을 읽어 AgentDefinition 생성
       ↓
  task-spawner.ts — mapModelName()으로 모델명 변환
       ↓
  executeTaskTool({ model: "opus", ... }) — Task tool 호출
       ↓
  ❌ 실제 실행 불가 — mock 결과 반환
```

### 2.2 근본 원인

`executeTaskTool()` (`src/core/agents/task-spawner.ts:141-178`)은
Claude Code의 Task tool을 호출해야 하지만, **TypeScript 런타임에서
Claude Code 세션의 도구를 직접 호출할 수 없다.**

```typescript
// task-spawner.ts:148-153
// This is the architectural limitation: TypeScript code cannot directly spawn
// Claude Code Task tools. The Task tool must be called from the main Claude Code
// session context.

// 경고 로그만 출력하고 가짜 결과 반환
return {
  success: true,
  output: JSON.stringify({
    note: 'Fallback result - Task tool must be invoked from main Claude Code session',
  }),
};
```

### 2.3 결과

- `agent.json`의 `model` 필드는 **읽히지만 실행에 반영되지 않음**
- 에이전트 스폰 시 실제 AI 호출이 발생하지 않음
- 모든 에이전트가 동일하게 mock 결과를 반환

---

## 3. 실제 실행 주체와 모델 강제 방법

### 3.1 핵심 인식

Task tool을 실제로 호출할 수 있는 주체는 **Claude Code 세션(AI)** 자체이다.
TypeScript 코드가 아닌, Claude Code가 대화 중에 직접 Task tool을 사용한다.

따라서 모델 선택을 강제하려면 **Claude Code 세션에 지시를 거는 방법**을 사용해야 한다.

### 3.2 방법 1: CLAUDE.md에 모델 정책 명시 (권장)

`template/CLAUDE.md`에 다음과 같은 규칙을 추가한다:

```markdown
## Sub-Agent Model Policy

에이전트를 Task tool로 스폰할 때, 해당 에이전트의
`template/.claude/agents/<agent-name>/agent.json`의 `model` 필드를 읽어
Task tool의 `model` 파라미터로 반드시 전달할 것.

예시:
- agent.json에 "model": "opus" → Task tool에 model: "opus"
- agent.json에 "model": "haiku" → Task tool에 model: "haiku"
- agent.json에 "model": "inherit" 또는 미지정 → model 파라미터 생략 (부모 상속)
```

**장점**: 구현 비용 없음, 즉시 적용 가능
**단점**: AI가 지시를 100% 따른다는 보장은 없음 (프롬프트 기반 강제)

### 3.3 방법 2: 스킬 프롬프트에 모델 로딩 로직 포함

각 스킬(예: `/validate`)의 프롬프트에서 agent.json을 읽고
Task tool 호출 시 model을 명시하도록 지시한다:

```markdown
## 실행 절차
1. `.claude/agents/validation-agent/agent.json`을 읽는다
2. `model` 필드 값을 확인한다
3. Task tool 호출 시 해당 model을 파라미터로 전달한다
```

**장점**: 스킬 단위로 세밀한 제어 가능
**단점**: 모든 스킬에 개별 수정 필요

### 3.4 방법 3: Hook으로 가드레일

Claude Code의 hook 시스템으로 Task tool 호출을 감시하여,
특정 에이전트가 의도하지 않은 모델로 호출되면 차단한다:

```jsonc
// .claude/hooks/preToolUse.json (개념)
{
  "tool": "Task",
  "validate": "agent model matches agent.json"
}
```

**장점**: 런타임 검증, 잘못된 호출 방지
**단점**: hook 구현 복잡도, 현재 hook 시스템의 지원 범위에 따라 제약

---

## 4. 권장 적용 순서

| 우선순위 | 방법 | 효과 | 구현 비용 |
|----------|------|------|-----------|
| 1 | CLAUDE.md 정책 명시 | 전체 세션에 적용 | 없음 |
| 2 | 주요 스킬 프롬프트 수정 | 핵심 경로 보강 | 낮음 |
| 3 | Hook 가드레일 | 강제 검증 | 중간 |

---

## 5. 향후 고려사항

### 5.1 agent.json model 필드의 위상

현재 `agent.json`의 `model` 필드는 TypeScript 코드에서 읽히지만 실행에 반영되지 않는다.
CLAUDE.md 정책을 적용하면 이 필드가 **실질적인 설정 소스**로 기능하게 된다.

### 5.2 models.jsonc와의 통합 여부

`models.jsonc`는 스테이지-모델 매핑, `agent.json`은 에이전트-모델 매핑으로
역할이 분리되어 있다. 통합할 경우 단일 설정으로 관리할 수 있지만,
현재 분리된 구조가 관심사 분리 원칙에 더 부합한다.

### 5.3 executeTaskTool stub 해소

TypeScript에서 직접 Task tool을 호출하는 것은 Claude Code 아키텍처상 불가능하므로,
stub을 해소하려면 다른 접근이 필요하다:

- **IPC 기반**: Claude Code 세션과 TypeScript 프로세스 간 통신 채널 구축
- **CLI 기반**: `claude` CLI를 subprocess로 호출하여 에이전트 실행
- **프롬프트 기반** (현재 권장): Claude Code 세션이 직접 Task tool 호출
