# /qa

Start the 08-qa stage directly.

## Usage
```
/qa [focus-area]
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 08-qa |
| AI Model | ClaudeCode |
| Execution Mode | Plan Mode + Sandbox |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - 07-refactoring completion status
   - src/, tests/ exist

2. **Execute QA**
   - Code quality inspection
   - Security vulnerability scan
   - Performance analysis

3. **Output Generation**
   - qa-report.md - QA report
   - issues.json - Discovered issues

## Execution

```bash
scripts/run-stage.sh 08-qa "$ARGUMENTS"
```

## Input Files

- `stages/06-implementation/outputs/src/`
- `stages/07-refactoring/outputs/refactoring-report.md`

## Output Files

- `stages/08-qa/outputs/qa-report.md`
- `stages/08-qa/outputs/issues.json`
- `stages/08-qa/outputs/security-audit.md`

## QA Checklist

### Code Quality
- [ ] Lint rules passed
- [ ] Type check passed
- [ ] Code complexity inspection
- [ ] Test coverage verification

### Security
- [ ] Dependency vulnerability scan
- [ ] Hardcoded secrets inspection
- [ ] OWASP Top 10 review

### Performance
- [ ] Bundle size analysis
- [ ] Rendering performance
- [ ] Memory usage

## Related Commands

- `/run-stage 08` - Start after prerequisite check
- `/next` - Next stage (09-testing)
- `/refactor` - Previous stage
- `/test` - Start testing directly

## QA Tools

- ESLint/Prettier - Code style
- TypeScript - Type checking
- npm audit - Security scan
- Coverage - Test coverage
