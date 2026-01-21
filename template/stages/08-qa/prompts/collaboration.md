# AI Collaboration Prompt - QA

## Collaboration Mode: Comprehensive Review

This stage uses **comprehensive review** mode to ensure quality.

### Participating Models
- **ClaudeCode**: Code review, bug fixing, security inspection

### Collaboration Prompt

```
# Multi-faceted review
/collaborate --mode sequential --chain "claudecode:code_review -> claudecode:security_audit -> claudecode:fix"
```

### Review Areas

| Area | Review Items |
|------|-------------|
| Code Quality | Readability, maintainability, best practices |
| Security | OWASP Top 10, input validation, authentication/authorization |
| Performance | Response time, memory, re-renders |
| Functionality | Requirements compliance, edge cases |

### Security Inspection Checklist

- [ ] SQL Injection
- [ ] XSS (Cross-Site Scripting)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] Authentication/authorization bypass
- [ ] Sensitive information exposure
- [ ] Dependency vulnerabilities

```bash
# Dependency vulnerability scan
npm audit
```

### Bug Priority

| Level | Criteria | Action |
|-------|----------|--------|
| Critical | Security, data loss | Fix immediately |
| High | Major feature failure | Fix in this stage |
| Medium | Minor feature issue | Next sprint |
| Low | UI/UX improvement | Backlog |

### Output Format

```markdown
## QA Results

### Code Review
- [File]: [Issue] - [Severity]
...

### Security Inspection
- [Vulnerability]: [Location] - [Action]
...

### Bug Fixes
- [BUG-001]: [Description] - [Resolution]
...
```
