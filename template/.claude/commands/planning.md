# /planning

Start the 03-planning stage directly.

## Usage
```
/planning
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 03-planning |
| AI Model | Gemini |
| Execution Mode | Plan Mode |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - 02-research completion status
   - research.md, tech-stack.md exist

2. **Execute Planning**
   - PRD (Product Requirements Document) writing
   - Architecture design
   - Technical specification

3. **Output Generation**
   - PRD.md - Product Requirements Document
   - architecture.md - Architecture design

## Execution

```bash
scripts/run-stage.sh 03-planning "$ARGUMENTS"
```

## Input Files

- `stages/02-research/outputs/research.md`
- `stages/02-research/outputs/tech-stack.md`

## Output Files

- `stages/03-planning/outputs/PRD.md`
- `stages/03-planning/outputs/architecture.md`

## Related Commands

- `/run-stage 03` - Start after prerequisite check
- `/next` - Next stage (04-ui-ux)
- `/research` - Previous stage
- `/gemini` - Direct Gemini CLI call

## PRD Structure

```markdown
# PRD: [Project Name]

## Overview
## Goals
## Functional Requirements
## Non-Functional Requirements
## Tech Stack
## Timeline
## Risk Factors
```
