/**
 * Checkpoint management
 * Creates and restores checkpoints for the pipeline
 */
import path from 'path';
import fs from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import { copyDirSync, ensureDir, readJson, writeJson, pathExists, remove } from '../../utils/fs.js';
import { getTimestamp } from '../../utils/shell.js';
import { addCheckpointToProgress } from './progress.js';
import type { StageId } from '../../types/stage.js';
import type { CheckpointMetadata } from '../../types/state.js';

/**
 * Generate checkpoint ID
 */
export function generateCheckpointId(stageId: StageId): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `checkpoint_${stageId}_${timestamp}`;
}

/**
 * Get checkpoints directory path
 */
export function getCheckpointsDir(projectRoot: string): string {
  return path.join(projectRoot, 'state', 'checkpoints');
}

/**
 * Get checkpoint path
 */
export function getCheckpointPath(projectRoot: string, checkpointId: string): string {
  return path.join(getCheckpointsDir(projectRoot), checkpointId);
}

/**
 * List all checkpoints
 */
export async function listCheckpoints(projectRoot: string): Promise<CheckpointMetadata[]> {
  const checkpointsDir = getCheckpointsDir(projectRoot);

  if (!pathExists(checkpointsDir)) {
    return [];
  }

  const entries = readdirSync(checkpointsDir);
  const checkpoints: CheckpointMetadata[] = [];

  for (const entry of entries) {
    const checkpointPath = path.join(checkpointsDir, entry);
    const metadataPath = path.join(checkpointPath, 'metadata.json');

    if (statSync(checkpointPath).isDirectory() && existsSync(metadataPath)) {
      const metadata = await readJson<CheckpointMetadata>(metadataPath);
      if (metadata) {
        checkpoints.push(metadata);
      }
    }
  }

  // Sort by creation date (newest first)
  return checkpoints.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get checkpoint metadata
 */
export async function getCheckpointMetadata(
  projectRoot: string,
  checkpointId: string
): Promise<CheckpointMetadata | null> {
  const metadataPath = path.join(
    getCheckpointPath(projectRoot, checkpointId),
    'metadata.json'
  );
  return readJson<CheckpointMetadata>(metadataPath);
}

/**
 * Create a checkpoint
 */
export async function createCheckpoint(
  projectRoot: string,
  stageId: StageId,
  options: {
    description?: string;
    includeStages?: boolean;
    includeState?: boolean;
    includeConfig?: boolean;
  } = {}
): Promise<CheckpointMetadata | null> {
  const {
    description,
    includeStages = true,
    includeState = true,
    includeConfig = false,
  } = options;

  const checkpointId = generateCheckpointId(stageId);
  const checkpointPath = getCheckpointPath(projectRoot, checkpointId);

  try {
    // Create checkpoint directory
    ensureDir(checkpointPath);

    const files: string[] = [];

    // Copy stages directory
    if (includeStages) {
      const stagesDir = path.join(projectRoot, 'stages');
      if (pathExists(stagesDir)) {
        const destStagesDir = path.join(checkpointPath, 'stages');
        copyDirSync(stagesDir, destStagesDir);
        files.push('stages/');
      }
    }

    // Copy state directory (except checkpoints)
    if (includeState) {
      const stateDir = path.join(projectRoot, 'state');
      if (pathExists(stateDir)) {
        const destStateDir = path.join(checkpointPath, 'state');
        ensureDir(destStateDir);

        const stateFiles = readdirSync(stateDir);
        for (const file of stateFiles) {
          if (file === 'checkpoints') continue; // Don't copy checkpoints recursively

          const srcPath = path.join(stateDir, file);
          const destPath = path.join(destStateDir, file);

          if (statSync(srcPath).isDirectory()) {
            copyDirSync(srcPath, destPath);
          } else {
            const content = await fs.readFile(srcPath);
            await fs.writeFile(destPath, content);
          }
          files.push(`state/${file}`);
        }
      }
    }

    // Copy config directory
    if (includeConfig) {
      const configDir = path.join(projectRoot, 'config');
      if (pathExists(configDir)) {
        const destConfigDir = path.join(checkpointPath, 'config');
        copyDirSync(configDir, destConfigDir);
        files.push('config/');
      }
    }

    // Create metadata
    const metadata: CheckpointMetadata = {
      id: checkpointId,
      stage: stageId,
      createdAt: getTimestamp(),
      description,
      files,
    };

    await writeJson(path.join(checkpointPath, 'metadata.json'), metadata);

    // Add to progress
    await addCheckpointToProgress(projectRoot, {
      id: checkpointId,
      stage: stageId,
      description,
    });

    return metadata;
  } catch (error) {
    console.error(`Failed to create checkpoint: ${error}`);
    // Clean up on failure
    await remove(checkpointPath);
    return null;
  }
}

/**
 * Restore a checkpoint
 */
export async function restoreCheckpoint(
  projectRoot: string,
  checkpointId: string,
  options: {
    restoreStages?: boolean;
    restoreState?: boolean;
    restoreConfig?: boolean;
    partial?: boolean;
    files?: string[];
  } = {}
): Promise<boolean> {
  const {
    restoreStages = true,
    restoreState = true,
    restoreConfig = false,
    partial = false,
    files = [],
  } = options;

  const checkpointPath = getCheckpointPath(projectRoot, checkpointId);

  if (!pathExists(checkpointPath)) {
    console.error(`Checkpoint not found: ${checkpointId}`);
    return false;
  }

  try {
    if (partial && files.length > 0) {
      // Partial restore - only specified files
      for (const file of files) {
        const srcPath = path.join(checkpointPath, file);
        const destPath = path.join(projectRoot, file);

        if (pathExists(srcPath)) {
          if (statSync(srcPath).isDirectory()) {
            copyDirSync(srcPath, destPath);
          } else {
            ensureDir(path.dirname(destPath));
            const content = await fs.readFile(srcPath);
            await fs.writeFile(destPath, content);
          }
        }
      }
    } else {
      // Full restore
      if (restoreStages) {
        const srcStagesDir = path.join(checkpointPath, 'stages');
        if (pathExists(srcStagesDir)) {
          const destStagesDir = path.join(projectRoot, 'stages');
          await remove(destStagesDir);
          copyDirSync(srcStagesDir, destStagesDir);
        }
      }

      if (restoreState) {
        const srcStateDir = path.join(checkpointPath, 'state');
        if (pathExists(srcStateDir)) {
          const destStateDir = path.join(projectRoot, 'state');
          // Keep checkpoints directory (preserved during restore)

          const stateFiles = readdirSync(srcStateDir);
          for (const file of stateFiles) {
            const srcPath = path.join(srcStateDir, file);
            const destPath = path.join(destStateDir, file);

            if (statSync(srcPath).isDirectory()) {
              if (pathExists(destPath)) await remove(destPath);
              copyDirSync(srcPath, destPath);
            } else {
              const content = await fs.readFile(srcPath);
              await fs.writeFile(destPath, content);
            }
          }
        }
      }

      if (restoreConfig) {
        const srcConfigDir = path.join(checkpointPath, 'config');
        if (pathExists(srcConfigDir)) {
          const destConfigDir = path.join(projectRoot, 'config');
          await remove(destConfigDir);
          copyDirSync(srcConfigDir, destConfigDir);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to restore checkpoint: ${error}`);
    return false;
  }
}

/**
 * Delete a checkpoint
 */
export async function deleteCheckpoint(
  projectRoot: string,
  checkpointId: string
): Promise<boolean> {
  const checkpointPath = getCheckpointPath(projectRoot, checkpointId);
  return remove(checkpointPath);
}

/**
 * Clean up old checkpoints based on retention policy
 */
export async function cleanupCheckpoints(
  projectRoot: string,
  maxRetention: number = 10,
  preserveMilestones: boolean = true
): Promise<number> {
  const checkpoints = await listCheckpoints(projectRoot);

  if (checkpoints.length <= maxRetention) {
    return 0;
  }

  let deleted = 0;
  const toDelete = checkpoints.slice(maxRetention);

  for (const checkpoint of toDelete) {
    // Skip milestone checkpoints (stage completion)
    if (preserveMilestones && checkpoint.description?.includes('milestone')) {
      continue;
    }

    const success = await deleteCheckpoint(projectRoot, checkpoint.id);
    if (success) deleted++;
  }

  return deleted;
}

/**
 * Checkpoint manager class
 */
export class CheckpointManager {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Create a checkpoint
   */
  async create(
    stageId: StageId,
    description?: string
  ): Promise<CheckpointMetadata | null> {
    return createCheckpoint(this.projectRoot, stageId, {
      description,
      includeStages: true,
      includeState: true,
    });
  }

  /**
   * Restore a checkpoint
   */
  async restore(checkpointId: string): Promise<boolean> {
    return restoreCheckpoint(this.projectRoot, checkpointId);
  }

  /**
   * List all checkpoints
   */
  async list(): Promise<CheckpointMetadata[]> {
    return listCheckpoints(this.projectRoot);
  }

  /**
   * Get checkpoint metadata
   */
  async get(checkpointId: string): Promise<CheckpointMetadata | null> {
    return getCheckpointMetadata(this.projectRoot, checkpointId);
  }

  /**
   * Delete a checkpoint
   */
  async delete(checkpointId: string): Promise<boolean> {
    return deleteCheckpoint(this.projectRoot, checkpointId);
  }

  /**
   * Clean up old checkpoints
   */
  async cleanup(maxRetention?: number): Promise<number> {
    return cleanupCheckpoints(this.projectRoot, maxRetention);
  }
}
