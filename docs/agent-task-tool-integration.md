# Agent Task Tool Integration Guide

## Architecture Overview

The claude-symphony sub-agent system uses **Claude Code's native Task tool** to spawn agents in isolated contexts.

### Key Principles

1. **TypeScript code CANNOT directly invoke the Task tool**
   - Task tool is part of Claude Code's runtime, not available to compiled TypeScript
   - Attempting to call Task tool from Node.js will fail

2. **Claude Code (the AI) invokes the Task tool**
   - When a hook/command needs an agent, it returns a status that signals Claude Code
   - Claude Code reads the signal and invokes the Task tool
   - Result is written back for TypeScript to read

3. **Agents run in completely isolated contexts**
   - 0% main session context usage
   - Agent has own tools, own context window
   - Only receives context via prompt parameters

## Implementation Pattern

### Pattern 1: Direct Task Tool Invocation (from Claude Code)

When Claude Code needs to run an agent (e.g., user runs `/validate`):

```
User: /validate
Claude Code: I'll spawn the validation-agent to check stage outputs.
[Claude Code calls Task tool directly]
```

Task tool invocation:
```typescript
Task({
  subagent_type: "validation-agent",
  prompt: `
# Validation Task

Validate stage outputs for: {{STAGE_ID}}
Project root: {{PROJECT_ROOT}}

## Validation Rules
${JSON.stringify(validationRules, null, 2)}

Follow your instructions in validation-agent/CLAUDE.md to perform validation checks.
Return a ValidationSummary JSON object.
  `,
  description: "Validate stage outputs",
  model: "sonnet",
  run_in_background: false
});
```

### Pattern 2: File-Based Communication (from TypeScript hooks)

When a TypeScript hook needs an agent (e.g., post-stage-transition.sh):

**Step 1**: Hook detects agent is needed
```typescript
// src/hooks/output-validator.ts
if (useAgent && agentExists) {
  // Write request file
  const requestPath = path.join(projectRoot, 'state', 'agent-requests', 'validation-request.json');
  await writeJson(requestPath, {
    agent: 'validation-agent',
    context: { projectRoot, stage: stageId, data: { validationRules } },
    requestedAt: new Date().toISOString()
  });

  // Signal Claude Code that agent is needed
  console.log('[AGENT_REQUEST] validation-agent');
  return { pending: true, requestPath };
}
```

**Step 2**: Claude Code detects signal and invokes Task tool
```
[Sees AGENT_REQUEST signal in hook output]
Claude Code: I'll spawn the validation-agent.
[Calls Task tool]
[Waits for agent to complete]
[Writes result to state/agent-results/validation-result.json]
```

**Step 3**: Hook continues after result is ready
```typescript
// Hook checks for result file
const resultPath = path.join(projectRoot, 'state', 'agent-results', 'validation-result.json');
if (existsSync(resultPath)) {
  const result = await readJson<AgentResult>(resultPath);
  // Process result...
}
```

## Current Implementation Status

### ✅ Complete
- Agent definitions (14 agents with CLAUDE.md + agent.json)
- Agent registry (loads agent definitions)
- Type system (AgentContext, AgentResult, etc.)

### 🔄 In Progress
- Task tool integration pattern
- File-based communication for hooks
- Signal detection system

### ❌ Not Implemented
- Background agent monitoring
- Agent result caching
- Multi-agent orchestration

## Testing the Validation Agent

To test the validation-agent manually:

1. Create a mock stage output:
```bash
mkdir -p stages/01-brainstorm/outputs
echo "# Ideas\n\n1. Idea 1\n2. Idea 2\n3. Idea 3\n4. Idea 4\n5. Idea 5" > stages/01-brainstorm/outputs/ideas.md
```

2. Run agent via Claude Code:
```
/validate
```

3. Claude Code will:
   - Spawn validation-agent with stage='01-brainstorm'
   - Agent validates files using Read/Glob tools
   - Agent returns ValidationSummary JSON
   - Result saved to state/validations/

4. Check result:
```bash
cat state/validations/01-brainstorm_*.json
```

## Agent Prompt Template

When spawning an agent, inject context via prompt:

```typescript
function buildAgentPrompt(agent: AgentDefinition, context: AgentContext): string {
  let prompt = agent.prompt; // Load from CLAUDE.md

  // Replace context variables
  prompt = prompt.replace(/\{\{STAGE_ID\}\}/g, context.stage || 'unknown');
  prompt = prompt.replace(/\{\{PROJECT_ROOT\}\}/g, context.projectRoot);

  // Append custom data
  if (context.data) {
    prompt += '\n\n## Context Data\n';
    for (const [key, value] of Object.entries(context.data)) {
      prompt += `\n**${key}**:\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;
    }
  }

  return prompt;
}
```

## Extended Thinking

All agents have `extendedThinking: true` in their agent.json. This enables:
- Deep analysis of validation failures
- Understanding of complex architectural issues
- Reasoning about synthesis tradeoffs

The Task tool should pass `extendedThinking: true` parameter when spawning agents.

## MCP Server Integration

Some agents need MCP servers:
- `test-execution-agent`: Needs playwright MCP
- `research-analysis-agent`: Needs exa/context7 MCP

The Task tool should pass `mcpServers` array from agent.json.

## Next Steps

1. **Implement file-based signaling** in hooks
2. **Update Claude Code detection logic** to watch for [AGENT_REQUEST] signals
3. **Create agent result writer** that saves Task tool output to state/
4. **Test with validation-agent** on real project
5. **Measure context savings** (should be 0% in main session)

## Example: Complete Validation Flow

```
User runs: /validate

→ Claude Code invokes: symphony-validate command
→ src/cli/validate.ts runs
→ Calls: runOutputValidation(projectRoot, stageId, useAgent=true)
→ src/hooks/output-validator.ts detects agent mode
→ Writes: state/agent-requests/validation-request.json
→ Prints: [AGENT_REQUEST] validation-agent
→ Exits with pending status

→ Claude Code sees [AGENT_REQUEST] signal
→ Claude Code reads: state/agent-requests/validation-request.json
→ Claude Code spawns Task tool:
   - subagent_type: "validation-agent"
   - prompt: Built from CLAUDE.md + context
   - model: "sonnet"
   - extendedThinking: true

→ Validation Agent (in isolated context):
   - Reads validation rules from prompt
   - Uses Glob/Read to check files
   - Generates ValidationSummary JSON
   - Returns result

→ Claude Code writes: state/agent-results/validation-result.json
→ Claude Code prints summary to user
→ User sees validation result
```

Total main session context usage: **0%** (agent ran separately)

---

**Conclusion**: The architecture requires Claude Code (the AI) to orchestrate agent spawning, not the TypeScript code. Hooks signal when agents are needed, and Claude Code handles the Task tool invocation.
