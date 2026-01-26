/**
 * Stage CLI commands
 * run-stage, next-stage, goto functionality
 * Migrated from run-stage.sh, next-stage.sh
 */
import path from 'path';
import { existsSync } from 'fs';
import { loadYaml } from '../../utils/yaml.js';
import { readFile, readJson, writeJson, ensureDirAsync } from '../../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../../utils/logger.js';
import { getTimestamp } from '../../utils/shell.js';
// getTimestamp used elsewhere in this module
import { ProgressManager } from '../../core/state/progress.js';
import { STAGE_IDS, getNextStage, getStageName } from '../../types/stage.js';
import type { StageId } from '../../types/stage.js';

/**
 * Run stage options
 */
export interface RunStageOptions {
  complete?: boolean;
}

/**
 * Next stage options
 */
export interface NextStageOptions {
  force?: boolean;
  preview?: boolean;
  noHandoff?: boolean;
  stage?: boolean; // Force stage transition (skip sprint check)
}

/**
 * Goto options
 */
export interface GotoOptions {
  list?: boolean;
  history?: boolean;
}

/**
 * Run a specific stage
 */
export async function runStage(
  projectRoot: string,
  stageId: StageId,
  options: RunStageOptions = {}
): Promise<boolean> {
  const stageDir = path.join(projectRoot, 'stages', stageId);

  // Handle --complete flag
  if (options.complete) {
    return completeStage(projectRoot, stageId);
  }

  // Check stage exists
  if (!existsSync(stageDir)) {
    logError(`Stage not found: ${stageId}`);
    return false;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Stage Execution: ${stageId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Execute pre-stage hook (if exists)
  console.log('\n[1/4] Executing Pre-Stage Hook');
  const preStageHook = path.join(projectRoot, '.claude', 'hooks', 'pre-stage.sh');
  if (existsSync(preStageHook)) {
    // Note: In full implementation, this would execute the hook via shell
    logInfo(`Pre-stage hook found: ${preStageHook}`);
    console.log('  (Hook execution delegated to shell wrapper)');
  } else {
    logWarning('No pre-stage hook found.');
  }

  // 2. Update status
  console.log('\n[2/4] Updating Status');
  const progressManager = new ProgressManager(projectRoot);
  const updated = await progressManager.setCurrentStage(stageId, 'in_progress');
  if (updated) {
    logSuccess('progress.json updated');
  } else {
    logWarning('Could not update progress.json');
  }

  // 3. Model enforcement check
  console.log('\n[3/4] AI Model Enforcement Check');
  const stageConfig = await loadYaml<{
    auto_invoke?: {
      enabled?: boolean;
      model?: string;
      message?: string;
      required?: boolean;
    };
  }>(path.join(stageDir, 'config.yaml'));

  if (stageConfig?.auto_invoke?.enabled) {
    const { model, message, required } = stageConfig.auto_invoke;
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logWarning('AI Model Auto-Invoke Settings');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Model: ${model}`);
    console.log(`  Required: ${required}`);
    if (message) {
      console.log(`\n  ${message}`);
    }
    if (required) {
      logWarning(`This stage requires using ${model}.`);
      logInfo(`→ Use /${model} command to invoke.`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // 4. Display CLAUDE.md
  console.log('\n[4/4] Loading Stage Instructions');
  const claudeMd = path.join(stageDir, 'CLAUDE.md');
  if (existsSync(claudeMd)) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Stage CLAUDE.md:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const content = await readFile(claudeMd);
    if (content) {
      console.log(content);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    logWarning('No CLAUDE.md found for this stage.');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logSuccess(`Stage ${stageId} started!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return true;
}

/**
 * Complete a stage
 */
async function completeStage(projectRoot: string, stageId: StageId): Promise<boolean> {
  const progressManager = new ProgressManager(projectRoot);
  const success = await progressManager.completeCurrentStage();

  if (success) {
    logSuccess(`Stage ${stageId} marked as completed`);
    const nextStage = getNextStage(stageId);
    if (nextStage !== 'completed') {
      logInfo(`→ Next stage: ${nextStage}`);
    } else {
      logSuccess('Pipeline completed!');
    }
  } else {
    logError('Failed to complete stage');
  }

  return success;
}

/**
 * Transition to next stage
 */
export async function nextStage(
  projectRoot: string,
  options: NextStageOptions = {}
): Promise<boolean> {
  const progressManager = new ProgressManager(projectRoot);
  const progress = await progressManager.load();

  if (!progress) {
    logError('Could not load progress.json');
    return false;
  }

  const currentStage = progress.current_stage as StageId;
  const nextStageId = getNextStage(currentStage);

  if (nextStageId === 'completed') {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Pipeline Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nAll stages have been completed.');
    return true;
  }

  // Preview mode
  if (options.preview) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Stage Transition Preview');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Current: ${currentStage} (${getStageName(currentStage)})`);
    console.log(`  Next:    ${nextStageId} (${getStageName(nextStageId as StageId)})`);
    console.log('\nNo changes made (preview mode)');
    return true;
  }

  // Check for sprint mode (if not forcing stage transition)
  if (!options.stage) {
    const sprintResult = await handleSprintTransition(projectRoot, currentStage);
    if (sprintResult) {
      return true; // Sprint transition handled
    }
  }

  // Check HANDOFF.md exists (unless --no-handoff)
  if (!options.noHandoff && !options.force) {
    const handoffPath = path.join(projectRoot, 'stages', currentStage, 'HANDOFF.md');
    if (!existsSync(handoffPath)) {
      logWarning('HANDOFF.md not found for current stage.');
      console.log('Generate HANDOFF.md with /handoff command or use --no-handoff to skip.');
      console.log('Use --force to transition anyway.');
      return false;
    }
  }

  // Perform stage transition
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Stage Transition');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  From: ${currentStage} (${getStageName(currentStage)})`);
  console.log(`  To:   ${nextStageId} (${getStageName(nextStageId as StageId)})`);

  // Complete current stage
  await progressManager.completeCurrentStage();

  // Start next stage
  await runStage(projectRoot, nextStageId as StageId);

  return true;
}

/**
 * Handle sprint transition logic
 */
async function handleSprintTransition(
  projectRoot: string,
  currentStage: StageId
): Promise<boolean> {
  const pipelineConfig = await loadYaml<{
    sprint_mode?: {
      enabled?: boolean;
      stage_iterations?: Record<string, { iterative?: boolean }>;
    };
  }>(path.join(projectRoot, 'config', 'pipeline.yaml'));

  if (!pipelineConfig?.sprint_mode?.enabled) {
    return false;
  }

  const stageIterative = pipelineConfig.sprint_mode.stage_iterations?.[currentStage]?.iterative;
  if (!stageIterative) {
    return false;
  }

  const progressPath = path.join(projectRoot, 'state', 'progress.json');
  const progress = await readJson<{
    current_iteration?: {
      current_sprint?: number;
      total_sprints?: number;
    };
  }>(progressPath);

  const currentSprint = progress?.current_iteration?.current_sprint ?? 1;
  const totalSprints = progress?.current_iteration?.total_sprints ?? 3;

  if (currentSprint >= totalSprints) {
    return false; // All sprints complete
  }

  // Sprint transition
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logInfo('Sprint Transition');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Stage: ${currentStage} (staying in same stage)`);
  console.log(`  Sprint: ${currentSprint} → ${currentSprint + 1} of ${totalSprints}`);

  // Update progress for next sprint
  if (progress) {
    if (!progress.current_iteration) {
      progress.current_iteration = {};
    }
    progress.current_iteration.current_sprint = currentSprint + 1;
    await writeJson(progressPath, progress);
  }

  const remaining = totalSprints - currentSprint - 1;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logSuccess(`Sprint ${currentSprint + 1} started!`);
  console.log(`  Progress: Sprint ${currentSprint + 1} / ${totalSprints}`);
  if (remaining > 0) {
    console.log(`  Remaining: ${remaining} more sprint(s) after this`);
    console.log('\n  Next actions:');
    console.log(`    /next         → Move to Sprint ${currentSprint + 2}`);
    console.log(`    /next --stage → Skip to next stage`);
  } else {
    console.log('  Status: This is the final sprint!');
    console.log('\n  Next action:');
    console.log(`    /next → Complete stage and move to next`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return true;
}

/**
 * Go to a specific stage (loop-back)
 */
export async function gotoStage(
  projectRoot: string,
  targetStage: StageId | undefined,
  options: GotoOptions = {}
): Promise<boolean> {
  // List available stages
  if (options.list || !targetStage) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Available Stages for Loop-back');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const progressManager = new ProgressManager(projectRoot);
    const progress = await progressManager.load();
    const currentStage = progress?.current_stage ?? '01-brainstorm';

    for (const stage of STAGE_IDS) {
      const isCurrent = stage === currentStage;
      const marker = isCurrent ? '→' : ' ';
      const status = progress?.stages?.[stage]?.status ?? 'pending';
      console.log(`  ${marker} ${stage}: ${getStageName(stage)} [${status}]`);
    }

    console.log('\nUsage: /goto <stage-id>');
    console.log('Example: /goto 03-planning');
    return true;
  }

  // Show history
  if (options.history) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Loop-back History');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const historyPath = path.join(projectRoot, 'state', 'loopback_history.json');
    const history = await readJson<Array<{
      from: string;
      to: string;
      timestamp: string;
      reason?: string;
    }>>(historyPath);

    if (history && history.length > 0) {
      for (const entry of history) {
        console.log(`  ${entry.timestamp}: ${entry.from} → ${entry.to}`);
        if (entry.reason) {
          console.log(`    Reason: ${entry.reason}`);
        }
      }
    } else {
      console.log('  No loop-back history found.');
    }

    return true;
  }

  // Validate target stage
  if (!STAGE_IDS.includes(targetStage)) {
    logError(`Invalid stage: ${targetStage}`);
    console.log(`Valid stages: ${STAGE_IDS.join(', ')}`);
    return false;
  }

  // Perform goto
  const progressManager = new ProgressManager(projectRoot);
  const progress = await progressManager.load();
  const currentStage = progress?.current_stage ?? '01-brainstorm';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Stage Loop-back');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  From: ${currentStage} (${getStageName(currentStage as StageId)})`);
  console.log(`  To:   ${targetStage} (${getStageName(targetStage)})`);

  // Log history
  const historyPath = path.join(projectRoot, 'state', 'loopback_history.json');
  let history = (await readJson<Array<{
    from: string;
    to: string;
    timestamp: string;
  }>>(historyPath)) ?? [];

  history.push({
    from: currentStage,
    to: targetStage,
    timestamp: getTimestamp(),
  });

  await ensureDirAsync(path.join(projectRoot, 'state'));
  await writeJson(historyPath, history);

  // Run target stage
  await runStage(projectRoot, targetStage);

  return true;
}

/**
 * List all stages with status
 */
export async function listStages(projectRoot: string): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Pipeline Stages');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const progressManager = new ProgressManager(projectRoot);
  const progress = await progressManager.load();
  const currentStage = progress?.current_stage ?? '01-brainstorm';

  console.log('\n  ID                    Name                 Status');
  console.log('  ──────────────────────────────────────────────────────');

  for (const stage of STAGE_IDS) {
    const isCurrent = stage === currentStage;
    const marker = isCurrent ? '→' : ' ';
    const status = progress?.stages?.[stage]?.status ?? 'pending';

    const statusIcon =
      status === 'completed' ? '✓' :
      status === 'in_progress' ? '⟳' :
      '○';

    console.log(
      `${marker} ${stage.padEnd(20)} ${getStageName(stage).padEnd(20)} ${statusIcon} ${status}`
    );
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
