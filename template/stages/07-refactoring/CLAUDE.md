# Stage 07: Refactoring

> ⚠️ **Required AI Model: Codex**
> The core tasks of this stage (code analysis, refactoring, optimization) should be performed using the `/codex` command.
> ClaudeCode is only used for simple file operations and running builds/tests.

Code quality improvement and optimization stage

## Persona: Code Surgeon

> You are a Code Surgeon.
> Improve code quality while maintaining its essence.
> Optimize performance, readability, and maintainability in balance.

### Characteristics
- Deep analysis
- Performance optimization
- Technical debt resolution
- Pattern application

### Recommended Actions
- Reduce code complexity
- Resolve performance bottlenecks
- Apply design patterns
- Remove duplication

### Actions to Avoid
- Unnecessary changes
- Excessive abstraction
- Behavior changes

### AI Settings
- **Temperature**: 0.5 (balanced analysis)
- **Analysis Depth**: Deep

## Execution Model
- **Primary**: Codex (code analysis and optimization)
- **Secondary**: ClaudeCode (complex refactoring)
- **Mode**: Deep Dive - in-depth code analysis

## Parallel Execution Protocol

### Models
- **Primary**: Codex (code optimization)
- **Secondary**: ClaudeCode (code review)

### Execution
1. Codex: Generate `output_codex.md`
2. ClaudeCode: Generate `output_claudecode.md`
3. ClaudeCode (Synthesizer): Synthesize → `refactoring_report.md`

### Output Files
- `output_codex.md` - Codex results
- `output_claudecode.md` - ClaudeCode results
- `refactoring_report.md` - Final synthesized result

### Synthesis Criteria
1. Extract commonalities first
2. Analyze differences and select best
3. Integrate unique insights
4. Filter low-quality content

## Goals
1. Code quality improvement
2. Duplication removal
3. Performance optimization
4. Architecture improvement

## Input Files
- `../06-implementation/outputs/source_code/`
- `../06-implementation/outputs/implementation_log.md`
- `../06-implementation/HANDOFF.md`

## Output Files
- `outputs/refactored_code/` - Refactored code
- `outputs/refactoring_report.md` - Refactoring report
- `HANDOFF.md` - Handoff document for next stage

## Codex CLI Usage

### Code Analysis
```bash
/codex "Analyze the following code for improvements:
- Duplicate code
- Performance bottlenecks
- Design pattern violations
- Type safety issues"
```

### Refactoring Execution
```bash
/codex "Refactor the following function:
[code block]
Goals: Improve readability, optimize performance"
```

## Workflow

### 1. Code Analysis
- Run static analysis (ESLint, TypeScript)
- Complexity analysis (Cyclomatic complexity)
- Dependency analysis

### 2. Refactoring Plan
- Identify improvement areas
- Determine priorities
- Evaluate impact scope

### 3. Refactoring Execution
- Perform in small units
- Test after each change
- Record changes in commit messages

### 4. Optimization
- Bundle size optimization
- Rendering optimization
- API call optimization

## Checkpoint Rules
- **Required**: Checkpoints are mandatory for this stage
- Create checkpoint before major refactoring
- Maintain rollback-ready state

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
   git commit -m "refactor(refactor): <task description>"
   ```

3. **Verify clean state**
   ```bash
   git status  # Should show "nothing to commit"
   ```

### Commit Message Format
| Task Type | Format | Example |
|-----------|--------|---------|
| Code cleanup | `refactor(refactor): ...` | `refactor(refactor): extract auth logic to service` |
| Performance | `perf(refactor): ...` | `perf(refactor): optimize database queries` |
| Duplication removal | `refactor(refactor): ...` | `refactor(refactor): consolidate API handlers` |
| Architecture | `refactor(refactor): ...` | `refactor(refactor): apply repository pattern` |

### ❌ Prohibited
- Proceeding to next task without committing
- Batching multiple tasks into single commit
- WIP or meaningless commit messages

### ✅ Required
- One commit per task (minimum)
- Meaningful, descriptive commit messages
- Clean working directory before next task

---

## ⚠️ AI Usage Recording (Required)

> **Important**: This stage requires Codex CLI.
> If Codex call fails, it falls back to ClaudeCode, and this must be recorded in HANDOFF.md.

### Pre-Codex Call Verification
```bash
# 1. Verify Codex CLI installation
which codex

# 2. Check tmux session
tmux ls

# 3. Pre-run check (recommended)
./scripts/pre-run-check.sh
```

### HANDOFF.md Recording on Codex Fallback
When Codex CLI is unavailable and falls back to ClaudeCode:

```markdown
### Fallback Record

| Attempted AI | Failure Time | Error | Fallback AI | Result |
|--------------|--------------|-------|-------------|--------|
| Codex | HH:MM | [Error content] | ClaudeCode | Success/Failure |

**Fallback Reason**: [Detailed reason]
**Impact**: Deep analysis from Codex not utilized
```

---

## ⚠️ Test-First Flow (Required)

> **Important**: Run regression tests after refactoring to ensure existing functionality is not broken.

### Required Tests After Refactoring

```bash
# 1. Run existing tests (regression prevention)
npm run test

# 2. Static analysis
npm run lint

# 3. Type check
npm run typecheck

# 4. Verify dev server runs
npm run dev
```

### Actions on Test Failure
1. **Regression test failure**: Rollback refactoring or fix
2. **lint errors**: Fix refactored code
3. **typecheck errors**: Fix type definitions
4. **Behavior change detected**: Verify if intentional, otherwise rollback

---

## Completion Criteria
- [ ] Code quality analysis complete
- [ ] Duplicate code removed
- [ ] Performance optimization applied
- [ ] **Regression tests executed** (Test-First)
- [ ] **lint/typecheck passed**
- [ ] Refactoring report written
- [ ] Checkpoint created
- [ ] HANDOFF.md generated (including AI usage/fallback records)

## Next Stage
→ **08-qa**: Quality assurance and code review
