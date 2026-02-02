/**
 * Agent system type definitions
 */

/**
 * Agent definition (loaded from agent.json)
 */
export interface AgentDefinition {
  /** Agent name */
  name: string;
  /** Human-readable description */
  description: string;
  /** System prompt (from CLAUDE.md) */
  prompt: string;
  /** Allowed tools (if undefined, inherits all tools) */
  tools?: string[];
  /** Model to use (reasoning, balanced, fast, inherit) */
  model?: 'reasoning' | 'balanced' | 'fast' | 'inherit';
  /** Permission mode */
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
  /** Enable extended thinking */
  extendedThinking?: boolean;
  /** Enable session persistence */
  sessionPersistence?: boolean;
  /** MCP server names to enable */
  mcpServers?: string[];
  /** Execution mode */
  executionMode?: 'foreground' | 'background';
}

/**
 * Context passed to agent when spawning
 */
export interface AgentContext {
  /** Project root directory */
  projectRoot: string;
  /** Current stage ID (if applicable) */
  stage?: string | undefined;
  /** Session ID (for persistence) */
  sessionId?: string | undefined;
  /** Custom context data */
  data?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  /** Whether the agent succeeded */
  success: boolean;
  /** Agent session ID */
  agentId?: string;
  /** Execution mode used */
  mode: 'foreground' | 'background';
  /** Result message (foreground only) */
  result?: string;
  /** Error messages (if failed) */
  errors?: string[];
  /** Execution summary (foreground only) */
  summary?: {
    duration_ms: number;
    num_turns: number;
    total_cost_usd: number;
  };
  /** Human-readable message */
  message?: string;
}

/**
 * Agent spawn options
 */
export interface SpawnOptions {
  /** Execution mode */
  mode?: 'foreground' | 'background';
  /** Override tools */
  tools?: string[];
  /** Override model */
  model?: string;
  /** Session ID to resume */
  resume?: string;
}

/**
 * Agent registry entry
 */
export interface AgentRegistryEntry {
  /** Agent name */
  name: string;
  /** Path to agent directory */
  path: string;
  /** Loaded definition (cached) */
  definition?: AgentDefinition;
}
