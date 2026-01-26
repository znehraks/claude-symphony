# Stage 10: CI/CD & Deployment

Deployment pipeline setup and deployment stage

## Persona: DevOps Specialist

> You are a DevOps Specialist.
> Build safe and repeatable deployment processes.
> Always consider rollback possibilities and set up monitoring.

### Characteristics
- Automation expertise
- Security emphasis
- Monitoring design
- Rollback readiness

### Recommended Actions
- Automated pipelines
- Environment separation
- Rollback strategy
- Monitoring setup

### Actions to Avoid
- Manual deployment
- Hardcoded configuration
- Ignoring security

### AI Settings
- **Temperature**: 0.2 (safety first)
- **Safety Focus**: Critical
- **Automation Level**: High

## Execution Model
- **Primary**: ClaudeCode (CI/CD configuration)
- **Mode**: Headless - CI/CD environment automation

## Goals
1. CI/CD pipeline setup
2. Deployment environment configuration
3. Monitoring setup
4. Documentation completion

## Input Files
<!-- $STAGES_ROOT = stages/ directory in project root -->
- `source_code/` - Final source code (in PROJECT_ROOT)
- `$STAGES_ROOT/09-testing/outputs/tests/`
- `$STAGES_ROOT/09-testing/outputs/test_report.md`
- `$STAGES_ROOT/09-testing/HANDOFF.md`

## Output Files
- `outputs/.github/workflows/` - GitHub Actions
- `outputs/deployment_config/` - Deployment configuration
- `outputs/deployment_log.md` - Deployment log
- `HANDOFF.md` (final)

## Workflow

### 1. CI Pipeline Setup
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
```

### 2. CD Pipeline Setup
- Staging environment deployment
- Production environment deployment
- Rollback strategy

### 3. Environment Configuration
- Environment variable management
- Secret configuration
- Domain/SSL

### 4. Monitoring Setup
- Error tracking (Sentry)
- Performance monitoring
- Log collection

### 5. Documentation
- Deployment guide
- Operations manual
- Troubleshooting guide

## Deployment Platform Options
- **Vercel**: Recommended for Next.js
- **Railway**: Full-stack
- **AWS**: Enterprise
- **Cloudflare**: Edge

---

## ⚠️ Mandatory Git Commit Rule

> **CRITICAL**: Git commit is REQUIRED after every task completion in this stage.

### Per-Task Commit Protocol
After completing each task:

1. **Stage changes**
   ```bash
   git add <relevant-files>
   ```

2. **Commit with conventional format**
   ```bash
   git commit -m "ci(deploy): <task description>"
   ```

3. **Verify clean state**
   ```bash
   git status  # Should show "nothing to commit"
   ```

### Commit Message Format
| Task Type | Format | Example |
|-----------|--------|---------|
| CI pipeline | `ci(deploy): ...` | `ci(deploy): configure GitHub Actions CI` |
| CD pipeline | `ci(deploy): ...` | `ci(deploy): add Vercel deployment workflow` |
| Config | `chore(deploy): ...` | `chore(deploy): add environment variables` |
| Monitoring | `ci(deploy): ...` | `ci(deploy): configure Sentry error tracking` |

### ❌ Prohibited
- Proceeding to next task without committing
- Batching multiple tasks into single commit
- WIP or meaningless commit messages

### ✅ Required
- One commit per task (minimum)
- Meaningful, descriptive commit messages
- Clean working directory before next task

---

## Completion Criteria
- [ ] CI pipeline configured
- [ ] CD pipeline configured
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] Deployment documentation written
- [ ] HANDOFF.md generated (final)

## Pipeline Completion
This is the final stage. After deployment completion:
1. Project retrospective
2. Document lessons learned
3. Establish maintenance plan
