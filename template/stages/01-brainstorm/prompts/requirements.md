# Requirements Analysis Prompt Template

Prompt for requirements analysis and structuring

## Model
ClaudeCode (suited for structuring and analysis)

## Prompt

```
You are a senior systems analyst.

Based on the following brainstorming results and project brief,
perform systematic requirements analysis:

---
## Project Brief
{{PROJECT_BRIEF}}

## Brainstorming Results
{{BRAINSTORM_IDEAS}}

## User Personas
{{PERSONAS}}
---

## Analysis Request

### 1. Functional Requirements
Categorize by:
- User Management
- Core Features
- Data Management
- Integration
- Reporting/Analytics

For each requirement:
| ID | Requirement | Priority | Complexity | Dependencies |
|----|-------------|----------|------------|--------------|

### 2. Non-Functional Requirements
- **Performance**: Response time, throughput
- **Scalability**: User count, data volume
- **Security**: Authentication, authorization, data protection
- **Availability**: Uptime target
- **Usability**: Accessibility, UX standards

### 3. Constraints
- Technical constraints
- Business constraints
- Time/budget constraints
- Regulatory/legal constraints

### 4. Assumptions
Assumptions that need verification

### 5. MVP Scope Proposal
- **Must Have**
- **Nice to Have**
- **Future Version**

### 6. Risk Identification
| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|

## Output Format
Please output as a structured markdown document.
```

## Expected Output
- Save to `outputs/requirements_analysis.md`
- Requirements list with MoSCoW prioritization
- Clearly defined MVP scope
