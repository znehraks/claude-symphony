/**
 * Agent Registry
 * Discovers and loads agent definitions from template/.claude/agents/
 */
import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { readFile, readJson } from '../../utils/fs.js';
import { logInfo, logWarning } from '../../utils/logger.js';
import type { AgentDefinition } from './types.js';

/**
 * Agent Registry class
 * Manages agent discovery and loading
 */
export class AgentRegistry {
  private agentsDir: string;
  private cache: Map<string, AgentDefinition> = new Map();

  constructor(projectRoot: string) {
    this.agentsDir = path.join(projectRoot, 'template', '.claude', 'agents');
  }

  /**
   * List all available agent names
   */
  async listAgents(): Promise<string[]> {
    if (!existsSync(this.agentsDir)) {
      logWarning(`Agents directory not found: ${this.agentsDir}`);
      return [];
    }

    const entries = readdirSync(this.agentsDir);
    const agents: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(this.agentsDir, entry);
      const stat = statSync(entryPath);

      if (stat.isDirectory()) {
        // Check if agent.json exists
        const agentJsonPath = path.join(entryPath, 'agent.json');
        if (existsSync(agentJsonPath)) {
          agents.push(entry);
        }
      }
    }

    return agents;
  }

  /**
   * Load agent definition by name
   */
  async loadAgent(agentName: string): Promise<AgentDefinition> {
    // Check cache
    if (this.cache.has(agentName)) {
      return this.cache.get(agentName)!;
    }

    const agentDir = path.join(this.agentsDir, agentName);

    if (!existsSync(agentDir)) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // Load agent.json
    const agentJsonPath = path.join(agentDir, 'agent.json');
    if (!existsSync(agentJsonPath)) {
      throw new Error(`Agent definition not found: ${agentJsonPath}`);
    }

    const agentJson = await readJson<Partial<AgentDefinition>>(agentJsonPath);

    // Load CLAUDE.md (prompt)
    const promptPath = path.join(agentDir, 'CLAUDE.md');
    let prompt: string | null = null;

    if (existsSync(promptPath)) {
      prompt = await readFile(promptPath);
    } else {
      logWarning(`Agent ${agentName} has no CLAUDE.md file`);
    }

    // Ensure agentJson is not null
    if (!agentJson) {
      throw new Error(`Agent definition is null: ${agentJsonPath}`);
    }

    // Build full definition
    const definition: AgentDefinition = {
      name: agentName,
      description: agentJson.description || '',
      prompt: prompt || '',
      tools: agentJson.tools,
      model: agentJson.model,
      permissionMode: agentJson.permissionMode,
      extendedThinking: agentJson.extendedThinking,
      sessionPersistence: agentJson.sessionPersistence,
      mcpServers: agentJson.mcpServers,
      executionMode: agentJson.executionMode || 'foreground',
    };

    // Validate
    this.validateAgent(definition);

    // Cache
    this.cache.set(agentName, definition);

    logInfo(`Loaded agent: ${agentName}`);
    return definition;
  }

  /**
   * Validate agent definition
   */
  private validateAgent(agent: AgentDefinition): void {
    if (!agent.name) {
      throw new Error('Agent name is required');
    }

    if (!agent.description) {
      throw new Error(`Agent ${agent.name}: description is required`);
    }

    if (!agent.prompt) {
      throw new Error(`Agent ${agent.name}: prompt (CLAUDE.md) is required`);
    }

    // Validate model
    if (agent.model && !['sonnet', 'opus', 'haiku', 'inherit'].includes(agent.model)) {
      throw new Error(
        `Agent ${agent.name}: invalid model "${agent.model}". ` +
        `Must be one of: sonnet, opus, haiku, inherit`
      );
    }

    // Validate permission mode
    const validModes = ['default', 'acceptEdits', 'bypassPermissions', 'plan'];
    if (agent.permissionMode && !validModes.includes(agent.permissionMode)) {
      throw new Error(
        `Agent ${agent.name}: invalid permissionMode "${agent.permissionMode}". ` +
        `Must be one of: ${validModes.join(', ')}`
      );
    }

    // Validate execution mode
    if (agent.executionMode && !['foreground', 'background'].includes(agent.executionMode)) {
      throw new Error(
        `Agent ${agent.name}: invalid executionMode "${agent.executionMode}". ` +
        `Must be one of: foreground, background`
      );
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Load agent definition synchronously
   * Used for prompt building in spawner helper
   */
  loadAgentSync(agentName: string): AgentDefinition {
    // Check cache
    if (this.cache.has(agentName)) {
      return this.cache.get(agentName)!;
    }

    const agentDir = path.join(this.agentsDir, agentName);

    if (!existsSync(agentDir)) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // Load agent.json
    const agentJsonPath = path.join(agentDir, 'agent.json');
    if (!existsSync(agentJsonPath)) {
      throw new Error(`Agent definition not found: ${agentJsonPath}`);
    }

    const fs = require('fs');
    const agentJson = JSON.parse(fs.readFileSync(agentJsonPath, 'utf-8')) as Partial<AgentDefinition>;

    // Load CLAUDE.md (prompt)
    const promptPath = path.join(agentDir, 'CLAUDE.md');
    let prompt = '';

    if (existsSync(promptPath)) {
      prompt = fs.readFileSync(promptPath, 'utf-8');
    } else {
      logWarning(`Agent ${agentName} has no CLAUDE.md file`);
    }

    // Build full definition
    const definition: AgentDefinition = {
      name: agentName,
      description: agentJson.description || '',
      prompt: prompt,
      tools: agentJson.tools,
      model: agentJson.model,
      permissionMode: agentJson.permissionMode,
      extendedThinking: agentJson.extendedThinking,
      sessionPersistence: agentJson.sessionPersistence,
      mcpServers: agentJson.mcpServers,
      executionMode: agentJson.executionMode || 'foreground',
    };

    // Validate
    this.validateAgent(definition);

    // Cache
    this.cache.set(agentName, definition);

    logInfo(`Loaded agent (sync): ${agentName}`);
    return definition;
  }

  /**
   * Get agent directory path
   */
  getAgentDir(agentName: string): string {
    return path.join(this.agentsDir, agentName);
  }
}
