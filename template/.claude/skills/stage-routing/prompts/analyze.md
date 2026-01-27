# Stage Routing Analysis Prompt

Analyze the current user request and determine the optimal pipeline stage.

## Analysis Context

- **Current Stage**: {{CURRENT_STAGE}}
- **User Request**: {{USER_PROMPT}}
- **Configuration**: Read from `config/stage_routing.jsonc`

## Analysis Steps

### Step 1: Extract Keywords

Scan the user prompt for keywords defined in `stage_routing.jsonc`:

```
Matched keywords by stage:
{{#each MATCHED_STAGES}}
- {{stage_id}}: [{{matched_keywords}}]
{{/each}}
```

### Step 2: Detect Intent

Based on keyword matches, classify the work type:

| Intent | Description |
|--------|-------------|
| `ideation` | Creative exploration, new ideas |
| `research` | Technical investigation, comparison |
| `planning` | Architecture design, system structure |
| `design` | UI/UX, wireframes, visual design |
| `task_breakdown` | Sprint planning, task decomposition |
| `implementation` | Feature development, coding |
| `refactoring` | Code improvement, optimization |
| `debugging` | Bug fixes, error resolution |
| `testing` | Test creation, coverage |
| `deployment` | CI/CD, release |

### Step 3: Calculate Confidence

```
keyword_score = matched_keywords.length / stage.keywords.length
trigger_score = matched_triggers.length / stage.triggers.length
confidence = (keyword_score * 0.6) + (trigger_score * 0.4)
```

### Step 4: Detect Scale

Check for large-scale change indicators:

- Architecture keywords: "아키텍처", "시스템", "전체", "마이크로서비스"
- Multi-module mentions
- Migration or redesign language

**If scale is LARGE** → Force recommendation: `03-planning`

### Step 5: Make Recommendation

**IMPORTANT: Do NOT expose internal analysis to users. Use simplified, friendly output.**

```
{{#if SHOULD_TRANSITION}}

{{#if IS_LARGE_SCALE}}
🔄 이 작업은 큰 변경이 필요해 보여요.
   {{RECOMMENDED_STAGE_NAME}} 스테이지에서 설계를 먼저 검토할까요?
   [Y] 이동  [N] 현재 스테이지 유지
{{else}}
🔄 {{RECOMMENDED_STAGE_NAME}} 스테이지로 이동해서 {{TASK_DESCRIPTION}}할까요?
   [Y] 이동  [N] 현재 스테이지 유지
{{/if}}

{{else}}

(No output - proceed with work in current stage)

{{/if}}
```

### Stage Name Mappings (for friendly output)

| Stage ID | Display Name | Task Description |
|----------|--------------|------------------|
| 01-brainstorm | 01 Brainstorm | 아이디어를 탐색 |
| 02-research | 02 Research | 조사를 진행 |
| 03-planning | 03 Planning | 설계를 검토 |
| 04-ui-ux | 04 UI/UX | 디자인을 수정 |
| 05-task-management | 05 Task | 작업을 분해 |
| 06-implementation | 06 Implementation | 기능을 구현 |
| 07-refactoring | 07 Refactoring | 코드를 개선 |
| 08-qa | 08 QA | 버그를 수정 |
| 09-testing | 09 Testing | 테스트를 작성 |
| 10-deployment | 10 Deployment | 배포를 진행 |

## Decision Matrix

| Current Stage | Request Type | Recommendation |
|---------------|--------------|----------------|
| Any | Bug fix | → 08-qa |
| Any | Test creation | → 09-testing |
| Any | Architecture change | → 03-planning |
| 06-impl | Small bug | Stay (fix inline) |
| 06-impl | Feature request | Stay |
| 08-qa | New feature | → 06-implementation |

## Scale-Based Routing

### Small Scale (Stay)
- Single file change
- No new dependencies
- No structural changes

### Medium Scale (Consider)
- 4-10 files affected
- Single module change
- 1-2 new dependencies

### Large Scale (Force Planning)
- 10+ files affected
- Architecture change
- Core dependency changes
- System-wide impact

## Output Variables

| Variable | Description |
|----------|-------------|
| `SHOULD_TRANSITION` | Boolean: recommend stage change |
| `RECOMMENDED_STAGE` | Target stage ID |
| `CONFIDENCE` | Match confidence (0-100%) |
| `DETECTED_INTENT` | Classified work type |
| `MATCHED_KEYWORDS` | Keywords that matched |
| `REASONING` | Explanation for recommendation |
