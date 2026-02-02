# How It Works

claude-symphony orchestrates a 10-stage development pipeline where AI agents execute each stage with quality gates, context handoffs, and a test-first workflow.

## The Pipeline

```
[01 Brainstorm] → [02 Research] → [03 Planning] → [04 UI/UX] → [05 Tasks]
                                                                     ↓
[10 Deployment] ← [09 Testing] ← [08 QA] ← [07 Refactoring] ← [06 Implementation]
```

Each stage is an isolated AI task with:
- **Instructions** (`stages/XX/CLAUDE.md`) — what to do
- **Inputs** — previous stage outputs + reference materials
- **Outputs** — deliverables validated by quality gates
- **HANDOFF** — curated context passed to the next stage

## Stage Execution Flow

```
For each stage:
  1. Load stage CLAUDE.md (instructions)
  2. Load previous HANDOFF.md (context)
  3. Load references/<stage>/ (user-provided materials)
  4. Apply stage persona (role, focus)
  5. Execute the stage work
  6. Validate outputs (quality gate)
  7. Generate HANDOFF.md for next stage
  8. Update progress state
  9. Create checkpoint (for code stages)
```

## Test-First Implementation (Stage 06)

The implementation stage guides a test-first workflow:

```
For EACH feature:
  1. Write tests first (unit + integration)
  2. Write implementation code
  3. Run tests → must pass
  4. If tests fail → fix, don't skip
  5. Move to next feature only after tests pass
```

### Quality Gate (4 Levels)

Stage 06 must pass all of these before completion:

| Level | Check | Required |
|-------|-------|----------|
| 1 | `npm run build` — project compiles | Yes |
| 2 | `npm test` — all tests pass | Yes |
| 3 | `npm run test:e2e` — E2E tests pass | If configured |
| 4 | `npm run lint` + `typecheck` | Recommended |

If any required check fails, the stage is retried automatically with the failure details injected into the retry prompt.

## Stage Personas

Each stage includes role-specific instructions:

| Stage | Persona | Focus |
|-------|---------|-------|
| 01 Brainstorm | Creative Explorer | Divergent thinking |
| 02 Research | Analytical Investigator | Evidence-based analysis |
| 03 Planning | Strategic Architect | System design |
| 04 UI/UX | Creative Designer | User experience |
| 05 Tasks | Systematic Organizer | Decomposition |
| 06 Implementation | Precise Builder | Test-first, correctness |
| 07 Refactoring | Code Surgeon | Quality improvement |
| 08 QA | Quality Guardian | Security, accessibility |
| 09 Testing | Methodical Tester | Edge cases, coverage |
| 10 Deployment | DevOps Engineer | CI/CD, production |

## HANDOFF System

HANDOFF.md files are the "memory" between stages. Each contains:

- What was accomplished
- Key decisions and rationale
- Files created/modified
- What the next stage needs to know
- Unresolved issues

This prevents context loss between stages and ensures each stage builds on the previous one's work.

## Retry & Recovery

If a stage fails validation:
1. Validation errors are collected
2. A retry prompt is built with the original instructions + error details
3. The stage is re-executed (up to 3 attempts)
4. If all retries fail, the pipeline pauses for manual intervention

Checkpoints allow rollback to any previous state:
```
/checkpoint     # Save current state
/restore [id]   # Rollback to a checkpoint
```

## Output Validation

Each stage has required outputs validated before progression:

- **File existence** — required files must exist
- **Content quality** — minimum size, required sections
- **Build commands** — lint, typecheck, test, build
- **Quality metrics** — coverage thresholds, pass rates

## Configuration

The pipeline is configured via JSONC files in `config/`:

| File | Purpose |
|------|---------|
| `pipeline.jsonc` | Stage definitions, quality gates |
| `stage_personas.jsonc` | AI persona per stage |
| `output_validation.jsonc` | Validation rules per stage |
| `handoff_intelligence.jsonc` | HANDOFF generation settings |
| `context.jsonc` | Context management settings |

All configurations have sensible defaults — zero config required to get started.
