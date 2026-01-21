# claude-symphony - Multi-AI Orchestration Framework

10단계 소프트웨어 개발 워크플로우 오케스트레이션 시스템

## 파이프라인 개요

| 단계 | 이름 | AI 모델 | 실행 모드 |
|------|------|---------|-----------|
| 01 | Brainstorming | Gemini + ClaudeCode | YOLO (Container) |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini | Plan Mode |
| 04 | UI/UX Planning | Gemini | Plan Mode |
| 05 | Task Management | ClaudeCode | Plan Mode |
| 06 | Implementation | ClaudeCode | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | ClaudeCode | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | ClaudeCode | Headless |

## 컨텍스트 관리 규칙

> 설정 파일: `config/context.yaml`

### 퍼센트 기반 임계값 (남은 컨텍스트 기준)

| 임계값 | 트리거 | 동작 |
|--------|--------|------|
| **60%** (warning) | 경고 표시 | 압축 비율 계산, 배너 표시 |
| **50%** (action) | 자동 저장 | `state/context/`에 상태 저장, 압축 권장 |
| **40%** (critical) | `/clear` 권고 | 강제 저장, 복구 HANDOFF 생성 |

### 태스크 기반 자동 저장
- **5개 태스크 완료마다** 상태 자동 저장
- 저장 위치: `state/context/state_{timestamp}_{stage}.md`

### 상태 저장 형식
> 템플릿: `state/templates/phase_state.md.template`

```markdown
# 작업 상태 저장 - {{TIMESTAMP}}

## 컨텍스트 상태
- 남은 컨텍스트: {{REMAINING_PERCENT}}%
- 저장 트리거: {{TRIGGER_REASON}}

## 현재 스테이지
{{STAGE_ID}}: {{STAGE_NAME}}

## 진행 상황
- 완료: [목록]
- 진행 중: [현재 작업]
- 대기: [남은 작업]

## 핵심 컨텍스트
- 주요 결정사항
- 수정된 파일
- 활성 이슈/버그

## AI 호출 기록
| AI | 시간 | 프롬프트 | 결과 |
|----|------|---------|------|

## 복구 지침
1. 이 파일 읽기
2. {{HANDOFF_FILE}} 참조
3. {{CURRENT_TASK}}부터 재개
```

### 컨텍스트 압축 전략
1. **summarize_completed**: 완료된 작업을 요약으로 대체
2. **externalize_code**: 코드 블록을 파일 참조로 대체
3. **handoff_generation**: 현재 상태를 HANDOFF.md로 외부화

## 스테이지 전환 프로토콜

### 필수 순서
1. 현재 스테이지의 모든 outputs 생성 확인
2. `HANDOFF.md` 생성 (필수)
3. 체크포인트 생성 (구현/리팩토링 스테이지)
4. `state/progress.json` 업데이트
5. 다음 스테이지 `CLAUDE.md` 로드

### HANDOFF.md 필수 포함 항목
- 완료된 작업 체크리스트
- 핵심 결정사항 및 이유
- 성공/실패한 접근법
- 다음 단계 즉시 실행 작업
- 체크포인트 참조 (해당시)

## 슬래시 커맨드

### 기본 명령어
| 커맨드 | 설명 |
|--------|------|
| `/init-project` | 새 프로젝트 초기화 |
| `/run-stage [id]` | 특정 스테이지 실행 |
| `/handoff` | 현재 스테이지 HANDOFF.md 생성 |
| `/checkpoint` | 체크포인트 생성 |
| `/gemini [prompt]` | Gemini CLI 호출 |
| `/codex [prompt]` | Codex CLI 호출 |

### Multi-AI 명령어
| 커맨드 | 설명 |
|--------|------|
| `/collaborate` | Multi-AI 협업 실행 |
| `/benchmark` | AI 모델 벤치마킹 |
| `/fork` | 파이프라인 분기 관리 |
| `/validate` | 산출물 검증 실행 |

### 가시성 명령어
| 커맨드 | 설명 |
|--------|------|
| `/status` | 파이프라인 전체 상태 확인 |
| `/stages` | 스테이지 목록 및 상세 |
| `/context` | 컨텍스트(토큰) 상태 관리 |

### 네비게이션 명령어
| 커맨드 | 설명 |
|--------|------|
| `/next` | 다음 스테이지로 전환 |
| `/restore` | 체크포인트에서 복구 |

### 스테이지 단축 명령어
| 커맨드 | 스테이지 |
|--------|----------|
| `/brainstorm` | 01-brainstorm |
| `/research` | 02-research |
| `/planning` | 03-planning |
| `/ui-ux` | 04-ui-ux |
| `/tasks` | 05-task-management |
| `/implement` | 06-implementation |
| `/refactor` | 07-refactoring |
| `/qa` | 08-qa |
| `/test` | 09-testing |
| `/deploy` | 10-deployment |

## 스킬 (자동 활성화)

| 스킬 | 트리거 | 설명 |
|------|--------|------|
| `stage-transition` | "완료", "/next" | 스테이지 완료 감지 및 전환 자동화 |
| `context-compression` | 토큰 50k+ | 컨텍스트 압축 및 상태 저장 |
| `smart-handoff` | 스테이지 완료 | 스마트 컨텍스트 추출 및 HANDOFF 생성 |
| `ai-collaboration` | `/collaborate` | Multi-AI 협업 오케스트레이션 |
| `auto-checkpoint` | 트리거 조건 충족 | 자동 체크포인트 생성 |
| `output-validator` | `/validate`, 스테이지 완료 | 산출물 검증 및 품질 확인 |

## Git 자동 커밋 규칙

> 설정 파일: `config/git.yaml`

### 자동 커밋 트리거
- **태스크 완료 시**: 관련 파일 커밋
- **스테이지 완료 시**: 전체 변경사항 커밋 + 태그 생성
- **체크포인트 생성 시**: 체크포인트 커밋 + 태그

### 커밋 메시지 형식 (Conventional Commits)
```
<type>(<scope>): <description>
```

| 스테이지 | 타입 | 스코프 | 예시 |
|---------|------|--------|------|
| 06-implementation | `feat` | `impl` | `feat(impl): 사용자 인증 구현` |
| 07-refactoring | `refactor` | `refactor` | `refactor(refactor): 인증 서비스 최적화` |
| 08-qa | `fix` | `qa` | `fix(qa): 세션 만료 버그 수정` |
| 09-testing | `test` | `test` | `test(test): E2E 테스트 추가` |
| 10-deployment | `ci` | `deploy` | `ci(deploy): GitHub Actions 설정` |

### 커밋 원칙
- 작은 단위로 자주 커밋
- 의미 있는 커밋 메시지 작성
- 커밋 전 lint/format 실행

## AI 호출 로깅

> 설정 파일: `config/ai_logging.yaml`

### AI 호출 기록
- 모든 AI 호출(Gemini, Codex, ClaudeCode)은 HANDOFF.md에 기록됩니다
- 호출 시간, 프롬프트 파일, 결과 파일, 상태를 추적합니다

### Gemini 호출 검증 체크리스트
| 단계 | 확인 항목 | 명령어 |
|------|----------|--------|
| 1 | CLI 설치 확인 | `which gemini` |
| 2 | 래퍼 사용 | `scripts/gemini-wrapper.sh` |
| 3 | tmux 세션 확인 | `tmux attach -t symphony-gemini` |
| 4 | 출력 파일 저장 | `outputs/` 디렉토리 |

### AI 호출 로그 형식 (HANDOFF.md)
```markdown
## AI 호출 기록
| AI | 호출 시간 | 프롬프트 | 결과 | 상태 |
|----|----------|---------|------|------|
| Gemini | 14:30 | prompts/ideation.md | outputs/ideas.md | 성공 |
```

## 문답 자동 기록 (Q&A Logging)

> 설정 파일: `config/qa_logging.yaml`

### 자동 기록 트리거
- **스테이지 완료 시**: 해당 스테이지의 주요 Q&A 기록
- **이슈 발견 시**: 문제와 해결 방법 기록
- **프로세스 변경 요청 시**: 변경 내용과 이유 기록

### 기록 형식
```markdown
### Q{{number}}: {{title}}
**질문**: {{question}}
**답변**: {{answer}}
**해결 방법**: {{solution}}
**향후 개선 제안**: {{suggestion}}
```

### 기록 대상 파일
- 기본: `feedback.md`
- 백업: `state/qa_backups/`

### 카테고리
- `workflow_improvements`: 워크플로우 개선
- `tool_usage`: 도구 사용법
- `process_changes`: 프로세스 변경
- `bug_fixes`: 버그 수정
- `best_practices`: 모범 사례

## 금지 사항

- HANDOFF.md 없이 스테이지 전환
- 체크포인트 없이 파괴적 작업 (구현/리팩토링)
- 단일 세션에 복수 스테이지 혼합
- 이전 스테이지 outputs 수정
- WIP 커밋, 의미 없는 커밋 메시지

## 디렉토리 구조 (Issue #17 해결)

### ⚠️ 핵심 구분: TEMPLATE_ROOT vs PROJECT_ROOT

```
TEMPLATE_ROOT (파이프라인 관리)     PROJECT_ROOT (소스코드)
/my-new-project/                   /my-new-project/[project-name]/
├── stages/        ← 산출물        ├── src/
│   └── XX-stage/                  ├── public/
│       └── outputs/               ├── package.json
├── config/                        └── ...
├── state/
└── CLAUDE.md
```

### 경로 규칙

| 유형 | 저장 위치 | 예시 |
|------|----------|------|
| 산출물 (문서) | `stages/XX/outputs/` | `ideas.md`, `architecture.md` |
| 소스 코드 | `[project-name]/src/` | 컴포넌트, API |
| 상태 파일 | `state/` | `progress.json`, 체크포인트 |
| HANDOFF | `stages/XX/` | `HANDOFF.md` |

### ⚠️ 금지: PROJECT_ROOT에 stages/ 생성
```
❌ 잘못된 구조
/my-new-project/my-app/
├── stages/        ← 여기에 생성하면 안됨!
└── src/

✅ 올바른 구조
/my-new-project/
├── stages/        ← TEMPLATE_ROOT에만 존재
└── my-app/
    └── src/       ← PROJECT_ROOT
```

### 파이프라인 파일 구조

```
config/
  pipeline.yaml        # 파이프라인 정의
  models.yaml          # AI 모델 할당
  context.yaml         # 컨텍스트 관리 설정
  model_enforcement.yaml  # AI 역할 분담
  git.yaml             # Git 자동 커밋 규칙
  mcp_fallbacks.yaml   # MCP 폴백 설정
  ai_logging.yaml      # AI 호출 로깅 설정
  qa_logging.yaml      # 문답 자동 기록 설정
  implementation.yaml.template  # 구현 규칙 템플릿

stages/
  XX-stage-name/
    CLAUDE.md          # 스테이지 AI 지침
    config.yaml        # 스테이지 설정
    prompts/           # 프롬프트 템플릿
    templates/         # 출력 템플릿
    inputs/            # 입력 파일 (이전 스테이지 링크)
    outputs/           # 출력 파일 (산출물)
    HANDOFF.md         # 생성된 핸드오프

state/
  progress.json        # 파이프라인 진행 상황
  checkpoints/         # 체크포인트 저장
  context/             # 컨텍스트 상태 저장
  handoffs/            # 핸드오프 아카이브
  templates/           # 상태 템플릿
```

## 디자인 패턴 적용

1. **Sequential Workflow Architecture** - 순차적 단계 정의 및 자동 진행
2. **Stateless Orchestration** - 무상태 컨텍스트 전달 (HANDOFF.md)
3. **Orchestrator-Workers** - 병렬 에이전트 실행 (Brainstorm 스테이지)
4. **Proactive State Externalization** - 외부 상태 파일 관리
5. **State Machine Workflow** - 상태 전이 관리 (progress.json)
6. **Layered Configuration** - 계층화된 설정 구조 (global → stage)

---

## Multi-AI Orchestration

> 설정 파일: `config/ai_collaboration.yaml`, `config/ai_benchmarking.yaml`

### AI 협업 모드

| 모드 | 설명 | 사용 스테이지 |
|------|------|--------------|
| `parallel` | 동일 작업을 여러 AI로 동시 실행 | 01-brainstorm, 02-research |
| `sequential` | AI 간 순차 전달 (리뷰 체인) | 06-implementation, 07-refactoring |
| `debate` | AI 간 토론으로 최적 결론 도출 | 03-planning, 04-ui-ux |

### AI 모델 전문화

| AI 모델 | 강점 | 최적 스테이지 |
|--------|------|--------------|
| Claude | 정확한 코드 생성, 로직 분석 | 06-implementation, 08-qa |
| Gemini | 창의적 아이디어, 빠른 탐색 | 01-brainstorm, 03-planning |
| Codex | 깊이 있는 분석, 리팩토링 | 07-refactoring, 09-testing |

### 사용 방법
```bash
# 병렬 협업 실행
/collaborate --mode parallel --models claude,gemini --task "아이디어 생성"

# 토론 모드
/collaborate --mode debate --rounds 3

# AI 벤치마킹
/benchmark --task code_generation --models claude,codex
```

---

## Smart HANDOFF 시스템

> 설정 파일: `config/handoff_intelligence.yaml`, `config/memory_integration.yaml`

### 자동 추출 항목
- 완료된 작업 (`completed_tasks`)
- 핵심 결정사항 (`key_decisions`)
- 수정된 파일 (`modified_files`)
- 대기 이슈 (`pending_issues`)
- AI 호출 기록 (`ai_call_history`)

### 컨텍스트 압축
- **전략**: 의미 기반 압축 (`semantic`)
- **목표 비율**: 원본의 30%
- **보존 항목**: 핵심 결정, 차단 이슈, 파일 변경

### AI 메모리 통합
- claude-mem MCP와 연동
- 스테이지 완료 시 자동 메모리 저장
- 스테이지 시작 시 이전 컨텍스트 주입

### HANDOFF 모드
```bash
# 기본 (스마트) HANDOFF
/handoff

# 컴팩트 모드 (최소 필수 정보만)
/handoff --compact

# 복구용 상세 HANDOFF
/handoff --recovery
```

---

## 자동 체크포인트 시스템

> 설정 파일: `config/auto_checkpoint.yaml`, `config/smart_rollback.yaml`

### 자동 생성 트리거

| 트리거 | 조건 | 동작 |
|--------|------|------|
| 태스크 기반 | 5개 태스크 완료 | 체크포인트 생성 |
| 파일 변경 | 100줄 이상 변경 | 체크포인트 생성 |
| 파괴적 작업 | rm, delete, drop 패턴 | 강제 체크포인트 |
| 시간 기반 | 30분 경과 | 체크포인트 생성 |

### 보존 정책
- 최대 보존: 10개
- 마일스톤 유지: 스테이지 완료 체크포인트는 영구 보존

### 스마트 롤백
```bash
# 체크포인트 목록
/restore --list

# 특정 체크포인트로 롤백
/restore checkpoint_20240101_120000

# 부분 롤백 (파일 레벨)
/restore checkpoint_id --partial --files "src/auth/*"
```

---

## 파이프라인 분기 (Forking)

> 설정 파일: `config/pipeline_forking.yaml`

### 분기 시점
- 아키텍처 대안 제안 시 (03-planning)
- 기술적 선택지 존재 시 (06-implementation)

### 분기 관리
- **최대 활성 분기**: 3개
- **병합 전략**: 최고 성능 기준 (`best_performer`)

### 비교 메트릭
- 코드 품질 (`code_quality`)
- 성능 (`performance`)
- 유지보수성 (`maintainability`)

### 사용 방법
```bash
# 분기 생성
/fork create --reason "아키텍처 대안 탐색" --direction "microservices"

# 분기 목록
/fork list

# 분기 비교
/fork compare

# 분기 병합
/fork merge fork_name

# 분기 삭제
/fork delete fork_name
```

---

## 스테이지 페르소나

> 설정 파일: `config/stage_personas.yaml`

각 스테이지에 최적화된 AI 행동 특성을 정의합니다.

| 스테이지 | 페르소나 | 특성 | Temperature |
|---------|---------|------|-------------|
| 01-brainstorm | Creative Explorer | 발산적 사고, 제약 없는 아이디어 | 0.9 |
| 02-research | Analytical Investigator | 체계적 분석, 깊이 있는 조사 | 0.5 |
| 03-planning | Strategic Architect | 장기적 관점, 구조적 사고 | 0.6 |
| 06-implementation | Precise Builder | 정확한 구현, 에러 방지 | 0.3 |
| 07-refactoring | Code Surgeon | 깊이 있는 분석, 성능 최적화 | 0.5 |
| 08-qa | Quality Guardian | 철저한 검증, 위험 감지 | 0.4 |

---

## 산출물 검증

> 설정 파일: `config/output_validation.yaml`

### 검증 항목

| 스테이지 | 필수 산출물 | 검증 명령 |
|---------|-----------|----------|
| 01-brainstorm | `ideas.md` (최소 5개 아이디어) | - |
| 06-implementation | `src/` (lint, typecheck 통과) | `npm run lint`, `npm run typecheck` |
| 09-testing | `tests/` (커버리지 80%+) | `npm run test:coverage` |

### 품질 메트릭
- 코드 품질 기준: 0.8
- 테스트 커버리지 기준: 80%

### 사용 방법
```bash
# 현재 스테이지 검증
/validate

# 특정 스테이지 검증
/validate --stage 06-implementation

# 자동 수정 포함
/validate --fix

# 상세 출력
/validate --verbose

# 실패해도 진행 (비권장)
/validate --force
```

---

## 신규 설정 파일

| 파일 | 설명 |
|------|------|
| `config/ai_collaboration.yaml` | AI 협업 모드 설정 |
| `config/ai_benchmarking.yaml` | AI 벤치마킹 설정 |
| `config/handoff_intelligence.yaml` | 스마트 HANDOFF 설정 |
| `config/memory_integration.yaml` | AI 메모리 통합 설정 |
| `config/auto_checkpoint.yaml` | 자동 체크포인트 설정 |
| `config/smart_rollback.yaml` | 스마트 롤백 설정 |
| `config/pipeline_forking.yaml` | 파이프라인 분기 설정 |
| `config/stage_personas.yaml` | 스테이지 페르소나 설정 |
| `config/output_validation.yaml` | 산출물 검증 설정 |

## 신규 State 디렉토리

| 디렉토리 | 설명 |
|---------|------|
| `state/ai_benchmarks/` | AI 벤치마크 결과 저장 |
| `state/forks/` | 파이프라인 분기 상태 저장 |
| `state/validations/` | 검증 결과 저장 |

