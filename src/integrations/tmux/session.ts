/**
 * tmux session management for AI CLI wrappers
 */
import {
  getTmuxPath,
  sessionExists,
  createSession,
  killSession,
  sendKeys,
  capturePane,
} from './utils.js';

export interface AISessionOptions {
  sessionName: string;
  command: string;
  promptFile?: string;
  outputFile?: string;
  timeout?: number;
}

export interface AISessionResult {
  success: boolean;
  output?: string;
  error?: string;
  sessionName?: string;
  paneId?: string;
}

const DEFAULT_SESSION_PREFIX = 'symphony';

/**
 * Get session name for an AI model
 */
export function getAISessionName(model: string): string {
  return `${DEFAULT_SESSION_PREFIX}-${model}`;
}

/**
 * Start an AI CLI session in tmux
 */
export async function startAISession(
  model: string,
  options: Partial<AISessionOptions> = {}
): Promise<AISessionResult> {
  const tmux = await getTmuxPath();
  if (!tmux) {
    return {
      success: false,
      error: 'tmux is not installed. Install with: brew install tmux',
    };
  }

  const sessionName = options.sessionName || getAISessionName(model);
  const command = options.command || model;

  // Check if session already exists
  if (await sessionExists(sessionName)) {
    return {
      success: true,
      sessionName,
      output: `Session ${sessionName} already exists`,
    };
  }

  // Create new session
  const created = await createSession(sessionName, {
    command,
    detached: true,
    windowName: model,
  });

  if (!created) {
    return {
      success: false,
      error: `Failed to create tmux session: ${sessionName}`,
    };
  }

  return {
    success: true,
    sessionName,
  };
}

/**
 * Send a prompt to an AI session
 */
export async function sendPromptToSession(
  sessionName: string,
  prompt: string
): Promise<boolean> {
  return sendKeys(sessionName, prompt, { enter: true });
}

/**
 * Get output from an AI session
 */
export async function getSessionOutput(
  sessionName: string,
  lines = 100
): Promise<string | null> {
  return capturePane(sessionName, { start: -lines });
}

/**
 * Stop an AI session
 */
export async function stopAISession(sessionName: string): Promise<boolean> {
  return killSession(sessionName);
}

/**
 * Check if an AI session is running
 */
export async function isAISessionRunning(model: string): Promise<boolean> {
  const sessionName = getAISessionName(model);
  return sessionExists(sessionName);
}
