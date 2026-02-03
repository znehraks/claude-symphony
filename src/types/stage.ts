/**
 * Stage-related type definitions
 */
import { z } from 'zod';

/**
 * Valid stage IDs (v2: 5-stage quality-based pipeline)
 */
export const STAGE_IDS = [
  '01-planning',
  '02-ui-ux',
  '03-implementation',
  '04-qa',
  '05-deployment',
] as const;

export type StageId = (typeof STAGE_IDS)[number];

/**
 * Stage ID schema
 */
export const StageIdSchema = z.enum(STAGE_IDS).describe('Unique identifier for a pipeline stage (01-planning through 05-deployment)');

/**
 * AI models available in the pipeline
 */
export const AI_MODELS = ['claudecode', 'claude', 'gemini', 'codex'] as const;
export type AIModel = (typeof AI_MODELS)[number];
export const AIModelSchema = z.enum(AI_MODELS).describe('AI model identifier: claudecode (Claude Code), claude (Claude research), gemini (Google Gemini), codex (OpenAI Codex)');

/**
 * Execution modes
 */
export const EXECUTION_MODES = [
  'yolo',
  'plan',
  'plan_sandbox',
  'deep_dive',
  'headless',
  'sandbox_playwright',
] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];
export const ExecutionModeSchema = z.enum(EXECUTION_MODES).describe('Execution mode: yolo (autonomous), plan (user confirmation), plan_sandbox (sandboxed), deep_dive (analysis), headless (CI/CD), sandbox_playwright (E2E testing)');

/**
 * Collaboration modes
 */
export const COLLABORATION_MODES = ['parallel', 'sequential', 'debate'] as const;
export type CollaborationMode = (typeof COLLABORATION_MODES)[number];
export const CollaborationModeSchema = z.enum(COLLABORATION_MODES).describe('Multi-AI collaboration mode: parallel (simultaneous), sequential (handoff chain), debate (convergence)');

/**
 * Stage status
 */
export const STAGE_STATUS = ['pending', 'in_progress', 'completed', 'skipped'] as const;
export type StageStatus = (typeof STAGE_STATUS)[number];
export const StageStatusSchema = z.enum(STAGE_STATUS).describe('Stage execution status');

/**
 * Stage information (for display)
 */
export interface StageInfo {
  id: StageId;
  name: string;
  models: AIModel[];
  mode: ExecutionMode;
}

/**
 * Stage name mapping (v2: 5-stage quality-based pipeline)
 */
export const STAGE_NAMES: Record<StageId, string> = {
  '01-planning': 'Planning & Architecture',
  '02-ui-ux': 'UI/UX Design',
  '03-implementation': 'Implementation',
  '04-qa': 'QA & E2E Testing',
  '05-deployment': 'Deployment',
};

/**
 * Stage AI model mapping (v2: SuperClaude commands)
 */
export const STAGE_AI_MODELS: Record<StageId, string> = {
  '01-planning': '/sc:workflow + /sc:design',
  '02-ui-ux': '/sc:design --type component',
  '03-implementation': '/sc:implement --with-tests',
  '04-qa': '/sc:test --type e2e',
  '05-deployment': '/sc:build',
};

/**
 * Get next stage
 */
export function getNextStage(current: StageId): StageId | 'completed' {
  const index = STAGE_IDS.indexOf(current);
  if (index === -1 || index === STAGE_IDS.length - 1) {
    return 'completed';
  }
  return STAGE_IDS[index + 1]!;
}

/**
 * Get previous stage
 */
export function getPrevStage(current: StageId): StageId | 'none' {
  const index = STAGE_IDS.indexOf(current);
  if (index <= 0) {
    return 'none';
  }
  return STAGE_IDS[index - 1]!;
}

/**
 * Check if stage ID is valid
 */
export function isValidStageId(id: string): id is StageId {
  return STAGE_IDS.includes(id as StageId);
}

/**
 * Get stage name
 */
export function getStageName(id: StageId): string {
  return STAGE_NAMES[id];
}

/**
 * Get stage AI description
 */
export function getStageAI(id: StageId): string {
  return STAGE_AI_MODELS[id];
}
