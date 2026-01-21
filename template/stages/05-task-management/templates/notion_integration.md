# Notion 연동 가이드

> claude-symphony 태스크 관리 - Notion 데이터베이스 연동

## 주의사항 (Issue #5, #6, #8, #16 해결)

### ⚠️ 순차 생성 필수

Notion API로 태스크를 생성할 때 **반드시 하나씩 순차적으로** 생성해야 합니다.

```
❌ 잘못된 방식 (병렬 생성)
Promise.all([
  createTask("태스크 1"),
  createTask("태스크 2"),
  createTask("태스크 3")
])

✅ 올바른 방식 (순차 생성)
await createTask("태스크 1", { order: 1 })
await createTask("태스크 2", { order: 2 })
await createTask("태스크 3", { order: 3 })
```

### ⚠️ Status 필드 필수

모든 태스크는 반드시 `Status` 필드를 포함해야 합니다.
- 기본값: `To Do`
- 생성 시 명시적으로 지정

### ⚠️ Order 필드로 정렬

Notion 데이터베이스 View 정렬은 수동으로 설정해야 합니다:

1. 데이터베이스 View 열기
2. `Sort` 클릭
3. `Order` 필드 선택
4. `Ascending` 정렬

---

## 데이터베이스 생성 절차

### 1. 데이터베이스 생성

```javascript
// MCP Notion 도구 사용 예시
await notion.createDatabase({
  parent: { page_id: "프로젝트_페이지_ID" },
  title: [{ text: { content: "프로젝트명 Tasks" } }],
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

### 2. 태스크 생성 (순차적)

```javascript
// 태스크 목록
const tasks = [
  { name: "프로젝트 초기 설정", priority: "High" },
  { name: "기본 UI 컴포넌트 구현", priority: "High" },
  { name: "API 연동", priority: "Medium" },
  // ...
];

// 순차 생성 (중요!)
for (let i = 0; i < tasks.length; i++) {
  await notion.createPage({
    parent: { database_id: "데이터베이스_ID" },
    properties: {
      "Task Name": { title: [{ text: { content: tasks[i].name } }] },
      "Status": { select: { name: "To Do" } },  // 필수!
      "Priority": { select: { name: tasks[i].priority } },
      "Order": { number: i + 1 }  // 순서 보장!
    }
  });

  // 순서 보장을 위한 짧은 대기
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

---

## View 설정 (수동)

Notion UI에서 직접 설정해야 합니다:

### Board View 설정
1. `+ Add a view` 클릭
2. `Board` 선택
3. `Group by` → `Status` 선택

### List View 정렬 설정
1. View에서 `...` 클릭
2. `Sort` 선택
3. `+ Add a sort`
4. `Order` → `Ascending` 선택

### 필터 설정 (선택)
1. `Filter` 클릭
2. `Status` `is not` `Done` 추가

---

## 체크리스트

- [ ] 데이터베이스 생성 완료
- [ ] Status 필드 포함 확인
- [ ] Order 필드 포함 확인
- [ ] 태스크 순차 생성 완료
- [ ] Board View 설정 (Status 그룹화)
- [ ] List View 정렬 설정 (Order 오름차순)

---

## 문제 해결

### 태스크 순서가 뒤죽박죽인 경우
1. List View에서 `Order` 정렬 확인
2. Order 값이 누락된 태스크 수정
3. 필요시 Order 값 재할당

### Status 필드가 없는 경우
1. 데이터베이스 속성에서 `Status` 추가
2. 기존 태스크에 Status 값 할당

### View 정렬이 저장되지 않는 경우
1. 해당 View가 저장된 View인지 확인
2. `...` → `Lock database` 해제 확인
