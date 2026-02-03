/**
 * PipelineOrchestrator — Auto-pilot loop for claude-symphony
 *
 * Iterates through pipeline stages, spawning Task agents for each stage,
 * validating outputs, generating HANDOFFs, and auto-progressing.
 *
 * Design: This module provides orchestration utilities. The actual Task tool
 * invocation happens from the `/auto-pilot` Claude Code command, which calls
 * these utilities to manage state, validation, and stage transitions.
 */
import path from 'path';
import fs from 'fs';
import { ProgressManager } from '../state/progress.js';
import { STAGE_IDS, STAGE_NAMES } from '../../types/stage.js';
import type { StageId, StageStatus } from '../../types/stage.js';
import { generateAutoHandoff } from '../../utils/auto-handoff.js';
import { runOutputValidation } from '../../hooks/output-validator.js';
import type { ValidationSummary } from '../../hooks/output-validator.js';
import { logInfo, logSuccess, logError } from '../../utils/logger.js';

/**
 * Stage persona configuration loaded from stage_personas.jsonc
 */
export interface StagePersona {
  role: string;
  temperature: number;
  model: string;
  focus: string;
}

/**
 * Reference files found for a stage
 */
export interface StageReferences {
  files: Array<{ name: string; path: string; content: string }>;
}

/**
 * Result of a single stage execution
 */
export interface StageExecutionResult {
  stageId: StageId;
  success: boolean;
  attempts: number;
  validationScore: number;
  duration_ms: number;
  error?: string;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  completed: boolean;
  stagesRun: number;
  stagesCompleted: number;
  stagesFailed: number;
  results: StageExecutionResult[];
  stoppedAt?: StageId;
  error?: string;
}

/**
 * Retry state for a stage attempt
 */
export interface StageRetryState {
  stageId: StageId;
  attempt: number;
  maxAttempts: number;
  validationErrors: string[];
  lastScore: number;
}

/**
 * Pipeline state (persisted for pause/resume)
 */
export interface PipelineState {
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStage: StageId | null;
  retryState: StageRetryState | null;
  startedAt: string;
  pausedAt?: string;
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  projectRoot: string;
  maxRetries: number;
  startFromStage?: StageId;
  stopAfterStage?: StageId;
  dryRun?: boolean;
}

/**
 * Load stage persona from config
 */
export function loadStagePersona(
  projectRoot: string,
  stageId: StageId
): StagePersona | null {
  const personaPath = path.join(projectRoot, 'config', 'stage_personas.jsonc');
  if (!fs.existsSync(personaPath)) return null;

  try {
    const { parse } = require('jsonc-parser');
    const content = fs.readFileSync(personaPath, 'utf-8');
    const config = parse(content);
    const personas = config?.stage_personas?.stages;
    if (!personas) return null;

    const stageKey = stageId.replace(/^\d+-/, '');
    const persona = personas[stageKey] || personas[stageId];
    if (!persona) return null;

    return {
      role: persona.role || persona.description || STAGE_NAMES[stageId],
      temperature: persona.temperature ?? 0.5,
      model: persona.model || persona.ai_model || 'sonnet',
      focus: persona.focus || '',
    };
  } catch {
    return null;
  }
}

/**
 * Load reference files for a stage
 */
export function loadStageReferences(
  projectRoot: string,
  stageId: StageId
): StageReferences {
  const refsDir = path.join(projectRoot, 'references', stageId);
  const result: StageReferences = { files: [] };

  if (!fs.existsSync(refsDir)) return result;

  try {
    const files = fs.readdirSync(refsDir);
    for (const file of files) {
      const filePath = path.join(refsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile() && stat.size < 50000) {
        // Only read text files under 50KB
        const ext = path.extname(file).toLowerCase();
        const textExts = ['.md', '.txt', '.json', '.jsonc', '.yaml', '.yml', '.ts', '.js', '.tsx', '.jsx', '.css', '.html'];
        if (textExts.includes(ext)) {
          result.files.push({
            name: file,
            path: filePath,
            content: fs.readFileSync(filePath, 'utf-8'),
          });
        }
      }
    }
  } catch {
    // silently skip
  }

  return result;
}

/**
 * Load stage CLAUDE.md instructions
 */
export function loadStageInstructions(
  projectRoot: string,
  stageId: StageId
): string {
  const claudePath = path.join(projectRoot, 'stages', stageId, 'CLAUDE.md');
  if (!fs.existsSync(claudePath)) {
    return `Execute stage ${stageId} (${STAGE_NAMES[stageId]}).`;
  }
  return fs.readFileSync(claudePath, 'utf-8');
}

/**
 * Load previous stage HANDOFF
 */
export function loadPreviousHandoff(
  projectRoot: string,
  stageId: StageId
): string | null {
  const stageIndex = STAGE_IDS.indexOf(stageId);
  if (stageIndex <= 0) return null;

  const prevStage = STAGE_IDS[stageIndex - 1]!;
  const handoffPath = path.join(projectRoot, 'stages', prevStage, 'HANDOFF.md');
  if (!fs.existsSync(handoffPath)) {
    // Try root HANDOFF.md
    const rootHandoff = path.join(projectRoot, 'HANDOFF.md');
    if (fs.existsSync(rootHandoff)) {
      return fs.readFileSync(rootHandoff, 'utf-8');
    }
    return null;
  }
  return fs.readFileSync(handoffPath, 'utf-8');
}

/**
 * Build the prompt for a stage agent.
 * Combines: stage instructions + persona + previous handoff + references + project brief
 */
export function buildStagePrompt(
  projectRoot: string,
  stageId: StageId
): string {
  const parts: string[] = [];

  // 1. Stage instructions
  const instructions = loadStageInstructions(projectRoot, stageId);
  parts.push(`# Stage: ${stageId} — ${STAGE_NAMES[stageId]}\n\n${instructions}`);

  // 2. Persona
  const persona = loadStagePersona(projectRoot, stageId);
  if (persona) {
    parts.push(`## Persona\n- Role: ${persona.role}\n- Temperature: ${persona.temperature}\n- Focus: ${persona.focus}`);
  }

  // 3. Previous HANDOFF context
  const handoff = loadPreviousHandoff(projectRoot, stageId);
  if (handoff) {
    parts.push(`## Context from Previous Stage\n\n${handoff}`);
  }

  // 4. Reference files
  const refs = loadStageReferences(projectRoot, stageId);
  if (refs.files.length > 0) {
    let refSection = '## Reference Materials\n';
    for (const ref of refs.files) {
      refSection += `\n### ${ref.name}\n\`\`\`\n${ref.content}\n\`\`\`\n`;
    }
    parts.push(refSection);
  }

  // 5. Project brief (for first stage)
  if (stageId === '01-brainstorm') {
    const briefPath = path.join(projectRoot, 'stages', '01-brainstorm', 'inputs', 'project_brief.md');
    if (fs.existsSync(briefPath)) {
      const brief = fs.readFileSync(briefPath, 'utf-8');
      parts.push(`## Project Brief\n\n${brief}`);
    }
  }

  // 6. Output directory
  parts.push(`## Output Directory\nSave all outputs to: \`stages/${stageId}/outputs/\``);

  return parts.join('\n\n---\n\n');
}

/**
 * Validate stage outputs. Returns validation summary.
 */
export async function validateStage(
  projectRoot: string,
  stageId: StageId
): Promise<ValidationSummary> {
  return runOutputValidation(projectRoot, stageId, false);
}

/**
 * Generate HANDOFF for completed stage
 */
export async function generateStageHandoff(
  projectRoot: string,
  _stageId: StageId
): Promise<boolean> {
  const result = await generateAutoHandoff(projectRoot, {
    trigger: 'stage_complete',
  });
  return result !== null;
}

/**
 * Get pipeline status summary for display
 */
export async function getPipelineStatus(projectRoot: string): Promise<{
  currentStage: StageId | null;
  stages: Array<{ id: StageId; name: string; status: StageStatus }>;
  isComplete: boolean;
  progress: number;
}> {
  const pm = new ProgressManager(projectRoot);
  const statuses = await pm.getStageStatuses();
  const currentStage = await pm.getCurrentStage();
  const isComplete = await pm.isComplete();

  const completed = statuses.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  const progress = Math.round((completed / STAGE_IDS.length) * 100);

  return {
    currentStage,
    stages: statuses.map((s) => ({
      ...s,
      name: STAGE_NAMES[s.id],
    })),
    isComplete,
    progress,
  };
}

/**
 * Run the full auto-pilot pipeline.
 *
 * Note: This function manages state transitions and validation.
 * The actual agent execution (Task tool calls) must be handled by
 * the calling context (Claude Code session via /auto-pilot command).
 *
 * This function is designed to be called step-by-step from the
 * auto-pilot command, not as a single blocking call.
 */
export async function prepareStageExecution(
  projectRoot: string,
  stageId: StageId
): Promise<{
  prompt: string;
  persona: StagePersona | null;
  model: string;
}> {
  // Set stage to in_progress
  const pm = new ProgressManager(projectRoot);
  await pm.setCurrentStage(stageId, 'in_progress');

  // Build prompt
  const prompt = buildStagePrompt(projectRoot, stageId);
  const persona = loadStagePersona(projectRoot, stageId);
  const model = persona?.model || 'balanced';

  logInfo(`Prepared stage ${stageId} (${STAGE_NAMES[stageId]}) with model: ${model}`);

  return { prompt, persona, model };
}

/**
 * Finalize a stage after agent execution.
 * Validates outputs, generates HANDOFF, creates checkpoint, updates progress.
 */
export async function finalizeStage(
  projectRoot: string,
  stageId: StageId
): Promise<{ success: boolean; validation: ValidationSummary; nextStage: StageId | null }> {
  // Validate outputs
  const validation = await validateStage(projectRoot, stageId);

  if (validation.failed > 0) {
    logError(`Stage ${stageId} validation failed (score: ${validation.score.toFixed(2)})`);
    return { success: false, validation, nextStage: null };
  }

  // Generate HANDOFF
  await generateStageHandoff(projectRoot, stageId);

  // Complete stage
  const pm = new ProgressManager(projectRoot);
  await pm.completeCurrentStage();

  // Get next stage
  const nextStage = await pm.getNextStage();
  const isComplete = await pm.isComplete();

  if (isComplete) {
    logSuccess('Pipeline complete! All stages finished.');
  } else if (nextStage) {
    logInfo(`Next stage: ${nextStage} (${STAGE_NAMES[nextStage]})`);
  }

  return { success: true, validation, nextStage };
}

/**
 * Build a retry prompt that includes validation feedback from the failed attempt.
 */
export function buildRetryPrompt(
  projectRoot: string,
  stageId: StageId,
  retryState: StageRetryState
): string {
  const basePrompt = buildStagePrompt(projectRoot, stageId);
  const errorList = retryState.validationErrors
    .map((e, i) => `${i + 1}. ${e}`)
    .join('\n');

  // For implementation/testing stages, try to include test failure output
  let testFailureContext = '';
  if (['06-implementation', '07-qa'].includes(stageId)) {
    const testErrors = retryState.validationErrors.filter(
      (e) => e.includes('test') || e.includes('Test') || e.includes('build') || e.includes('Build')
    );
    if (testErrors.length > 0) {
      testFailureContext = `

## Test/Build Failure Details

The following test or build commands failed. Focus on fixing these FIRST before addressing other issues:
${testErrors.map((e) => `- ${e}`).join('\n')}

**Strategy**: Run the failing command locally, read the error output, fix the root cause, then re-run to verify.`;
    }
  }

  return `${basePrompt}

---

## RETRY ATTEMPT ${retryState.attempt} of ${retryState.maxAttempts}

The previous attempt failed validation (score: ${retryState.lastScore.toFixed(2)}). Please fix the following issues:

${errorList}
${testFailureContext}

Focus on producing all required output files with sufficient content. Check the "Required Outputs" and "Quality Gate" sections above carefully.`;
}

/**
 * Finalize a stage with retry support.
 * Returns updated retry state if validation fails within retry budget.
 */
export async function finalizeStageWithRetry(
  projectRoot: string,
  stageId: StageId,
  retryState: StageRetryState | null
): Promise<{
  success: boolean;
  validation: ValidationSummary;
  nextStage: StageId | null;
  retryState: StageRetryState | null;
  shouldRetry: boolean;
}> {
  const validation = await validateStage(projectRoot, stageId);
  const maxAttempts = retryState?.maxAttempts ?? 3;
  const currentAttempt = retryState?.attempt ?? 1;

  if (validation.failed > 0) {
    const errors = validation.checks
      .filter((c) => !c.passed)
      .map((c) => c.message || `Check "${c.name}" failed`);

    if (currentAttempt < maxAttempts) {
      const newRetryState: StageRetryState = {
        stageId,
        attempt: currentAttempt + 1,
        maxAttempts,
        validationErrors: errors,
        lastScore: validation.score,
      };

      logError(
        `Stage ${stageId} validation failed (attempt ${currentAttempt}/${maxAttempts}, score: ${validation.score.toFixed(2)}). Retrying...`
      );

      return {
        success: false,
        validation,
        nextStage: null,
        retryState: newRetryState,
        shouldRetry: true,
      };
    }

    logError(
      `Stage ${stageId} failed after ${maxAttempts} attempts. Pipeline paused.`
    );

    return {
      success: false,
      validation,
      nextStage: null,
      retryState: null,
      shouldRetry: false,
    };
  }

  // Validation passed — finalize
  await generateStageHandoff(projectRoot, stageId);

  const pm = new ProgressManager(projectRoot);
  await pm.completeCurrentStage();

  const nextStage = await pm.getNextStage();
  const isComplete = await pm.isComplete();

  if (isComplete) {
    logSuccess('Pipeline complete! All stages finished.');
  } else if (nextStage) {
    logInfo(`Next stage: ${nextStage} (${STAGE_NAMES[nextStage]})`);
  }

  return {
    success: true,
    validation,
    nextStage,
    retryState: null,
    shouldRetry: false,
  };
}

// --- Pipeline state persistence ---

const PIPELINE_STATE_FILE = 'state/pipeline_state.json';

/**
 * Load pipeline state from disk
 */
export function loadPipelineState(projectRoot: string): PipelineState | null {
  const statePath = path.join(projectRoot, PIPELINE_STATE_FILE);
  if (!fs.existsSync(statePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Save pipeline state to disk
 */
export function savePipelineState(
  projectRoot: string,
  state: PipelineState
): void {
  const statePath = path.join(projectRoot, PIPELINE_STATE_FILE);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

/**
 * Pause the pipeline
 */
export function pausePipeline(projectRoot: string): PipelineState {
  const existing = loadPipelineState(projectRoot) ?? {
    status: 'running' as const,
    currentStage: null,
    retryState: null,
    startedAt: new Date().toISOString(),
  };

  const paused: PipelineState = {
    ...existing,
    status: 'paused',
    pausedAt: new Date().toISOString(),
  };

  savePipelineState(projectRoot, paused);
  logInfo('Pipeline paused. Run /resume to continue.');
  return paused;
}

/**
 * Resume a paused pipeline
 */
export function resumePipeline(projectRoot: string): PipelineState | null {
  const state = loadPipelineState(projectRoot);
  if (!state || state.status !== 'paused') {
    logError('No paused pipeline to resume.');
    return null;
  }

  const resumed: PipelineState = {
    ...state,
    status: 'running',
    pausedAt: undefined,
  };

  savePipelineState(projectRoot, resumed);
  logInfo(`Pipeline resumed from stage ${state.currentStage}.`);
  return resumed;
}

/**
 * Skip the current stage
 */
export async function skipStage(
  projectRoot: string,
  stageId: StageId
): Promise<StageId | null> {
  const pm = new ProgressManager(projectRoot);
  await pm.setCurrentStage(stageId, 'skipped');

  // Mark as skipped, not completed
  const progress = await pm.load();
  if (progress && progress.stages[stageId]) {
    progress.stages[stageId].status = 'skipped';
    await pm.save();
  }

  const nextStage = await pm.getNextStage();
  logInfo(`Skipped stage ${stageId}. Next: ${nextStage ?? 'none'}`);
  return nextStage;
}
