/**
 * State type definitions
 */
import { z } from 'zod';
import { StageIdSchema, StageStatusSchema } from './stage.js';

/**
 * Sprint status
 */
export const SprintStatusSchema = z.enum(['pending', 'in_progress', 'completed']);
export type SprintStatus = z.infer<typeof SprintStatusSchema>;

/**
 * Sprint state
 */
export const SprintStateSchema = z.object({
  status: SprintStatusSchema,
  tasks_total: z.number(),
  tasks_completed: z.number(),
  checkpoint_id: z.string().nullable(),
});

export type SprintState = z.infer<typeof SprintStateSchema>;

/**
 * Epic cycle state
 */
export const EpicCycleStateSchema = z.object({
  enabled: z.boolean(),
  current_cycle: z.number(),
  total_cycles: z.number(),
  scope: z.object({
    start_stage: StageIdSchema,
    end_stage: StageIdSchema,
  }),
});

export type EpicCycleState = z.infer<typeof EpicCycleStateSchema>;

/**
 * Current iteration state
 */
export const CurrentIterationSchema = z.object({
  current_sprint: z.number(),
  total_sprints: z.number(),
  epic_context: z.object({
    enabled: z.boolean(),
    current_cycle: z.number(),
    total_cycles: z.number(),
  }).optional(),
});

export type CurrentIteration = z.infer<typeof CurrentIterationSchema>;

/**
 * Progress JSON schema
 */
export const ProgressSchema = z.object({
  project_name: z.string(),
  current_stage: StageIdSchema,
  stage_status: StageStatusSchema,
  started_at: z.string(),
  last_updated: z.string(),
  pipeline: z.object({
    name: z.string(),
    version: z.string(),
    started_at: z.string(),
    updated_at: z.string(),
  }).optional(),
  stages: z.record(StageIdSchema, z.object({
    status: StageStatusSchema,
    started_at: z.string().nullable(),
    completed_at: z.string().nullable(),
    checkpoint_id: z.string().nullable(),
  })),
  current_iteration: CurrentIterationSchema.optional(),
  sprints: z.record(z.string(), SprintStateSchema).optional(),
  epic_cycle: EpicCycleStateSchema.optional(),
  implementation_order: z.object({
    selected: z.string().nullable(),
  }).optional(),
  requirements_refinement: z.object({
    active: z.boolean(),
  }).optional(),
  checkpoints: z.array(z.object({
    id: z.string(),
    stage: StageIdSchema,
    created_at: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export type Progress = z.infer<typeof ProgressSchema>;

/**
 * Checkpoint metadata
 */
export interface CheckpointMetadata {
  id: string;
  stage: string;
  createdAt: string;
  description?: string;
  files: string[];
}

/**
 * Handoff content
 */
export interface HandoffContent {
  stage: string;
  completedAt: string;
  completedTasks: string[];
  keyDecisions: string[];
  modifiedFiles: string[];
  pendingIssues: string[];
  nextSteps: string[];
  aiCallLog: Array<{
    ai: string;
    time: string;
    prompt: string;
    result: string;
    status: string;
  }>;
}

/**
 * Context state
 */
export interface ContextState {
  remainingPercent: number;
  saveTrigger: string;
  stageId: string;
  stageName: string;
  completedTasks: string[];
  currentTask: string;
  pendingTasks: string[];
  majorDecisions: string[];
  modifiedFiles: string[];
  activeIssues: string[];
}

/**
 * Create initial progress object
 */
export function createInitialProgress(projectName: string): Progress {
  const now = new Date().toISOString();
  const stages: Progress['stages'] = {} as Progress['stages'];

  const stageIds = [
    '01-brainstorm',
    '02-research',
    '03-planning',
    '04-ui-ux',
    '05-task-management',
    '06-implementation',
    '07-refactoring',
    '08-qa',
    '09-testing',
    '10-deployment',
  ] as const;

  for (const id of stageIds) {
    stages[id] = {
      status: 'pending',
      started_at: null,
      completed_at: null,
      checkpoint_id: null,
    };
  }

  return {
    project_name: projectName,
    current_stage: '01-brainstorm',
    stage_status: 'pending',
    started_at: now,
    last_updated: now,
    stages,
    current_iteration: {
      current_sprint: 1,
      total_sprints: 3,
      epic_context: {
        enabled: false,
        current_cycle: 1,
        total_cycles: 1,
      },
    },
    sprints: {
      'Sprint 1': { status: 'pending', tasks_total: 0, tasks_completed: 0, checkpoint_id: null },
      'Sprint 2': { status: 'pending', tasks_total: 0, tasks_completed: 0, checkpoint_id: null },
      'Sprint 3': { status: 'pending', tasks_total: 0, tasks_completed: 0, checkpoint_id: null },
    },
    epic_cycle: {
      enabled: false,
      current_cycle: 1,
      total_cycles: 1,
      scope: {
        start_stage: '01-brainstorm',
        end_stage: '05-task-management',
      },
    },
    implementation_order: {
      selected: null,
    },
    requirements_refinement: {
      active: true,
    },
    checkpoints: [],
  };
}
