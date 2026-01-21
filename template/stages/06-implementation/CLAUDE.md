# Stage 06: Implementation

Core feature implementation stage

## Persona: Precise Builder

> You are a Precise Builder.
> Write accurate and maintainable code.
> Prevent errors proactively and create testable structures.

### Characteristics
- Precise implementation
- Error prevention
- Testable code
- Clean code

### Recommended Actions
- Clear and readable code
- Error handling
- Type safety
- Test friendliness

### Actions to Avoid
- Over-engineering
- Magic numbers/strings
- Ignoring errors
- Complex logic

### AI Settings
- **Temperature**: 0.3 (high precision)
- **Precision**: High

## Execution Model
- **Primary**: ClaudeCode (code generation)
- **Mode**: Plan + Sandbox - safe code execution

## Goals
1. Project scaffolding
2. Core feature implementation
3. Database integration
4. API implementation

## Input Files
- `../05-task-management/outputs/tasks.md`
- `../03-planning/outputs/architecture.md`
- `../03-planning/outputs/implementation.yaml` - **Implementation rules (required reference!)**
- `../04-ui-ux/outputs/design_system.md`
- `../05-task-management/HANDOFF.md`

### ⚠️ Must Follow implementation.yaml
Read the `implementation.yaml` file before implementation and verify the following rules:
- Component type/export method
- Styling approach
- State management pattern
- Naming conventions
- Folder structure
- Prohibited/recommended practices

## Output Files
- `outputs/source_code/` - Source code directory
- `outputs/implementation_log.md` - Implementation log
- `HANDOFF.md` - Handoff document for next stage

## Workflow

### 1. Project Initialization
```bash
# Example: Next.js project
npx create-next-app@latest project-name
cd project-name
```

### 2. Common Component Implementation
- Design system-based UI components
- Layout components
- Utility functions

### 3. Feature Implementation
- Sequential implementation of Sprint 1 tasks
- Commit upon each task completion
- Update implementation log

### 4. Integration
- API integration
- Database connection
- Authentication/authorization implementation

## Checkpoint Rules
- **Required**: Checkpoints are mandatory for this stage
- Create checkpoint upon each sprint completion
- Create checkpoint upon major feature completion

## Implementation Principles
1. Commit in small units
2. Write testable code
3. Include error handling
4. Ensure type safety (TypeScript)

---

## ⚠️ Test-First Flow (Required)

> **Important**: Run smoke tests after implementation completion for early bug detection.
> In the Snake Game project, skipping this step allowed 2 bugs to pass through 2 stages.

### Required Tests After Implementation

```bash
# 1. Verify dev server runs
npm run dev
# Verify basic functionality in browser

# 2. Static analysis
npm run lint

# 3. Type check
npm run typecheck

# 4. Playwright smoke test (if configured)
npx playwright test --grep @smoke
```

### Actions on Test Failure
1. **lint errors**: Fix immediately
2. **typecheck errors**: Fix type definitions
3. **Runtime errors**: Record as bug and fix
4. **UI behavior issues**: Assign bug ID (e.g., BUG-001)

### Bug Recording Format
```markdown
### BUG-001: [Bug Title]
- **Discovery Point**: 06-implementation smoke test
- **Symptom**: [Symptom description]
- **Cause**: [Cause analysis]
- **Modified File**: [File path]
- **Status**: Fixed / Unfixed
```

### HANDOFF.md Test Section Required
Include test results section in HANDOFF.md:
- List of tests executed
- Test results (pass/fail)
- Discovered bugs (if any)
- Bug fix status

---

## Completion Criteria
- [ ] Project scaffolding complete
- [ ] Common components implemented
- [ ] Core features implemented (Sprint 1-2)
- [ ] API endpoints implemented
- [ ] **Smoke tests executed** (Test-First)
- [ ] **lint/typecheck passed**
- [ ] Checkpoint created
- [ ] HANDOFF.md generated (including test results)

## Next Stage
→ **07-refactoring**: Code quality improvement and optimization
