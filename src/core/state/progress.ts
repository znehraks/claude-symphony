/**
 * Progress state management
 * Manages the progress.json file
 */
import path from 'path';
import { readJson, writeJson, pathExists } from '../../utils/fs.js';
import { getTimestamp } from '../../utils/shell.js';
import { ProgressSchema, type Progress, type MultiModelStatus, createInitialProgress } from '../../types/state.js';
import { STAGE_IDS } from '../../types/stage.js';
import type { StageId, StageStatus } from '../../types/stage.js';

/**
 * Get the path to progress.json
 */
export function getProgressPath(projectRoot: string): string {
  return path.join(projectRoot, 'state', 'progress.json');
}

/**
 * Load progress from file
 */
export async function loadProgress(projectRoot: string): Promise<Progress | null> {
  const progressPath = getProgressPath(projectRoot);
  const data = await readJson<unknown>(progressPath);

  if (!data) return null;

  const result = ProgressSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  console.error('Progress validation error:', result.error.format());
  // Return the data as-is if it doesn't fully validate (for backwards compatibility)
  return data as Progress;
}

/**
 * Save progress to file
 */
export async function saveProgress(
  projectRoot: string,
  progress: Progress
): Promise<boolean> {
  const progressPath = getProgressPath(projectRoot);
  progress.last_updated = getTimestamp();
  return writeJson(progressPath, progress);
}

/**
 * Initialize progress for a new project
 */
export async function initProgress(
  projectRoot: string,
  projectName: string
): Promise<Progress> {
  const progress = createInitialProgress(projectName);
  await saveProgress(projectRoot, progress);
  return progress;
}

/**
 * Check if progress exists
 */
export function progressExists(projectRoot: string): boolean {
  return pathExists(getProgressPath(projectRoot));
}

/**
 * Get current stage from progress
 */
export async function getCurrentStage(projectRoot: string): Promise<StageId | null> {
  const progress = await loadProgress(projectRoot);
  return progress?.current_stage ?? null;
}

/**
 * Update current stage
 */
export async function updateCurrentStage(
  projectRoot: string,
  stageId: StageId,
  status: StageStatus = 'in_progress'
): Promise<boolean> {
  const progress = await loadProgress(projectRoot);
  if (!progress) return false;

  progress.current_stage = stageId;
  progress.stage_status = status;

  // Update individual stage status
  if (progress.stages[stageId]) {
    progress.stages[stageId].status = status;
    if (status === 'in_progress' && !progress.stages[stageId].started_at) {
      progress.stages[stageId].started_at = getTimestamp();
    }
    if (status === 'completed') {
      progress.stages[stageId].completed_at = getTimestamp();
    }
  }

  return saveProgress(projectRoot, progress);
}

/**
 * Mark stage as completed
 */
export async function completeStage(
  projectRoot: string,
  stageId: StageId,
  checkpointId?: string,
  multiModel?: MultiModelStatus
): Promise<boolean> {
  const progress = await loadProgress(projectRoot);
  if (!progress) return false;

  if (progress.stages[stageId]) {
    progress.stages[stageId].status = 'completed';
    progress.stages[stageId].completed_at = getTimestamp();
    if (checkpointId) {
      progress.stages[stageId].checkpoint_id = checkpointId;
    }
    if (multiModel) {
      progress.stages[stageId].multi_model = multiModel;
    }
  }

  progress.stage_status = 'completed';

  return saveProgress(projectRoot, progress);
}

/**
 * Get stage status
 */
export async function getStageStatus(
  projectRoot: string,
  stageId: StageId
): Promise<StageStatus | null> {
  const progress = await loadProgress(projectRoot);
  return progress?.stages[stageId]?.status ?? null;
}

/**
 * Update sprint status
 */
export async function updateSprintStatus(
  projectRoot: string,
  sprintName: string,
  status: 'pending' | 'in_progress' | 'completed',
  tasksCompleted?: number,
  tasksTotal?: number
): Promise<boolean> {
  const progress = await loadProgress(projectRoot);
  if (!progress?.sprints) return false;

  if (progress.sprints[sprintName]) {
    progress.sprints[sprintName].status = status;
    if (tasksCompleted !== undefined) {
      progress.sprints[sprintName].tasks_completed = tasksCompleted;
    }
    if (tasksTotal !== undefined) {
      progress.sprints[sprintName].tasks_total = tasksTotal;
    }
  }

  return saveProgress(projectRoot, progress);
}

/**
 * Get current sprint
 */
export async function getCurrentSprint(projectRoot: string): Promise<{
  name: string;
  number: number;
  total: number;
} | null> {
  const progress = await loadProgress(projectRoot);
  if (!progress?.current_iteration) return null;

  const sprintNum = progress.current_iteration.current_sprint;
  const total = progress.current_iteration.total_sprints;

  return {
    name: `Sprint ${sprintNum}`,
    number: sprintNum,
    total,
  };
}

/**
 * Advance to next sprint
 */
export async function advanceToNextSprint(projectRoot: string): Promise<boolean> {
  const progress = await loadProgress(projectRoot);
  if (!progress?.current_iteration) return false;

  const current = progress.current_iteration.current_sprint;
  const total = progress.current_iteration.total_sprints;

  if (current >= total) {
    return false; // Already at last sprint
  }

  progress.current_iteration.current_sprint = current + 1;
  return saveProgress(projectRoot, progress);
}

/**
 * Add checkpoint to progress
 */
export async function addCheckpointToProgress(
  projectRoot: string,
  checkpoint: {
    id: string;
    stage: StageId;
    description?: string;
  }
): Promise<boolean> {
  const progress = await loadProgress(projectRoot);
  if (!progress) return false;

  if (!progress.checkpoints) {
    progress.checkpoints = [];
  }

  progress.checkpoints.push({
    id: checkpoint.id,
    stage: checkpoint.stage,
    created_at: getTimestamp(),
    description: checkpoint.description,
  });

  return saveProgress(projectRoot, progress);
}

/**
 * Progress manager class
 */
export class ProgressManager {
  private projectRoot: string;
  private progress: Progress | null = null;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load progress (cached)
   */
  async load(): Promise<Progress | null> {
    if (!this.progress) {
      this.progress = await loadProgress(this.projectRoot);
    }
    return this.progress;
  }

  /**
   * Save progress
   */
  async save(): Promise<boolean> {
    if (!this.progress) return false;
    return saveProgress(this.projectRoot, this.progress);
  }

  /**
   * Reload progress from disk
   */
  async reload(): Promise<Progress | null> {
    this.progress = await loadProgress(this.projectRoot);
    return this.progress;
  }

  /**
   * Get current stage
   */
  async getCurrentStage(): Promise<StageId | null> {
    const progress = await this.load();
    return progress?.current_stage ?? null;
  }

  /**
   * Set current stage
   */
  async setCurrentStage(stageId: StageId, status: StageStatus = 'in_progress'): Promise<boolean> {
    const progress = await this.load();
    if (!progress) return false;

    progress.current_stage = stageId;
    progress.stage_status = status;

    if (progress.stages[stageId]) {
      progress.stages[stageId].status = status;
      if (status === 'in_progress' && !progress.stages[stageId].started_at) {
        progress.stages[stageId].started_at = getTimestamp();
      }
    }

    return this.save();
  }

  /**
   * Complete current stage
   */
  async completeCurrentStage(checkpointId?: string): Promise<boolean> {
    const progress = await this.load();
    if (!progress) return false;

    const stageId = progress.current_stage;
    if (progress.stages[stageId]) {
      progress.stages[stageId].status = 'completed';
      progress.stages[stageId].completed_at = getTimestamp();
      if (checkpointId) {
        progress.stages[stageId].checkpoint_id = checkpointId;
      }
    }

    progress.stage_status = 'completed';
    return this.save();
  }

  /**
   * Get the next stage after the current one.
   * Returns the next StageId or null if pipeline is complete.
   */
  async getNextStage(): Promise<StageId | null> {
    const progress = await this.load();
    if (!progress) return null;

    const currentIndex = STAGE_IDS.indexOf(progress.current_stage);
    if (currentIndex === -1 || currentIndex >= STAGE_IDS.length - 1) {
      return null;
    }
    return STAGE_IDS[currentIndex + 1]!;
  }

  /**
   * Check if all stages are completed.
   */
  async isComplete(): Promise<boolean> {
    const progress = await this.load();
    if (!progress) return false;

    return STAGE_IDS.every(
      (stageId) => progress.stages[stageId]?.status === 'completed' || progress.stages[stageId]?.status === 'skipped'
    );
  }

  /**
   * Get all stages with their statuses.
   */
  async getStageStatuses(): Promise<Array<{ id: StageId; status: StageStatus }>> {
    const progress = await this.load();
    if (!progress) return [];

    return STAGE_IDS.map((id) => ({
      id,
      status: progress.stages[id]?.status ?? 'pending',
    }));
  }
}
