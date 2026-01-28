# claude-symphony Sub-Agent 도입 로드맵

**작성일**: 2026-01-28
**범위**: 14개 sub-agent 구현 계획
**목표**: 컨텍스트 사용량 최적화 및 품질 향상

---

## Executive Summary

### 현황
- **기존 시스템**: validation-agent 1개만 존재
- **문제점**: 복잡한 분석/검증 작업이 메인 세션 컨텍스트를 소비 (8-20% per operation)
- **발견**: 14개의 추가 sub-agent 도입 기회 확인 (Context auto-compact 기능과 중복되는 1개 제외)

### 제안
14개 sub-agent를 우선순위별 3단계로 구현:
- **Tier 1 (Critical/High)**: 5개 - 컨텍스트 영향 대 (~50-65% 절감)
- **Tier 2 (Medium)**: 4개 - 자동화 중심 (~30-40% 절감)
- **Tier 3 (Medium-Low)**: 5개 - 품질 개선 중심 (~30-40% 절감)

### 예상 효과
- **전체 컨텍스트 절감**: 105-140% (누적, 프로젝트 전체)
- **세션 지속 시간**: 2-3배 증가
- **품질 지표**: +25-40% 개선
- **자동화 수준**: 수동 작업 50-70% 감소

---

## 📋 14개 Sub-Agent 전체 목록

| # | Agent 명 | 우선순위 | 컨텍스트 절감 | 주요 역할 |
|---|----------|----------|--------------|-----------|
| 1 | handoff-generator-agent | CRITICAL | 8-12% | 스테이지 전환 HANDOFF 생성 |
| 2 | output-synthesis-agent | HIGH | 10-15% | 병렬 AI 출력 통합 (5개 스테이지) |
| 3 | research-analysis-agent | HIGH | 10-12% | Stage 02 연구 분석 및 종합 |
| 4 | architecture-review-agent | HIGH | 12-15% | Stage 03 아키텍처 검증 |
| 5 | refactoring-analysis-agent | HIGH | 10-15% | Stage 07 리팩토링 분석 |
| 6 | qa-analysis-agent | MEDIUM | 8-9% | Stage 08 보안/품질 분석 |
| 7 | checkpoint-manager-agent | MEDIUM | 7-8% | 자동 체크포인트 관리 |
| 8 | benchmark-analyzer-agent | MEDIUM | 10-14% | AI 모델 성능 벤치마킹 |
| 9 | test-execution-agent | MEDIUM | 6-7% | Stage 09 테스트 실행 및 리포팅 |
| 10 | requirements-validation-agent | MEDIUM-LOW | 6-8% | INVEST 기준 요구사항 검증 |
| 11 | task-decomposition-agent | MEDIUM-LOW | 8-10% | Stage 05 태스크 분해 및 의존성 분석 |
| 12 | moodboard-analysis-agent | MEDIUM-LOW | 6-8% | Stage 04 디자인 토큰 추출 |
| 13 | cicd-validation-agent | MEDIUM-LOW | 5-7% | Stage 10 CI/CD 설정 검증 |
| 14 | smart-rollback-agent | MEDIUM-LOW | 6-8% | 에러 분석 및 롤백 제안 |

**총 누적 절감**: 113-148% (프로젝트 전체 사이클 기준)

> **Note**: Context Analyzer Agent는 기존 context auto-compact 기능과 중복되어 제외

---

## 🎯 Tier 1: Critical & High Priority (Agents 1-5)

> **Context Auto-Compact 사용**: Context Analyzer Agent는 기존 auto-compact 기능으로 대체

### 1. HANDOFF Generator Agent

**역할**: 스테이지 전환 시 스마트 HANDOFF.md 생성

**트리거**:
- 스테이지 완료 시 (`/next` 전)
- `/handoff` 명령
- 에픽 사이클 경계
- 컨텍스트 임계점 (40%)

**처리 과정**:
1. 대화 이력에서 콘텐츠 추출 (결정, 파일 변경, 이슈, AI 호출)
2. 중요도별 우선순위 부여 (블로킹 이슈 > 결정 > 파일)
3. 조건부 섹션 포함 (epic_cycle, implementation_order, moodboard 등)
4. 타겟 토큰 예산에 맞춰 압축 (기본 4000 토큰)
5. 템플릿 적용 (default, compact, recovery, epic_transition)

**출력**:
- `stages/XX-stage/HANDOFF.md` - 메인 핸드오프
- `state/handoffs/archive/` - 아카이브
- 추출 메트릭 로그

**구현 단계**:
- **Phase 1 (1주)**: 코어 추출 로직
- **Phase 2 (1주)**: 스마트 기능 (압축, 조건부 섹션)
- **Phase 3 (1주)**: 고급 인텔리전스 (extended thinking, 메모리 통합)

**예상 효과**:
- HANDOFF당 8-12% 컨텍스트 절감
- 프로젝트당 10-12회 전환 × 10% = 100-120% 총 절감
- 스테이지 전환 시간 5-10분 → 30초

---

### 2. Output Synthesis Agent

**역할**: 병렬 AI 출력 통합 (Gemini+Claude, Codex+Claude)

**트리거**:
- 병렬 실행 완료 후 자동
- `/synthesize` 명령
- `/synthesize --verbose` (상세 분석)

**처리 과정**:
1. 모든 모델 출력 수집
2. 공통점 분석 (합의 비율 계산)
3. 차이점 평가 (고유 인사이트 비교)
4. 통합 (공통점 우선 + 보완 인사이트)
5. 품질 검증 (consensus_ratio + keyword_coverage ≥ 0.8)

**영향받는 스테이지**:
- 01-brainstorm → ideas.md
- 03-planning → architecture.md
- 04-ui-ux → wireframes.md
- 07-refactoring → refactoring_report.md
- 09-testing → tests/

**출력**:
- 최종 통합 파일 (스테이지별 요구 출력)
- `state/collaborations/synthesis_log.md` - 통합 로그

**구현 단계**:
- **Phase 1 (1주)**: 기본 통합 (수집, 합의 추출, 병합)
- **Phase 2 (1주)**: 고급 분석 (키워드 감지, 가중 품질 메트릭)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, 자동 개선)

**예상 효과**:
- 통합당 10-15% 컨텍스트 절감
- 프로젝트당 5개 병렬 스테이지 × 12% = 60% 총 절감
- 품질 점수 ≥ 0.8 보장

---

### 3. Research Analysis Agent

**역할**: Stage 02 연구 출력물 크로스 분석 및 종합

**트리거**:
- Stage 02 완료 시
- 웹 연구 MCP 호출 후
- feasibility_report.md 생성 전

**처리 과정**:
1. 소스 파싱 (tech_research.md, market_analysis.md, competitor_research.md)
2. 크로스 레퍼런스 (모순 식별, 지지 증거 탐색)
3. 발견사항 종합 (기술 타당성, 시장 기회, 리스크)
4. feasibility_report.md 생성

**출력**:
- `stages/02-research/outputs/feasibility_report.md` - 주요 결과물
- `state/research/cross_analysis_{timestamp}.json` - 분석 메타데이터

**구현 단계**:
- **Phase 1 (1주)**: 소스 파싱 및 크로스 레퍼런싱
- **Phase 2 (1주)**: 고급 분석 (소스 신뢰도, 증거 매핑, 리스크 식별)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, Go/No-Go 추천)

**예상 효과**:
- 연구당 10-12% 컨텍스트 절감
- 타당성 평가 완전성 ≥ 0.9
- 모순 감지 100%

---

### 4. Architecture Review Agent

**역할**: architecture.md 및 implementation.yaml 검증, 의존성 분석

**트리거**:
- Stage 03 완료 시
- `/arch-review` 명령
- implementation.yaml 생성 후

**처리 과정**:
1. 아키텍처 검증 (필수 섹션, 다이어그램, 순환 의존성)
2. implementation.yaml 검증 (필수 키, 일관성)
3. 크로스 문서 일관성 (컴포넌트 일치, 마일스톤 정렬)
4. 의존성 분석 (누락, 버전 충돌, API 통합 포인트)

**출력**:
- `state/validations/03-planning_architecture_{timestamp}.json` - 검증 리포트
- 콘솔 요약 (우선순위별 이슈)

**구현 단계**:
- **Phase 1 (1주)**: 문서 검증 (섹션, 키, 기본 일관성)
- **Phase 2 (1주)**: 고급 분석 (의존성 그래프, 순환 감지)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, 수정 제안)

**예상 효과**:
- 기획당 12-15% 컨텍스트 절감
- Stage 06 재작업 50-100% 방지
- 아키텍처 이슈 감지율 95%+

---

### 5. Refactoring Analysis Agent

**역할**: Codex+Claude 리팩토링 권장사항 통합 및 검증

**트리거**:
- Stage 07 완료 시 (병렬 실행 후)
- `/refactor-analyze` 명령

**처리 과정**:
1. 권장사항 수집 (Codex: 성능, Claude: 명확성/유지보수)
2. 공통점 분석 (두 모델이 제안한 리팩토링 = 높은 우선순위)
3. 차이점 평가 (모델별 고유 인사이트)
4. 최종 계획 종합 및 문서화
5. 개선사항 검증 (lint, test, 성능 메트릭)

**출력**:
- `stages/07-refactoring/outputs/refactoring_report.md` - 주요 결과물
- `state/refactoring/synthesis_{timestamp}.json` - 통합 메타데이터

**구현 단계**:
- **Phase 1 (1주)**: 권장사항 통합 (수집, 합의, 병합)
- **Phase 2 (1주)**: 검증 및 메트릭 (lint+test, 성능, 복잡도)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, 우선순위, 상세 리포트)

**예상 효과**:
- 리팩토링당 10-15% 컨텍스트 절감
- 파괴적 변경 0% (테스트 통과 보장)
- 성능 개선 ≥ 10%, 복잡도 감소 ≥ 20%

---

### Tier 1 구현 순서

1. **handoff-generator-agent** (1순위) - 모든 스테이지 전환 차단
2. **output-synthesis-agent** (2순위) - 5개 스테이지 영향
3. **architecture-review-agent** (3순위) - 예방적 가치
4. **research-analysis-agent** (4순위) - 품질 향상
5. **refactoring-analysis-agent** (5순위) - #2 패턴 재사용

**예상 기간**: 5-7주 (병렬 구현 가능)

---

## 🔧 Tier 2: Medium Priority (Agents 6-9)

### 6. QA & Bug Analysis Agent

#### Priority
**MEDIUM** - 8-9% context savings in Stage 08

#### Role
Perform automated security scans, code quality analysis, and bug classification with OWASP Top 10 pattern detection.

#### File Structure
```
template/.claude/agents/qa-analysis-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "qa-analysis-agent",
  "description": "Performs security scans, code quality analysis, and bug classification for Stage 08",
  "tools": [
    "Read",
    "Glob",
    "Grep",
    "Bash"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

#### CLAUDE.md Structure

```markdown
# QA & Bug Analysis Agent

## Your Role
You are the **QA & Bug Analysis Agent** for claude-symphony, responsible for automated security scanning, code quality analysis, and bug classification.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- {{STAGE_ID}}: Current stage (should be "08-qa")
- Custom data:
  - codebaseRoot: Path to source code
  - scanTypes: ["security", "quality", "bugs"]

## Processing Steps

### Step 1: Security Scan
1. Run npm audit for dependency vulnerabilities
2. Grep for OWASP Top 10 patterns (SQL injection, XSS, etc.)
3. Detect hardcoded secrets (API keys, passwords)
4. Check authentication/authorization issues

### Step 2: Code Quality Analysis
1. Run ESLint/TSC for linting and type errors
2. Calculate cyclomatic complexity
3. Detect code smells (long functions, deep nesting)
4. Check naming conventions

### Step 3: Bug Classification
1. Categorize issues by severity (Critical/High/Medium/Low)
2. Generate bug report with locations and fixes
3. Prioritize by impact and effort

## Output Format
Return JSON with security findings, quality issues, and bug list.
```

#### Input/Output Schema

```typescript
interface QAAnalysisInput {
  codebaseRoot: string;
  scanTypes: Array<'security' | 'quality' | 'bugs'>;
}

interface QAAnalysisOutput {
  security: {
    vulnerabilities: Array<{
      type: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      location: string;
      fix: string;
    }>;
    secrets: string[];
  };
  quality: {
    lintErrors: number;
    complexity: number;
    codeSmells: string[];
  };
  bugs: Array<{
    severity: string;
    description: string;
    location: string;
  }>;
}
```

#### Spawn Example

```typescript
const result = await spawnAgent(
  'qa-analysis-agent',
  {
    projectRoot: '/path/to/project',
    stage: '08-qa',
    data: {
      codebaseRoot: '/path/to/project/my-app/src',
      scanTypes: ['security', 'quality', 'bugs'],
    },
  },
  'foreground'
);
```

#### State Files
- `state/qa_analysis/qa_report_{timestamp}.json` - Main analysis report
- `state/qa_analysis/security_scan_{timestamp}.json` - Security findings

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add OWASP pattern detection logic
- [ ] Integrate npm audit
- [ ] Add code quality metrics
- [ ] Integrate with Stage 08 workflow
- [ ] Add `/qa-analyze` command
- [ ] Test with sample projects
- [ ] Document security patterns

#### Testing Scenarios

**TC-1: Security Vulnerabilities Found**
- Input: Project with npm vulnerabilities
- Expected: Critical findings listed with fix suggestions

**TC-2: Hardcoded Secrets**
- Input: Code with API keys
- Expected: Secrets detected and reported

**TC-3: Code Quality Issues**
- Input: Complex functions with high cyclomatic complexity
- Expected: Quality issues with severity ratings

**TC-4: Clean Codebase**
- Input: Well-tested, secure code
- Expected: Pass report with no issues

**TC-5: Mixed Issues**
- Input: Multiple security + quality issues
- Expected: Prioritized list with action items

#### Fallback Strategy
If agent fails:
1. Run basic npm audit only
2. Skip extended analysis
3. Generate minimal security report
4. Continue to Stage 09 (non-blocking)

---

### 7. Checkpoint Manager Agent

#### Priority
**MEDIUM** - 7-8% context savings through automated checkpointing

#### Role
Automatically create checkpoints based on triggers (task completion, file changes, time elapsed, destructive operations) and manage retention policy.

#### File Structure
```
template/.claude/agents/checkpoint-manager-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "checkpoint-manager-agent",
  "description": "Automatically creates and manages checkpoints based on triggers and retention policy",
  "tools": [
    "Read",
    "Glob",
    "Bash"
  ],
  "model": "haiku",
  "permissionMode": "acceptEdits",
  "extendedThinking": false,
  "executionMode": "background"
}
```

#### CLAUDE.md Structure

```markdown
# Checkpoint Manager Agent

## Your Role
You are the **Checkpoint Manager Agent** for claude-symphony, responsible for automatic checkpoint creation and retention management.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- Custom data:
  - triggers: Checkpoint trigger conditions
  - retentionPolicy: Max checkpoints, milestone preservation

## Processing Steps

### Step 1: Evaluate Triggers
1. Check task completion count (≥5 tasks?)
2. Check file changes (≥100 lines?)
3. Check time elapsed (≥30 minutes?)
4. Check for destructive operations (rm, delete patterns)
5. Calculate risk score

### Step 2: Create Checkpoint
If trigger condition met:
1. Generate checkpoint ID
2. Archive changed files
3. Create metadata (timestamp, stage, trigger reason)
4. Create git tag
5. Log to `state/checkpoints/metadata.json`

### Step 3: Cleanup
1. List all checkpoints
2. Sort by timestamp
3. Preserve milestone checkpoints (stage completion)
4. Delete oldest if count > max_retention (default 20)

## Output Format
Return checkpoint ID and metadata.
```

#### Input/Output Schema

```typescript
interface CheckpointManagerInput {
  triggers: {
    taskCount: number;
    linesChanged: number;
    minutesElapsed: number;
    destructiveOp: boolean;
  };
  retentionPolicy: {
    maxCheckpoints: number;
    preserveMilestones: boolean;
  };
}

interface CheckpointManagerOutput {
  checkpointId: string;
  timestamp: string;
  trigger: string;
  riskScore: number;
  filesArchived: number;
  cleanedUp: number;
}
```

#### Spawn Example

```typescript
// Triggered automatically by checkpoint hook
const result = await spawnAgent(
  'checkpoint-manager-agent',
  {
    projectRoot: '/path/to/project',
    data: {
      triggers: {
        taskCount: 5,
        linesChanged: 150,
        minutesElapsed: 35,
        destructiveOp: false,
      },
      retentionPolicy: {
        maxCheckpoints: 20,
        preserveMilestones: true,
      },
    },
  },
  'background'
);
```

#### State Files
- `state/checkpoints/checkpoint_{id}.tar.gz` - Archived files
- `state/checkpoints/metadata.json` - All checkpoint metadata

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add trigger evaluation logic
- [ ] Implement checkpoint archiving
- [ ] Add git tag creation
- [ ] Implement retention cleanup
- [ ] Integrate with auto-checkpoint hooks
- [ ] Test with various triggers
- [ ] Document trigger conditions

#### Testing Scenarios

**TC-1: Task-based Trigger**
- Input: 5 tasks completed
- Expected: Checkpoint created with task trigger reason

**TC-2: File Change Trigger**
- Input: 150 lines changed
- Expected: Checkpoint created with file change reason

**TC-3: Destructive Operation**
- Input: `rm -rf` detected
- Expected: Immediate checkpoint before operation

**TC-4: Retention Cleanup**
- Input: 21 checkpoints exist, max 20
- Expected: Oldest non-milestone checkpoint deleted

**TC-5: Multiple Triggers**
- Input: Tasks + time + file changes all met
- Expected: Single checkpoint with combined reasons

#### Fallback Strategy
If agent fails:
1. Log error
2. Skip checkpoint creation
3. Continue workflow (non-critical)
4. User can manually create checkpoint later

---

### 8. AI Benchmark Analyzer Agent

#### Priority
**MEDIUM** - 10-14% context savings through optimal model selection

#### Role
Benchmark AI models (Claude, Codex, Gemini) on code generation, refactoring, and test generation tasks to recommend the best model for each stage.

#### File Structure
```
template/.claude/agents/benchmark-analyzer-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "benchmark-analyzer-agent",
  "description": "Benchmarks AI models and recommends optimal model selection based on performance metrics",
  "tools": [
    "Read",
    "Glob",
    "Bash"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

#### CLAUDE.md Structure

```markdown
# AI Benchmark Analyzer Agent

## Your Role
You are the **AI Benchmark Analyzer Agent** for claude-symphony, responsible for benchmarking AI models and recommending optimal selections.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- Custom data:
  - benchmarkTask: "code_generation" | "refactoring" | "test_generation"
  - models: Array of model names to benchmark
  - sampleSize: Number of sample tasks (default 3)

## Processing Steps

### Step 1: Generate Sample Tasks
1. Create 3-5 sample tasks for benchmarkTask type
2. Ensure tasks are representative of real work

### Step 2: Execute Benchmarks
For each model:
1. Run model on each sample task
2. Measure execution time
3. Run tests on generated code
4. Calculate lint/style scores
5. Measure complexity

### Step 3: Calculate Scores
For each model:
- Correctness: test_pass_rate (0-1)
- Performance: 1 - (execution_time / max_time)
- Style: lint_score (0-1)
- Readability: 1 - (complexity / max_complexity)
- Overall: weighted sum (0.4, 0.2, 0.2, 0.2)

### Step 4: Analyze Historical Trends
1. Load past benchmark results (7 days)
2. Calculate 7-day average scores
3. Determine trend (improving/stable/declining)

### Step 5: Generate Recommendation
Recommend model with highest overall score (confidence threshold 0.15).

## Output Format
Return JSON with scores, recommendation, and historical comparison.
```

#### Input/Output Schema

```typescript
interface BenchmarkAnalyzerInput {
  benchmarkTask: 'code_generation' | 'refactoring' | 'test_generation';
  models: string[];
  sampleSize?: number;
}

interface BenchmarkAnalyzerOutput {
  benchmarkId: string;
  results: Array<{
    model: string;
    score: number;
    rank: number;
    metrics: {
      correctness: number;
      performance: number;
      style: number;
      readability: number;
    };
  }>;
  recommendation: {
    model: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  };
}
```

#### Spawn Example

```typescript
const result = await spawnAgent(
  'benchmark-analyzer-agent',
  {
    projectRoot: '/path/to/project',
    stage: '06-implementation',
    data: {
      benchmarkTask: 'code_generation',
      models: ['claude', 'codex'],
      sampleSize: 3,
    },
  },
  'foreground'
);
```

#### State Files
- `state/ai_benchmarks/benchmark_{timestamp}.json` - Benchmark results
- `state/ai_benchmarks/trends.json` - 7-day rolling trends

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add sample task generation
- [ ] Implement model execution via Task tool
- [ ] Add scoring algorithm
- [ ] Implement trend analysis
- [ ] Add `/benchmark` command
- [ ] Test with multiple models
- [ ] Document metrics and weights

#### Testing Scenarios

**TC-1: Code Generation Benchmark**
- Input: claude vs codex, 3 sample tasks
- Expected: Scores calculated, recommendation provided

**TC-2: Tie Scenario**
- Input: claude 0.85, codex 0.83 (gap < 0.15)
- Expected: Fallback model recommended, confidence "low"

**TC-3: Historical Trend**
- Input: 7 days of results, claude improving
- Expected: Trend indicators correct, historical comparison shown

**TC-4: Single Model**
- Input: Only claude benchmarked
- Expected: Claude recommended by default

**TC-5: Custom Metrics**
- Input: Override metrics (only correctness + performance)
- Expected: Score calculated with custom weights

#### Fallback Strategy
If agent fails:
1. Use default model assignment from config
2. Log warning
3. Skip recommendation update
4. Continue pipeline (optimization, not critical)

---

### 9. Test Execution & Reporting Agent

#### Priority
**MEDIUM** - 6-7% context savings through automated test execution and analysis

#### Role
Execute unit, integration, and E2E tests, analyze coverage, detect flaky tests, and generate comprehensive reports.

#### File Structure
```
template/.claude/agents/test-execution-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "test-execution-agent",
  "description": "Executes tests, analyzes coverage, and detects flaky tests for Stage 09",
  "tools": [
    "Read",
    "Glob",
    "Bash"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground",
  "mcpServers": ["playwright"]
}
```

#### CLAUDE.md Structure

```markdown
# Test Execution & Reporting Agent

## Your Role
You are the **Test Execution & Reporting Agent** for claude-symphony, responsible for running all test types and analyzing results.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- {{STAGE_ID}}: Current stage (typically "09-testing")
- Custom data:
  - testTypes: ["unit", "integration", "e2e"]
  - coverageThreshold: 80
  - runCount: 3 (for flaky detection)

## Processing Steps

### Step 1: Discover Tests
1. Use Glob to find test files (*.test.ts, *.spec.ts)
2. Count total tests

### Step 2: Run Unit Tests
1. Execute `npm run test -- --json --outputFile=/tmp/test_results.json`
2. Parse results (total, passed, failed, duration)
3. Run coverage analysis

### Step 3: Run Integration Tests
1. Execute `npm run test:integration -- --json`
2. Parse results

### Step 4: Run E2E Tests (Playwright)
1. Use Playwright MCP or `npm run test:e2e`
2. Parse results

### Step 5: Analyze Coverage
1. Parse coverage report JSON
2. Check against threshold (80%)
3. Identify uncovered files

### Step 6: Detect Flaky Tests
1. Run tests 3 times
2. Identify tests that pass sometimes, fail sometimes
3. Calculate success rate

### Step 7: Generate Report
Return JSON with test results, coverage, flaky tests, and recommendations.
```

#### Input/Output Schema

```typescript
interface TestExecutionInput {
  testTypes: Array<'unit' | 'integration' | 'e2e'>;
  coverageThreshold?: number;
  runCount?: number;
}

interface TestExecutionOutput {
  testExecution: {
    unit: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
    integration: { /* same */ };
    e2e: { /* same */ };
  };
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
    passed: boolean;
  };
  flakyTests: Array<{
    name: string;
    successRate: number;
    recommendation: string;
  }>;
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    overallPassRate: number;
    coverageMet: boolean;
  };
}
```

#### Spawn Example

```typescript
const result = await spawnAgent(
  'test-execution-agent',
  {
    projectRoot: '/path/to/project',
    stage: '09-testing',
    data: {
      testTypes: ['unit', 'integration', 'e2e'],
      coverageThreshold: 80,
      runCount: 3,
    },
  },
  'foreground'
);
```

#### State Files
- `state/test_reports/test_report_{timestamp}.json` - Main report
- `state/test_reports/coverage_{timestamp}.html` - HTML coverage

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add test discovery logic
- [ ] Implement test execution
- [ ] Add coverage parsing
- [ ] Implement flaky test detection
- [ ] Integrate Playwright MCP
- [ ] Add `/test-run` command
- [ ] Test with various test frameworks

#### Testing Scenarios

**TC-1: All Tests Pass**
- Input: 100% passing tests, coverage 85%
- Expected: Success report, no issues

**TC-2: Test Failures**
- Input: 2 unit tests fail
- Expected: Failures listed with locations

**TC-3: Low Coverage**
- Input: Coverage 70% (below 80%)
- Expected: Coverage failure, files below threshold listed

**TC-4: Flaky Test Detection**
- Input: Test fails in run 2, passes in runs 1 and 3
- Expected: Flaky test detected, 67% success rate

**TC-5: E2E Test Failure**
- Input: E2E test timeout
- Expected: E2E failure reported with error details

#### Fallback Strategy
If agent fails:
1. Fallback to legacy test script (`npm run test`)
2. Run basic tests only (skip E2E)
3. Generate minimal report
4. Continue to Stage 10 (non-blocking)

---

### Tier 2 구현 순서

6. **qa-analysis-agent** (1-3주) - 보안/품질 가치 높음
7. **test-execution-agent** (4-6주) - QA와 자연스럽게 연결
8. **checkpoint-manager-agent** (7-9주) - 크로스 스테이지 유틸리티
9. **benchmark-analyzer-agent** (10-12주) - 장기 최적화, 이력 데이터 필요

**예상 기간**: 12주 (Agent 6, 9 병렬 가능)

---

## 🎨 Tier 3: Medium-Low Priority (Agents 10-14)

### 10. Requirements Validation Agent ⭐ (최고 ROI)

#### Priority
**MEDIUM-LOW** - 6-8% context savings, highest ROI in Tier 3

#### Role
Validate requirements against INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable) during the `/refine` workflow.

#### File Structure
```
template/.claude/agents/requirements-validation-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "requirements-validation-agent",
  "description": "Validates requirements against INVEST criteria and detects circular dependencies",
  "tools": [
    "Read",
    "Glob",
    "Grep"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

#### CLAUDE.md Structure

```markdown
# Requirements Validation Agent

## Your Role
You are the **Requirements Validation Agent** for claude-symphony, responsible for validating requirements against INVEST criteria.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- Custom data:
  - requirementsFiles: Array of requirement document paths
  - validateINVEST: boolean (default true)
  - checkDependencies: boolean (default true)

## Processing Steps

### Step 1: Load Requirements
1. Read all requirement files
2. Parse Epic/Feature/Task hierarchy
3. Extract metadata (estimates, dependencies, acceptance criteria)

### Step 2: INVEST Validation
For each requirement:
- **Independent**: Check for dependencies on other requirements
- **Negotiable**: Verify flexibility in implementation approach
- **Valuable**: Check for clear business value statement
- **Estimable**: Verify time estimates are present and reasonable
- **Small**: Check against thresholds (Feature ≤40h, Task ≤8h)
- **Testable**: Verify acceptance criteria are present and measurable

### Step 3: Dependency Analysis
1. Build dependency graph
2. Detect circular dependencies (topological sort)
3. Identify blocking chains

### Step 4: Size Threshold Check
- Epic: ≤80 hours
- Feature: ≤40 hours
- Task: ≤8 hours

### Step 5: Generate Report
Return validation summary with pass/fail status for each criterion.
```

#### Input/Output Schema

```typescript
interface RequirementsValidationInput {
  requirementsFiles: string[];
  validateINVEST: boolean;
  checkDependencies: boolean;
}

interface INVESTScore {
  independent: number;    // 0-1
  negotiable: number;     // 0-1
  valuable: number;       // 0-1
  estimable: number;      // 0-1
  small: number;          // 0-1
  testable: number;       // 0-1
  overall: number;        // 0-1 (average)
}

interface RequirementValidation {
  id: string;
  title: string;
  type: 'epic' | 'feature' | 'task';
  invest: INVESTScore;
  passed: boolean;
  issues: string[];
  recommendations: string[];
}

interface RequirementsValidationOutput {
  totalRequirements: number;
  passed: number;
  failed: number;
  avgINVESTScore: number;
  requirements: RequirementValidation[];
  circularDependencies: string[];
}
```

#### Spawn Example

```typescript
const result = await spawnAgent(
  'requirements-validation-agent',
  {
    projectRoot: '/path/to/project',
    data: {
      requirementsFiles: [
        'stages/01-brainstorm/outputs/requirements_analysis.md',
        'stages/03-planning/outputs/feature_breakdown.md'
      ],
      validateINVEST: true,
      checkDependencies: true,
    },
  },
  'foreground'
);
```

#### State Files
- `state/validations/requirements_validation_{timestamp}.json` - Validation report

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add INVEST criteria evaluation logic
- [ ] Implement dependency graph builder
- [ ] Add circular dependency detection
- [ ] Integrate with `/refine --validate`
- [ ] Add to Stage 03 workflow
- [ ] Test with sample requirements
- [ ] Document INVEST criteria

#### Testing Scenarios

**TC-1: Valid Requirements**
- Input: Well-defined requirements with clear INVEST compliance
- Expected: All pass, high scores

**TC-2: Missing Acceptance Criteria**
- Input: Requirements without testable criteria
- Expected: Testable score low, recommendations provided

**TC-3: Oversized Feature**
- Input: Feature estimated at 60 hours
- Expected: Small criterion fails, split recommendation

**TC-4: Circular Dependency**
- Input: Feature A depends on B, B depends on A
- Expected: Circular dependency detected, resolution suggested

**TC-5: Incomplete Estimates**
- Input: Requirements without time estimates
- Expected: Estimable criterion fails

#### Fallback Strategy
If agent fails:
1. Log warning
2. Run basic size checks only
3. Skip INVEST validation
4. Continue workflow (non-blocking)

---

### 11. Task Decomposition Agent

#### Priority
**MEDIUM-LOW** - 8-10% context savings in Stage 05

#### Role
Decompose epics and features into tasks, build dependency graph, apply MoSCoW prioritization, and perform sprint capacity planning.

#### File Structure
```
template/.claude/agents/task-decomposition-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "task-decomposition-agent",
  "description": "Decomposes epics/features into tasks with dependency analysis and sprint planning",
  "tools": [
    "Read",
    "Glob",
    "Grep"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

#### CLAUDE.md Structure

```markdown
# Task Decomposition Agent

## Your Role
You are the **Task Decomposition Agent** for claude-symphony, responsible for task decomposition, dependency analysis, and sprint planning.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- {{STAGE_ID}}: Current stage (should be "05-task-management")
- Custom data:
  - requirementFiles: Paths to requirements/features
  - sprintCapacity: hours per sprint (default 40)
  - teamSize: number of developers (default 1)

## Processing Steps

### Step 1: Load Requirements
1. Read feature breakdown and requirements
2. Parse Epic → Feature → Task hierarchy

### Step 2: Task Extraction
For each Feature:
1. Identify task-level work items
2. Generate task IDs (TASK-001, TASK-002)
3. Estimate hours (≤8 per task)

### Step 3: Dependency Analysis
1. Build task dependency graph
2. Identify blocking relationships
3. Calculate critical path

### Step 4: MoSCoW Prioritization
Classify each task:
- **Must**: Critical for MVP
- **Should**: Important but not blocking
- **Could**: Nice-to-have
- **Won't**: Deferred

### Step 5: Sprint Planning
1. Calculate sprint capacity (team_size × sprint_hours)
2. Allocate tasks to sprints
3. Balance load across sprints
4. Identify bottlenecks

### Step 6: Generate Output
Create tasks.json with full task list and sprint assignments.
```

#### Input/Output Schema

```typescript
interface TaskDecompositionInput {
  requirementFiles: string[];
  sprintCapacity: number;
  teamSize: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  estimate: number;
  dependencies: string[];
  moscow: 'must' | 'should' | 'could' | 'wont';
  sprint: number;
}

interface TaskDecompositionOutput {
  totalTasks: number;
  totalEstimate: number;
  tasks: Task[];
  dependencyGraph: {
    nodes: string[];
    edges: Array<{ from: string; to: string }>;
  };
  sprints: Array<{
    sprintNumber: number;
    capacity: number;
    allocated: number;
    tasks: string[];
  }>;
  criticalPath: string[];
}
```

#### Spawn Example

```typescript
const result = await spawnAgent(
  'task-decomposition-agent',
  {
    projectRoot: '/path/to/project',
    stage: '05-task-management',
    data: {
      requirementFiles: ['stages/03-planning/outputs/feature_breakdown.md'],
      sprintCapacity: 40,
      teamSize: 1,
    },
  },
  'foreground'
);
```

#### State Files
- `stages/05-task-management/outputs/tasks.json` - Main task list
- `state/task_decomposition/dependency_graph.mermaid` - Mermaid diagram

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add task extraction logic
- [ ] Implement dependency graph builder
- [ ] Add MoSCoW classification
- [ ] Implement sprint capacity planning
- [ ] Generate Mermaid dependency diagram
- [ ] Integrate with Stage 05
- [ ] Test with complex feature sets

#### Testing Scenarios

**TC-1: Simple Feature Set**
- Input: 10 tasks, no dependencies
- Expected: Tasks evenly distributed across sprints

**TC-2: Complex Dependencies**
- Input: 20 tasks with blocking chains
- Expected: Critical path identified, sprint order respects dependencies

**TC-3: Overloaded Sprint**
- Input: Too many Must tasks for single sprint
- Expected: Warning issued, sprint split recommended

**TC-4: Unbalanced Load**
- Input: Sprint 1 has 50h, Sprint 2 has 10h
- Expected: Tasks rebalanced

**TC-5: Empty Requirement File**
- Input: No tasks found
- Expected: Empty tasks.json, warning issued

#### Fallback Strategy
If agent fails:
1. Use legacy manual task list
2. Skip automated sprint planning
3. Generate basic task template
4. Continue to Stage 06

---

### 12. Moodboard Analysis Agent

#### Priority
**MEDIUM-LOW** - 6-8% context savings in Stage 04

#### Role
Extract design tokens (colors, typography, layout patterns) from moodboard images with WCAG contrast validation.

#### File Structure
```
template/.claude/agents/moodboard-analysis-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "moodboard-analysis-agent",
  "description": "Extracts design tokens from moodboard images with WCAG accessibility validation",
  "tools": [
    "Read",
    "Glob"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

#### CLAUDE.md Structure

```markdown
# Moodboard Analysis Agent

## Your Role
You are the **Moodboard Analysis Agent** for claude-symphony, responsible for extracting design tokens from moodboard images.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- {{STAGE_ID}}: Current stage (should be "04-ui-ux")
- Custom data:
  - moodboardDir: Path to moodboard images
  - extractColors: boolean (default true)
  - extractTypography: boolean (default true)
  - extractLayout: boolean (default true)

## Processing Steps

### Step 1: Load Moodboard Images
1. Use Glob to find all images in moodboardDir
2. Use Read tool (supports image reading) to load each image
3. Parse visual content

### Step 2: Color Extraction
For each image:
1. Identify 5-7 dominant colors
2. Extract RGB/HEX values
3. Calculate WCAG contrast ratios
4. Classify as primary/secondary/accent

### Step 3: Typography Analysis
For each image:
1. Detect font families (serif/sans-serif/monospace)
2. Extract font sizes (headings, body, captions)
3. Measure line heights and letter spacing
4. Identify weight variations

### Step 4: Layout Pattern Detection
For each image:
1. Detect grid systems (columns, gutters)
2. Extract spacing patterns (margins, padding)
3. Identify border radius patterns
4. Note shadow styles

### Step 5: WCAG Validation
For color combinations:
1. Check text-background contrast ratios
2. AA: 4.5:1 for normal text, 3:1 for large text
3. AAA: 7:1 for normal text, 4.5:1 for large text
4. Flag insufficient contrast

### Step 6: Generate Design Tokens
Create design_tokens.json with all extracted values.
```

#### Input/Output Schema

```typescript
interface MoodboardAnalysisInput {
  moodboardDir: string;
  extractColors: boolean;
  extractTypography: boolean;
  extractLayout: boolean;
}

interface ColorToken {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  role: 'primary' | 'secondary' | 'accent' | 'neutral';
  wcagAA: boolean;
  wcagAAA: boolean;
}

interface TypographyToken {
  scale: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: number;
}

interface LayoutToken {
  gridColumns: number;
  gutter: string;
  spacing: string[];
  borderRadius: string[];
  shadows: string[];
}

interface MoodboardAnalysisOutput {
  colors: ColorToken[];
  typography: TypographyToken[];
  layout: LayoutToken;
  warnings: string[];
}
```

#### Spawn Example

```typescript
const result = await spawnAgent(
  'moodboard-analysis-agent',
  {
    projectRoot: '/path/to/project',
    stage: '04-ui-ux',
    data: {
      moodboardDir: 'stages/04-ui-ux/inputs/moodboard/',
      extractColors: true,
      extractTypography: true,
      extractLayout: true,
    },
  },
  'foreground'
);
```

#### State Files
- `stages/04-ui-ux/outputs/design_tokens.json` - Main design tokens
- `state/moodboard/analysis_{timestamp}.json` - Analysis metadata

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add image reading logic (Read tool supports images)
- [ ] Implement color extraction algorithm
- [ ] Add WCAG contrast calculation
- [ ] Implement typography detection
- [ ] Add layout pattern recognition
- [ ] Integrate with `/moodboard analyze`
- [ ] Test with sample moodboards

#### Testing Scenarios

**TC-1: Color-Rich Moodboard**
- Input: Images with clear color palette
- Expected: 5-7 dominant colors extracted, WCAG validation performed

**TC-2: Typography-Focused Moodboard**
- Input: Images with text samples
- Expected: Font families, sizes, weights detected

**TC-3: Low Contrast Colors**
- Input: Colors with insufficient contrast
- Expected: WCAG warnings issued, alternative colors suggested

**TC-4: Mixed Design Systems**
- Input: Multiple images with different styles
- Expected: Consensus design tokens extracted, outliers noted

**TC-5: Empty Moodboard Directory**
- Input: No images found
- Expected: Empty design tokens, fallback to AI-generated defaults

#### Fallback Strategy
If agent fails:
1. Skip design token extraction
2. Use AI-generated design system
3. Continue to Stage 05

---

### 13. CI/CD Validation Agent

#### Priority
**MEDIUM-LOW** - 5-7% context savings in Stage 10

#### Role
Validate GitHub Actions YAML files, detect hardcoded secrets, verify workflow logic, and ensure environment separation.

#### File Structure
```
template/.claude/agents/cicd-validation-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "cicd-validation-agent",
  "description": "Validates CI/CD workflows, detects secrets, and ensures deployment best practices",
  "tools": [
    "Read",
    "Glob",
    "Grep",
    "Bash"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

#### CLAUDE.md Structure

```markdown
# CI/CD Validation Agent

## Your Role
You are the **CI/CD Validation Agent** for claude-symphony, responsible for validating deployment configurations.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- Custom data:
  - workflowsDir: Path to .github/workflows/
  - validateSecrets: boolean (default true)
  - checkEnvironmentSeparation: boolean (default true)

## Processing Steps

### Step 1: Load Workflow Files
1. Use Glob to find all .yml/.yaml files in workflowsDir
2. Use Read to load each workflow
3. Parse YAML structure

### Step 2: YAML Syntax Validation
For each workflow:
1. Use Bash with `yq` to validate YAML syntax
2. Check GitHub Actions schema compliance
3. Verify required fields (name, on, jobs)

### Step 3: Workflow Logic Validation
Check:
- Trigger validation (push, pull_request, workflow_dispatch)
- Job dependencies (needs: ...) form DAG (no cycles)
- Conditional logic (if: ...) syntax
- Infinite loop detection

### Step 4: Secret and Environment Validation
1. Find all secret references: `${{ secrets.SECRET_NAME }}`
2. Check for hardcoded secrets (API keys, tokens)
3. Verify environment separation (dev/staging/prod)
4. Ensure production has manual approval

### Step 5: Deployment Step Validation
Check best practices:
- Dependency installation
- Build command
- Test execution
- Artifact creation
- Cache usage (actions/cache)
- Timeout settings

### Step 6: Generate Report
Return validation summary with critical issues and warnings.
```

#### Input/Output Schema

```typescript
interface CICDValidationInput {
  workflowsDir: string;
  validateSecrets: boolean;
  checkEnvironmentSeparation: boolean;
}

interface WorkflowCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface WorkflowValidation {
  file: string;
  passed: boolean;
  checks: WorkflowCheck[];
  warnings: string[];
  errors: string[];
}

interface SecretAudit {
  total: number;
  byEnvironment: Record<string, string[]>;
  hardcoded: Array<{
    file: string;
    line: number;
    pattern: string;
  }>;
}

interface CICDValidationOutput {
  totalWorkflows: number;
  passed: number;
  failed: number;
  score: number;
  workflows: WorkflowValidation[];
  secrets: SecretAudit;
  recommendations: string[];
}
```

#### Spawn Example

```typescript
const result = await spawnAgent(
  'cicd-validation-agent',
  {
    projectRoot: '/path/to/project',
    data: {
      workflowsDir: '.github/workflows/',
      validateSecrets: true,
      checkEnvironmentSeparation: true,
    },
  },
  'foreground'
);
```

#### State Files
- `state/validations/cicd_validation_{timestamp}.json` - Validation report

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add YAML parsing logic (use yq)
- [ ] Implement secret detection patterns
- [ ] Add environment separation checker
- [ ] Implement cycle detection for job dependencies
- [ ] Integrate with `/deploy` validation
- [ ] Test with sample workflows
- [ ] Document security patterns

#### Testing Scenarios

**TC-1: Valid Workflow**
- Input: Well-formed CI workflow
- Expected: All checks pass, score 1.0

**TC-2: YAML Syntax Error**
- Input: Invalid YAML (missing colon)
- Expected: Parse error, validation fails

**TC-3: Hardcoded Secret**
- Input: Workflow with API key in plaintext
- Expected: Secret detected, critical error

**TC-4: Circular Job Dependency**
- Input: job-a needs job-b, job-b needs job-a
- Expected: Cycle detected, validation fails

**TC-5: Environment Collision**
- Input: Same secret name for dev and prod
- Expected: Warning about shared secrets

#### Fallback Strategy
If agent fails:
1. Run basic YAML syntax check only
2. Skip deep logic analysis
3. Recommend manual review
4. Continue to deployment (non-blocking)

---

### 14. Smart Rollback Agent

#### Priority
**MEDIUM-LOW** - 6-8% context savings during error recovery

#### Role
Analyze build/test/runtime errors and recommend intelligent rollback strategies by scoring checkpoints (recency 30%, stability 40%, relevance 30%).

#### File Structure
```
template/.claude/agents/smart-rollback-agent/
├── agent.json
├── CLAUDE.md
└── README.md
```

#### agent.json

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "smart-rollback-agent",
  "description": "Analyzes errors and suggests intelligent rollback strategies with checkpoint scoring",
  "tools": [
    "Read",
    "Glob",
    "Grep",
    "Bash"
  ],
  "model": "sonnet",
  "permissionMode": "plan",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

#### CLAUDE.md Structure

```markdown
# Smart Rollback Agent

## Your Role
You are the **Smart Rollback Agent** for claude-symphony, responsible for analyzing errors and recommending intelligent rollback strategies.

## Context Variables
- {{PROJECT_ROOT}}: Absolute path to project root
- Custom data:
  - errorLog: Path to error log or error message
  - errorType: "build" | "test" | "runtime" | "config" | "unknown"

## Processing Steps

### Step 1: Error Classification
Analyze error to determine type:
- **Build Error**: Compilation failures, dependency errors
- **Test Error**: Test failures, assertion errors
- **Runtime Error**: Crashes, null pointer exceptions
- **Config Error**: Invalid configuration, missing env vars

### Step 2: Load Available Checkpoints
1. Use Glob to find all checkpoints in `state/checkpoints/`
2. Read metadata (timestamp, stage, trigger, files changed)
3. Filter checkpoints before error occurrence

### Step 3: Checkpoint Scoring
Score each checkpoint:

**Recency Score (30%):**
```
recency = 1 - (age_hours / 168)  # 168 hours = 1 week
```

**Stability Score (40%):**
```
stability = successful_builds / total_builds_after_checkpoint

Heuristics:
- Stage completion: 0.9
- Pre-destructive: 0.7
- Auto task: 0.6
- Time-based: 0.5
```

**Relevance Score (30%):**
```
relevance = |files_in_error ∩ files_in_checkpoint| / |files_in_error|
```

**Overall Score:**
```
total = (recency × 0.3) + (stability × 0.4) + (relevance × 0.3)
```

### Step 4: Determine Rollback Scope
- **File-level**: Error in 1-3 files (risk: low)
- **Function-level**: Error in specific function (risk: very low)
- **Stage-level**: Multiple subsystems affected (risk: medium)
- **Full**: Critical system failure (risk: high)

### Step 5: Generate Recommendation
Return rollback recommendation with:
- Best checkpoint (highest score)
- Rollback scope (file/function/stage/full)
- Git command to execute
- Risk level and estimated work loss
- Alternative rollback options
```

#### Input/Output Schema

```typescript
interface SmartRollbackInput {
  errorLog?: string;
  errorMessage?: string;
  errorType: 'build' | 'test' | 'runtime' | 'config' | 'unknown';
}

interface ErrorAnalysis {
  type: string;
  classification: string;
  affectedFiles: string[];
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isBlocking: boolean;
}

interface CheckpointScore {
  recency: number;
  stability: number;
  relevance: number;
  overall: number;
}

interface CheckpointCandidate {
  id: string;
  timestamp: string;
  ageHours: number;
  scores: CheckpointScore;
  recommended: boolean;
  reason: string;
}

interface RollbackAction {
  action: 'file_rollback' | 'function_rollback' | 'stage_rollback' | 'full_rollback';
  scope: string;
  command: string;
  riskLevel: 'very_low' | 'low' | 'medium' | 'high';
  estimatedWorkLoss: string;
}

interface SmartRollbackOutput {
  errorAnalysis: ErrorAnalysis;
  checkpoints: CheckpointCandidate[];
  recommendation: RollbackAction & {
    alternatives: RollbackAction[];
  };
  preventionSuggestions: string[];
}
```

#### Spawn Example

```typescript
// Triggered by build failure
try {
  await runBuild(projectRoot);
} catch (error) {
  const result = await spawnAgent(
    'smart-rollback-agent',
    {
      projectRoot,
      data: {
        errorMessage: error.message,
        errorType: 'build',
      },
    },
    'foreground'
  );

  const recommendation = JSON.parse(result.result);
  console.log('Rollback command:', recommendation.recommendation.command);
}
```

#### State Files
- `state/rollback_analysis/rollback_{timestamp}.json` - Analysis report

#### Implementation Checklist
- [ ] Create agent directory
- [ ] Write agent.json
- [ ] Write CLAUDE.md
- [ ] Add error classification logic
- [ ] Implement checkpoint scoring algorithm
- [ ] Add file overlap calculation
- [ ] Generate git rollback commands
- [ ] Integrate with build/test failure hooks
- [ ] Add `/restore --smart` command
- [ ] Test with various error types

#### Testing Scenarios

**TC-1: TypeScript Build Error**
- Input: Type error in single file
- Expected: File-level rollback recommended

**TC-2: Test Failure After Refactoring**
- Input: Multiple test failures
- Expected: Stage-level rollback to pre-refactoring

**TC-3: Runtime Error (Unknown Cause)**
- Input: Generic runtime crash
- Expected: Full rollback to last known good state

**TC-4: Config Error (Missing Env Var)**
- Input: Deployment failure due to config
- Expected: Restore config files only

**TC-5: No Relevant Checkpoints**
- Input: Error in newly created files
- Expected: Recommend manual fix (no rollback)

#### Fallback Strategy
If agent fails:
1. List all checkpoints by recency
2. Recommend most recent stage completion
3. Default to manual investigation

---

### Tier 3 구현 순서 (ROI 기반)

10. **requirements-validation-agent** (1-2주) - 최고 ROI
11. **moodboard-analysis-agent** (3-4주) - 독립적, 시각적 임팩트
12. **task-decomposition-agent** (5-6주) - Agent 10 기반
13. **smart-rollback-agent** (7-8주) - 높은 가치, 낮은 빈도
14. **cicd-validation-agent** (9-10주) - 최종 스테이지, 낮은 빈도

**예상 기간**: 10주

---

## 🏗️ 구현 아키텍처

### Agent 파일 구조

```
template/.claude/agents/{agent-name}/
├── agent.json              # 에이전트 설정
├── CLAUDE.md              # 시스템 프롬프트
└── [optional] README.md   # 문서
```

### agent.json 표준 템플릿

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "agent-name",
  "description": "한 줄 설명 (100자 이내)",
  "tools": ["Read", "Glob", "Grep", "Bash"],
  "model": "sonnet",
  "permissionMode": "acceptEdits",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

### CLAUDE.md 구조

```markdown
# {Agent Name}

## Your Role
[에이전트의 책임 설명]

## Context Variables
- {{STAGE_ID}}: 스테이지 ID
- {{PROJECT_ROOT}}: 프로젝트 루트 경로
- [custom variables]: 에이전트별 추가 변수

## Processing Steps
### Step 1: ...
### Step 2: ...

## Output Format
[JSON/마크다운 출력 형식 정의]

## Extended Thinking
[extended thinking 활용 가이드]
```

### Agent 호출 방식

```typescript
import { spawnAgent } from '../core/agents/index.js';

const result = await spawnAgent(
  'validation-agent',
  {
    projectRoot: '/path/to/project',
    stage: '01-brainstorm',
    data: { validationRules: {...} },
  },
  'foreground'  // or 'background'
);
```

---

## 📊 예상 효과 종합

### 컨텍스트 절감 (프로젝트 전체 사이클)

| Tier | Agent 수 | 총 절감 | 주요 영향 |
|------|----------|---------|-----------|
| Tier 1 | 5개 | 50-69% | HANDOFF, 통합 (고빈도) |
| Tier 2 | 4개 | 31-38% | QA, 테스트, 체크포인트 (자동화) |
| Tier 3 | 5개 | 31-39% | 검증, 롤백, CI/CD (품질) |
| **총계** | **14개** | **112-146%** | **누적 절감** |

> **Note**: Context 분석/압축은 기존 auto-compact 기능 활용

### 품질 지표 개선

| 지표 | 개선률 | 관련 Agent |
|------|--------|-----------|
| 요구사항 명확성 | +25% | Agent 11 |
| 태스크 크기 정확도 | +30-35% | Agent 11, 12 |
| 디자인 일관성 | +40% | Agent 13 |
| 아키텍처 이슈 감지 | 95%+ | Agent 5 |
| 보안 취약점 감지 | 95%+ | Agent 7, 14 |
| 테스트 자동화 | 100% | Agent 10 |

### 자동화 수준

| 작업 | 수동 시간 | 자동화 후 | 절감률 |
|------|----------|----------|--------|
| HANDOFF 생성 | 5-10분 | 30초 | 90% |
| 출력 통합 | 10-15분 | 1분 | 93% |
| QA 분석 | 30분 | 5분 | 83% |
| 체크포인트 결정 | 5분 | 자동 | 100% |
| 테스트 실행 | 10분 | 2분 | 80% |
| 요구사항 검증 | 20분 | 3분 | 85% |
| 디자인 토큰 추출 | 1시간 | 10분 | 83% |

---

## 🔄 의존성 및 통합 포인트

### Agent 간 의존성

```
handoff-generator-agent (최우선)
  └─ 기존 auto-compact 기능 활용

output-synthesis-agent
  └─ refactoring-analysis-agent (패턴 재사용)

architecture-review-agent
  └─ validation-agent (검증 프레임워크)

requirements-validation-agent
  └─ task-decomposition-agent (검증된 요구사항 사용)
```

### 공유 인프라

모든 에이전트 공유:
- `src/core/agents/task-spawner.ts` - 에이전트 스폰
- `src/core/agents/registry.ts` - 에이전트 로딩
- `state/` - 상태 저장 (`validations/`, `context/`, `qa_analysis/` 등)
- 설정 파일 읽기 (`config/*.jsonc`)

### Fallback 전략

모든 에이전트는 실패 시 레거시 방식으로 fallback:
- HANDOFF Generator → 템플릿 기반 HANDOFF
- Output Synthesis → best_of_n 스코어링
- Validation → 파일 존재 체크만
- Context 관리 → 기존 auto-compact 기능

---

## 🎯 구현 우선순위 결정 기준

### 우선순위 스코어링 매트릭스

| Agent | 컨텍스트 절감 | 구현 복잡도 | 사용자 영향 | 빈도 | 품질 개선 | ROI 점수 |
|-------|--------------|------------|------------|------|-----------|----------|
| handoff-generator | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 22/25 |
| output-synthesis | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 19/25 |
| requirements-validation | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 23/25 |
| architecture-review | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 21/25 |

---

## 📅 구현 타임라인

### Phase 1: Foundation (3개월)

**Month 1: Tier 1 Critical**
- Week 1-3: handoff-generator-agent
- Week 2-4: output-synthesis-agent (병렬)

**Month 2: Tier 1 High**
- Week 5-7: architecture-review-agent
- Week 6-8: research-analysis-agent (병렬)

**Month 3: Tier 1 완료**
- Week 9-10: refactoring-analysis-agent

### Phase 2: Automation (3개월)

**Month 4-6: Tier 2**
- Week 13-15: qa-analysis-agent
- Week 16-18: test-execution-agent (병렬)
- Week 19-21: checkpoint-manager-agent
- Week 22-24: benchmark-analyzer-agent

### Phase 3: Enhancement (2.5개월)

**Month 7-8.5: Tier 3**
- Week 25-26: requirements-validation-agent
- Week 27-28: moodboard-analysis-agent (병렬)
- Week 29-30: task-decomposition-agent
- Week 31-32: smart-rollback-agent
- Week 33-34: cicd-validation-agent

**총 예상 기간**: 7.5개월 (병렬 구현 활용 시)

---

## 🔍 검증 및 테스트 전략

### Agent 테스트 레벨

1. **Unit Tests** (각 에이전트)
   - 코어 로직 검증 (패턴 매칭, 계산, 분류)
   - Mock 입력/출력
   - 엣지 케이스

2. **Integration Tests**
   - 에이전트 스폰 및 결과 수신
   - 상태 파일 읽기/쓰기
   - Fallback 시나리오

3. **End-to-End Tests**
   - 실제 프로젝트에서 전체 워크플로우
   - 스테이지 전환 포함
   - 성능 벤치마크

### 성공 기준

각 에이전트는 다음 기준 충족 시 완료:
- ✅ Unit 테스트 커버리지 ≥ 80%
- ✅ Integration 테스트 통과
- ✅ E2E 시나리오 3개 이상 검증
- ✅ Fallback 전략 테스트 완료
- ✅ 문서 작성 (CLAUDE.md, README.md)
- ✅ 예상 컨텍스트 절감 실측 (±10% 오차 이내)

---

## 📝 다음 단계

### Immediate Actions (Phase 4 진입 전)

1. **플랜 승인 받기** - 사용자 확인
2. **우선순위 최종 조정** - 프로젝트 상황에 맞게
3. **리소스 할당** - 개발 인력, 시간
4. **파일럿 Agent 선정** - handoff-generator 또는 requirements-validation (빠른 승리)

### Phase 1 착수 시 필요 사항

- [ ] Agent 개발 환경 설정
- [ ] 테스트 프레임워크 구축
- [ ] CI/CD 파이프라인에 Agent 테스트 추가
- [ ] 문서 템플릿 정리 (CLAUDE.md, README.md)
- [ ] 성능 벤치마크 기준선 측정

---

## 📚 참고 자료

### 핵심 파일 (구현 시 참조)

1. `/Users/youjungmin/Documents/vibespace/claude-symphony/template/.claude/agents/validation-agent/CLAUDE.md`
   - Agent 인스트럭션 패턴

2. `/Users/youjungmin/Documents/vibespace/claude-symphony/src/core/agents/task-spawner.ts`
   - Agent 스폰 메커니즘

3. `/Users/youjungmin/Documents/vibespace/claude-symphony/src/core/agents/registry.ts`
   - Agent 로딩 시스템

4. `/Users/youjungmin/Documents/vibespace/claude-symphony/template/config/*.jsonc`
   - 각 기능별 설정 규칙

### 설계 원칙

- **독립성**: 각 에이전트는 독립적으로 실행 가능
- **명확한 인터페이스**: 입력/출력 JSON 스키마 정의
- **Fallback 보장**: 에이전트 실패 시 레거시 방식으로 대체
- **상태 저장**: 모든 결과는 `state/` 디렉토리에 타임스탬프와 함께 저장
- **Extended Thinking**: 복잡한 분석/결정이 필요한 에이전트는 extended thinking 활성화

---

## ✅ 플랜 완료 체크리스트

- [x] 14개 에이전트 전체 식별 (Context Analyzer 제외)
- [x] 우선순위 3단계 분류 (Tier 1/2/3)
- [x] 각 에이전트 역할 및 트리거 정의
- [x] 예상 컨텍스트 절감 계산
- [x] 구현 단계 및 타임라인 수립
- [x] 의존성 및 통합 포인트 분석
- [x] 검증 전략 수립
- [x] Context Analyzer 제거 (auto-compact 사용)
- [ ] **사용자 승인 대기** ← 다음 단계

---

**End of Roadmap**

이 로드맵은 Phase 1 (Understanding), Phase 2 (Design), Phase 3 (Review), Phase 4 (Final Plan)를 거쳐 작성되었습니다. 3개의 Plan 에이전트(a8547f3, ab4fe67, a7f8271)의 분석 결과를 종합하였으며, validation-agent 패턴을 참조하여 실행 가능성을 검증하였습니다. 사용자 피드백을 반영하여 Context Analyzer Agent를 제거하고 기존 auto-compact 기능을 활용하는 것으로 최종 결정하였습니다.
