# System Architecture Document
<!-- SCHEMA VERSION: 1.0 -->
<!-- REF: arc42 v9.0, C4 Model, MADR -->

> This is a sample file demonstrating the expected output format.
> Real output should be saved as `architecture.md`.

---

## 1. Introduction and Goals (arc42 §1)

### Requirements Overview

**Core Functional Requirements:**
1. User authentication with OAuth 2.0 (Google, GitHub)
2. PR analysis and summarization via AI
3. Real-time collaboration features
4. Integration with GitHub/GitLab APIs

**Non-Functional Requirements:**
- Response time: 95th percentile < 500ms
- Availability: 99.5% uptime
- Security: SOC 2 Type II compliance path

### Quality Goals (Top 3)

| Priority | Quality Attribute | Motivation | Scenario |
|----------|-------------------|------------|----------|
| 1 | **Performance** | User retention | API responses < 200ms for 95% of requests |
| 2 | **Security** | Enterprise adoption | Zero data breaches, encrypted at rest/transit |
| 3 | **Maintainability** | Long-term velocity | New feature deployment < 1 day |

### Stakeholders

| Role | Expectations | Contact |
|------|--------------|---------|
| Product Owner | Feature delivery on schedule | @product-owner |
| Development Team | Clear architecture, good DX | @dev-team |
| End Users | Fast, reliable service | Support channel |
| Security Team | Compliance, audit trails | @security |

---

## 2. Architecture Constraints (arc42 §2)

| Constraint | Background | Consequences |
|------------|------------|--------------|
| Budget $500/month | Startup phase | Prefer managed services, serverless |
| 2-person team | Limited resources | Minimize operational overhead |
| 8-week timeline | MVP deadline | Focus on core features only |
| TypeScript only | Team preference | Full-stack type safety |

---

## 3. System Scope and Context (arc42 §3)

### Business Context (C4 Level 1 - Context Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                      External Systems                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐         ┌─────────────────┐         ┌─────────┐  │
│   │ GitHub  │◄───────►│   Our System    │◄───────►│ OpenAI  │  │
│   │   API   │         │  (PR Analyzer)  │         │   API   │  │
│   └─────────┘         └────────┬────────┘         └─────────┘  │
│                                │                               │
│   ┌─────────┐                  │                 ┌─────────┐   │
│   │ GitLab  │◄─────────────────┤                 │ Slack   │   │
│   │   API   │                  │                 │   API   │   │
│   └─────────┘                  ▼                 └─────────┘   │
│                         ┌──────────────┐                       │
│                         │  Developer   │                       │
│                         │    Users     │                       │
│                         └──────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technical Context

| Neighbor System | Channel | Protocol | Data Format |
|-----------------|---------|----------|-------------|
| GitHub API | HTTPS | REST/GraphQL | JSON |
| GitLab API | HTTPS | REST | JSON |
| OpenAI API | HTTPS | REST | JSON |
| Slack API | HTTPS | REST + WebSocket | JSON |
| Supabase | HTTPS | REST + WebSocket | JSON |

---

## 4. Solution Strategy (arc42 §4)

| Quality Goal | Architectural Approach | Implementation Details |
|--------------|------------------------|------------------------|
| Performance | Edge-first deployment | Vercel Edge Functions, ISR |
| Security | Defense in depth | RLS, JWT, HTTPS only |
| Maintainability | Modular monolith | Feature-based folder structure |
| Scalability | Serverless-first | Auto-scaling with Vercel/Supabase |

---

## 5. Building Block View (arc42 §5)

### Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PR Analyzer System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │   Web App        │     │   API Routes     │                 │
│  │   (Next.js)      │────►│   (Next.js)      │                 │
│  │   React, TS      │     │   TypeScript     │                 │
│  └──────────────────┘     └────────┬─────────┘                 │
│                                    │                           │
│                                    ▼                           │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │   Supabase       │◄────│   Edge Functions │                 │
│  │   (PostgreSQL)   │     │   (Vercel)       │                 │
│  │   Auth, RLS      │     │   AI Processing  │                 │
│  └──────────────────┘     └──────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Specifications

| Container | Technology | Responsibility | Port | Scaling |
|-----------|------------|----------------|------|---------|
| Web App | Next.js 14 | UI rendering, client state | 3000 | Vercel auto |
| API Routes | Next.js API | Business logic, auth | 3000 | Vercel auto |
| Edge Functions | Vercel Edge | AI calls, caching | - | Auto |
| Database | Supabase | Data persistence, auth | 5432 | Supabase auto |

---

## 6. Runtime View (arc42 §6)

### Core Scenario: PR Analysis Flow

```
┌────────┐     ┌─────────┐     ┌─────────┐     ┌────────┐     ┌────────┐
│  User  │     │ Web App │     │   API   │     │ GitHub │     │ OpenAI │
└───┬────┘     └────┬────┘     └────┬────┘     └───┬────┘     └───┬────┘
    │               │               │              │              │
    │  Open PR #123 │               │              │              │
    │──────────────►│               │              │              │
    │               │ GET /api/pr/123              │              │
    │               │──────────────►│              │              │
    │               │               │ GET /repos/pr│              │
    │               │               │─────────────►│              │
    │               │               │◄─────────────│              │
    │               │               │   PR Data    │              │
    │               │               │              │              │
    │               │               │ POST /chat   │              │
    │               │               │─────────────────────────────►│
    │               │               │◄─────────────────────────────│
    │               │               │   Summary    │              │
    │               │◄──────────────│              │              │
    │◄──────────────│  Render       │              │              │
    │   Summary     │               │              │              │
```

---

## 7. Deployment View (arc42 §7)

### Infrastructure Overview

| Environment | Infrastructure | Data Store | Access Control |
|-------------|----------------|------------|----------------|
| Development | Local + Supabase | Local/Dev DB | Developer only |
| Staging | Vercel Preview | Staging DB | Team + QA |
| Production | Vercel Production | Production DB | Public (auth required) |

### Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Production                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Vercel    │    │   Vercel    │    │  Supabase   │        │
│   │   CDN       │───►│   Edge      │───►│   Cloud     │        │
│   │   (Global)  │    │   (Region)  │    │   (Region)  │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐                           │
│   │   GitHub    │    │   OpenAI    │                           │
│   │   (API)     │    │   (API)     │                           │
│   └─────────────┘    └─────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Cross-cutting Concepts (arc42 §8)

### Security

| Concept | Approach | Implementation |
|---------|----------|----------------|
| Authentication | OAuth 2.0 + JWT | Supabase Auth |
| Authorization | Row-Level Security | PostgreSQL RLS policies |
| Data Encryption | AES-256 | Supabase default |
| API Security | Rate limiting | Vercel + custom middleware |

### Error Handling

| Layer | Strategy | Example |
|-------|----------|---------|
| Client | Error boundaries | React ErrorBoundary |
| API | Structured errors | `{ error: { code, message } }` |
| Database | Constraint violations | PostgreSQL exceptions |

### Logging & Monitoring

| Category | Tool | Purpose |
|----------|------|---------|
| Application Logs | Vercel Logs | Debug, audit |
| Error Tracking | Sentry | Exception monitoring |
| Analytics | PostHog | Usage analytics |
| Uptime | Better Uptime | Availability monitoring |

---

## 9. Architecture Decision Records (arc42 §9)

### ADR-001: Next.js App Router over Pages Router

**Status:** Accepted

**Context:**
Need to choose between Next.js App Router (new) and Pages Router (stable).

**Decision:**
Use App Router for new projects starting 2024.

**Consequences:**
- **Good:** Server Components, better streaming, layouts
- **Good:** Future-proof, Vercel investment
- **Bad:** Some ecosystem libraries not yet compatible
- **Bad:** Team needs to learn new patterns

---

### ADR-002: Supabase over Custom Backend

**Status:** Accepted

**Context:**
Build custom Node.js backend vs use Supabase BaaS.

**Decision:**
Use Supabase for MVP phase.

**Consequences:**
- **Good:** Faster development, auth included, real-time built-in
- **Good:** Lower operational burden
- **Bad:** Vendor lock-in risk
- **Bad:** Less control over query optimization

---

## 10. Quality Requirements (arc42 §10)

### Quality Tree

```
Quality
├── Performance
│   ├── Response Time
│   └── Throughput
├── Security
│   ├── Authentication
│   ├── Authorization
│   └── Data Protection
├── Maintainability
│   ├── Modularity
│   ├── Testability
│   └── Documentation
└── Usability
    ├── Learnability
    └── Accessibility
```

### Quality Scenarios

| ID | Quality | Scenario | Response Measure |
|----|---------|----------|------------------|
| QS-1 | Performance | User requests PR summary | < 2s for 95% of requests |
| QS-2 | Security | Unauthorized API access attempt | Blocked, logged, no data exposure |
| QS-3 | Availability | Database failover | < 30s recovery time |

---

## 11. Risks and Technical Debt (arc42 §11)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenAI API cost overrun | Medium | Medium | Implement caching, set budget alerts |
| Supabase outage | Low | High | Implement graceful degradation |
| Team member unavailable | Medium | Medium | Document everything, pair programming |

### Technical Debt Register

| Item | Severity | Estimated Effort | Target Sprint |
|------|----------|------------------|---------------|
| Add comprehensive error handling | Medium | 2 days | Sprint 3 |
| Implement request caching | Low | 1 day | Sprint 4 |

---

## 12. Glossary (arc42 §12)

| Term | Definition |
|------|------------|
| PR | Pull Request - code change proposal |
| RLS | Row-Level Security - PostgreSQL access control |
| ISR | Incremental Static Regeneration - Next.js rendering strategy |
| Edge Function | Serverless function running at CDN edge |
| BaaS | Backend as a Service |
