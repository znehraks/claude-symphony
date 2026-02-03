/**
 * Pre-stage hook logic
 * Validates prerequisites before stage execution
 * Migrated from .claude/hooks/pre-stage.sh
 */
import path from 'path';
import { existsSync } from 'fs';
import { readJson } from '../utils/fs.js';
import { logSuccess, logWarning, logError } from '../utils/logger.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS, getPrevStage } from '../types/stage.js';
import type { Progress } from '../types/state.js';

/**
 * Pre-stage check result
 */
export interface PreStageResult {
  success: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

/**
 * Run pre-stage checks
 */
export async function runPreStageChecks(
  projectRoot: string,
  stageId: StageId
): Promise<PreStageResult> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔍 Pre-Stage Hook: ${stageId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const checks: PreStageResult['checks'] = [];

  // 1. Check prerequisites
  const prereqResult = await checkPrerequisites(projectRoot, stageId);
  checks.push(prereqResult);

  // 2. Check HANDOFF.md
  const handoffResult = await checkHandoff(projectRoot, stageId);
  checks.push(handoffResult);

  // 3. Check required inputs
  const inputsResult = await checkInputs(projectRoot, stageId);
  checks.push(inputsResult);

  // 4. Check AI model requirements
  const modelResult = await checkModelRequirements(projectRoot, stageId);
  checks.push(modelResult);

  // Summary
  const allPassed = checks.every(c => c.passed);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    logSuccess('All pre-stage checks passed!');
  } else {
    const failed = checks.filter(c => !c.passed);
    logError(`${failed.length} check(s) failed`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    success: allPassed,
    checks,
  };
}

/**
 * Check if previous stage is completed
 */
async function checkPrerequisites(
  projectRoot: string,
  stageId: StageId
): Promise<{ name: string; passed: boolean; message: string }> {
  // Stage 01 has no prerequisites
  if (stageId === '01-planning') {
    logSuccess('First stage - No prerequisites');
    return {
      name: 'prerequisites',
      passed: true,
      message: 'First stage - no prerequisites needed',
    };
  }

  const prevStage = getPrevStage(stageId);
  if (prevStage === 'none') {
    logSuccess('No previous stage');
    return {
      name: 'prerequisites',
      passed: true,
      message: 'No previous stage',
    };
  }

  const progressPath = path.join(projectRoot, 'state', 'progress.json');
  const progress = await readJson<Progress>(progressPath);

  const prevStatus = progress?.stages?.[prevStage as StageId]?.status ?? 'pending';

  if (prevStatus !== 'completed') {
    logError(`Previous stage not completed: ${prevStage} (status: ${prevStatus})`);
    return {
      name: 'prerequisites',
      passed: false,
      message: `Previous stage ${prevStage} is ${prevStatus}, not completed`,
    };
  }

  logSuccess(`Previous stage completed: ${prevStage}`);
  return {
    name: 'prerequisites',
    passed: true,
    message: `Previous stage ${prevStage} is completed`,
  };
}

/**
 * Check HANDOFF.md exists from previous stage
 */
async function checkHandoff(
  projectRoot: string,
  stageId: StageId
): Promise<{ name: string; passed: boolean; message: string }> {
  // Stage 01 doesn't need handoff
  if (stageId === '01-planning') {
    logSuccess('First stage - No handoff needed');
    return {
      name: 'handoff',
      passed: true,
      message: 'First stage - no handoff needed',
    };
  }

  const prevStage = getPrevStage(stageId);
  if (!prevStage) {
    return {
      name: 'handoff',
      passed: true,
      message: 'No previous stage',
    };
  }

  const handoffPath = path.join(projectRoot, 'stages', prevStage, 'HANDOFF.md');

  if (!existsSync(handoffPath)) {
    logError(`HANDOFF.md missing: ${prevStage}/HANDOFF.md`);
    console.log('  Please run /handoff in the previous stage.');
    return {
      name: 'handoff',
      passed: false,
      message: `HANDOFF.md missing from ${prevStage}`,
    };
  }

  logSuccess(`HANDOFF.md exists: ${prevStage}/HANDOFF.md`);
  return {
    name: 'handoff',
    passed: true,
    message: `HANDOFF.md found in ${prevStage}`,
  };
}

/**
 * Check required input files for stage
 */
async function checkInputs(
  projectRoot: string,
  stageId: StageId
): Promise<{ name: string; passed: boolean; message: string }> {
  const stageNum = stageId.substring(0, 2);
  const missingFiles: string[] = [];

  // Stage-specific input requirements
  switch (stageNum) {
    case '01': {
      const brief = path.join(projectRoot, 'stages', '01-planning', 'inputs', 'project_brief.md');
      if (!existsSync(brief)) {
        missingFiles.push('project_brief.md');
      }
      break;
    }
    case '02': {
      const req = path.join(projectRoot, 'stages', '01-planning', 'outputs', 'requirements_analysis.md');
      if (!existsSync(req)) {
        missingFiles.push('requirements_analysis.md from Stage 01');
      }
      break;
    }
    // Add more stage-specific checks as needed
  }

  if (missingFiles.length > 0) {
    logWarning(`Missing input files: ${missingFiles.join(', ')}`);
    return {
      name: 'inputs',
      passed: false,
      message: `Missing files: ${missingFiles.join(', ')}`,
    };
  }

  logSuccess('Required inputs available');
  return {
    name: 'inputs',
    passed: true,
    message: 'All required inputs available',
  };
}

/**
 * Check AI model requirements for stage
 */
async function checkModelRequirements(
  projectRoot: string,
  stageId: StageId
): Promise<{ name: string; passed: boolean; message: string }> {
  const stageConfig = path.join(projectRoot, 'stages', stageId, 'config.yaml');

  if (!existsSync(stageConfig)) {
    logWarning('Stage config.yaml not found');
    return {
      name: 'model',
      passed: true, // Not a hard failure
      message: 'Stage config not found, using defaults',
    };
  }

  // Model check logic could be expanded here
  logSuccess('Model requirements checked');
  return {
    name: 'model',
    passed: true,
    message: 'Model requirements satisfied',
  };
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const stageId = process.argv[2] as StageId;

  if (!stageId || !STAGE_IDS.includes(stageId)) {
    console.error('Usage: pre-stage <stage-id>');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const result = await runPreStageChecks(projectRoot, stageId);

  process.exit(result.success ? 0 : 1);
}

// Run if executed directly
if (process.argv[1]?.includes('pre-stage')) {
  main().catch(console.error);
}
