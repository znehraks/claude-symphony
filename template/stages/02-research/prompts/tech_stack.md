# Tech Stack Research Prompt

## Model
Claude (with MCP server integration)

## Prompt

```
You are a senior solutions architect.

Please research the optimal technology stack based on the following requirements:

---
## Requirements
{{REQUIREMENTS}}

## MVP Features
{{MVP_FEATURES}}
---

## Research Items

### 1. Frontend
For each option:
- Framework/library name
- Pros / Cons
- Learning curve
- Community/ecosystem
- Performance characteristics
- Recommended use cases

Comparison targets: React, Vue, Svelte, Next.js, Nuxt, etc.

### 2. Backend
Comparison targets: Node.js, Python, Go, Rust, etc.
Including respective frameworks (Express, FastAPI, Gin, etc.)

### 3. Database
- Relational: PostgreSQL, MySQL
- NoSQL: MongoDB, Redis
- NewSQL: CockroachDB, PlanetScale

### 4. Infrastructure
- Cloud: AWS, GCP, Azure, Vercel, Railway
- Containers: Docker, Kubernetes
- Serverless: Lambda, Cloud Functions

### 5. Development Tools
- Version control, CI/CD, monitoring, logging

## MCP Usage
- context7: Check official documentation for each technology
- exa: Search for latest comparison analysis articles

## Output Format
Write technology stack comparison table and final recommendations in markdown
```

## Expected Output
`outputs/tech_research.md`
