# Output Validation Prompt - QA

## Validation Targets

| Output | Required Condition | Validation Method |
|--------|-------------------|-------------------|
| `qa_report.md` | Review results included | Structure verification |
| `bug_fixes.md` | Fix history | Item verification |
| Source code | Security inspection passed | Auto scan |
| `HANDOFF.md` | Items needing testing | Item verification |

## Validation Command

```bash
/validate --stage 08-qa
```

## Quality Criteria

### qa_report.md
- [ ] Code review results
- [ ] Security inspection results
- [ ] Performance review results
- [ ] Discovered bugs list
- [ ] Recommendations

### bug_fixes.md
- [ ] Fixed bugs list
- [ ] Root cause analysis for each bug
- [ ] Resolution method
- [ ] Regression prevention measures

### Source Code
- [ ] 0 Critical bugs
- [ ] 0 High bugs
- [ ] Security vulnerabilities resolved

### HANDOFF.md
- [ ] Areas needing testing
- [ ] Remaining Medium/Low issues
- [ ] Next step recommendations

## Auto Validation Script

```bash
# Security vulnerability scan
npm audit --audit-level=high

# Lint check
npm run lint

# Type check
npm run typecheck

# Run tests
npm run test
```

## Security Metrics

| Metric | Criteria | Actual |
|--------|----------|--------|
| Critical vulnerabilities | 0 | - |
| High vulnerabilities | 0 | - |
| Medium vulnerabilities | < 5 | - |

## Actions on Failure

1. Security vulnerability → Fix immediately and re-verify
2. Test failure → Fix bug and re-run
3. Lint error → Fix code
