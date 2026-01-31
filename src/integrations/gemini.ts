/**
 * Gemini CLI wrapper
 * Direct execa-based Gemini CLI invocation with fallback signaling
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
 * Gemini call result
 */
export interface GeminiResult {
  success: boolean;
  output?: string;
  fallbackRequired: boolean;
  fallbackSignal?: FallbackSignal;
  fallbackReason?: string;
}

/**
 * Gemini wrapper options
 */
export interface GeminiOptions {
  timeout?: number; // seconds, default 300
  cwd?: string;
}

const DEFAULT_TIMEOUT = 300;

/**
 * Check if Gemini CLI is available
 */
export async function isGeminiAvailable(): Promise<boolean> {
  return commandExists('gemini');
}

/**
 * Call Gemini CLI directly via execa
 */
export async function callGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<GeminiResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  // Check Gemini CLI availability
  if (!(await isGeminiAvailable())) {
    logWarning('gemini CLI is not installed — falling back to claudecode.');
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'CLI_NOT_FOUND',
      fallbackReason: 'Gemini CLI not installed',
    };
  }

  try {
    logInfo(`Calling Gemini CLI (timeout: ${timeout}s)...`);

    const result = await exec('gemini', ['-p', prompt, '--yolo'], {
      timeout: timeout * 1000,
      cwd: options.cwd,
    });

    const output = result.stdout.trim();

    // Empty output
    if (!output) {
      logWarning('Gemini returned empty response — falling back.');
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'TIMEOUT',
        fallbackReason: 'Empty response from Gemini CLI',
      };
    }

    // Check for error patterns
    const errorPatterns = /rate.limit|quota.exceeded|authentication.failed/i;
    if (!result.success || errorPatterns.test(output)) {
      logWarning('Gemini API error detected — falling back.');
      return {
        success: false,
        output,
        fallbackRequired: true,
        fallbackSignal: 'API_ERROR',
        fallbackReason: result.stderr || 'API error detected in response',
      };
    }

    logSuccess('Gemini call completed.');
    return {
      success: true,
      output,
      fallbackRequired: false,
    };
  } catch (error) {
    logError(`Gemini call failed: ${error}`);
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'API_ERROR',
      fallbackReason: String(error),
    };
  }
}
