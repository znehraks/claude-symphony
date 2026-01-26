/**
 * AI Orchestrator
 * Unified AI call router with automatic fallback
 * Migrated from ai-call.sh
 */
import path from 'path';
import { existsSync } from 'fs';
import { callGemini, type GeminiResult } from '../../integrations/gemini.js';
import { callCodex, type CodexResult } from '../../integrations/codex.js';
import { logInfo, logSuccess, logWarning, logError } from '../../utils/logger.js';
import { readJson, writeJson, ensureDirAsync } from '../../utils/fs.js';
import { getTimestamp } from '../../utils/shell.js';

/**
 * Supported AI models
 */
export type AIModel = 'gemini' | 'codex' | 'claudecode' | 'claude';

/**
 * AI call result
 */
export interface AICallResult {
  success: boolean;
  model: AIModel;
  output?: string;
  fallbackUsed: boolean;
  fallbackModel?: AIModel;
  fallbackReason?: string;
}

/**
 * AI call options
 */
export interface AICallOptions {
  timeout?: number;
  projectRoot?: string;
}

/**
 * Fallback log entry
 */
interface FallbackLogEntry {
  timestamp: string;
  originalAi: AIModel;
  exitCode: number;
  reason?: string;
}

/**
 * Fallback log structure
 */
interface FallbackLog {
  fallbacks: FallbackLogEntry[];
}

/**
 * Log fallback to state file
 */
async function logFallback(
  projectRoot: string,
  originalAi: AIModel,
  exitCode: number,
  reason?: string
): Promise<void> {
  const stateDir = path.join(projectRoot, 'state');
  const logPath = path.join(stateDir, 'fallback_log.json');

  try {
    await ensureDirAsync(stateDir);

    let log: FallbackLog = { fallbacks: [] };
    if (existsSync(logPath)) {
      const existing = await readJson<FallbackLog>(logPath);
      if (existing) {
        log = existing;
      }
    }

    log.fallbacks.push({
      timestamp: getTimestamp(),
      originalAi: originalAi,
      exitCode,
      reason,
    });

    await writeJson(logPath, log);
  } catch {
    // Ignore logging errors
  }
}

/**
 * Call AI model with automatic fallback
 */
export async function callAI(
  model: AIModel,
  prompt: string,
  options: AICallOptions = {}
): Promise<AICallResult> {
  const { timeout = 300, projectRoot } = options;

  // Normalize model name
  const normalizedModel = model.toLowerCase() as AIModel;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logInfo('AI Call Router');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Model: ${normalizedModel}`);
  console.log(`  Timeout: ${timeout}s\n`);

  // Handle ClaudeCode directly (no wrapper needed)
  if (normalizedModel === 'claudecode' || normalizedModel === 'claude') {
    console.log('Routing to ClaudeCode...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('EXECUTE WITH CLAUDECODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(prompt);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ACTION_REQUIRED: CLAUDECODE_EXECUTE');

    return {
      success: true,
      model: 'claudecode',
      output: prompt,
      fallbackUsed: false,
    };
  }

  // Route to appropriate wrapper
  let result: GeminiResult | CodexResult;

  switch (normalizedModel) {
    case 'gemini':
      console.log('Executing gemini wrapper...\n');
      result = await callGemini(prompt, { timeout });
      break;

    case 'codex':
      console.log('Executing codex wrapper...\n');
      result = await callCodex(prompt, { timeout });
      break;

    default:
      logError(`Unknown AI model: ${normalizedModel}`);
      console.log('  Supported: gemini, codex, claudecode');
      return {
        success: false,
        model: normalizedModel,
        fallbackUsed: false,
      };
  }

  // Check if fallback is required
  if (result.fallbackRequired) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logWarning('AUTO-FALLBACK TRIGGERED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`  Primary AI: ${normalizedModel}`);
    console.log(`  Fallback Signal: ${result.fallbackSignal}`);
    console.log(`  Reason: ${result.fallbackReason}`);

    // Log fallback if project root is provided
    if (projectRoot) {
      const exitCode = getExitCodeForSignal(result.fallbackSignal);
      await logFallback(projectRoot, normalizedModel, exitCode, result.fallbackReason);
    }

    console.log('\nFalling back to ClaudeCode...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('EXECUTE WITH CLAUDECODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(prompt);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ACTION_REQUIRED: CLAUDECODE_FALLBACK');
    console.log(`ORIGINAL_AI: ${normalizedModel}`);
    console.log(`FALLBACK_REASON: ${result.fallbackSignal}`);

    return {
      success: false,
      model: normalizedModel,
      output: prompt,
      fallbackUsed: true,
      fallbackModel: 'claudecode',
      fallbackReason: result.fallbackReason,
    };
  }

  // Success
  return {
    success: true,
    model: normalizedModel,
    output: result.output,
    fallbackUsed: false,
  };
}

/**
 * Map fallback signal to exit code
 */
function getExitCodeForSignal(signal?: string): number {
  switch (signal) {
    case 'CLI_NOT_FOUND':
      return 100;
    case 'TIMEOUT':
      return 101;
    case 'API_ERROR':
      return 102;
    case 'OUTPUT_FAILED':
      return 103;
    default:
      return 1;
  }
}

/**
 * Check if a model is available
 */
export async function isModelAvailable(model: AIModel): Promise<boolean> {
  switch (model.toLowerCase() as AIModel) {
    case 'claudecode':
    case 'claude':
      return true; // Always available
    case 'gemini':
      const { isGeminiAvailable } = await import('../../integrations/gemini.js');
      return isGeminiAvailable();
    case 'codex':
      const { isCodexAvailable } = await import('../../integrations/codex.js');
      return isCodexAvailable();
    default:
      return false;
  }
}

/**
 * Get available models
 */
export async function getAvailableModels(): Promise<AIModel[]> {
  const models: AIModel[] = ['claudecode'];

  if (await isModelAvailable('gemini')) {
    models.push('gemini');
  }
  if (await isModelAvailable('codex')) {
    models.push('codex');
  }

  return models;
}
