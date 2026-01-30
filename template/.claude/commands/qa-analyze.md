# /qa-analyze

Perform automated security scans and code quality analysis using the qa-analysis-agent.

## Usage
```
/qa-analyze [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--scan-types <types>` | Comma-separated: security,quality,bugs (default: all) |
| `--severity <level>` | Minimum severity to report: critical,high,medium,low |
| `--fix` | Include auto-fix suggestions |
| `--codebase <path>` | Path to source code (default: from config) |

## How It Works

1. **Spawn qa-analysis-agent** - Agent runs in isolated context
2. **Security Scan** - OWASP Top 10 patterns, npm audit, secret detection
3. **Quality Analysis** - Lint, complexity, code smells
4. **Bug Classification** - Categorize by severity with fix suggestions
5. **Generate Report** - Save to `state/qa_analysis/`

## Security Patterns Detected

- SQL injection
- XSS vulnerabilities
- Hardcoded secrets (API keys, passwords)
- Authentication/authorization issues
- Command injection
- Path traversal

## Quality Metrics

- ESLint/TSC errors
- Cyclomatic complexity
- Code smells (long functions, deep nesting)
- Naming convention violations

## Example

```
/qa-analyze

Running security scan...
✓ npm audit: 2 vulnerabilities (1 high, 1 medium)
✓ Secret detection: 1 hardcoded API key found
✓ OWASP patterns: No SQL injection detected

Running quality analysis...
✓ Lint: 12 errors
✓ Complexity: 3 functions exceed threshold

Bug classification:
- 1 Critical: Hardcoded API key in config.ts:23
- 1 High: npm dependency vulnerability (axios 0.21.0)
- 3 Medium: Lint errors

Report: state/qa_analysis/qa_report_20260128_143000.json
```

## Integration

Automatically runs as part of Stage 08 (QA) workflow.

## Agent Model Selection

When spawning **qa-analysis-agent**:
1. Read `.claude/agents/qa-analysis-agent/agent.json`
2. Pass the `model` field value to the Task tool's `model` parameter
3. If `"inherit"` or absent, omit the `model` parameter

## Fallback

If agent fails, runs basic npm audit only.
