/**
 * Task Tool-based agent spawner
 * Replaces Agent SDK wrapper with Claude Code native Task tool
 */
import { AgentRegistry } from './registry.js';
import type { AgentContext, AgentResult, AgentDefinition } from './types.js';
import { logInfo, logError, logWarning } from '../../utils/logger.js';
import { resolveToTier } from '../models/registry.js';

/**
 * Spawn agent using Claude Code's Task tool
 *
 * Note: This implementation demonstrates the architecture for Task tool integration.
 * In production, the actual Task tool call will be executed through Claude Code's
 * native runtime environment.
 */
export async function spawnAgent(
  agentName: string,
  context: AgentContext,
  mode: 'foreground' | 'background' = 'foreground'
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    // Load agent definition from registry
    const registry = new AgentRegistry(context.projectRoot);
    const agentDef = await registry.loadAgent(agentName);

    // Build prompt with context injection
    const prompt = buildPromptWithContext(agentDef, context);

    logInfo(`Spawning ${mode} agent: ${agentName}`);

    // In a real implementation, this would call Claude Code's Task tool directly
    // For now, we simulate the behavior with a placeholder
    const taskResult = await executeTaskTool({
      subagent_type: agentName,
      prompt,
      description: agentDef.description,
      run_in_background: mode === 'background',
      model: mapModelName(agentDef.model),
    });

    const duration = Date.now() - startTime;
    logInfo(`Agent ${agentName} completed in ${duration}ms`);

    return parseAgentResult(taskResult, mode, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`Agent ${agentName} failed after ${duration}ms: ${error}`);
    return {
      success: false,
      mode,
      errors: [String(error)],
    };
  }
}

/**
 * Build prompt with injected context variables
 */
function buildPromptWithContext(agentDef: AgentDefinition, context: AgentContext): string {
  let prompt = agentDef.prompt;

  // Replace context variables
  if (context.stage !== undefined) {
    prompt = prompt.replace(/\{\{STAGE_ID\}\}/g, context.stage);
  }
  if (context.projectRoot !== undefined) {
    prompt = prompt.replace(/\{\{PROJECT_ROOT\}\}/g, context.projectRoot);
  }

  // Add custom context data
  if (context.data && Object.keys(context.data).length > 0) {
    prompt += '\n\n## Context Data\n';
    for (const [key, value] of Object.entries(context.data)) {
      prompt += `\n**${key}**: ${JSON.stringify(value, null, 2)}`;
    }
  }

  return prompt;
}

/**
 * Map user-facing role names to Task tool model identifiers.
 * "reasoning" → "opus", "balanced" → "sonnet", "fast" → "haiku"
 */
function mapModelName(model?: string): string | undefined {
  return resolveToTier(model);
}

/**
 * Parse Task tool result into AgentResult
 */
function parseAgentResult(taskResult: any, mode: string, duration: number): AgentResult {
  const baseResult = {
    success: taskResult.success || false,
    mode: mode as 'foreground' | 'background',
    result: taskResult.output,
    agentId: taskResult.task_id,
    summary: {
      duration_ms: duration,
      num_turns: taskResult.num_turns || 0,
      total_cost_usd: taskResult.total_cost_usd || 0,
    },
  };

  // Add errors array if task failed
  if (!taskResult.success && taskResult.error) {
    return {
      ...baseResult,
      errors: [taskResult.error],
    };
  }

  return baseResult;
}

/**
 * Execute Task tool via file-based communication
 *
 * Since we're running inside Claude Code, we can't directly call the Task tool API.
 * Instead, we use a file-based approach:
 * 1. Write task request to a file
 * 2. Request the user to execute the task
 * 3. Wait for result file to be written
 *
 * For now, this remains a limitation that requires the Task tool to be invoked
 * from the main Claude Code context, not from within TypeScript code.
 *
 * @internal - Exported for testing purposes only
 */
export async function executeTaskTool(params: {
  subagent_type: string;
  prompt: string;
  description: string;
  run_in_background: boolean;
  model?: string;
}): Promise<any> {
  // This is the architectural limitation: TypeScript code cannot directly spawn
  // Claude Code Task tools. The Task tool must be called from the main Claude Code
  // session context.
  //
  // Solution: The CLI/hooks that call spawnAgent() should actually be using
  // the Task tool directly in their implementation, not calling this TypeScript function.
  //
  // For fallback/testing purposes, return a mock result
  logWarning(
    'Task tool cannot be directly invoked from TypeScript code. ' +
    'Use Claude Code\'s Task tool directly from the main session instead.'
  );

  return {
    success: false,
    output: JSON.stringify({
      stage: 'unknown',
      timestamp: new Date().toISOString(),
      totalChecks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      score: 0.0,
      checks: [],
      note: 'Mock result — Task tool must be invoked from main Claude Code session. Returning failure to force legacy validation fallback.',
    }),
    task_id: `${params.subagent_type}-${Date.now()}`,
    num_turns: 0,
    total_cost_usd: 0,
  };
}
