# Smart HANDOFF - Contextual Summarization

## Auto Summary Generation

### 1. Completed Work → Key Achievements

**Input**: Detailed task list
**Output**: Compressed achievement summary

```markdown
## Transformation Example

### Before (Detailed)
- [x] Create UserService class
- [x] Implement login method
- [x] Implement signup method
- [x] Add password hash handling
- [x] Add error handling

### After (Compressed)
✅ **User authentication system implementation complete**
- UserService: login/signup/password hash
```

### 2. File Changes → Impact Analysis

```markdown
## Impact Analysis Template

### High Impact Changes
| File | Change | Impact Scope |
|------|--------|--------------|
| src/auth/UserService.ts | New | All authentication |

### Low Impact Changes
- Config file updates (3)
- Test file additions (2)
```

### 3. Decisions → Structured Record

```markdown
## Decision Record Format

### 🔷 [Decision Title]
- **Decision**: [Final choice]
- **Reason**: [Core rationale in 1-2 sentences]
- **Impact**: [Affected areas]
```

### 4. Next Steps → Immediately Actionable Format

```markdown
## Next Steps Format

### Immediate Actions (On next session start)
1. `npm install` - Install dependencies
2. Resume work in `src/components/` directory
3. Implement UserProfile component

### References Needed
- Architecture: `stages/03-planning/outputs/architecture.md`
- Design: `stages/04-ui-ux/outputs/design_system.md`
```

## Stage-Specific Summary Focus

### 01-brainstorm
- **Emphasize**: Ideas, requirements
- **Minimize**: Technical details

### 06-implementation
- **Emphasize**: Code changes, technical decisions
- **Minimize**: Ideas/planning

### 08-qa
- **Emphasize**: Bugs, test results
- **Minimize**: Plan details

## Compression Ratios

| Original Tokens | Target Compression | Max Tokens |
|-----------------|-------------------|------------|
| < 2000 | 100% | 2000 |
| 2000-5000 | 50% | 2500 |
| 5000-10000 | 30% | 3000 |
| > 10000 | 25% | 4000 |

## Quality Verification

Generated summary verification criteria:
- **Clarity**: No ambiguous expressions
- **Completeness**: No missing key information
- **Actionability**: Next steps are specific
