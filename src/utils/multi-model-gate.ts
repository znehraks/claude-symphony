/**
 * Multi-Model Gate Verification
 * Ensures stages configured for multi-model execution actually invoke external AI calls.
 * Checks pipeline.jsonc for model configuration and ai-call-log.jsonl for execution evidence.
 */
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { loadJsonc } from './jsonc.js';
import type { StageId } from '../types/stage.js';

/**
 * AI call log entry shape (from state/ai-call-log.jsonl)
 */
interface AiCallLogEntry {
  timestamp: string;
  stage: string;
  type: string;
  model?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Pipeline stage config shape (subset)
 */
interface PipelineStageConfig {
  models?: string[];
  [key: string]: unknown;
}

interface PipelineConfig {
  stages?: Record<string, PipelineStageConfig>;
  [key: string]: unknown;
}

/** Models that are native Claude Code — not "external" */
const NATIVE_MODELS = new Set(['claudecode', 'claude']);

/**
 * Check if a stage is configured for multi-model execution.
 * Reads pipeline.jsonc and checks whether the stage's `models` array
 * contains any model other than claudecode/claude.
 */
export async function isMultiModelStage(
  projectRoot: string,
  stageId: StageId
): Promise<boolean> {
  const pipelinePath = path.join(projectRoot, 'config', 'pipeline.jsonc');
  const config = await loadJsonc<PipelineConfig>(pipelinePath);

  if (!config?.stages?.[stageId]) {
    return false;
  }

  const models = config.stages[stageId]?.models;
  if (!models || !Array.isArray(models)) {
    return false;
  }

  return models.some((m) => !NATIVE_MODELS.has(m.toLowerCase()));
}

/**
 * Parse ai-call-log.jsonl entries for a specific stage.
 * Returns empty array if the log file doesn't exist.
 */
export function getAiCallLogEntries(
  projectRoot: string,
  stageId: StageId
): AiCallLogEntry[] {
  const logPath = path.join(projectRoot, 'state', 'ai-call-log.jsonl');

  if (!existsSync(logPath)) {
    return [];
  }

  try {
    const content = readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const entries: AiCallLogEntry[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as AiCallLogEntry;
        if (entry.stage === stageId) {
          entries.push(entry);
        }
      } catch {
        // Skip malformed lines
      }
    }

    return entries;
  } catch {
    return [];
  }
}

/**
 * Gate result
 */
export interface MultiModelGateResult {
  passed: boolean;
  message: string;
}

/**
 * Verify multi-model gate for a stage.
 *
 * - If the stage is NOT multi-model → always passes
 * - If the stage IS multi-model → requires at least one `type: "multi-model"` entry
 *   in ai-call-log.jsonl for that stage
 * - Entries with action "fallback" or "error" still count (attempt was made)
 */
export async function verifyMultiModelGate(
  projectRoot: string,
  stageId: StageId
): Promise<MultiModelGateResult> {
  const isMulti = await isMultiModelStage(projectRoot, stageId);

  if (!isMulti) {
    return {
      passed: true,
      message: `Stage ${stageId} is single-model — gate not required`,
    };
  }

  const entries = getAiCallLogEntries(projectRoot, stageId);
  const multiModelEntries = entries.filter((e) => e.type === 'multi-model');

  if (multiModelEntries.length === 0) {
    return {
      passed: false,
      message:
        `Stage ${stageId} requires multi-model execution but no AI call log entries found. ` +
        `Run: claude-symphony ai-call --stage ${stageId}`,
    };
  }

  return {
    passed: true,
    message: `Multi-model gate passed (${multiModelEntries.length} call(s) logged)`,
  };
}
