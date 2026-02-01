/**
 * ai-call command
 * Calls external AI model for a pipeline stage, outputs JSON to stdout.
 *
 * Exit codes:
 *   0  — success (external model returned output)
 *  10  — fallback needed (claudecode-only stage or model unavailable)
 *   1  — error
 */
import { readFileSync, statSync } from 'fs';
import path from 'path';
import { callAI, type AIModel } from '../../core/ai/orchestrator.js';
import { logError } from '../../utils/logger.js';
import { loadJsonc } from '../../utils/jsonc.js';
import { writeFile, ensureDirAsync } from '../../utils/fs.js';

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
  stages?: Array<{ id: string; models?: string[]; timeout?: number }>;
}

interface StageConfig {
  models: string[];
  timeout: number; // seconds, 0 = unlimited
}

/**
 * Parse pipeline.jsonc to extract models and timeout for a given stage.
 * Uses the project's loadJsonc utility for safe JSONC parsing.
 */
async function getStageConfig(projectRoot: string, stageId: string): Promise<StageConfig> {
  const pipelinePath = path.join(projectRoot, 'config', 'pipeline.jsonc');
  const config = await loadJsonc<PipelineConfig>(pipelinePath);
  if (!config) return { models: [], timeout: 0 };
  const stages = config.stages ?? [];
  const stage = stages.find((s) => s.id === stageId);
  return {
    models: stage?.models ?? [],
    timeout: stage?.timeout ?? 0,
  };
}

/**
 * Find all non-claudecode models from a models array.
 */
function findExternalModels(models: string[]): AIModel[] {
  const result: AIModel[] = [];
  for (const m of models) {
    const lower = m.toLowerCase();
    if (lower !== 'claudecode' && lower !== 'claude') {
      result.push(lower as AIModel);
    }
  }
  return result;
}

interface ModelResultMetadata {
  command?: string;
  exitCode?: number;
  stderr?: string;
  durationMs?: number;
  stdoutLength?: number;
  timestamp?: string;
}

interface ModelResult {
  success: boolean;
  model: string;
  output: string | null;
  fallback: { used: boolean; reason?: string };
  metadata?: ModelResultMetadata;
}

/**
 * ai-call command handler.
 * Returns an exit code (0, 10, or 1).
 */
export async function aiCallCommand(options: AiCallOptions): Promise<number> {
  const startTime = Date.now();
  const projectRoot = process.cwd();
  const { stage, timeout: timeoutStr } = options;

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

  // Read models and timeout from pipeline.jsonc
  const stageConfig = await getStageConfig(projectRoot, stage);
  const models = stageConfig.models;
  const externalModels = findExternalModels(models);

  // Timeout priority: CLI flag > pipeline.jsonc > 0 (unlimited)
  const timeout = timeoutStr ? parseInt(timeoutStr, 10) : stageConfig.timeout;

  if (externalModels.length === 0) {
    // claudecode-only stage — signal fallback
    const output = JSON.stringify({
      success: false,
      model: null,
      output: null,
      fallback: { used: true, reason: 'claudecode-only stage' },
      results: [],
      stage,
      duration_ms: Date.now() - startTime,
    });
    process.stdout.write(output + '\n');
    return EXIT_FALLBACK;
  }

  // Call each external model sequentially and collect results
  const results: ModelResult[] = [];
  let hasHardError = false;

  for (const model of externalModels) {
    try {
      const result = await callAI(model, prompt, {
        timeout,
        projectRoot,
        quiet: true,
      });

      if (result.success) {
        results.push({
          success: true,
          model: result.model,
          output: result.output ?? null,
          fallback: { used: false },
          metadata: result.metadata,
        });
      } else {
        results.push({
          success: false,
          model: result.model,
          output: null,
          fallback: {
            used: true,
            reason: result.fallbackReason ?? 'model call failed',
          },
          metadata: result.metadata,
        });
        if (!result.fallbackUsed) {
          hasHardError = true;
        }
      }
    } catch (err) {
      logError(`ai-call error for ${model}: ${err instanceof Error ? err.message : String(err)}`);
      results.push({
        success: false,
        model,
        output: null,
        fallback: { used: true, reason: String(err) },
      });
      hasHardError = true;
    }
  }

  // Write per-model files and build combined output
  const successResults = results.filter((r) => r.success && r.output);
  const aiOutputsDir = path.join(projectRoot, 'state', 'ai-outputs');

  if (results.length > 0) {
    await ensureDirAsync(aiOutputsDir);

    // Write per-model .meta.json for ALL results (success and failure)
    for (const r of results) {
      try {
        const metaPath = path.join(aiOutputsDir, `${stage}_${r.model}.meta.json`);
        const metaContent = JSON.stringify({
          model: r.model,
          stage,
          timestamp: r.metadata?.timestamp ?? new Date().toISOString(),
          command: r.metadata?.command ?? null,
          exitCode: r.metadata?.exitCode ?? null,
          stdoutLength: r.metadata?.stdoutLength ?? (r.output?.length ?? 0),
          stderrPreview: (r.metadata?.stderr ?? '').substring(0, 500),
          durationMs: r.metadata?.durationMs ?? null,
          success: r.success,
          fallbackReason: r.fallback.reason ?? null,
        }, null, 2);
        await writeFile(metaPath, metaContent);
      } catch {
        // Metadata write failure should not affect main flow
      }
    }

    // Write per-model .md files for successful results only
    for (const r of successResults) {
      const perModelPath = path.join(aiOutputsDir, `${stage}_${r.model}.md`);
      await writeFile(perModelPath, r.output!);
    }

    // Always write combined .meta.json (Gap 3)
    try {
      const combinedMetaPath = path.join(aiOutputsDir, `${stage}.meta.json`);
      const combinedMeta = JSON.stringify({
        stage,
        timestamp: new Date().toISOString(),
        totalModels: results.length,
        successCount: successResults.length,
        failureCount: results.length - successResults.length,
        models: results.map((r) => ({
          model: r.model,
          success: r.success,
          timestamp: r.metadata?.timestamp ?? null,
          command: r.metadata?.command ?? null,
          exitCode: r.metadata?.exitCode ?? null,
          stdoutLength: r.metadata?.stdoutLength ?? null,
          stderrPreview: (r.metadata?.stderr ?? '').substring(0, 500),
          durationMs: r.metadata?.durationMs ?? null,
          fallbackReason: r.fallback.reason ?? null,
        })),
      }, null, 2);
      await writeFile(combinedMetaPath, combinedMeta);
    } catch {
      // Metadata write failure should not affect main flow
    }

    // Write combined .md only when there are successful results
    if (successResults.length > 0) {
      const combinedParts = successResults.map(
        (r) => `## Output from ${r.model}\n\n${r.output!}`
      );
      const combinedPath = path.join(aiOutputsDir, `${stage}.md`);
      await writeFile(combinedPath, combinedParts.join('\n\n---\n\n') + '\n');
    }
  }

  // Verify output files (Gap 5)
  const verification = verifyOutputFiles(aiOutputsDir, stage, results, successResults);

  // Build JSON output (backward-compat: top-level fields from first result)
  const first = results[0] ?? { success: false, model: null, output: null, fallback: { used: true, reason: 'no models' } };
  const jsonOutput = JSON.stringify({
    success: first.success,
    model: first.model,
    output: first.output,
    fallback: first.fallback,
    results,
    stage,
    duration_ms: Date.now() - startTime,
    verification,
  });
  process.stdout.write(jsonOutput + '\n');

  // Exit code: 0 if any success, 10 if all fallback, 1 if hard error
  if (hasHardError) return EXIT_ERROR;
  if (successResults.length > 0) return EXIT_SUCCESS;
  return EXIT_FALLBACK;
}

interface VerificationFile {
  path: string;
  exists: boolean;
  sizeBytes: number;
  adequate: boolean;
}

interface VerificationResult {
  allPresent: boolean;
  files: VerificationFile[];
}

/**
 * Verify that all expected output files exist after writing.
 */
function verifyOutputFiles(
  aiOutputsDir: string,
  stage: string,
  allResults: ModelResult[],
  successResults: ModelResult[],
): VerificationResult {
  const files: VerificationFile[] = [];

  // All attempted models should have .meta.json
  for (const r of allResults) {
    const metaRelPath = `state/ai-outputs/${stage}_${r.model}.meta.json`;
    const metaAbsPath = path.join(aiOutputsDir, `${stage}_${r.model}.meta.json`);
    const stat = statSync(metaAbsPath, { throwIfNoEntry: false });
    const sizeBytes = stat?.size ?? 0;
    files.push({
      path: metaRelPath,
      exists: !!stat,
      sizeBytes,
      adequate: !!stat && sizeBytes > 0,
    });
  }

  // Successful models should have .md files (>= 50 bytes)
  for (const r of successResults) {
    const mdRelPath = `state/ai-outputs/${stage}_${r.model}.md`;
    const mdAbsPath = path.join(aiOutputsDir, `${stage}_${r.model}.md`);
    const stat = statSync(mdAbsPath, { throwIfNoEntry: false });
    const sizeBytes = stat?.size ?? 0;
    files.push({
      path: mdRelPath,
      exists: !!stat,
      sizeBytes,
      adequate: !!stat && sizeBytes >= 50,
    });
  }

  // Combined .meta.json should always exist (when results > 0)
  if (allResults.length > 0) {
    const combinedMetaRelPath = `state/ai-outputs/${stage}.meta.json`;
    const combinedMetaAbsPath = path.join(aiOutputsDir, `${stage}.meta.json`);
    const stat = statSync(combinedMetaAbsPath, { throwIfNoEntry: false });
    const sizeBytes = stat?.size ?? 0;
    files.push({
      path: combinedMetaRelPath,
      exists: !!stat,
      sizeBytes,
      adequate: !!stat && sizeBytes > 0,
    });
  }

  // Combined .md should exist when there are successful results
  if (successResults.length > 0) {
    const combinedMdRelPath = `state/ai-outputs/${stage}.md`;
    const combinedMdAbsPath = path.join(aiOutputsDir, `${stage}.md`);
    const stat = statSync(combinedMdAbsPath, { throwIfNoEntry: false });
    const sizeBytes = stat?.size ?? 0;
    files.push({
      path: combinedMdRelPath,
      exists: !!stat,
      sizeBytes,
      adequate: !!stat && sizeBytes >= 50,
    });
  }

  return {
    allPresent: files.every((f) => f.adequate),
    files,
  };
}
