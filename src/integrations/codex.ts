/**
 * Codex CLI wrapper
 * Direct execa-based Codex CLI invocation with fallback signaling
 */
import { commandExists, exec } from '../utils/shell.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';

/**
 * Fallback signal types
 */
export type FallbackSignal =
  | 'CLI_NOT_FOUND'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'OUTPUT_FAILED';

/**
 * Codex call result
 */
export interface CodexResult {
  success: boolean;
  output?: string;
  fallbackRequired: boolean;
  fallbackSignal?: FallbackSignal;
  fallbackReason?: string;
}

/**
 * Codex wrapper options
 */
export interface CodexOptions {
  timeout?: number; // seconds, default 300
  fullAuto?: boolean; // default true
  cwd?: string;
}

const DEFAULT_TIMEOUT = 300;

/**
 * Check if Codex CLI is available
 */
export async function isCodexAvailable(): Promise<boolean> {
  return commandExists('codex');
}

/**
 * Call Codex CLI directly via execa
 */
export async function callCodex(
  prompt: string,
  options: CodexOptions = {}
): Promise<CodexResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const fullAuto = options.fullAuto ?? true;

  // Check Codex CLI availability
  if (!(await isCodexAvailable())) {
    logWarning('codex CLI is not installed — falling back to claudecode.');
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'CLI_NOT_FOUND',
      fallbackReason: 'Codex CLI not installed',
    };
  }

  try {
    const args = fullAuto ? ['--full-auto', prompt] : [prompt];
    logInfo(`Calling Codex CLI${fullAuto ? ' (--full-auto)' : ''} (timeout: ${timeout}s)...`);

    const result = await exec('codex', args, {
      timeout: timeout * 1000,
      cwd: options.cwd,
    });

    const output = result.stdout.trim();

    // Empty output
    if (!output) {
      logWarning('Codex returned empty response — falling back.');
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'TIMEOUT',
        fallbackReason: 'Empty response from Codex CLI',
      };
    }

    // Check for error patterns
    const errorPatterns = /rate.limit|quota.exceeded|authentication.failed/i;
    if (!result.success || errorPatterns.test(output)) {
      logWarning('Codex API error detected — falling back.');
      return {
        success: false,
        output,
        fallbackRequired: true,
        fallbackSignal: 'API_ERROR',
        fallbackReason: result.stderr || 'API error detected in response',
      };
    }

    logSuccess('Codex call completed.');
    return {
      success: true,
      output,
      fallbackRequired: false,
    };
  } catch (error) {
    logError(`Codex call failed: ${error}`);
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'API_ERROR',
      fallbackReason: String(error),
    };
  }
}
