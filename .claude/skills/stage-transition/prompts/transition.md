# Stage Transition Prompt

Prompt templates used during stage transitions.

## Completion Detection Prompt

When user expresses completion:

```
Stage completion detected.

Current stage: {{CURRENT_STAGE}}
Status: {{STATUS}}

[Completion Criteria Validation]
{{VALIDATION_RESULTS}}

{{#if ALL_PASSED}}
✅ All criteria are met.

Next steps:
1. Would you like to generate HANDOFF.md? [Y/n]
2. Or transition directly with /next

{{else}}
⚠️ Some criteria are not met.

Required actions:
{{REQUIRED_ACTIONS}}

Force transition: /next --force (not recommended)
{{/if}}
```

## Transition Guidance Prompt

When transitioning to next stage:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Stage Transition Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{PREV_STAGE}} ✅ → {{NEXT_STAGE}} 🔄

[{{NEXT_STAGE}} Stage Information]
• AI Model: {{AI_MODEL}}
• Execution Mode: {{MODE}}
• Estimated Time: {{ESTIMATED_TIME}}

[Input Files]
{{INPUT_FILES}}

[Main Tasks]
{{MAIN_TASKS}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Start command: /{{SHORTCUT}} or /run-stage {{STAGE_NUM}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Stage-Specific Transition Messages

### 01 → 02 (brainstorm → research)

```
🧠 Brainstorming complete!

Ideas have been organized. Now entering research phase.

Next tasks:
• Technical research based on ideas.md
• Competitor analysis
• Gather latest info with MCP tools

Start: /research
```

### 05 → 06 (task-management → implementation)

```
📋 Task breakdown complete!

{{TASK_COUNT}} tasks planned across {{SPRINT_COUNT}} sprints.

⚠️ Important: 06-implementation is a checkpoint-required stage.
Run /checkpoint at major milestones.

Next tasks:
• Implement starting from Sprint 1 tasks
• Write unit tests alongside
• Checkpoint at each milestone

Start: /implement
```

### 09 → 10 (testing → deployment)

```
✅ Testing complete!

Test results:
• Unit tests: {{UNIT_PASS}}/{{UNIT_TOTAL}} passed
• E2E tests: {{E2E_PASS}}/{{E2E_TOTAL}} passed
• Coverage: {{COVERAGE}}%

🚀 Final stage!

Next tasks:
• CI/CD pipeline setup
• Environment-specific deployment config
• Monitoring setup

Start: /deploy
```

## Completion Celebration Prompt

```
🎉 Pipeline Complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: {{PROJECT_NAME}}
Total Duration: {{DURATION}}
Checkpoints: {{CHECKPOINT_COUNT}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Stage Summary]
01 ✅ brainstorm     - Idea development
02 ✅ research       - Technical research
03 ✅ planning       - PRD creation
04 ✅ ui-ux          - Design
05 ✅ task-mgmt      - Task breakdown
06 ✅ implementation - Implementation
07 ✅ refactoring    - Refactoring
08 ✅ qa             - Quality verification
09 ✅ testing        - Testing
10 ✅ deployment     - Deployment

[Documents]
• state/handoffs/ - All handoff documents
• state/checkpoints/ - Checkpoints

Great work! 🎊
```
