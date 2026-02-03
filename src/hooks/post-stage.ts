/**
 * Post-stage hook logic
 * Handles stage completion tasks
 * Migrated from .claude/hooks/post-stage.sh
 */
import path from 'path';
import { existsSync } from 'fs';
import { writeFile, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { getTimestamp } from '../utils/shell.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS, getStageName, getNextStage } from '../types/stage.js';
import { ProgressManager } from '../core/state/progress.js';
import { createCheckpoint } from '../core/state/checkpoint.js';

/**
 * Post-stage result
 */
export interface PostStageResult {
  success: boolean;
  handoffGenerated: boolean;
  checkpointCreated: boolean;
  nextStage: string | null;
}

/**
 * Run post-stage tasks
 */
export async function runPostStageTasks(
  projectRoot: string,
  stageId: StageId
): Promise<PostStageResult> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✨ Post-Stage Hook: ${stageId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let handoffGenerated = false;
  let checkpointCreated = false;

  // 1. Verify outputs
  console.log('\n[1/4] Verifying stage outputs...');
  const outputsValid = await verifyOutputs(projectRoot, stageId);
  if (outputsValid) {
    logSuccess('Stage outputs verified');
  } else {
    logWarning('Some outputs may be missing');
  }

  // 2. Generate HANDOFF.md if not exists
  console.log('\n[2/4] Checking HANDOFF.md...');
  const handoffPath = path.join(projectRoot, 'stages', stageId, 'HANDOFF.md');
  if (!existsSync(handoffPath)) {
    logWarning('HANDOFF.md not found, generating...');
    handoffGenerated = await generateHandoff(projectRoot, stageId);
  } else {
    logSuccess('HANDOFF.md exists');
    handoffGenerated = true;
  }

  // 3. Create checkpoint for critical stages
  console.log('\n[3/4] Checkpoint management...');
  const criticalStages: StageId[] = ['03-implementation', '04-qa'];
  if (criticalStages.includes(stageId)) {
    logInfo('Critical stage - creating checkpoint');
    const checkpoint = await createCheckpoint(projectRoot, stageId, {
      description: `Stage completion: ${stageId}`,
    });
    checkpointCreated = !!checkpoint;
    if (checkpointCreated) {
      logSuccess(`Checkpoint created: ${checkpoint?.id}`);
    }
  } else {
    logInfo('Non-critical stage - checkpoint optional');
  }

  // 4. Update progress
  console.log('\n[4/4] Updating progress...');
  const progressManager = new ProgressManager(projectRoot);
  const updateSuccess = await progressManager.completeCurrentStage();
  if (updateSuccess) {
    logSuccess('Progress updated');
  } else {
    logError('Failed to update progress');
  }

  // Summary
  const nextStage = getNextStage(stageId);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logSuccess(`Stage ${stageId} completed!`);
  if (nextStage !== 'completed') {
    console.log(`\n  Next: ${nextStage} (${getStageName(nextStage as StageId)})`);
    console.log('  Run /next to transition');
  } else {
    console.log('\n  Pipeline completed!');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    success: updateSuccess,
    handoffGenerated,
    checkpointCreated,
    nextStage: nextStage !== 'completed' ? nextStage : null,
  };
}

/**
 * Verify stage outputs exist
 */
async function verifyOutputs(projectRoot: string, stageId: StageId): Promise<boolean> {
  const outputsDir = path.join(projectRoot, 'stages', stageId, 'outputs');

  if (!existsSync(outputsDir)) {
    return false;
  }

  // Stage-specific output requirements could be added here
  return true;
}

/**
 * Generate basic HANDOFF.md
 */
async function generateHandoff(projectRoot: string, stageId: StageId): Promise<boolean> {
  const timestamp = getTimestamp();
  const handoffPath = path.join(projectRoot, 'stages', stageId, 'HANDOFF.md');
  const nextStage = getNextStage(stageId);

  const content = `# Stage Handoff: ${stageId}

## Completion Summary
- **Stage**: ${stageId} (${getStageName(stageId)})
- **Completed**: ${timestamp}
- **Next Stage**: ${nextStage === 'completed' ? 'Pipeline Complete' : `${nextStage} (${getStageName(nextStage as StageId)})`}

## Completed Tasks
- [x] Stage execution completed

## Key Decisions
- (Add key decisions made during this stage)

## Modified Files
- (List modified files)

## Pending Issues
- (List any unresolved issues)

## Next Steps
${nextStage === 'completed' ? '- Deploy to production' : `- Begin ${getStageName(nextStage as StageId)}`}

## Notes for Next Stage
(Add any important context for the next stage)

---
Generated automatically by post-stage hook
`;

  const success = await writeFile(handoffPath, content);

  // Archive copy
  const archiveDir = path.join(projectRoot, 'state', 'handoffs');
  await ensureDirAsync(archiveDir);
  await writeFile(path.join(archiveDir, `${stageId}_handoff.md`), content);

  return success;
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const stageId = process.argv[2] as StageId;

  if (!stageId || !STAGE_IDS.includes(stageId)) {
    console.error('Usage: post-stage <stage-id>');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const result = await runPostStageTasks(projectRoot, stageId);

  process.exit(result.success ? 0 : 1);
}

// Run if executed directly
if (process.argv[1]?.includes('post-stage')) {
  main().catch(console.error);
}
