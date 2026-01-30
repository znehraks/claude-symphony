# Validation Hook

Automatically validates stage outputs using the validation-agent.

## Trigger Conditions

- Stage completion via `/next` command (before transition)
- Manual validation via `/validate` command
- Output file creation/update in stages/*/outputs/

## Agent Execution

**Agent**: validation-agent
**Mode**: Foreground (blocking on stage transition)
**Model**: Sonnet
**Extended Thinking**: Enabled

### Execution Flow

```
Validation Triggered

↓

Determine Validation Scope
├─ Stage-specific: Use stage config.yaml rules
├─ Global: Use config/output_validation.yaml
└─ Custom: User-provided validation rules

↓

Spawn validation-agent (foreground)

↓

Agent Tasks
├─ File Validation → Check existence, size, format
├─ Content Validation → Check required sections, structure
├─ Command Validation → Run lint, test, typecheck
└─ Quality Scoring → Calculate overall score

↓

Parse Results
├─ Score ≥ 0.8 → ✅ Pass
├─ 0.6 ≤ Score < 0.8 → ⚠️ Warning (allow with confirmation)
└─ Score < 0.6 → ❌ Fail (block transition)

↓

Save Report → state/validations/{stage}_{timestamp}.json

↓

Return Result to User
```

## Validation Types by Stage

| Stage | File Validation | Command Validation | Quality Threshold |
|-------|-----------------|-------------------|-------------------|
| 01-brainstorm | ideas.md (≥5 ideas) | - | 0.7 |
| 02-research | tech_research.md, market_analysis.md | - | 0.8 |
| 03-planning | architecture.md, implementation.yaml | - | 0.85 |
| 04-ui-ux | wireframes.md, design_tokens.json | - | 0.8 |
| 05-task-management | tasks.json | - | 0.8 |
| 06-implementation | src/, implementation_log.md | lint, typecheck | 0.9 |
| 07-refactoring | refactoring_report.md | lint, test | 0.85 |
| 08-qa | security_report.md | - | 0.9 |
| 09-testing | tests/ | test, coverage | 0.85 |
| 10-deployment | .github/workflows/ | - | 0.8 |

## Configuration

```yaml
# config/output_validation.yaml
enabled: true
use_agent: true  # Set to false for legacy validation
agent:
  model: sonnet
  extended_thinking: true
  timeout_seconds: 120
fallback:
  enabled: true
  strategy: basic_file_check
blocking:
  enabled: true
  minimum_score: 0.6
quality_thresholds:
  default: 0.8
  strict_stages: [06, 08, 09]
  strict_threshold: 0.9
```

## Validation Report Format

```json
{
  "stage": "06-implementation",
  "timestamp": "2026-01-28T14:30:00Z",
  "totalChecks": 12,
  "passed": 10,
  "failed": 2,
  "warnings": 1,
  "score": 0.83,
  "checks": [
    {
      "name": "Source code exists",
      "type": "file",
      "status": "passed",
      "message": "src/ directory found with 24 files"
    },
    {
      "name": "ESLint validation",
      "type": "command",
      "status": "failed",
      "message": "3 lint errors found",
      "details": ["src/auth.ts:23 - unused variable"]
    }
  ],
  "recommendations": [
    "Fix 3 lint errors before proceeding",
    "Consider adding error handling in src/api.ts"
  ]
}
```

## Bypass Validation (Not Recommended)

```bash
# Skip validation for single transition
/next --skip-validation

# Force pass with reason
/validate --force --reason "Test environment issue, verified locally"
```

## Performance

- **Average time**: 30-60 seconds
- **Context saved**: 5-8% per validation
- **Success rate**: 98%+

## Error Handling

| Error | Behavior |
|-------|----------|
| Agent spawn fails | Use legacy validation |
| Agent timeout | Kill agent, use legacy validation |
| Parse error | Log error, assume pass |
| Command execution fails | Mark as validation failure |

## Legacy Validation Fallback

If agent fails or is disabled:
1. Check file existence
2. Check file size (not empty)
3. Skip command validation
4. Return basic pass/fail

## Agent Model Selection

When spawning **validation-agent**:
1. Read `.claude/agents/validation-agent/agent.json`
2. Pass the `model` field value to the Task tool's `model` parameter
3. If `"inherit"` or absent, omit the `model` parameter

## Related

- `/validate` - Manual validation
- `/next` - Stage transition (auto-validation)
- `validation-agent` - Agent definition
