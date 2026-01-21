# /validate - Output Validation Command

Validate the outputs of the current stage.

## Usage

```bash
/validate [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--stage` | Stage ID to validate | Current stage |
| `--verbose` | Detailed output | false |
| `--fix` | Auto-fix suggestions | false |
| `--skip-commands` | Skip command validation | false |
| `--force` | Pass even on failure | false |

## Validation Items

### 1. Required File Existence
```bash
/validate
# → ideas.md ✅, requirements_analysis.md ❌ (missing)
```

### 2. File Content Validation
```bash
/validate --verbose
# → ideas.md: 8 ideas (minimum 5) ✅
# → Required sections: Functional Requirements ✅, Non-Functional Requirements ❌
```

### 3. Command Validation
```bash
/validate
# → npm run lint ✅
# → npm run typecheck ✅
# → npm run test ❌ (3 failures)
```

### 4. Quality Score
```bash
/validate
# → Overall score: 0.85/1.0
```

## Output Format

### Simple Output
```
✅ Validation passed: 06-implementation (score: 0.95)
```

### On Failure
```
❌ Validation failed: 06-implementation

Failed items:
1. Test failures (3)
2. Coverage below target (75% < 80%)

Fixes needed:
- [ ] Fix tests/auth.test.ts:45
- [ ] Improve test coverage by 5%
```

### Verbose Output (--verbose)
```markdown
# Output Validation Report

## Stage: 06-implementation
## Status: ⚠️ Partial Pass
## Score: 0.85

### File Validation
| File | Status | Details |
|------|--------|---------|
| source_code/ | ✅ | Directory exists |
| implementation_log.md | ✅ | Required format met |

### Command Validation
| Command | Result | Time |
|---------|--------|------|
| lint | ✅ | 2.3s |
| typecheck | ✅ | 4.1s |
| test | ❌ | 15.2s |

### Quality Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Lint | 0.95 | 0.90 | ✅ |
| Coverage | 0.75 | 0.80 | ❌ |
```

## Auto-Fix Suggestions

```bash
/validate --fix
```

```markdown
## Auto-Fix Suggestions

### 1. Add Missing Section
**File**: requirements_analysis.md
**Suggestion**: Add "Non-Functional Requirements" section

### 2. Fix Test
**File**: tests/auth.test.ts:45
**Cause**: Return type mismatch
**Fix**:
```typescript
expect(result).toHaveProperty('token');
// Change to →
expect(result.data).toHaveProperty('token');
```

Apply auto-fixes? (y/n)
```

## Force Pass

```bash
/validate --force
```

```
⚠️ There are failed validation items.
Force pass anyway?

Enter reason:
> Temporary failure due to test environment issue, verified locally

✅ Force passed (reason recorded)
```

## Examples

```bash
# Validate current stage
/validate

# Validate specific stage with details
/validate --stage 06 --verbose

# Include auto-fix suggestions
/validate --fix

# Quick validation (skip commands)
/validate --skip-commands
```

## Validation Results Storage

- Results: `state/validations/{stage}_{timestamp}.json`
- Report: `state/validations/{stage}_{timestamp}.md`

## Configuration

See `config/output_validation.yaml`

## Auto-Run on Stage Transition

Validation runs automatically when executing `/next` command.
Stage transition is blocked if validation fails.

## Related Commands

- `/next` - Next stage transition
- `/status` - Pipeline status
- `/stages` - Stage list
