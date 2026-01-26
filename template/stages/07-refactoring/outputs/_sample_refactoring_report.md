# Refactoring Report
<!-- SCHEMA VERSION: 1.0 -->
<!-- REF: Fowler's Refactoring Catalog, ADR, Code Smells -->

> This is a sample file demonstrating the expected output format.
> Real output should be saved as `refactoring_report.md`.

---

## Metadata

| Field | Value |
|-------|-------|
| date | YYYY-MM-DD |
| author | AI: Codex + ClaudeCode |
| reviewer | @lead-developer |
| status | implemented |

---

## Executive Summary

### Before/After Metrics

| Metric | Before | After | Change | Tool |
|--------|--------|-------|--------|------|
| Cyclomatic Complexity (avg) | 12.3 | 6.8 | -45% | ESLint |
| Code Duplication | 15% | 3% | -80% | SonarQube |
| Test Coverage | 72% | 89% | +17% | Vitest |
| Bundle Size | 245KB | 198KB | -19% | webpack-bundle-analyzer |
| Maintainability Index | C | A | +2 grades | CodeClimate |
| TypeScript Strictness | Partial | Full | - | tsc --strict |

### Summary
- **Total Refactorings Applied:** 8
- **Files Modified:** 23
- **Lines Changed:** +450 / -680 (net -230)
- **Breaking Changes:** 0

---

## Refactoring Catalog

### REF-001: Extract Custom Hook from Component

**Code Smell:** Feature Envy, Long Method (75 lines)
**Pattern:** Extract Method → Extract Custom Hook (React-specific)
**Severity:** High
**Effort:** Medium

#### Problem (AS-IS)

```tsx
// src/components/UserProfile.tsx:45-120
// Problem: 75-line component mixing data fetching, transformation, and rendering

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        // 20 lines of data transformation
        const transformedUser = {
          ...data,
          fullName: `${data.firstName} ${data.lastName}`,
          initials: `${data.firstName[0]}${data.lastName[0]}`,
          // ... more transformations
        };

        setUser(transformedUser);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  // 25 lines of rendering logic with loading/error states
  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} />;
  if (!user) return null;

  return (
    <div>
      {/* Complex JSX */}
    </div>
  );
}
```

#### Solution (TO-BE)

```tsx
// NEW: src/hooks/useUser.ts
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setUser(transformUser(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const refetch = useCallback(() => {
    // Trigger refetch
  }, [userId]);

  return { user, loading, error, refetch };
}

// NEW: src/utils/user.ts
export function transformUser(data: RawUserData): User {
  return {
    ...data,
    fullName: `${data.firstName} ${data.lastName}`,
    initials: `${data.firstName[0]}${data.lastName[0]}`,
  };
}

// MODIFIED: src/components/UserProfile.tsx (25 lines, down from 75)
function UserProfile({ userId }: { userId: string }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} />;
  if (!user) return null;

  return (
    <div>
      {/* Clean JSX, rendering only */}
    </div>
  );
}
```

#### Impact Analysis

| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| Lines of Code | 75 | 25 + 30 + 10 | Total 65, but better organized |
| Testability | Low | High | Hook and util independently testable |
| Reusability | None | High | Hook reused in 3 other components |
| Cognitive Load | High | Low | Clear separation of concerns |

#### Backward Compatibility

| API | Compatible | Migration |
|-----|------------|-----------|
| Component Props | ✓ Yes | None needed |
| Return Value | ✓ Yes | None needed |
| Side Effects | ✓ Yes | Verified via tests |

---

### REF-002: Replace Conditional with Polymorphism

**Code Smell:** Switch Statement, Shotgun Surgery
**Pattern:** Replace Conditional with Polymorphism
**Severity:** Medium
**Effort:** High

#### Problem

```typescript
// src/services/notification.ts
function sendNotification(type: string, payload: any) {
  switch (type) {
    case 'email':
      // 15 lines of email logic
      break;
    case 'sms':
      // 15 lines of SMS logic
      break;
    case 'push':
      // 15 lines of push logic
      break;
    case 'slack':
      // 15 lines of Slack logic
      break;
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}
```

#### Solution

```typescript
// src/services/notifications/index.ts
interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}

// src/services/notifications/email.ts
export class EmailChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    // Email-specific logic
  }
}

// src/services/notifications/factory.ts
const channels: Record<string, NotificationChannel> = {
  email: new EmailChannel(),
  sms: new SmsChannel(),
  push: new PushChannel(),
  slack: new SlackChannel(),
};

export function getChannel(type: string): NotificationChannel {
  const channel = channels[type];
  if (!channel) throw new Error(`Unknown channel: ${type}`);
  return channel;
}

// Usage
await getChannel('email').send(payload);
```

#### Impact

| Aspect | Before | After |
|--------|--------|-------|
| Open/Closed Principle | Violated | Satisfied |
| Adding new channel | Modify switch | Add new class |
| Testing | Integration only | Unit test per channel |

---

### REF-003: Consolidate Duplicate API Calls

**Code Smell:** Duplicated Code
**Pattern:** Extract Class / Consolidate Duplicate Conditional Fragments
**Severity:** High
**Effort:** Low

#### Problem

```typescript
// Same fetch pattern duplicated across 12 files:
// - src/hooks/useUser.ts
// - src/hooks/usePosts.ts
// - src/hooks/useComments.ts
// ... etc.

const response = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
});
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
return response.json();
```

#### Solution

```typescript
// NEW: src/lib/api-client.ts
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.message || 'Request failed');
    }
    return response.json();
  }
}

export const api = new ApiClient();

// Usage in hooks (much cleaner)
const user = await api.get<User>(`/users/${userId}`);
```

#### Impact

| Metric | Before | After |
|--------|--------|-------|
| Duplicate Lines | 180 | 0 |
| Files with fetch logic | 12 | 1 |
| Error handling consistency | Inconsistent | Unified |

---

## Architecture Decision Records

### ADR-REF-001: Custom Hooks for Data Fetching

**Status:** Accepted
**Date:** YYYY-MM-DD

**Context:**
Components were mixing data fetching, state management, and rendering, leading to:
- Poor testability (can't test logic without rendering)
- Code duplication across components
- Difficult to add features like caching

**Decision:**
Extract all data fetching into custom hooks following the pattern:
```typescript
function useResource(id: string) {
  return { data, loading, error, refetch };
}
```

**Alternatives Considered:**
1. **HOC (Higher-Order Components)** - Rejected: Creates wrapper hell, harder to type
2. **Render Props** - Rejected: Verbose, harder to compose
3. **Redux Toolkit Query** - Considered for future: Overkill for current scale

**Consequences:**
- (+) Clear separation of concerns
- (+) Reusable data fetching logic
- (+) Easier unit testing
- (+) Foundation for adding caching (React Query) later
- (-) More files to manage
- (-) Team needs to learn pattern

---

### ADR-REF-002: API Client Singleton

**Status:** Accepted

**Context:**
Fetch calls scattered across codebase with inconsistent error handling, auth headers, and base URL management.

**Decision:**
Create a centralized API client class with typed methods.

**Consequences:**
- (+) Single source of truth for API configuration
- (+) Consistent error handling
- (+) Easy to add interceptors, retries, caching
- (+) Type-safe API calls
- (-) Slight overhead for simple requests

---

## Verification Results

### Test Results

| Suite | Before | After | New Tests |
|-------|--------|-------|-----------|
| useUser.test.ts | N/A | 15/15 ✓ | +15 |
| api-client.test.ts | N/A | 22/22 ✓ | +22 |
| UserProfile.test.tsx | 8/10 | 12/12 ✓ | +4 |
| notification.test.ts | 5/8 | 20/20 ✓ | +15 |

### Regression Check

| Scenario | Status | Notes |
|----------|--------|-------|
| User profile loads | ✓ Pass | |
| Error states display | ✓ Pass | |
| Loading states show | ✓ Pass | |
| API error handling | ✓ Pass | |
| Auth token refresh | ✓ Pass | |

### Performance Check

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Lighthouse Performance | 85 | 92 | ✓ Improved |
| First Contentful Paint | 1.8s | 1.2s | ✓ Improved |
| Bundle size (gzip) | 98KB | 82KB | ✓ Reduced |

---

## Rollback Plan

**Checkpoint Created:** `git tag refactor/v1.0.0`

**Rollback Procedure:**
```bash
# Full rollback
git revert HEAD~8..HEAD  # Revert all 8 refactoring commits

# Partial rollback (specific refactoring)
git revert <commit-hash>  # Revert specific commit
```

**Rollback Triggers:**
- [ ] Error rate increases > 1% for 5 minutes
- [ ] Performance degrades > 20%
- [ ] Critical bugs discovered in production

---

## Technical Debt Created

| Item | Severity | Estimated Effort | Target |
|------|----------|------------------|--------|
| Add React Query for caching | Low | 8h | Sprint 5 |
| Migrate remaining fetch calls | Low | 4h | Sprint 4 |
| Add API client retry logic | Low | 2h | Sprint 4 |

---

## Parallel AI Synthesis Notes

### Model Contributions

| Model | Focus Area | Key Contributions |
|-------|------------|-------------------|
| Codex | Deep code analysis | Identified 3 additional code smells |
| ClaudeCode | Pattern application | Suggested API client pattern |

### Consensus Items
- Custom hooks for data fetching
- Centralized API client
- Notification channel refactoring

### Divergent Items (Resolved)
- Codex suggested using Axios; ClaudeCode preferred native fetch
- **Resolution:** Native fetch with wrapper (smaller bundle, fewer deps)
