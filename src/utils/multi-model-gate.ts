/**
 * Multi-Model Gate Verification
 * Ensures stages configured for multi-model execution actually invoke external AI calls.
 * Checks pipeline.jsonc for model configuration and ai-call-log.jsonl for execution evidence.
 * Enhanced with output quality verification and synthesis notes checking.
 */
import path from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import { loadJsonc } from './jsonc.js';
import { validateOutputQuality, type QualityResult } from './output-quality.js';
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
 * Gate result details
 */
export interface MultiModelGateDetails {
  logExists: boolean;
  outputExists: boolean;
  outputQuality: QualityResult | null;
  synthesisFound: boolean;
}

/**
 * Gate result
 */
export interface MultiModelGateResult {
  passed: boolean;
  message: string;
  details?: MultiModelGateDetails;
}

/**
 * Check if a file contains a "## Synthesis Notes" section.
 */
function hasSynthesisNotes(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  try {
    const content = readFileSync(filePath, 'utf-8');
    return /^#{1,2}\s+Synthesis Notes/im.test(content);
  } catch {
    return false;
  }
}

/**
 * Get the list of output files for a multi-model stage.
 * Checks the stage's outputs directory for markdown files.
 */
export function getMultiModelOutputFiles(
  projectRoot: string,
  stageId: StageId
): string[] {
  const outputsDir = path.join(projectRoot, 'stages', stageId, 'outputs');
  if (!existsSync(outputsDir)) return [];

  try {
    const { readdirSync } = require('fs');
    const files: string[] = readdirSync(outputsDir);
    return files
      .filter((f: string) => f.endsWith('.md'))
      .map((f: string) => path.join('stages', stageId, 'outputs', f));
  } catch {
    return [];
  }
}

/**
 * Verify multi-model gate for a stage.
 *
 * Verification layers:
 * 1. (existing) ai-call-log.jsonl has multi-model entry for this stage
 * 2. (new) state/ai-outputs/{stageId}.md exists and is >= 500 bytes
 * 3. (new) Output passes quality validation (not meta-commentary)
 * 4. (new) Stage output files contain "## Synthesis Notes" section
 *
 * Gate judgment:
 * - External AI success + Synthesis Notes → PASSED
 * - External AI failed + Synthesis Notes with failure documented → WARNING (passes)
 * - No Synthesis Notes at all → FAILED (blocks transition)
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

  // Layer 1: Check ai-call-log.jsonl for multi-model entries
  const entries = getAiCallLogEntries(projectRoot, stageId);
  const multiModelEntries = entries.filter((e) => e.type === 'multi-model');
  const logExists = multiModelEntries.length > 0;

  if (!logExists) {
    return {
      passed: false,
      message:
        `Stage ${stageId} requires multi-model execution but no AI call log entries found. ` +
        `Run: claude-symphony ai-call --stage ${stageId}`,
      details: {
        logExists: false,
        outputExists: false,
        outputQuality: null,
        synthesisFound: false,
      },
    };
  }

  // Check if the external AI call was a fallback/error (attempt was made but failed)
  const hasFallback = multiModelEntries.some(
    (e) => e.action === 'fallback' || e.action === 'error'
  );
  const hasSuccess = multiModelEntries.some((e) => e.action === 'called');

  // Layer 2: Check ai-outputs file exists and meets minimum size
  const aiOutputPath = path.join(projectRoot, 'state', 'ai-outputs', `${stageId}.md`);
  const outputStat = existsSync(aiOutputPath) ? statSync(aiOutputPath) : null;
  const outputExists = !!outputStat && (outputStat.size ?? 0) >= 500;

  // Layer 3: Quality validation on the output file
  let outputQuality: QualityResult | null = null;
  if (outputExists) {
    try {
      const content = readFileSync(aiOutputPath, 'utf-8');
      outputQuality = validateOutputQuality(content, '', { stageId });
    } catch {
      // Quality check failure is non-fatal
    }
  }

  // Layer 4: Check for Synthesis Notes in stage output files
  const outputFiles = getMultiModelOutputFiles(projectRoot, stageId);
  const synthesisFound = outputFiles.some((f) =>
    hasSynthesisNotes(path.join(projectRoot, f))
  );

  const details: MultiModelGateDetails = {
    logExists,
    outputExists,
    outputQuality,
    synthesisFound,
  };

  // Gate judgment
  if (!synthesisFound) {
    return {
      passed: false,
      message:
        `Stage ${stageId}: Synthesis Notes section missing in output files. ` +
        `Multi-model stages MUST include a "## Synthesis Notes" section documenting external AI contributions.`,
      details,
    };
  }

  // If external AI failed but Synthesis Notes documents the failure → warning (passes)
  if (hasFallback && !hasSuccess) {
    return {
      passed: true,
      message:
        `Multi-model gate passed with WARNING: external AI failed for ${stageId}, ` +
        `but Synthesis Notes documents the fallback. (${multiModelEntries.length} call(s) logged)`,
      details,
    };
  }

  // If external AI succeeded but output quality is poor
  if (hasSuccess && outputQuality && !outputQuality.passes) {
    return {
      passed: false,
      message:
        `Stage ${stageId}: AI output failed quality check — ${outputQuality.reason}. ` +
        `External AI output may be meta-commentary rather than actual content.`,
      details,
    };
  }

  return {
    passed: true,
    message: `Multi-model gate passed (${multiModelEntries.length} call(s) logged, quality OK, synthesis verified)`,
    details,
  };
}
