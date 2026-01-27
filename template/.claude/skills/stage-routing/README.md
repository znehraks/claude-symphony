# Stage Routing Skill

Automatically analyze user prompts and recommend appropriate pipeline stages.

## Overview

This skill detects keywords and patterns in user requests to determine if a different stage would be more appropriate for the requested work.

## Auto-Trigger Conditions

The skill activates when user prompts contain:

1. **Work type indicators**
   - Feature requests → 06-implementation
   - Bug reports → 08-qa
   - Test requests → 09-testing
   - Design changes → 04-ui-ux

2. **Action keywords**
   - "구현해", "만들어" → Implementation
   - "버그", "오류", "수정" → QA/Debugging
   - "테스트", "검증" → Testing
   - "설계", "아키텍처" → Planning

3. **Scale indicators**
   - Architecture-level changes → 03-planning
   - Multi-module changes → Consider planning first

## Configuration

Located at: `config/stage_routing.jsonc`

### Key Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `confidence_threshold` | 0.6 | Minimum confidence for recommendation |
| `auto_transition` | false | Auto-transition without confirmation |
| `require_user_confirmation` | true | Always ask before transitioning |
| `min_keyword_matches` | 2 | Minimum keyword matches required |

## Detection Logic

### 1. Keyword Matching

Each stage has defined keywords that indicate relevance:

```
06-implementation: ["구현", "개발", "코드", "기능", "만들어"]
08-qa: ["버그", "오류", "수정", "fix", "에러"]
09-testing: ["테스트", "coverage", "검증"]
```

### 2. Confidence Calculation

```
confidence = (matched_keywords + trigger_matches) / total_indicators
```

### 3. Scale Detection

| Scale | Criteria | Action |
|-------|----------|--------|
| Small | ≤3 files | Stay in current stage |
| Medium | 4-10 files | Consider related stage |
| Large | >10 files or architecture keywords | Recommend 03-planning |

## Output Format (Simplified)

**Important**: Internal logic (keywords, confidence scores, intents) is NOT shown to users.
Only display a simple, friendly question.

### When a different stage is recommended:

```
🔄 08 QA 스테이지로 이동해서 버그를 수정할까요?
   [Y] 이동  [N] 현재 스테이지 유지
```

### For large-scale changes:

```
🔄 이 작업은 큰 변경이 필요해 보여요.
   03 Planning 스테이지에서 설계를 먼저 검토할까요?
   [Y] 이동  [N] 현재 스테이지 유지
```

### When current stage is appropriate:

No output - work continues silently.

## Skill Files

```
stage-routing/
├── README.md              # This file
└── prompts/
    └── analyze.md         # Analysis prompt template
```

## Usage Scenarios

### Scenario 1: Bug Found During Implementation

```
Current: 06-implementation
User: "이 코드에서 버그가 발생해. 수정해줘"

AI Output:
🔄 08 QA 스테이지로 이동해서 버그를 수정할까요?
   [Y] 이동  [N] 현재 스테이지 유지
```

### Scenario 2: Stay in Current Stage

```
Current: 06-implementation
User: "버튼 컴포넌트 구현해줘"

→ No stage change suggestion, work proceeds directly
```

### Scenario 3: Large-Scale Change Detected

```
Current: 06-implementation
User: "전체 아키텍처를 마이크로서비스로 변경하고 싶어"

AI Output:
🔄 이 작업은 큰 변경이 필요해 보여요.
   03 Planning 스테이지에서 설계를 먼저 검토할까요?
   [Y] 이동  [N] 현재 스테이지 유지
```

### Scenario 4: Design Change Request

```
Current: 06-implementation
User: "이 부분 디자인을 다시해볼래?"

AI Output:
🔄 04 UI/UX 스테이지로 되돌아가서 다시 진행할까요?
   [Y] 이동  [N] 현재 스테이지 유지
```

## Integration Points

- **HANDOFF.md**: Loop-back transitions are recorded
- **progress.json**: Stage changes update progress state
- **loopback_history.json**: Full transition history maintained

## Related Commands

- `/goto <stage>` - Execute stage transition
- `/goto --list` - View available stages
- `/goto --history` - View transition history
- `/status` - Check current stage

## Related Skills

- `stage-transition` - Handles forward progression
- `smart-handoff` - Generates HANDOFF.md on transition
