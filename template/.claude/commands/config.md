# /config - Configuration Management

Manage pipeline configuration settings.

## Usage

```
/config                          # Show all config options
/config sprint <subcommand>      # Sprint mode configuration
/config order <subcommand>       # Implementation order configuration
```

## Sprint Mode Subcommands

### `/config sprint enable`
Enable sprint-based iteration mode.

**Action:**
Update `state/progress.json`:
```json
{
  "current_iteration": {
    "type": "sprint"
  }
}
```

### `/config sprint disable`
Disable sprint mode (single-pass execution).

### `/config sprint status`
Show current sprint configuration.

### `/config sprint count <n>`
Set the default number of sprints.

**Example:**
```bash
./scripts/config-manager.sh sprint count 4
```

---

## Implementation Order Subcommands

> Configuration file: `config/implementation_order.yaml`

### `/config order`
Show current implementation order setting.

**Action:**
Read from `state/progress.json`:
```json
{
  "implementation_order": {
    "selected": "frontend_first",
    "set_at": "2024-01-15T10:30:00Z",
    "current_phase": 1
  }
}
```

Display current selection and its description.

### `/config order frontend`
Set implementation order to **Frontend First**.

**Description:** Build UI components first, then connect to APIs.

**Phases:**
1. **UI Foundation** - Frontend setup, design system, components, mock data
2. **Backend & Integration** - Backend setup, API implementation, integration

**Action:**
Update `state/progress.json`:
```json
{
  "implementation_order": {
    "selected": "frontend_first",
    "set_at": "<timestamp>",
    "current_phase": 1
  }
}
```

### `/config order backend`
Set implementation order to **Backend First**.

**Description:** Build APIs and data layer first, then add UI.

**Phases:**
1. **API & Data Layer** - Backend setup, database, APIs, authentication
2. **Frontend Integration** - Frontend setup, API client, UI implementation

**Action:**
Update `state/progress.json`:
```json
{
  "implementation_order": {
    "selected": "backend_first",
    "set_at": "<timestamp>",
    "current_phase": 1
  }
}
```

### `/config order parallel`
Set implementation order to **Parallel Development**.

**Description:** Develop frontend and backend simultaneously.

**Phases:**
1. **Contract Definition** - API contracts, type definitions, mock setup
2. **Parallel Implementation** - Frontend and backend in parallel
3. **Integration** - Connect and test together

**Action:**
Update `state/progress.json`:
```json
{
  "implementation_order": {
    "selected": "parallel",
    "set_at": "<timestamp>",
    "current_phase": 1
  }
}
```

### `/config order links`
Display reference documentation links for the current implementation order.

**Example Output (frontend_first):**

```
=== Frontend First - Reference Links ===

Frontend Frameworks:
  - React: https://react.dev/learn
  - Next.js: https://nextjs.org/docs
  - Vue.js: https://vuejs.org/guide/introduction.html

Styling:
  - Tailwind CSS: https://tailwindcss.com/docs
  - shadcn/ui: https://ui.shadcn.com/docs
  - Radix UI: https://www.radix-ui.com/primitives/docs

State Management:
  - Zustand: https://github.com/pmndrs/zustand
  - TanStack Query: https://tanstack.com/query/latest/docs

Mock Data:
  - MSW: https://mswjs.io/docs/
  - Faker.js: https://fakerjs.dev/guide/
```

### `/config order clear`
Clear implementation order setting (reset to null).

**Action:**
Update `state/progress.json`:
```json
{
  "implementation_order": {
    "selected": null,
    "set_at": null,
    "current_phase": null
  }
}
```

---

## How Implementation Order Works

### Task Prioritization (Stage 05)
When implementation order is set, tasks in Stage 05 (Task Management) are sorted based on the selected approach:

**Frontend First Priority:**
- High: UI, component, page, layout, style, form
- Medium: API client, fetch, mock
- Low: Backend, database, server

**Backend First Priority:**
- High: Database, schema, API, endpoint, server
- Medium: Middleware, auth, validation
- Low: UI, component, style

**Parallel:**
- No automatic sorting (maintain original order)

### Reference Links Integration
Each implementation order includes curated reference links for:
- Frameworks
- Styling/UI libraries
- State management
- Database/ORM
- Authentication
- API design

Use `/config order links` to display relevant links.

---

## Configuration Files

| File | Description |
|------|-------------|
| `config/pipeline.yaml` | Pipeline and sprint configuration |
| `config/implementation_order.yaml` | Implementation order definitions |
| `config/epic_cycles.yaml` | Epic cycle settings |
| `state/progress.json` | Current configuration state |

---

## Best Practices

1. **Set implementation order before Stage 05** - Ensures proper task sorting
2. **Use reference links** - Leverage curated documentation for faster development
3. **Stick with chosen order** - Changing mid-project can cause confusion
4. **Consider team structure** - Parallel is best for larger, specialized teams
