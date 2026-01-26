/**
 * Checkpoint CLI commands
 * create-checkpoint, restore-checkpoint functionality
 * Uses core/state/checkpoint.ts
 */
import {
  createCheckpoint,
  restoreCheckpoint,
  listCheckpoints,
  deleteCheckpoint,
  cleanupCheckpoints,
  getCheckpointMetadata,
} from '../../core/state/checkpoint.js';
import { ProgressManager } from '../../core/state/progress.js';
import { logInfo, logSuccess, logError } from '../../utils/logger.js';
import type { StageId } from '../../types/stage.js';

/**
 * Create checkpoint options
 */
export interface CreateCheckpointOptions {
  description?: string;
  includeConfig?: boolean;
}

/**
 * Restore checkpoint options
 */
export interface RestoreCheckpointOptions {
  list?: boolean;
  partial?: boolean;
  files?: string[];
  restoreConfig?: boolean;
}

/**
 * Create a new checkpoint
 */
export async function createCheckpointCommand(
  projectRoot: string,
  options: CreateCheckpointOptions = {}
): Promise<boolean> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 Create Checkpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Get current stage
  const progressManager = new ProgressManager(projectRoot);
  const progress = await progressManager.load();

  if (!progress) {
    logError('Could not load progress.json');
    return false;
  }

  const currentStage = progress.current_stage as StageId;

  console.log(`\n  Stage: ${currentStage}`);
  if (options.description) {
    console.log(`  Description: ${options.description}`);
  }

  logInfo('Creating checkpoint...');

  const metadata = await createCheckpoint(projectRoot, currentStage, {
    description: options.description,
    includeStages: true,
    includeState: true,
    includeConfig: options.includeConfig,
  });

  if (metadata) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Checkpoint created!');
    console.log(`\n  ID: ${metadata.id}`);
    console.log(`  Stage: ${metadata.stage}`);
    console.log(`  Created: ${metadata.createdAt}`);
    console.log(`  Files included:`);
    for (const file of metadata.files) {
      console.log(`    • ${file}`);
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n  To restore: /restore ' + metadata.id);
    return true;
  } else {
    logError('Failed to create checkpoint');
    return false;
  }
}

/**
 * Restore a checkpoint
 */
export async function restoreCheckpointCommand(
  projectRoot: string,
  checkpointId: string | undefined,
  options: RestoreCheckpointOptions = {}
): Promise<boolean> {
  // List checkpoints
  if (options.list || !checkpointId) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Available Checkpoints');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const checkpoints = await listCheckpoints(projectRoot);

    if (checkpoints.length === 0) {
      console.log('\n  No checkpoints found.');
      console.log('  Create one with: /checkpoint');
    } else {
      console.log('\n  ID                                    Stage              Created');
      console.log('  ────────────────────────────────────────────────────────────────────');

      for (const cp of checkpoints) {
        console.log(`  ${cp.id.padEnd(40)} ${cp.stage.padEnd(18)} ${cp.createdAt}`);
        if (cp.description) {
          console.log(`    ${cp.description}`);
        }
      }

      console.log('\n  To restore: /restore <checkpoint-id>');
    }
    return true;
  }

  // Get checkpoint metadata
  const metadata = await getCheckpointMetadata(projectRoot, checkpointId);
  if (!metadata) {
    logError(`Checkpoint not found: ${checkpointId}`);
    console.log('Run /restore --list to see available checkpoints');
    return false;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Restore Checkpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n  ID: ${metadata.id}`);
  console.log(`  Stage: ${metadata.stage}`);
  console.log(`  Created: ${metadata.createdAt}`);
  if (metadata.description) {
    console.log(`  Description: ${metadata.description}`);
  }

  // Partial restore
  if (options.partial && options.files && options.files.length > 0) {
    logInfo(`Restoring ${options.files.length} file(s)...`);
    console.log('  Files:');
    for (const file of options.files) {
      console.log(`    • ${file}`);
    }
  } else {
    logInfo('Restoring full checkpoint...');
  }

  const success = await restoreCheckpoint(projectRoot, checkpointId, {
    restoreStages: true,
    restoreState: true,
    restoreConfig: options.restoreConfig,
    partial: options.partial,
    files: options.files,
  });

  if (success) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Checkpoint restored!');
    console.log(`\n  Restored to stage: ${metadata.stage}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  } else {
    logError('Failed to restore checkpoint');
    return false;
  }
}

/**
 * Delete a checkpoint
 */
export async function deleteCheckpointCommand(
  projectRoot: string,
  checkpointId: string
): Promise<boolean> {
  const metadata = await getCheckpointMetadata(projectRoot, checkpointId);
  if (!metadata) {
    logError(`Checkpoint not found: ${checkpointId}`);
    return false;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗑️  Delete Checkpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n  ID: ${metadata.id}`);
  console.log(`  Stage: ${metadata.stage}`);

  const success = await deleteCheckpoint(projectRoot, checkpointId);

  if (success) {
    logSuccess('Checkpoint deleted');
    return true;
  } else {
    logError('Failed to delete checkpoint');
    return false;
  }
}

/**
 * Cleanup old checkpoints
 */
export async function cleanupCheckpointsCommand(
  projectRoot: string,
  maxRetention: number = 10
): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 Cleanup Checkpoints');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n  Max retention: ${maxRetention}`);
  console.log('  Milestone checkpoints are preserved');

  logInfo('Cleaning up old checkpoints...');

  const deleted = await cleanupCheckpoints(projectRoot, maxRetention, true);

  if (deleted > 0) {
    logSuccess(`Deleted ${deleted} old checkpoint(s)`);
  } else {
    logInfo('No checkpoints needed cleanup');
  }
}
