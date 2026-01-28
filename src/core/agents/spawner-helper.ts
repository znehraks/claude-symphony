/**
 * Agent Spawner Helper
 *
 * This module provides utilities for Claude Code to spawn agents using the Task tool.
 * It CANNOT be called from TypeScript code - only from Claude Code's runtime context.
 *
 * TypeScript hooks should use the request/response file pattern instead.
 */

import { AgentRegistry } from './registry.js';
import type { AgentContext, AgentResult } from './types.js';
import { logInfo, logWarning } from '../../utils/logger.js';

/**
 * Build agent prompt with context injection
 *
 * This function prepares the prompt that Claude Code will pass to the Task tool.
 * It replaces context variables and appends custom data.
 */
export function buildAgentPrompt(
  agentName: string,
  projectRoot: string,
  context: AgentContext
): string {
  const registry = new AgentRegistry(projectRoot);

  try {
    // Load agent definition (synchronous for simplicity)
    const agentDef = registry.loadAgentSync(agentName);

    let prompt = agentDef.prompt;

    // Replace context variables
    if (context.stage) {
      prompt = prompt.replace(/\{\{STAGE_ID\}\}/g, context.stage);
    }
    if (context.projectRoot) {
      prompt = prompt.replace(/\{\{PROJECT_ROOT\}\}/g, context.projectRoot);
    }

    // Append custom context data
    if (context.data && Object.keys(context.data).length > 0) {
      prompt += '\n\n## Context Data\n\n';
      for (const [key, value] of Object.entries(context.data)) {
        prompt += `**${key}**:\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\n`;
      }
    }

    return prompt;
  } catch (error) {
    logWarning(`Failed to build agent prompt: ${error}`);
    throw error;
  }
}

/**
 * Get agent configuration for Task tool
 *
 * Returns the configuration needed to spawn an agent via Task tool.
 * Claude Code should use this to prepare Task tool parameters.
 */
export function getAgentConfig(
  agentName: string,
  projectRoot: string
): {
  model?: string;
  tools?: string[];
  extendedThinking?: boolean;
  mcpServers?: string[];
  executionMode?: 'foreground' | 'background';
} {
  const registry = new AgentRegistry(projectRoot);

  try {
    const agentDef = registry.loadAgentSync(agentName);

    return {
      model: agentDef.model === 'inherit' ? undefined : agentDef.model,
      tools: agentDef.tools,
      extendedThinking: agentDef.extendedThinking,
      mcpServers: agentDef.mcpServers,
      executionMode: agentDef.executionMode || 'foreground',
    };
  } catch (error) {
    logWarning(`Failed to get agent config: ${error}`);
    throw error;
  }
}

/**
 * Parse agent result from Task tool output
 *
 * Extracts JSON from agent's response (may be wrapped in markdown).
 */
export function parseAgentOutput<T = any>(taskOutput: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = taskOutput.match(/```json\n([\s\S]*?)\n```/);
  const jsonStr = jsonMatch && jsonMatch[1] ? jsonMatch[1] : taskOutput;

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    // If parsing fails, try to find JSON object in text
    const objectMatch = taskOutput.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }
    throw new Error(`Failed to parse agent output as JSON: ${error}`);
  }
}

/**
 * Example usage for Claude Code:
 *
 * ```typescript
 * import { buildAgentPrompt, getAgentConfig } from './spawner-helper.js';
 *
 * // Prepare agent
 * const prompt = buildAgentPrompt('validation-agent', '/path/to/project', {
 *   projectRoot: '/path/to/project',
 *   stage: '01-brainstorm',
 *   data: { validationRules: {...} }
 * });
 *
 * const config = getAgentConfig('validation-agent', '/path/to/project');
 *
 * // Claude Code then calls Task tool:
 * const result = await Task({
 *   subagent_type: 'validation-agent',
 *   prompt: prompt,
 *   description: 'Validate stage outputs',
 *   model: config.model,
 *   run_in_background: config.executionMode === 'background'
 * });
 *
 * // Parse result
 * const summary = parseAgentOutput(result.output);
 * ```
 */

// Add synchronous version of loadAgent for prompt building
declare module './registry.js' {
  interface AgentRegistry {
    loadAgentSync(agentName: string): import('./types.js').AgentDefinition;
  }
}
