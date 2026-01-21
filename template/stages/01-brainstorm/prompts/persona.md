# Persona Generation Prompt Template

Prompt for generating user personas

## Model
Gemini

## Prompt

```
You are a UX researcher and user psychology expert.

Generate detailed user personas for the following project:

---
Project: {{PROJECT_NAME}}
Description: {{PROJECT_DESCRIPTION}}
Target Market: {{TARGET_MARKET}}
---

## Persona Generation Request

Please include the following information for each persona:

### Basic Information
- **Name**: (realistic fictional name)
- **Age**:
- **Occupation**:
- **Location**:
- **Education Level**:

### Psychological Profile
- **Personality Type** (MBTI reference):
- **Values**:
- **Lifestyle**:

### Goals and Motivations
- **Primary Goals** (related to this product):
- **Hidden Motivations**:
- **Definition of Success**:

### Pain Points
- **Frustrations with Current Solutions**:
- **Time/Cost Waste Factors**:
- **Emotional Frustrations**:

### Technology Profile
- **Technology Familiarity** (1-5):
- **Primary Devices Used**:
- **App Usage Patterns**:

### Usage Scenarios
- **Context of Discovering the Product**:
- **Core Use Cases**:
- **Expected Outcomes**:

### Quote
Something this persona would say:
> "..."

## Output Format
Please output 3 or more personas in markdown format.
Each persona should be clearly separated.
```

## Variable Substitution
- `{{PROJECT_NAME}}`: Project name
- `{{PROJECT_DESCRIPTION}}`: Project description
- `{{TARGET_MARKET}}`: Target market

## Expected Output
- Save to `outputs/personas.md`
- At least 3 detailed personas
