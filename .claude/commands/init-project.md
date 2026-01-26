# /init-project

Initialize a new project with the claude-symphony workflow.

## Usage
```
/init-project [project-name]
```

## Actions

1. **Create Project Directory**
   - Create `projects/[project-name]/`
   - Create stage-specific working directories

2. **Initialize State Files**
   - Update `state/progress.json` with project info
   - Record timestamp

3. **Prepare Input Files**
   - Create `stages/01-brainstorm/inputs/project_brief.md` template

4. **First Stage Guidance**
   - Guide to 01-brainstorm stage CLAUDE.md

## Execution Script

```bash
scripts/init-project.sh "$ARGUMENTS"
```

## Example

```
/init-project my-saas-app

Output:
✓ Project 'my-saas-app' initialization complete
✓ Working directory: projects/my-saas-app/
✓ State files updated

Next steps:
1. Write stages/01-brainstorm/inputs/project_brief.md
2. Run /run-stage 01-brainstorm
```

## Cautions
- Project name allows only lowercase letters, numbers, and hyphens
- Cannot overwrite existing projects
