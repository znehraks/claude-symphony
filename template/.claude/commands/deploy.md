# /deploy

Start the 10-deployment stage directly.

## Usage
```
/deploy [environment]
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 10-deployment |
| AI Model | ClaudeCode |
| Execution Mode | Headless |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - 09-testing completion status
   - test-results.md exists
   - All tests passed

2. **Execute Deployment**
   - CI/CD pipeline setup
   - Environment-specific deployment
   - Monitoring setup

3. **Output Generation**
   - CI/CD configuration files
   - deployment-log.md

## Execution

```bash
scripts/run-stage.sh 10-deployment "$ARGUMENTS"
```

## Input Files

- `stages/09-testing/outputs/test-results.md`
- `stages/06-implementation/outputs/src/`
- All previous stage outputs

## Output Files

- `.github/workflows/ci.yaml`
- `.github/workflows/cd.yaml`
- `stages/10-deployment/outputs/deployment-log.md`

## Deployment Environments

| Environment | Description |
|-------------|-------------|
| dev | Development environment |
| staging | Staging |
| prod | Production |

## CI/CD Workflow

```
Push
  ↓
CI (Build + Test)
  ↓
Quality Gate
  ↓
CD (Deploy)
  ↓
Health Check
```

## Related Commands

- `/run-stage 10` - Start after prerequisite check
- `/test` - Previous stage
- `/status` - Pipeline status

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Secrets configured (GitHub Secrets)
- [ ] Domain/DNS configured
- [ ] SSL certificate
- [ ] Monitoring configured
- [ ] Rollback plan

## On Completion

🎉 **Pipeline Complete!**

All 10 stages completed.
- Check final status with `/status`
- Review all documents in `state/handoffs/`

## Tips

- Verify in staging before prod deployment
- Prepare rollback script
- Run smoke tests after deployment
