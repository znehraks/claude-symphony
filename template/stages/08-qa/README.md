# Stage 08: QA

Quality assurance and code review

## Overview

This stage performs comprehensive quality assurance including code review, security inspection, functional testing, and bug fixing.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | ClaudeCode | Code review, bug fixing |

**Mode**: Plan + Sandbox

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../07-refactoring/HANDOFF.md
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 08-qa

# Method 2: Direct script execution
../../scripts/run-stage.sh 08-qa
```

### 3. Manual Workflow

```bash
# Step 1: Code review
# Check coding standards, best practices

# Step 2: Security inspection (OWASP Top 10)

# Step 3: Functional testing

# Step 4: Bug fixing

# Step 5: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
08-qa/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── code_review.md  # Code review prompt
│   ├── security_audit.md  # Security audit prompt
│   └── bug_fix.md      # Bug fix prompt
├── templates/
├── inputs/             # Input files
├── outputs/
│   ├── qa_report.md
│   └── bug_fixes.md
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Git Commit Rules

> **CRITICAL**: Git commit required after every bug fix

```bash
# Per-task commit
git add <relevant-files>
git commit -m "fix(qa): <bug fix description>"
git status  # Verify clean state
```

## QA Checklist

### Code Review
- [ ] Coding standards compliance
- [ ] Best practices application
- [ ] Documentation level

### Security
- [ ] OWASP Top 10 check
- [ ] Input validation
- [ ] Authentication/authorization
- [ ] Sensitive information exposure

### Performance
- [ ] Response time
- [ ] Memory usage
- [ ] Unnecessary re-renders

## Completion Criteria

- [ ] Code review complete
- [ ] Security inspection passed
- [ ] Identified bugs fixed
- [ ] QA report written
- [ ] HANDOFF.md generated

## Outputs

| File | Description |
|------|-------------|
| `outputs/qa_report.md` | QA report |
| `outputs/bug_fixes.md` | Bug fix history |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 09-testing**: Test code writing and E2E testing

## Tips

1. **Be thorough**: Don't assume positive outcomes
2. **Edge cases**: Test boundary conditions
3. **Security first**: Prioritize security vulnerabilities
4. **Document bugs**: Track all discovered issues
