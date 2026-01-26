/**
 * Memory Relay configuration
 * Handles path resolution and configuration loading
 */
import os from 'os';
import path from 'path';
import { existsSync } from 'fs';
import type { RelayConfig } from './types.js';

/** Session name for tmux */
export const SESSION_NAME = 'symphony-session';

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
