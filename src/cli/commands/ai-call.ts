/**
 * ai-call command
 * Calls external AI model for a pipeline stage, outputs JSON to stdout.
 *
 * Exit codes:
 *   0  — success (external model returned output)
 *  10  — fallback needed (claudecode-only stage or model unavailable)
 *   1  — error
 */
import { readFileSync } from 'fs';
import path from 'path';
import { callAI, type AIModel } from '../../core/ai/orchestrator.js';
import { logError } from '../../utils/logger.js';
import { loadJsonc } from '../../utils/jsonc.js';

/** Exit code constants */
const EXIT_SUCCESS = 0;
const EXIT_FALLBACK = 10;
const EXIT_ERROR = 1;

export interface AiCallOptions {
  stage: string;
  prompt?: string;
  promptFile?: string;
  timeout?: string;
}

interface PipelineConfig {
  stages?: Array<{ id: string; models?: string[] }>;
}

/**
 * Parse pipeline.jsonc to extract models array for a given stage.
 * Uses the project's loadJsonc utility for safe JSONC parsing.
 */
async function getStageModels(projectRoot: string, stageId: string): Promise<string[]> {
  const pipelinePath = path.join(projectRoot, 'config', 'pipeline.jsonc');
  const config = await loadJsonc<PipelineConfig>(pipelinePath);
  if (!config) return [];
  const stages = config.stages ?? [];
  const stage = stages.find((s) => s.id === stageId);
  return stage?.models ?? [];
}

/**
 * Find the first non-claudecode model from a models array.
 */
function findExternalModel(models: string[]): AIModel | null {
  for (const m of models) {
    const lower = m.toLowerCase();
    if (lower !== 'claudecode' && lower !== 'claude') {
      return lower as AIModel;
    }
  }
  return null;
}

/**
 * ai-call command handler.
 * Returns an exit code (0, 10, or 1).
 */
export async function aiCallCommand(options: AiCallOptions): Promise<number> {
  const startTime = Date.now();
  const projectRoot = process.cwd();
  const { stage, timeout: timeoutStr } = options;
  const timeout = parseInt(timeoutStr ?? '0', 10);

  // Resolve prompt text
  let prompt: string;
  if (options.promptFile) {
    try {
      prompt = readFileSync(path.resolve(options.promptFile), 'utf8');
    } catch (err) {
      logError(`Failed to read prompt file: ${options.promptFile}`);
      return EXIT_ERROR;
    }
  } else if (options.prompt) {
    prompt = options.prompt;
  } else {
    logError('Either --prompt or --prompt-file is required');
    return EXIT_ERROR;
  }

  // Read models from pipeline.jsonc
  const models = await getStageModels(projectRoot, stage);
  const externalModel = findExternalModel(models);

  if (!externalModel) {
    // claudecode-only stage — signal fallback
    const output = JSON.stringify({
      success: false,
      model: null,
      output: null,
      fallback: { used: true, reason: 'claudecode-only stage' },
      stage,
      duration_ms: Date.now() - startTime,
    });
    process.stdout.write(output + '\n');
    return EXIT_FALLBACK;
  }

  // Call the external AI model via orchestrator (quiet mode keeps stdout clean)
  try {
    const result = await callAI(externalModel, prompt, {
      timeout,
      projectRoot,
      quiet: true,
    });

    if (result.success) {
      const output = JSON.stringify({
        success: true,
        model: result.model,
        output: result.output,
        fallback: { used: false },
        stage,
        duration_ms: Date.now() - startTime,
      });
      process.stdout.write(output + '\n');
      return EXIT_SUCCESS;
    }

    // Model failed, fallback triggered
    const output = JSON.stringify({
      success: false,
      model: result.model,
      output: null,
      fallback: {
        used: true,
        reason: result.fallbackReason ?? 'model call failed',
      },
      stage,
      duration_ms: Date.now() - startTime,
    });
    process.stdout.write(output + '\n');
    return result.fallbackUsed ? EXIT_FALLBACK : EXIT_ERROR;
  } catch (err) {
    logError(`ai-call error: ${err instanceof Error ? err.message : String(err)}`);
    const output = JSON.stringify({
      success: false,
      model: externalModel,
      output: null,
      fallback: { used: true, reason: String(err) },
      stage,
      duration_ms: Date.now() - startTime,
    });
    process.stdout.write(output + '\n');
    return EXIT_ERROR;
  }
}
