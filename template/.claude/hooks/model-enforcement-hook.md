# Model Enforcement Hook

Verifies that sub-agent spawns use the correct model as defined in their `agent.json`.

## Trigger Conditions

- Task tool invocation that spawns a known sub-agent
- Agent name detected in Task tool prompt or description

## Verification Flow

```
Task Tool Call Detected

↓

Extract Agent Name from prompt/description

↓

Read .claude/agents/{agent-name}/agent.json
├─ Extract "model" field
└─ If file not found → Skip verification

↓

Compare Expected vs Actual Model
├─ Match → ✅ Log success
├─ Mismatch (advisory agent) → ⚠️ Log warning
└─ Mismatch (strict agent) → ❌ Log error + alert

↓

Log Result → state/model_enforcement.log
```

## Enforcement Modes

### Advisory Mode (Default)

For most agents, model mismatches produce a **warning log** but do not block execution:

```
⚠️ [MODEL_MISMATCH] validation-agent: expected "sonnet", got "inherit"
   Action: Warning logged (advisory mode)
```

### Strict Mode

For cost-critical agents, model mismatches produce an **error log** and alert:

```
❌ [MODEL_MISMATCH] checkpoint-manager-agent: expected "haiku", got "sonnet"
   Action: Error logged (strict mode) — cost impact detected
```

## Strict Agents

The following agents are in strict enforcement mode:

| Agent | Required Model | Reason |
|-------|---------------|--------|
| checkpoint-manager-agent | haiku | Frequent background task, cost-critical |

## Known Agents

| Agent | Expected Model | Mode |
|-------|---------------|------|
| validation-agent | sonnet | advisory |
| output-synthesis-agent | sonnet | advisory |
| handoff-generator-agent | sonnet | advisory |
| benchmark-analyzer-agent | sonnet | advisory |
| checkpoint-manager-agent | haiku | **strict** |
| architecture-review-agent | sonnet | advisory |
| qa-analysis-agent | sonnet | advisory |
| requirements-validation-agent | sonnet | advisory |
| research-analysis-agent | sonnet | advisory |
| task-decomposition-agent | sonnet | advisory |
| refactoring-analysis-agent | sonnet | advisory |
| test-execution-agent | sonnet | advisory |
| smart-rollback-agent | sonnet | advisory |
| cicd-validation-agent | sonnet | advisory |
| moodboard-analysis-agent | sonnet | advisory |

## Log Format

```
[2026-01-28T14:30:00Z] [MODEL_OK] validation-agent: model=sonnet ✅
[2026-01-28T14:30:05Z] [MODEL_MISMATCH] checkpoint-manager-agent: expected=haiku, actual=sonnet ❌ (strict)
[2026-01-28T14:31:00Z] [MODEL_SKIP] unknown-agent: no agent.json found, skipping
```

## Log Location

- `state/model_enforcement.log`

## Configuration

See `config/model_enforcement.yaml` for enforcement settings.

## Error Handling

| Error | Behavior |
|-------|----------|
| agent.json not found | Skip verification, log info |
| agent.json parse error | Skip verification, log warning |
| Log file write error | Continue execution silently |

## Related

- Sub-Agent Model Enforcement Policy (CLAUDE.md)
- `config/model_enforcement.yaml` - Enforcement configuration
- `.claude/agents/*/agent.json` - Agent definitions
