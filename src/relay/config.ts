/**
 * Memory Relay configuration
 * Handles path resolution and configuration loading
 */
import os from 'os';
import path from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import type { RelayConfig } from './types.js';

/** Session name prefix for tmux */
export const SESSION_PREFIX = 'symphony-session';

/**
 * @deprecated Use SESSION_PREFIX instead
 */
export const SESSION_NAME = SESSION_PREFIX;

/**
 * Get list of active symphony sessions
 * Returns session names that start with SESSION_PREFIX
 */
export function listActiveSessions(): string[] {
  try {
    const output = execSync('tmux list-sessions -F "#{session_name}" 2>/dev/null', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output
      .split('\n')
      .filter((name) => name.startsWith(SESSION_PREFIX));
  } catch {
    return [];
  }
}

/** Default relay directory */
const DEFAULT_RELAY_DIR = path.join(os.homedir(), '.claude/memory-relay');

let cachedConfig: RelayConfig | null = null;

/**
 * Determine the relay base directory
 * Prefers project-local config if available, falls back to global
 */
function resolveBaseDir(scriptDir?: string): string {
  // If running from a script directory with config.json, use project-local
  if (scriptDir) {
    const localConfig = path.join(scriptDir, '..', 'config.json');
    if (existsSync(localConfig)) {
      return path.dirname(path.resolve(localConfig));
    }
  }

  // Default to global installation path
  return DEFAULT_RELAY_DIR;
}

/**
 * Get the relay configuration
 * Uses lazy initialization with caching
 */
export function getConfig(scriptDir?: string): RelayConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const baseDir = resolveBaseDir(scriptDir);
  const orchestratorDir = path.join(baseDir, 'orchestrator');
  const signalsDir = path.join(orchestratorDir, 'signals');
  const logDir = path.join(baseDir, 'logs');

  cachedConfig = {
    baseDir,
    logDir,
    signalsDir,
    fifoPath: path.join(signalsDir, 'relay.fifo'),
    orchestratorDir,
    handoffsDir: path.join(baseDir, 'handoffs'),
    pidFile: path.join(orchestratorDir, 'orchestrator.pid'),
    logFile: path.join(logDir, 'orchestrator.log'),
    relayLogFile: path.join(logDir, 'relay.log'),
  };

  return cachedConfig;
}

/**
 * Reset the cached configuration
 * Useful for testing or when paths need to be recalculated
 */
export function resetConfig(): void {
  cachedConfig = null;
}

/**
 * Get the relay directory (for external use)
 */
export function getRelayDir(): string {
  return DEFAULT_RELAY_DIR;
}
