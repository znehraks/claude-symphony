# Output Validator Skill

Stage-specific output validation skill

## Overview

Automatically validates that each stage's outputs meet requirements:
- Required file existence check
- File content validation
- Validation command execution (lint, test, etc.)
- Quality score calculation

## Trigger

- Auto-runs on stage completion
- `/validate` command
- Auto-check before `/next` command

## Features

### 1. File Existence Check
```yaml
required_outputs:
  ideas.md:
    exists: true
    min_size_bytes: 500
```

### 2. Content Validation
```yaml
content_checks:
  min_ideas: 5
  has_sections: ["functional", "non-functional"]
```

### 3. Command Validation
```yaml
validation_commands:
  - name: "lint"
    command: "npm run lint"
    required: true
```

### 4. Quality Score
```yaml
quality_metrics:
  lint_score: 0.9
  test_coverage: 0.8
```

## File Structure

```
output-validator/
├── README.md          # This file
├── validate.md        # Validation process guide
└── prompts/
    └── CLAUDE.md      # AI instructions
```

## Configuration

See `config/output_validation.yaml`

## Usage Examples

```bash
# Validate current stage
/validate

# Validate specific stage
/validate --stage 06

# Detailed report
/validate --verbose

# Auto-fix suggestions
/validate --fix
```

## Output

- Validation result report
- Quality score
- Fix suggestions (on failure)
- Saved to `state/validations/`
