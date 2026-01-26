# Task Management Document
<!-- SCHEMA VERSION: 1.0 -->
<!-- REF: INVEST Criteria, Connextra Template, Atlassian User Stories -->

> This is a sample file demonstrating the expected output format.
> Real output should be saved as `tasks.md`.

---

## Metadata

| Field | Value |
|-------|-------|
| project_id | example-project |
| created_at | YYYY-MM-DD |
| sprint_mode | enabled |
| velocity | 34 story points/sprint |
| notion_sync | enabled |

---

## Epic Overview

### EPIC-001: User Authentication System

| Field | Value |
|-------|-------|
| **Goal** | Secure, frictionless user authentication |
| **Success Metrics** | 90% signup completion rate, <3s login time |
| **Time Horizon** | Sprint 1-2 |
| **Priority** | P0 - Critical Path |

---

## Features (User Story Level)

### FEAT-001: OAuth Login

**User Story (Connextra Format):**
```
As a new user,
I want to sign in with my GitHub or Google account,
So that I can start using the app without creating a new password.
```

**3 C's:**
- **Card:** OAuth sign-in with GitHub/Google
- **Conversation:** Discuss scope of OAuth permissions, session handling
- **Confirmation:** See Acceptance Criteria below

**Acceptance Criteria (Given-When-Then):**
```gherkin
Scenario: Successful GitHub OAuth login
  Given I am on the login page
  When I click "Sign in with GitHub"
  And I authorize the application on GitHub
  Then I should be redirected to the dashboard
  And I should see my GitHub profile picture

Scenario: OAuth cancellation handling
  Given I am on the GitHub authorization page
  When I click "Cancel" or close the window
  Then I should be returned to the login page
  And I should see a message "Login cancelled"

Scenario: Account linking
  Given I have an existing account with email "user@example.com"
  When I sign in with GitHub using the same email
  Then my accounts should be linked automatically
```

**Metadata:**

| Field | Value |
|-------|-------|
| Estimate | 16h (Story Points: 5) |
| Priority | P0 (MoSCoW: Must) |
| Sprint | Sprint 1 |
| Dependencies | None |

---

### FEAT-002: Session Management

**User Story:**
```
As a logged-in user,
I want my session to persist across browser tabs and survive page refreshes,
So that I don't have to log in repeatedly.
```

**Acceptance Criteria:**
```gherkin
Scenario: Session persistence across tabs
  Given I am logged in in one tab
  When I open a new tab and navigate to the app
  Then I should still be logged in

Scenario: Session expiration
  Given my session has been inactive for 7 days
  When I try to access the app
  Then I should be prompted to log in again
```

**Metadata:**

| Field | Value |
|-------|-------|
| Estimate | 8h (Story Points: 3) |
| Priority | P0 (Must) |
| Sprint | Sprint 1 |
| Dependencies | FEAT-001 |

---

## Tasks (Implementation Level)

### TASK-001: Set up Supabase Auth

**INVEST Checklist:**

| Criterion | Pass | Evidence |
|-----------|------|----------|
| **I**ndependent | ✓ | Can be done without other tasks |
| **N**egotiable | ✓ | Implementation approach flexible |
| **V**aluable | ✓ | Enables all auth features |
| **E**stimable | ✓ | 4h estimated |
| **S**mall | ✓ | < 8h |
| **T**estable | ✓ | Auth flow can be tested |

**Definition of Done:**
- [x] Supabase project created
- [ ] Auth providers configured (GitHub, Google)
- [ ] Environment variables set up
- [ ] Connection tested locally
- [ ] Documentation updated

**Technical Details:**

| Field | Value |
|-------|-------|
| Type | feature |
| Estimate | 4h |
| Blocked By | None |
| Files | `src/lib/supabase.ts`, `.env.local` |
| Owner | @developer-1 |

---

### TASK-002: Implement OAuth callback handler

**INVEST Checklist:**

| Criterion | Pass | Evidence |
|-----------|------|----------|
| **I**ndependent | ✓ | After TASK-001 |
| **N**egotiable | ✓ | Redirect flow is flexible |
| **V**aluable | ✓ | Core auth functionality |
| **E**stimable | ✓ | 3h estimated |
| **S**mall | ✓ | < 8h |
| **T**estable | ✓ | OAuth flow testable |

**Definition of Done:**
- [ ] Callback route created (`/api/auth/callback`)
- [ ] Token exchange implemented
- [ ] Session created on success
- [ ] Error handling for failures
- [ ] Unit tests added

**Technical Details:**

| Field | Value |
|-------|-------|
| Type | feature |
| Estimate | 3h |
| Blocked By | TASK-001 |
| Files | `src/app/api/auth/callback/route.ts` |

---

### TASK-003: Create login page UI

**INVEST Checklist:**

| Criterion | Pass | Evidence |
|-----------|------|----------|
| **I**ndependent | ✓ | UI can use mock auth |
| **N**egotiable | ✓ | Design details flexible |
| **V**aluable | ✓ | User-facing entry point |
| **E**stimable | ✓ | 4h estimated |
| **S**mall | ✓ | < 8h |
| **T**estable | ✓ | Visual regression test |

**Definition of Done:**
- [ ] Login page component created
- [ ] OAuth buttons styled per design system
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Responsive design verified
- [ ] Accessibility audit passed

**Technical Details:**

| Field | Value |
|-------|-------|
| Type | feature |
| Estimate | 4h |
| Blocked By | None (can mock auth) |
| Files | `src/app/login/page.tsx`, `src/components/auth/OAuthButton.tsx` |

---

### TASK-004: Implement useAuth hook

**Definition of Done:**
- [ ] Hook created with session state
- [ ] signIn, signOut methods
- [ ] Loading and error states
- [ ] TypeScript types complete
- [ ] Unit tests (80% coverage)

**Technical Details:**

| Field | Value |
|-------|-------|
| Type | feature |
| Estimate | 3h |
| Blocked By | TASK-001 |
| Files | `src/hooks/useAuth.ts`, `src/hooks/useAuth.test.ts` |

---

### TASK-005: Add protected route middleware

**Definition of Done:**
- [ ] Middleware checks session
- [ ] Unauthenticated users redirected
- [ ] Public routes excluded
- [ ] Configuration for route patterns

**Technical Details:**

| Field | Value |
|-------|-------|
| Type | feature |
| Estimate | 2h |
| Blocked By | TASK-002, TASK-004 |
| Files | `src/middleware.ts` |

---

## Sprint Planning

### Sprint 1: Authentication Foundation

| Field | Value |
|-------|-------|
| Dates | YYYY-MM-DD to YYYY-MM-DD |
| Goal | Complete OAuth login flow |
| Capacity | 40h (1 developer × 40h × 1.0) |
| Committed | 34h (85% utilization) |
| Story Points | 13 |

**Sprint Backlog:**

| Task ID | Title | Points | Estimate | Owner | Status |
|---------|-------|--------|----------|-------|--------|
| TASK-001 | Set up Supabase Auth | 2 | 4h | @dev-1 | todo |
| TASK-002 | OAuth callback handler | 2 | 3h | @dev-1 | todo |
| TASK-003 | Login page UI | 3 | 4h | @dev-1 | todo |
| TASK-004 | useAuth hook | 2 | 3h | @dev-1 | todo |
| TASK-005 | Protected routes | 2 | 2h | @dev-1 | todo |
| TASK-006 | User profile page | 2 | 3h | @dev-1 | todo |

---

### Sprint 2: Enhanced Auth Features

| Field | Value |
|-------|-------|
| Dates | YYYY-MM-DD to YYYY-MM-DD |
| Goal | Session management, account linking |
| Capacity | 40h |
| Story Points Target | 13 |

**Planned Items:**
- FEAT-002: Session Management (8h)
- FEAT-003: Account Settings (12h)

---

## Dependency Graph

```
                    ┌─────────────┐
                    │  TASK-001   │
                    │  Supabase   │
                    │   Setup     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ TASK-002 │ │ TASK-003 │ │ TASK-004 │
       │ Callback │ │ Login UI │ │ useAuth  │
       └────┬─────┘ └──────────┘ └────┬─────┘
            │                         │
            └───────────┬─────────────┘
                        │
                        ▼
                 ┌──────────┐
                 │ TASK-005 │
                 │Middleware│
                 └──────────┘
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OAuth provider downtime | Low | High | Implement fallback email login |
| Session token leakage | Low | Critical | Use HttpOnly cookies, short expiry |
| Rate limiting by OAuth providers | Medium | Medium | Cache tokens, implement backoff |

---

## Definition of Ready (DoR)

All tasks must meet these criteria before sprint:

- [ ] User story and acceptance criteria defined
- [ ] Technical approach discussed
- [ ] Estimate provided (< 8h for tasks)
- [ ] Dependencies identified
- [ ] Test strategy outlined

---

## Definition of Done (DoD)

All tasks must meet these criteria for completion:

- [ ] Code complete and reviewed
- [ ] Unit tests passing (80% coverage)
- [ ] No lint errors
- [ ] TypeScript types complete
- [ ] PR approved and merged
- [ ] Deployed to staging

---

## Sync Configuration

```yaml
primary: notion
fallback: state/tasks.json
sync_interval: 5m
fields_to_sync:
  - status
  - owner
  - estimate
  - priority
conflict_resolution: last_write_wins
```

---

## Task State Transitions

```
                    ┌──────────┐
         Create     │          │
        ─────────►  │   Todo   │
                    │          │
                    └────┬─────┘
                         │ Start
                         ▼
                    ┌──────────┐
                    │   In     │◄────┐
                    │ Progress │     │ Reopen
                    └────┬─────┘     │
                         │ Complete  │
                         ▼           │
                    ┌──────────┐     │
                    │   Done   │─────┘
                    │          │
                    └──────────┘
```
