/**
 * Auto-checkpoint hook logic
 * Automatically creates checkpoints based on triggers
 * Migrated from .claude/hooks/auto-checkpoint.sh
 */
import path from 'path';
import { readJson, writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning } from '../utils/logger.js';
import { getTimestamp } from '../utils/shell.js';
import { createCheckpoint, cleanupCheckpoints } from '../core/state/checkpoint.js';
import { ProgressManager } from '../core/state/progress.js';
import type { StageId } from '../types/stage.js';

/**
 * Auto-checkpoint trigger types
 */
export type TriggerType =
  | 'task_count'
  | 'file_changes'
  | 'destructive_operation'
  | 'time_elapsed';

/**
 * Auto-checkpoint state
 */
interface AutoCheckpointState {
  lastCheckpoint: string;
  tasksSinceLastCheckpoint: number;
  fileChangesSinceLastCheckpoint: number;
}

/**
 * Auto-checkpoint options
 */
export interface AutoCheckpointOptions {
  taskThreshold?: number;       // Default: 5
  fileChangeThreshold?: number; // Default: 100 lines
  timeThreshold?: number;       // Default: 30 minutes
  maxRetention?: number;        // Default: 10
}

const DEFAULT_OPTIONS: Required<AutoCheckpointOptions> = {
  taskThreshold: 5,
  fileChangeThreshold: 100,
  timeThreshold: 30,
  maxRetention: 10,
};

/**
 * Check if auto-checkpoint should be triggered
 */
export async function shouldTriggerCheckpoint(
  projectRoot: string,
  trigger: TriggerType,
  options: AutoCheckpointOptions = {}
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stateFile = path.join(projectRoot, 'state', 'auto_checkpoint_state.json');

  const state = await readJson<AutoCheckpointState>(stateFile) ?? {
    lastCheckpoint: getTimestamp(),
    tasksSinceLastCheckpoint: 0,
    fileChangesSinceLastCheckpoint: 0,
  };

  switch (trigger) {
    case 'task_count':
      return state.tasksSinceLastCheckpoint >= opts.taskThreshold;

    case 'file_changes':
      return state.fileChangesSinceLastCheckpoint >= opts.fileChangeThreshold;

    case 'destructive_operation':
      // Always trigger for destructive operations
      return true;

    case 'time_elapsed': {
      const lastTime = new Date(state.lastCheckpoint).getTime();
      const now = Date.now();
      const elapsedMinutes = (now - lastTime) / (1000 * 60);
      return elapsedMinutes >= opts.timeThreshold;
    }

    default:
      return false;
  }
}

/**
 * Increment task counter
 */
export async function incrementTaskCount(projectRoot: string): Promise<number> {
  const stateFile = path.join(projectRoot, 'state', 'auto_checkpoint_state.json');
  await ensureDirAsync(path.dirname(stateFile));

  const state = await readJson<AutoCheckpointState>(stateFile) ?? {
    lastCheckpoint: getTimestamp(),
    tasksSinceLastCheckpoint: 0,
    fileChangesSinceLastCheckpoint: 0,
  };

  state.tasksSinceLastCheckpoint++;
  await writeJson(stateFile, state);

  return state.tasksSinceLastCheckpoint;
}

/**
 * Record file changes
 */
export async function recordFileChanges(
  projectRoot: string,
  linesChanged: number
): Promise<number> {
  const stateFile = path.join(projectRoot, 'state', 'auto_checkpoint_state.json');
  await ensureDirAsync(path.dirname(stateFile));

  const state = await readJson<AutoCheckpointState>(stateFile) ?? {
    lastCheckpoint: getTimestamp(),
    tasksSinceLastCheckpoint: 0,
    fileChangesSinceLastCheckpoint: 0,
  };

  state.fileChangesSinceLastCheckpoint += linesChanged;
  await writeJson(stateFile, state);

  return state.fileChangesSinceLastCheckpoint;
}

/**
 * Reset checkpoint state after creating a checkpoint
 */
async function resetState(projectRoot: string): Promise<void> {
  const stateFile = path.join(projectRoot, 'state', 'auto_checkpoint_state.json');
  await ensureDirAsync(path.dirname(stateFile));

  await writeJson(stateFile, {
    lastCheckpoint: getTimestamp(),
    tasksSinceLastCheckpoint: 0,
    fileChangesSinceLastCheckpoint: 0,
  });
}

/**
 * Run auto-checkpoint check
 */
export async function runAutoCheckpoint(
  projectRoot: string,
  trigger: TriggerType,
  options: AutoCheckpointOptions = {}
): Promise<{ triggered: boolean; checkpointId?: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Auto-Checkpoint Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Trigger: ${trigger}`);

  const shouldCreate = await shouldTriggerCheckpoint(projectRoot, trigger, opts);

  if (!shouldCreate) {
    logInfo('Checkpoint not needed yet');
    return { triggered: false };
  }

  // Get current stage
  const progressManager = new ProgressManager(projectRoot);
  const progress = await progressManager.load();
  const currentStage = progress?.current_stage as StageId;

  if (!currentStage) {
    logWarning('Could not determine current stage');
    return { triggered: false };
  }

  logInfo(`Creating auto-checkpoint for ${currentStage}...`);

  // Create checkpoint
  const metadata = await createCheckpoint(projectRoot, currentStage, {
    description: `Auto-checkpoint: ${trigger}`,
  });

  if (metadata) {
    logSuccess(`Checkpoint created: ${metadata.id}`);

    // Reset state
    await resetState(projectRoot);

    // Cleanup old checkpoints
    const deleted = await cleanupCheckpoints(projectRoot, opts.maxRetention, true);
    if (deleted > 0) {
      logInfo(`Cleaned up ${deleted} old checkpoint(s)`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { triggered: true, checkpointId: metadata.id };
  }

  logWarning('Failed to create checkpoint');
  return { triggered: false };
}

/**
 * Check for destructive operation patterns
 */
export function isDestructiveOperation(command: string): boolean {
  const patterns = [
    /\brm\s+(-[rf]+\s+)?[^|>]+/i,    // rm -rf or rm
    /\bdelete\b/i,                    // delete keyword
    /\bdrop\b/i,                      // drop (database)
    /\btruncate\b/i,                  // truncate
    /\bgit\s+reset\s+--hard/i,        // git reset --hard
    /\bgit\s+clean\s+-[fd]+/i,        // git clean -f
    /\bgit\s+checkout\s+\./i,         // git checkout .
  ];

  return patterns.some(pattern => pattern.test(command));
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const trigger = (process.argv[2] ?? 'task_count') as TriggerType;
  const projectRoot = process.cwd();

  const result = await runAutoCheckpoint(projectRoot, trigger);
  process.exit(result.triggered ? 0 : 1);
}

// Run if executed directly
if (process.argv[1]?.includes('auto-checkpoint')) {
  main().catch(console.error);
}
