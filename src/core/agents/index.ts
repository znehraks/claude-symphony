/**
 * Agent Module
 * Sub-agent spawning and management using Task Tool
 */

export { spawnAgent } from './task-spawner.js';
export { AgentRegistry } from './registry.js';
export { buildAgentPrompt, getAgentConfig, parseAgentOutput } from './spawner-helper.js';
export type {
  AgentDefinition,
  AgentContext,
  AgentResult,
  SpawnOptions,
  AgentRegistryEntry,
} from './types.js';
