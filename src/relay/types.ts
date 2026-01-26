/**
 * Type definitions for Memory Relay
 * Part of claude-symphony package
 */

/**
 * Memory Relay configuration
 */
export interface RelayConfig {
  /** Base directory for relay files (~/.claude/memory-relay) */
  baseDir: string;
  /** Log directory */
  logDir: string;
  /** Signals directory */
  signalsDir: string;
  /** FIFO path for inter-process communication */
  fifoPath: string;
  /** Orchestrator directory */
  orchestratorDir: string;
  /** Handoffs archive directory */
  handoffsDir: string;
  /** PID file path */
  pidFile: string;
  /** Main log file */
  logFile: string;
  /** Relay log file (wrapper) */
  relayLogFile: string;
}

/**
 * Signal types for orchestrator communication
 */
export type SignalType = 'RELAY_READY' | 'RELAY_ACK';

/**
 * Relay signal structure
 */
export interface RelaySignal {
  /** Signal type */
  type: SignalType;
  /** Path to handoff file */
  handoffPath: string;
  /** Source tmux pane ID */
  paneId: string;
}

/**
 * Session startup options
 */
export interface SessionOptions {
  /** Working directory for the session */
  workDir: string;
  /** Skip permission prompts (dangerous) */
  bypass: boolean;
  /** Handoff file to resume from */
  handoffFile?: string;
}

/**
 * Orchestrator command types
 */
export type OrchestratorCommand = 'start' | 'stop' | 'status' | 'restart';

/**
 * Orchestrator status
 */
export interface OrchestratorStatus {
  /** Is the orchestrator running */
  running: boolean;
  /** Process ID if running */
  pid?: number;
  /** FIFO exists */
  fifoExists: boolean;
  /** Base directory */
  baseDir: string;
  /** Recent log lines */
  recentLogs?: string[];
}

/**
 * Pane creation result
 */
export interface PaneResult {
  success: boolean;
  paneId?: string;
  error?: string;
}

/**
 * Session choice for existing session handling
 */
export type SessionChoice = 'attach' | 'recreate' | 'cancel';

/**
 * Log levels for relay logging
 */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
