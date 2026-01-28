# End-User Workflow: Sub-Agent Integration

## Overview

This document explains how sub-agent integration changes the user experience in claude-symphony. The focus is on **what changed for you** as a user, not the technical implementation details.

**Key Takeaway**: Your commands stay the same, but you get better context management and smarter validation.

---

## What Changed for Users

### Commands Remain Identical

```bash
# Before v0.2.14
$ /validate

# After v0.2.14+
$ /validate   # Same command, better results
```

You don't need to learn new commands or change your workflow.

### Internal Improvements

While your workflow stays the same, these improvements happen automatically:

1. **Context Preservation**: Validation runs in a separate context, preserving your main session
2. **Intelligent Analysis**: AI reasoning helps identify why issues exist, not just what failed
3. **Automatic History**: Results are saved to `state/validations/` for future reference
4. **Graceful Degradation**: If agent fails, automatically falls back to legacy validation

---

## Before/After Comparison

### /validate Command Behavior

| Aspect | Before (v0.2.12) | After (v0.2.14+) |
|--------|------------------|------------------|
| **Command** | `/validate` | `/validate` (unchanged) |
| **Execution** | Main session directly | Validation Agent (separate context) |
| **Context Impact** | Uses 5-8% of main session | 0% main session impact |
| **Validation Quality** | File checks + commands | AI reasoning + checks + commands |
| **Results** | Console output only | Console + saved JSON file |
| **On Failure** | Shows error | Auto-fallback to legacy method |
| **Analysis Depth** | "File too small" | "Why it's small & what's missing" |

### Stage Transition Workflow

**Before v0.2.14:**
```
User: /next
  ↓
Check HANDOFF.md exists
  ↓
Run validation (in main session)
  ↓  [Uses 5-8% context]
  ↓
Pass/Fail → Continue/Block
```

**After v0.2.14:**
```
User: /next
  ↓
Check HANDOFF.md exists
  ↓
Spawn Validation Agent (separate context)
  ↓  [Uses 0% main context]
  ↓  [Agent failure? → Auto-fallback to legacy]
  ↓
Pass/Fail → Continue/Block
```

---

## User-Visible Benefits

### 1. Context Preservation

**Real-World Scenario**: You're implementing features in Stage 06 and have 45% context remaining.

**Before v0.2.14:**
```
Working on code: 45% context remaining
  ↓
Run /validate to check progress
  ↓
Validation uses 5-8% context
  ↓
Result: 37-40% remaining ⚠️
  ↓
Might need /clear soon
```

**After v0.2.14:**
```
Working on code: 45% context remaining
  ↓
Run /validate to check progress
  ↓
Agent runs in separate context
  ↓
Result: 45% remaining ✨
  ↓
Keep working without interruption
```

**Impact**: You can validate more frequently without worrying about context exhaustion.

---

### 2. Validation History

**Before v0.2.14:**
```bash
$ /validate
✅ Validation complete
   - ideas.md: ✓
   - requirements_analysis.md: ✗ (too small)

# Results disappear after scrolling
# No way to review past validations
```

**After v0.2.14:**
```bash
$ /validate
✅ Validation complete
   - Details saved: state/validations/01-brainstorm_20260128_143000.json

$ ls state/validations/
01-brainstorm_20260128_143000.json
01-brainstorm_20260128_154500.json
03-planning_20260128_163000.json

$ cat state/validations/01-brainstorm_20260128_143000.json
{
  "timestamp": "2026-01-28T14:30:00Z",
  "stage": "01-brainstorm",
  "passed": 6,
  "failed": 2,
  "checks": [...]
}
```

**Impact**: Track validation progress over time and review past issues.

---

### 3. Intelligent Analysis

**Before v0.2.14 (Simple checks):**
```bash
$ /validate

❌ Failed checks:
- ideas.md: File size 300 bytes (required: 500 bytes minimum)
- requirements_analysis.md: Missing section
```

**After v0.2.14 (AI-powered analysis):**
```bash
$ /validate

❌ Failed checks:
- ideas.md: Insufficient content (300 < 500 bytes)

  Analysis: The ideas section appears incomplete. Most ideas lack:
  - Detailed technical approach
  - Risk assessment
  - Resource requirements

  Suggestion: Expand each idea with:
  - Implementation strategy (2-3 paragraphs)
  - Potential challenges and solutions
  - Required technologies and team size

- requirements_analysis.md: Missing "Non-functional Requirements" section

  Analysis: Functional requirements are well-defined, but system
  qualities (performance, security, scalability) are not specified.

  Suggestion: Add section with:
  - Performance targets (response time, throughput)
  - Security requirements (authentication, authorization)
  - Scalability expectations (concurrent users, data volume)
```

**Impact**: Understand not just what failed, but why and how to fix it.

---

### 4. Graceful Degradation

**Scenario: Agent Fails to Execute**

```bash
$ /validate

🤖 Spawning validation-agent...
⚠️ Agent execution failed (timeout or error)
🔄 Falling back to legacy validation...

✅ Validation complete (legacy mode)
   - Passed: 6/8 checks
   - Failed: 2/8 checks

Note: Agent validation unavailable, used traditional method.
Results are still reliable.
```

**Impact**: You always get validation results, even if agent system has issues.

---

## Usage Examples

### Example 1: Successful Validation

```bash
$ /validate

🤖 Spawning validation-agent...
✅ Validation complete

Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
  Passed: 8/8 checks
  Failed: 0/8 checks
  Score: 1.0/1.0
  Status: READY FOR TRANSITION ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checked Files:
  ✓ ideas.md (2.4 KB)
  ✓ requirements_analysis.md (3.1 KB)
  ✓ tech_stack_recommendations.md (1.8 KB)
  ✓ project_structure.md (2.2 KB)
  ✓ risk_assessment.md (1.5 KB)
  ✓ initial_timeline.md (1.1 KB)
  ✓ stakeholder_identification.md (900 bytes)
  ✓ success_criteria.md (1.3 KB)

📁 Details: state/validations/01-brainstorm_20260128_143000.json

You may proceed with /next
```

---

### Example 2: Validation with Issues

```bash
$ /validate

🤖 Spawning validation-agent...
⚠️ Issues found

Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
  Passed: 6/8 checks
  Failed: 2/8 checks
  Score: 0.75/1.0
  Status: BLOCKED ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Blocking Issues (must fix):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ideas.md
   ✗ Insufficient content (300 bytes < 500 bytes required)

   The brainstormed ideas lack depth. Each idea should include:
   - Problem statement (what user pain point does this solve?)
   - Proposed solution (high-level technical approach)
   - Estimated complexity (simple/moderate/complex)
   - Success metrics (how do we measure if this works?)

   Current ideas are 1-2 sentences each. Expand to 1-2 paragraphs.

2. requirements_analysis.md
   ✗ Missing required section: "Non-functional Requirements"

   While functional requirements are well-documented, system qualities
   are not defined. Add section covering:

   ## Non-functional Requirements
   - Performance (target response times, throughput)
   - Security (authentication, authorization, data protection)
   - Scalability (expected user growth, data volume)
   - Reliability (uptime targets, error handling)
   - Maintainability (code quality, documentation standards)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Details: state/validations/01-brainstorm_20260128_143000.json

Please fix issues above before running /next
```

---

### Example 3: Agent Failure with Auto-Fallback

```bash
$ /validate

🤖 Spawning validation-agent...
⚠️ Agent execution failed (timeout after 30s)
🔄 Falling back to legacy validation...

✅ Validation complete (legacy mode)

Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
  Passed: 6/8 checks
  Failed: 2/8 checks
  Score: 0.75/1.0
  Status: BLOCKED ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues:
  ✗ ideas.md: File size too small (300 < 500 bytes)
  ✗ requirements_analysis.md: Missing section "Non-functional"

Note: Used legacy validation (agent unavailable).
Results are still accurate but lack detailed AI analysis.

Please fix issues above before running /next
```

---

## When to Use /validate

### Recommended Times ✅

| Scenario | Why |
|----------|-----|
| **Before /next** | Ensure outputs meet requirements before stage transition |
| **After major deliverables** | Verify completeness when finishing key documents |
| **Mid-stage checkpoint** | Check progress without consuming main context |
| **Uncertainty** | Verify if you're on the right track |

### Not Required ❌

| Scenario | Why |
|----------|-----|
| **During active development** | Will be validated automatically at transition |
| **Every small change** | Over-validation wastes time |
| **After /validate just passed** | No need to re-validate immediately |

---

## Checking Past Validation Results

### List All Validations

```bash
$ ls -lh state/validations/

-rw-r--r-- 1 user staff 2.1K Jan 28 14:30 01-brainstorm_20260128_143000.json
-rw-r--r-- 1 user staff 1.8K Jan 28 15:45 01-brainstorm_20260128_154500.json
-rw-r--r-- 1 user staff 2.4K Jan 28 16:30 03-planning_20260128_163000.json
```

### View Specific Result

```bash
$ cat state/validations/01-brainstorm_20260128_143000.json | jq '.'

{
  "timestamp": "2026-01-28T14:30:00Z",
  "stage": "01-brainstorm",
  "passed": 6,
  "failed": 2,
  "score": 0.75,
  "checks": [
    {
      "file": "ideas.md",
      "status": "failed",
      "reason": "Insufficient content (300 < 500 bytes)",
      "suggestion": "Expand ideas with technical details and risk assessment"
    },
    {
      "file": "requirements_analysis.md",
      "status": "failed",
      "reason": "Missing section: Non-functional Requirements",
      "suggestion": "Add section covering performance, security, scalability"
    }
  ]
}
```

### Track Progress Over Time

```bash
# Compare validation scores over time
$ for file in state/validations/*.json; do
    echo "$file: $(jq -r '.score' $file)"
  done

01-brainstorm_20260128_143000.json: 0.75
01-brainstorm_20260128_154500.json: 0.88
03-planning_20260128_163000.json: 1.0
```

---

## Configuration (Optional)

### Disabling Sub-Agents

Most users should keep sub-agents enabled for better context management.

If needed, disable in `config/output_validation.yaml`:

```yaml
# config/output_validation.yaml
validation:
  use_agent: false  # Falls back to legacy validation

  # Agent remains available, just not used by default
  # You can still manually test with:
  # /validate --agent (force agent)
  # /validate --legacy (force legacy)
```

**When to disable**:
- Agent consistently times out in your environment
- You prefer simpler validation without AI analysis
- Debugging validation logic (legacy is easier to trace)

**When to keep enabled** (recommended):
- Default for all users
- Better context preservation
- More helpful error messages

---

## Current Sub-Agents

| Agent | Purpose | Auto-Used By | Context Impact |
|-------|---------|--------------|----------------|
| **validation-agent** | Validate stage outputs | `/validate`, `/next` | None (separate context) |

### Coming Soon

Future sub-agents planned:

- **synthesis-agent**: Consolidate parallel AI outputs (Stage 01, 03, 04, 07, 09)
- **transition-agent**: Automate stage transition workflow
- **checkpoint-agent**: Intelligent checkpoint creation with impact analysis

---

## Troubleshooting

### Agent Always Times Out

```bash
$ /validate

🤖 Spawning validation-agent...
⚠️ Agent execution failed (timeout after 30s)
🔄 Falling back to legacy validation...
```

**Solutions**:
1. Check system resources (CPU, memory)
2. Increase timeout in `config/output_validation.yaml`:
   ```yaml
   agent:
     timeout: 60000  # 60 seconds instead of 30
   ```
3. Disable agent if persistent: `use_agent: false`

---

### Results Not Saved

```bash
$ /validate
✅ Validation complete
# But no file in state/validations/
```

**Solutions**:
1. Check directory exists: `mkdir -p state/validations`
2. Check permissions: `ls -la state/`
3. Check config: `cat config/output_validation.yaml | grep save_results`

---

### Want More Detailed Output

```bash
# Run validation with verbose output
$ /validate --verbose

# Or check saved JSON for full details
$ cat state/validations/$(ls -t state/validations/ | head -1) | jq '.'
```

---

## Summary

### What Changed ✨

| Aspect | Impact |
|--------|--------|
| **Internal execution** | Agent runs in separate context |
| **Context efficiency** | Main session preserved (0% usage) |
| **Result storage** | Automatic JSON save with history |
| **Analysis quality** | AI-powered insights and suggestions |
| **Reliability** | Auto-fallback ensures validation always works |

### What Stayed the Same ✅

| Aspect | Details |
|--------|---------|
| **Commands** | `/validate` unchanged |
| **Usage** | Same workflow, same syntax |
| **Validation criteria** | Same requirements, same thresholds |
| **Output format** | Console output looks similar |

### Key Benefits 🎯

| Benefit | Description |
|---------|-------------|
| **Context preservation** | Run `/validate` freely without impacting main session |
| **Validation history** | Review past results and track progress |
| **Intelligent feedback** | Understand why issues exist and how to fix them |
| **No action required** | Improvements are automatic, no workflow changes needed |
| **Always works** | Auto-fallback ensures reliability |

---

## Conclusion

**For Users**: You don't need to change anything. Your commands work the same, but internally you get better context management and smarter validation.

**The Win**: Validate as often as you want without worrying about context consumption. Get helpful AI analysis explaining not just what failed, but why and how to fix it.

**Next Steps**:
1. Continue using `/validate` as before
2. Check `state/validations/` to review past results
3. Enjoy preserved context and helpful suggestions
4. Report any issues if agent consistently fails
