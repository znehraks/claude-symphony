/**
 * Stage-related type definitions
 */
import { z } from 'zod';

/**
 * Valid stage IDs
 */
export const STAGE_IDS = [
  '01-brainstorm',
  '02-research',
  '03-planning',
  '04-ui-ux',
  '05-task-management',
  '06-implementation',
  '07-qa',
  '08-deployment',
] as const;

export type StageId = (typeof STAGE_IDS)[number];

/**
 * Stage ID schema
 */
export const StageIdSchema = z.enum(STAGE_IDS).describe('Unique identifier for a pipeline stage (01-brainstorm through 08-deployment)');

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
 * Stage name mapping
 */
export const STAGE_NAMES: Record<StageId, string> = {
  '01-brainstorm': 'Brainstorming',
  '02-research': 'Research',
  '03-planning': 'Planning',
  '04-ui-ux': 'UI/UX Design',
  '05-task-management': 'Task Management',
  '06-implementation': 'Implementation',
  '07-qa': 'QA & Full Testing',
  '08-deployment': 'Deployment',
};

/**
 * Stage AI model mapping
 */
export const STAGE_AI_MODELS: Record<StageId, string> = {
  '01-brainstorm': 'Gemini + ClaudeCode',
  '02-research': 'Claude',
  '03-planning': 'Gemini',
  '04-ui-ux': 'Gemini',
  '05-task-management': 'ClaudeCode',
  '06-implementation': 'ClaudeCode',
  '07-qa': 'ClaudeCode',
  '08-deployment': 'ClaudeCode',
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
