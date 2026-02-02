/**
 * Codex CLI wrapper
 * Direct execa-based Codex CLI invocation with fallback signaling
 */
import { commandExists, exec } from '../utils/shell.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { type IntegrationMetadata, type FallbackSignal } from '../types/integration.js';
import { validateOutputQuality } from '../utils/output-quality.js';

export type { FallbackSignal, IntegrationMetadata };

/**
 * Codex call result
 */
export interface CodexResult {
  success: boolean;
  output?: string;
  fallbackRequired: boolean;
  fallbackSignal?: FallbackSignal;
  fallbackReason?: string;
  metadata?: IntegrationMetadata;
}

/**
 * Codex wrapper options
 */
export interface CodexOptions {
  timeout?: number; // seconds, 0 = no limit (default)
  fullAuto?: boolean; // default true
  cwd?: string;
}

const DEFAULT_TIMEOUT = 0; // 0 = wait until process exits (no timeout)

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
  const startTime = Date.now();

  // Check Codex CLI availability
  if (!(await isCodexAvailable())) {
    logWarning('codex CLI is not installed — falling back to claudecode.');
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'CLI_NOT_FOUND',
      fallbackReason: 'Codex CLI not installed',
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
    // Soft format guide prepended to prompt (non-enforced)
    const formatGuide =
      'PREFERRED OUTPUT FORMAT (optional but recommended):\n' +
      '- Use markdown headings (##, ###) to organize sections.\n' +
      '- Use bullet points for lists.\n' +
      '- Output actual content directly rather than describing what you will do.\n\n';
    const enhancedPrompt = formatGuide + prompt;

    const args = fullAuto
      ? ['exec', '--full-auto', enhancedPrompt]
      : ['exec', enhancedPrompt];
    const commandStr = `codex ${args.slice(0, -1).join(' ')} <${enhancedPrompt.length}chars>`;
    logInfo(`Calling Codex CLI${fullAuto ? ' (--full-auto)' : ''} (timeout: ${timeout > 0 ? timeout + 's' : 'none'})...`);

    const result = await exec('codex', args, {
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

    console.error(`[TRACE] codex stdout=${output.length}B exit=${metadata.exitCode} ${durationMs}ms`);

    // Empty output
    if (!output) {
      logWarning('Codex returned empty response — falling back.');
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'TIMEOUT',
        fallbackReason: 'Empty response from Codex CLI',
        metadata,
      };
    }

    // Output quality check (non-blocking — for logging/reporting only)
    const quality = validateOutputQuality(output, prompt);
    if (!quality.passes) {
      logWarning(`Codex output quality note: ${quality.reason} (non-blocking)`);
    }

    // Refusal pattern detection
    const refusalPattern = /I cannot|I'm unable|I can't help|as an AI/i;
    if (refusalPattern.test(output.substring(0, 200))) {
      logWarning('Codex model refusal detected — falling back.');
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
      logWarning('Codex API error detected — falling back.');
      return {
        success: false,
        output,
        fallbackRequired: true,
        fallbackSignal: 'API_ERROR',
        fallbackReason: result.stderr || 'API error detected in response',
        metadata,
      };
    }

    logSuccess('Codex call completed.');
    return {
      success: true,
      output,
      fallbackRequired: false,
      metadata,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const metadata: IntegrationMetadata = {
      command: `codex exec${fullAuto ? ' --full-auto' : ''} <${prompt.length}chars>`,
      exitCode: -1,
      stderr: String(error),
      durationMs,
      stdoutLength: 0,
      timestamp: new Date().toISOString(),
    };

    console.error(`[TRACE] codex stdout=0B exit=-1 ${durationMs}ms error`);
    logError(`Codex call failed: ${error}`);
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'API_ERROR',
      fallbackReason: String(error),
      metadata,
    };
  }
}
