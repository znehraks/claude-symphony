# Claude-Symphony Scripts

Scripts organized by usage category.

## Directory Structure

| Directory | Category | Description |
|-----------|----------|-------------|
| `dev/` | Development | Framework build and maintenance |
| `test/` | Testing | Framework validation and CI/CD |
| `user/` | End-User | Project runtime and operations |

## Usage

### Development Scripts

Used by framework developers for build and maintenance tasks.

| Script | npm Command | Purpose |
|--------|-------------|---------|
| `build-schema.ts` | `npm run build:schema` | Generate JSON schemas from Zod |
| `migrate-yaml-to-jsonc.ts` | `npm run migrate:jsonc` | Migrate YAML configs to JSONC |

```bash
# Build JSON schemas (required for IDE support)
npm run build:schema

# Migrate configuration files
npm run migrate:jsonc
```

### Test Scripts

Used for framework validation and CI/CD pipelines.

| Script | npm Command | Purpose |
|--------|-------------|---------|
| `test-pipeline.ts` | `npm run test:pipeline` | Validate 8-stage pipeline structure |
| `test-mcp-fallback.ts` | `npm run test:mcp-fallback` | Test MCP server availability |
| `test-quota-management.ts` | `npm run test:quota` | Test MCP quota tracking |

```bash
# Validate pipeline structure
npm run test:pipeline

# Test MCP availability
npm run test:mcp-fallback

# Test quota tracking
npm run test:quota
```

### User Scripts

Used by end-users for project runtime and operations.

| Script | npm Command | Purpose |
|--------|-------------|---------|
| `validate-env.ts` | `npm run validate:env` | Validate environment and security |
| `rollback.ts` | `npm run rollback` | Checkpoint/Git/Deployment rollback |

```bash
# Validate environment
npm run validate:env

# List rollback points
npm run rollback -- --list

# Rollback to checkpoint
npm run rollback -- --checkpoint <id>
```

## Script Help

All scripts support `--help` flag for detailed usage:

```bash
npm run test:pipeline -- --help
npm run validate:env -- --help
npm run rollback -- --help
```
