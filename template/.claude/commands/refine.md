# /refine - Requirements Refinement Loop

Systematically break down and refine requirements into implementable units.

## Usage

```
/refine                          # Start refinement wizard
/refine <requirement>            # Refine specific requirement
/refine --list                   # List requirements with refinement status
/refine --validate               # Validate refined requirements
/refine --history                # Show refinement history
```

---

## 4-Level Granularity Hierarchy

```
Epic (2-8 weeks)
  └── Feature (3-5 days)
       └── Task (4-8 hours)
            └── Subtask (30min - 2 hours)
```

| Level | Description | Max Hours | Example |
|-------|-------------|-----------|---------|
| **Epic** | Large theme/capability | - | User Authentication System |
| **Feature** | User-facing functionality | 40h | Google OAuth Login |
| **Task** | Technical implementation | 8h | Implement OAuth callback |
| **Subtask** | Atomic step | 2h | Add Google Client ID env var |

---

## Commands

### `/refine` (Start Wizard)

Starts the interactive refinement process:

1. **Identify** - Scan for vague or large requirements
2. **Analyze** - Deep dive into selected requirement
3. **Breakdown** - Split into smaller units
4. **Validate** - Check INVEST criteria
5. **Document** - Update requirements docs

**Example Flow:**
```
/refine

[Scanning requirements...]

Found 3 requirements needing refinement:
1. "User should be able to manage their account" - VAGUE
2. "Build e-commerce functionality" - TOO LARGE (est. 120h)
3. "Handle notifications" - MISSING AC

Select requirement to refine (1-3):
```

### `/refine <requirement>`

Refine a specific requirement directly.

**Example:**
```
/refine "User should be able to manage their account"

Analyzing requirement...

Current Level: Feature (too vague for direct implementation)
Issues:
  - Missing acceptance criteria
  - "manage" is ambiguous
  - No edge cases defined

Suggested Breakdown:
  Feature: Account Management
    ├── Task: View Profile
    │   ├── Subtask: Create profile page
    │   ├── Subtask: Fetch user data API
    │   └── Subtask: Display user info
    ├── Task: Edit Profile
    │   ├── Subtask: Create edit form
    │   ├── Subtask: Implement update API
    │   └── Subtask: Add validation
    └── Task: Delete Account
        ├── Subtask: Add confirmation dialog
        ├── Subtask: Implement delete API
        └── Subtask: Handle data cleanup

Apply this breakdown? (y/n)
```

### `/refine --list`

Show all requirements with their refinement status.

**Example Output:**
```
Requirements Refinement Status
==============================

Epics (3):
  [✓] User Authentication - 4 features, fully refined
  [~] E-commerce - 2/5 features refined
  [ ] Admin Dashboard - Not started

Features (12):
  [✓] Google OAuth Login - 3 tasks, 8 subtasks
  [✓] Email/Password Login - 4 tasks, 12 subtasks
  [~] Product Search - 2/4 tasks refined
  [ ] Shopping Cart - Not started
  ...

Legend: [✓] Complete  [~] In Progress  [ ] Not Started
```

### `/refine --validate`

Run validation checks on all refined requirements.

**Validation Checks:**
- All items have acceptance criteria
- Estimates within thresholds
- Dependencies mapped
- No circular dependencies
- INVEST criteria met

**Example Output:**
```
Validation Results
==================

Passed: 15/18 requirements

Issues Found:
  ⚠ "Implement caching" - Missing acceptance criteria
  ⚠ "Build dashboard" - Estimate exceeds 8h (12h)
  ✗ "Setup API" → "Create DB" - Circular dependency

Suggestions:
  - Add AC: "Cache hit rate > 80%"
  - Break "Build dashboard" into smaller tasks
  - Resolve dependency cycle
```

### `/refine --history`

Show refinement history for the project.

**Example Output:**
```
Refinement History
==================

2024-01-15 10:30:
  Refined: "User Authentication" (Epic → 4 Features)
  By: Claude
  Iteration: 1

2024-01-15 14:45:
  Refined: "Google OAuth Login" (Feature → 3 Tasks)
  By: Claude
  Iteration: 2

Total Refinements: 8
Current Iteration: 3
```

---

## INVEST Criteria

Tasks should meet INVEST criteria:

| Criteria | Description | Check |
|----------|-------------|-------|
| **I**ndependent | Can be developed alone | No blocking dependencies |
| **N**egotiable | Details flexible | Alternatives exist |
| **V**aluable | Delivers user value | Clear benefit stated |
| **E**stimable | Can be estimated | Has hour estimate |
| **S**mall | Quick to complete | ≤ 8 hours |
| **T**estable | Clear acceptance | Has AC defined |

---

## Auto-Detection Triggers

The system automatically suggests refinement when it detects:

| Trigger | Pattern | Action |
|---------|---------|--------|
| Vague scope | "should be able to", "might need", "etc." | Suggest refine |
| Too large | Estimate > 40 hours | Require breakdown |
| Missing AC | No acceptance criteria | Suggest refine |
| Unclear deps | "depends on", "after X" | Flag for review |

---

## Workflow Integration

### Stage 01 (Brainstorm)
- Auto-suggests refinement after capturing requirements
- Use `/refine` to break down initial ideas

### Stage 03 (Planning)
- Validation check before stage completion
- All requirements must be at Task level or below

### Stage 05 (Task Management)
- Refined hierarchy applied to task organization
- Subtasks become sprint tasks

---

## Configuration

See `config/requirements_refinement.yaml` for:
- Granularity level definitions
- Trigger patterns
- Validation rules
- Templates

---

## Best Practices

1. **Start at Epic level** - Don't over-refine early
2. **Refine just-in-time** - Break down when entering a sprint
3. **Validate frequently** - Run `/refine --validate` before stage transitions
4. **Keep acceptance criteria specific** - "User can log in" → "User can log in with Google OAuth and see dashboard"
5. **Estimate conservatively** - When in doubt, break it down further
