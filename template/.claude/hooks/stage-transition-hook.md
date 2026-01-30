# Stage Transition Hook

Automatically triggered when transitioning between stages (via `/next` command).

## Trigger Conditions

- User executes `/next` command
- Current stage completion criteria met
- HANDOFF.md generation requested

## Agents Triggered

### 1. handoff-generator-agent (ALWAYS)

**When**: Before every stage transition
**Purpose**: Generate smart HANDOFF.md with compressed context
**Context Impact**: None (runs in isolated context)

**Fallback**: Legacy bash script if agent fails

### 2. output-synthesis-agent (CONDITIONAL)

**When**: Current stage is parallel-capable (01, 03, 04, 07, 09)
**Purpose**: Synthesize multiple AI outputs before transition
**Context Impact**: None (runs in isolated context)

**Example**:
```
Stage 01 → Stage 02:
1. Spawn output-synthesis-agent → generate ideas.md
2. Spawn handoff-generator-agent → generate HANDOFF.md
3. Proceed to Stage 02
```

**Fallback**: Skip synthesis, use best output if agent fails

### 3. validation-agent (CONDITIONAL)

**When**: Stage has validation requirements (all stages except 01, 02)
**Purpose**: Validate outputs before allowing transition
**Context Impact**: None (runs in isolated context)

**Fallback**: Basic file check if agent fails

## Execution Flow

```
User: /next

↓

Check Stage Completion
├─ ✅ Complete → Proceed
└─ ❌ Incomplete → Block transition

↓

Trigger Agents (parallel where possible)
├─ validation-agent (if applicable)
├─ output-synthesis-agent (if applicable)
└─ handoff-generator-agent (always)

↓

Check Agent Results
├─ ✅ All pass → Allow transition
├─ ⚠️ Some fail → Use fallbacks → Allow transition
└─ ❌ Critical fail → Block transition

↓

Update state/progress.json

↓

Load Next Stage CLAUDE.md
```

## Configuration

```yaml
# config/hooks/stage_transition.yaml
enabled: true
agents:
  handoff_generator:
    enabled: true
    mode: foreground
    fallback: bash_script
  output_synthesis:
    enabled: true
    mode: foreground
    stages: [01, 03, 04, 07, 09]
    fallback: skip
  validation:
    enabled: true
    mode: foreground
    fallback: basic_check
```

## Error Handling

| Error | Behavior |
|-------|----------|
| Agent spawn fails | Use fallback strategy |
| Agent timeout | Kill agent, use fallback |
| Multiple failures | Log warning, allow transition |
| Critical validation fail | Block transition, show errors |

## Performance

- **Average time**: 30-60 seconds for all agents
- **Context saved**: 8-15% per transition
- **Success rate**: 95%+ with fallbacks

## Disable Hook (Not Recommended)

```bash
# Temporarily disable for single transition
/next --skip-hooks

# Disable permanently
/config hooks stage-transition disable
```

## Agent Model Selection

When spawning agents during stage transition, read each agent's `agent.json` and pass the `model` field:

| Agent | Config Path | Expected Model |
|-------|-------------|----------------|
| handoff-generator-agent | `.claude/agents/handoff-generator-agent/agent.json` | sonnet |
| output-synthesis-agent | `.claude/agents/output-synthesis-agent/agent.json` | sonnet |
| validation-agent | `.claude/agents/validation-agent/agent.json` | sonnet |

**Protocol**: For each agent spawn, read its `agent.json`, extract the `model` field, and pass it to the Task tool's `model` parameter. If `"inherit"` or absent, omit the `model` parameter.

## Related

- `/handoff` - Manual HANDOFF generation
- `/synthesize` - Manual synthesis
- `/validate` - Manual validation
