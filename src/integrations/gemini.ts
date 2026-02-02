/**
 * Gemini CLI wrapper
 * Direct execa-based Gemini CLI invocation with fallback signaling
 */
import { commandExists, exec } from '../utils/shell.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { type IntegrationMetadata, type FallbackSignal } from '../types/integration.js';
import { validateOutputQuality } from '../utils/output-quality.js';

export type { FallbackSignal, IntegrationMetadata };

/**
 * Gemini call result
 */
export interface GeminiResult {
  success: boolean;
  output?: string;
  fallbackRequired: boolean;
  fallbackSignal?: FallbackSignal;
  fallbackReason?: string;
  metadata?: IntegrationMetadata;
}

/**
 * Gemini wrapper options
 */
export interface GeminiOptions {
  timeout?: number; // seconds, 0 = no limit (default)
  cwd?: string;
}

const DEFAULT_TIMEOUT = 0; // 0 = wait until process exits (no timeout)

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
  const startTime = Date.now();

  // Check Gemini CLI availability
  if (!(await isGeminiAvailable())) {
    logWarning('gemini CLI is not installed — falling back to claudecode.');
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'CLI_NOT_FOUND',
      fallbackReason: 'Gemini CLI not installed',
      metadata: {
        command: 'N/A',
        exitCode: -1,
        stderr: 'CLI not found in PATH',
        durationMs: Date.now() - startTime,
        stdoutLength: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    logInfo(`Calling Gemini CLI (timeout: ${timeout > 0 ? timeout + 's' : 'none'})...`);

    const commandStr = `gemini -p <${prompt.length}chars> --yolo`;

    const result = await exec('gemini', ['-p', prompt, '--yolo'], {
      timeout: timeout > 0 ? timeout * 1000 : 0,
      cwd: options.cwd,
    });

    const output = result.stdout.trim();
    const durationMs = Date.now() - startTime;

    const metadata: IntegrationMetadata = {
      command: commandStr,
      exitCode: result.success ? 0 : 1,
      stderr: result.stderr ?? '',
      durationMs,
      stdoutLength: output.length,
      timestamp: new Date().toISOString(),
    };

    console.error(`[TRACE] gemini stdout=${output.length}B exit=${metadata.exitCode} ${durationMs}ms`);

    // Empty output
    if (!output) {
      logWarning('Gemini returned empty response — falling back.');
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'TIMEOUT',
        fallbackReason: 'Empty response from Gemini CLI',
        metadata,
      };
    }

    // Output quality check (replaces simple length check)
    const quality = validateOutputQuality(output, prompt);
    if (!quality.passes) {
      logWarning(`Gemini output failed quality check: ${quality.reason}`);
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'OUTPUT_FAILED',
        fallbackReason: `Quality check failed: ${quality.reason}`,
        metadata,
      };
    }

    // Refusal pattern detection
    const refusalPattern = /I cannot|I'm unable|I can't help|as an AI/i;
    if (refusalPattern.test(output.substring(0, 200))) {
      logWarning('Gemini model refusal detected — falling back.');
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'OUTPUT_FAILED',
        fallbackReason: 'Model refusal detected',
        metadata,
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
        metadata,
      };
    }

    logSuccess('Gemini call completed.');
    return {
      success: true,
      output,
      fallbackRequired: false,
      metadata,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const metadata: IntegrationMetadata = {
      command: `gemini -p <${prompt.length}chars> --yolo`,
      exitCode: -1,
      stderr: String(error),
      durationMs,
      stdoutLength: 0,
      timestamp: new Date().toISOString(),
    };

    console.error(`[TRACE] gemini stdout=0B exit=-1 ${durationMs}ms error`);
    logError(`Gemini call failed: ${error}`);
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'API_ERROR',
      fallbackReason: String(error),
      metadata,
    };
  }
}
