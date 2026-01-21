# Notion Integration Guide

> claude-symphony Task Management - Notion Database Integration

## Important Notes (Issue #5, #6, #8, #16 Resolution)

### Sequential Creation Required

When creating tasks via Notion API, **tasks must be created one at a time sequentially**.

```
❌ Incorrect (parallel creation)
Promise.all([
  createTask("Task 1"),
  createTask("Task 2"),
  createTask("Task 3")
])

✅ Correct (sequential creation)
await createTask("Task 1", { order: 1 })
await createTask("Task 2", { order: 2 })
await createTask("Task 3", { order: 3 })
```

### Status Field Required

All tasks must include the `Status` field.
- Default: `To Do`
- Explicitly specify when creating

### Sorting with Order Field

Notion database View sorting must be configured manually:

1. Open database View
2. Click `Sort`
3. Select `Order` field
4. Set to `Ascending` order

---

## Database Creation Procedure

### 1. Create Database

```javascript
// MCP Notion tool usage example
await notion.createDatabase({
  parent: { page_id: "PROJECT_PAGE_ID" },
  title: [{ text: { content: "Project Tasks" } }],
  properties: {
    "Task Name": { title: {} },
    "Status": {
      select: {
        options: [
          { name: "To Do", color: "gray" },
          { name: "In Progress", color: "blue" },
          { name: "Review", color: "yellow" },
          { name: "Done", color: "green" },
          { name: "Blocked", color: "red" }
        ]
      }
    },
    "Priority": {
      select: {
        options: [
          { name: "High", color: "red" },
          { name: "Medium", color: "yellow" },
          { name: "Low", color: "green" }
        ]
      }
    },
    "Order": { number: { format: "number" } },
    "Sprint": {
      select: {
        options: [
          { name: "Sprint 1" },
          { name: "Sprint 2" },
          { name: "Sprint 3" }
        ]
      }
    },
    "Assignee": { rich_text: {} },
    "Estimate": { rich_text: {} },
    "Due Date": { date: {} },
    "Depends On": { rich_text: {} },
    "Stage": {
      select: {
        options: [
          { name: "06-implementation" },
          { name: "07-refactoring" },
          { name: "08-qa" },
          { name: "09-testing" }
        ]
      }
    }
  }
})
```

### 2. Create Tasks (Sequential)

```javascript
// Task list
const tasks = [
  { name: "Project initial setup", priority: "High" },
  { name: "Basic UI component implementation", priority: "High" },
  { name: "API integration", priority: "Medium" },
  // ...
];

// Sequential creation (important!)
for (let i = 0; i < tasks.length; i++) {
  await notion.createPage({
    parent: { database_id: "DATABASE_ID" },
    properties: {
      "Task Name": { title: [{ text: { content: tasks[i].name } }] },
      "Status": { select: { name: "To Do" } },  // Required!
      "Priority": { select: { name: tasks[i].priority } },
      "Order": { number: i + 1 }  // Order guaranteed!
    }
  });

  // Short delay to ensure order
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

---

## View Settings (Manual)

Must be configured directly in Notion UI:

### Board View Setup
1. Click `+ Add a view`
2. Select `Board`
3. Set `Group by` → `Status`

### List View Sort Setup
1. Click `...` in View
2. Select `Sort`
3. Click `+ Add a sort`
4. Set `Order` → `Ascending`

### Filter Setup (Optional)
1. Click `Filter`
2. Add `Status` `is not` `Done`

---

## Checklist

- [ ] Database creation complete
- [ ] Status field included
- [ ] Order field included
- [ ] Sequential task creation complete
- [ ] Board View setup (Status grouping)
- [ ] List View sort setup (Order ascending)

---

## Troubleshooting

### Tasks are out of order
1. Check `Order` sort in List View
2. Fix tasks with missing Order values
3. Reassign Order values if needed

### Status field missing
1. Add `Status` in database properties
2. Assign Status values to existing tasks

### View sort not saving
1. Check if it's a saved View
2. Verify `...` → `Lock database` is disabled
