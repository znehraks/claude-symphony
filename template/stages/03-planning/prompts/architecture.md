# Architecture Design Prompt

## Model
Gemini

## Prompt

```
You are a senior software architect.

Please design a system architecture based on the following requirements and technical research:

---
## Requirements
{{REQUIREMENTS}}

## Technical Research Results
{{TECH_RESEARCH}}

## Feasibility Assessment
{{FEASIBILITY}}
---

## Design Items

### 1. System Overview
- System purpose
- Key features
- Non-functional requirements response

### 2. Architecture Style
- Selection: Monolithic / Microservices / Serverless / Hybrid
- Selection rationale

### 3. Component Design
For each component:
- Name
- Responsibility
- Interface
- Dependencies

### 4. Data Architecture
- Data model overview
- Data flow
- Storage strategy

### 5. Integration Points
- External APIs
- Third-party services
- Authentication/Authorization

### 6. Diagrams (Mermaid)
- System context
- Container diagram
- Component diagram

## Output Format
Markdown document including Mermaid diagrams
```

## Expected Output
`outputs/architecture.md`
