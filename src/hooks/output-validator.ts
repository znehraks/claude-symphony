/**
 * Output Validator hook logic
 * Stage output validation
 * Migrated from .claude/hooks/output-validator.sh
 */
import path from 'path';
import { existsSync, statSync, readFileSync } from 'fs';
import { readJson, writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { execShell } from '../utils/shell.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS } from '../types/stage.js';
import type { Progress } from '../types/state.js';

/**
 * Validation check result
 */
export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  stage: StageId;
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  score: number;
  checks: ValidationCheck[];
}

/**
 * Validation state for tracking results
 */
class ValidationState {
  checks: ValidationCheck[] = [];

  addCheck(name: string, passed: boolean, message: string, required: boolean = true): void {
    this.checks.push({ name, passed, message, required });

    if (passed) {
      logSuccess(`${name}: ${message}`);
    } else if (required) {
      logError(`${name}: ${message}`);
    } else {
      logWarning(`${name}: ${message} (optional)`);
    }
  }

  get totalChecks(): number {
    return this.checks.length;
  }

  get passed(): number {
    return this.checks.filter((c) => c.passed).length;
  }

  get failed(): number {
    return this.checks.filter((c) => !c.passed && c.required).length;
  }

  get warnings(): number {
    return this.checks.filter((c) => !c.passed && !c.required).length;
  }

  get score(): number {
    return this.totalChecks > 0 ? this.passed / this.totalChecks : 0;
  }

  get success(): boolean {
    return this.failed === 0;
  }
}

/**
 * Check if file exists
 */
function checkFileExists(
  state: ValidationState,
  projectRoot: string,
  relativePath: string,
  required: boolean = true
): boolean {
  const fullPath = path.join(projectRoot, relativePath);
  const exists = existsSync(fullPath);

  state.addCheck(
    'File exists',
    exists,
    exists ? `${relativePath} exists` : `${relativePath} missing`,
    required
  );

  return exists;
}

/**
 * Check if directory exists
 */
function checkDirectoryExists(
  state: ValidationState,
  projectRoot: string,
  relativePath: string,
  required: boolean = true
): boolean {
  const fullPath = path.join(projectRoot, relativePath);
  const exists = existsSync(fullPath) && statSync(fullPath).isDirectory();

  state.addCheck(
    'Directory exists',
    exists,
    exists ? `${relativePath} directory exists` : `${relativePath} directory missing`,
    required
  );

  return exists;
}

/**
 * Check file minimum size
 */
function checkFileSize(
  state: ValidationState,
  projectRoot: string,
  relativePath: string,
  minSize: number
): boolean {
  const fullPath = path.join(projectRoot, relativePath);

  if (!existsSync(fullPath)) {
    return false;
  }

  const stats = statSync(fullPath);
  const meets = stats.size >= minSize;

  state.addCheck(
    'File size',
    meets,
    meets
      ? `${relativePath} size met (${stats.size} bytes >= ${minSize})`
      : `${relativePath} size insufficient (${stats.size} bytes < ${minSize})`,
    true
  );

  return meets;
}

/**
 * Check markdown sections exist
 */
function checkMarkdownSections(
  state: ValidationState,
  projectRoot: string,
  relativePath: string,
  sections: string[]
): boolean {
  const fullPath = path.join(projectRoot, relativePath);

  if (!existsSync(fullPath)) {
    return false;
  }

  const content = readFileSync(fullPath, 'utf-8');
  let allFound = true;

  for (const section of sections) {
    const pattern = new RegExp(`^#{1,2}.*${section}`, 'im');
    const found = pattern.test(content);

    state.addCheck(
      'Markdown section',
      found,
      found ? `${relativePath}: '${section}' section exists` : `${relativePath}: '${section}' section missing`,
      true
    );

    if (!found) allFound = false;
  }

  return allFound;
}

/**
 * Run validation command
 */
async function runValidationCommand(
  state: ValidationState,
  name: string,
  command: string,
  cwd: string,
  required: boolean = true
): Promise<boolean> {
  logInfo(`Running: ${name} (${command})`);

  const result = await execShell(command, { cwd });

  state.addCheck(name, result.success, result.success ? `${name} passed` : `${name} failed`, required);

  return result.success;
}

/**
 * Validate stage outputs
 */
async function validateStageOutputs(
  state: ValidationState,
  projectRoot: string,
  stageId: StageId
): Promise<void> {
  // HANDOFF.md check (common for all stages)
  checkFileExists(state, projectRoot, `stages/${stageId}/HANDOFF.md`, true);

  // Stage-specific validation
  switch (stageId) {
    case '01-brainstorm':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/ideas.md`, true);
      checkFileSize(state, projectRoot, `stages/${stageId}/outputs/ideas.md`, 500);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/requirements_analysis.md`, true);
      checkMarkdownSections(state, projectRoot, `stages/${stageId}/outputs/requirements_analysis.md`, [
        'Functional',
        'Non-functional',
      ]);
      break;

    case '02-research':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/tech_research.md`, true);
      checkFileSize(state, projectRoot, `stages/${stageId}/outputs/tech_research.md`, 2000);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/feasibility_report.md`, true);
      break;

    case '03-planning':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/architecture.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/tech_stack.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/project_plan.md`, true);
      break;

    case '04-ui-ux':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/wireframes.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/design_system.md`, false);
      break;

    case '05-task-management':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/tasks.md`, true);
      break;

    case '06-implementation':
      checkDirectoryExists(state, projectRoot, `stages/${stageId}/outputs/source_code`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/implementation_log.md`, true);

      // Build validation if package.json exists
      if (existsSync(path.join(projectRoot, 'package.json'))) {
        await runValidationCommand(state, 'lint', 'npm run lint', projectRoot, true);
        await runValidationCommand(state, 'typecheck', 'npm run typecheck', projectRoot, true);
      }
      break;

    case '07-refactoring':
      checkDirectoryExists(state, projectRoot, `stages/${stageId}/outputs/refactored_code`, false);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/refactoring_report.md`, true);
      break;

    case '08-qa':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/qa_report.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/bug_list.md`, false);
      break;

    case '09-testing':
      checkDirectoryExists(state, projectRoot, `stages/${stageId}/outputs/tests`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/test_report.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/coverage_report.md`, true);

      // Test validation if package.json exists
      if (existsSync(path.join(projectRoot, 'package.json'))) {
        await runValidationCommand(state, 'test', 'npm run test', projectRoot, true);
      }
      break;

    case '10-deployment':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/deployment_guide.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/ci_config.yaml`, false);
      break;

    default:
      logInfo(`No specific validation rules for stage ${stageId}`);
  }
}

/**
 * Get current stage from progress
 */
async function getCurrentStage(projectRoot: string): Promise<StageId | null> {
  const progressPath = path.join(projectRoot, 'state', 'progress.json');
  const progress = await readJson<Progress>(progressPath);

  if (progress?.current_stage && STAGE_IDS.includes(progress.current_stage as StageId)) {
    return progress.current_stage as StageId;
  }

  return null;
}

/**
 * Run output validation
 */
export async function runOutputValidation(
  projectRoot: string,
  stageId?: StageId
): Promise<ValidationSummary> {
  const stage = stageId || (await getCurrentStage(projectRoot));

  if (!stage) {
    throw new Error('Cannot determine current stage');
  }

  console.log('');
  console.log('==========================================');
  console.log(`  Output Validation: ${stage}`);
  console.log('==========================================');
  console.log('');

  const state = new ValidationState();
  await validateStageOutputs(state, projectRoot, stage);

  const summary: ValidationSummary = {
    stage,
    timestamp: new Date().toISOString(),
    totalChecks: state.totalChecks,
    passed: state.passed,
    failed: state.failed,
    warnings: state.warnings,
    score: state.score,
    checks: state.checks,
  };

  // Save results
  const validationsDir = path.join(projectRoot, 'state', 'validations');
  await ensureDirAsync(validationsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  await writeJson(path.join(validationsDir, `${stage}_${timestamp}.json`), summary);

  // Print summary
  console.log('');
  console.log('==========================================');
  console.log('  Validation Result Summary');
  console.log('==========================================');
  console.log('');
  console.log(`Total checks: ${summary.totalChecks}`);
  logSuccess(`Passed: ${summary.passed}`);
  logError(`Failed: ${summary.failed}`);
  logWarning(`Warnings: ${summary.warnings}`);
  console.log('');
  console.log(`Score: ${summary.score.toFixed(2)}`);

  if (summary.failed === 0) {
    logSuccess('Validation passed');
  } else {
    logError('Validation failed - Stage transition blocked');
  }

  return summary;
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const stageId = process.argv[2] as StageId | undefined;
  const projectRoot = process.cwd();

  try {
    const summary = await runOutputValidation(projectRoot, stageId);
    process.exit(summary.failed === 0 ? 0 : 1);
  } catch (error) {
    logError(error instanceof Error ? error.message : 'Validation failed');
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('output-validator')) {
  main().catch(console.error);
}
