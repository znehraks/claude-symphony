/**
 * Output Validator hook logic
 * Stage output validation
 * Migrated from .claude/hooks/output-validator.sh
 *
 * Now supports both legacy validation and Agent SDK-based validation
 */
import path from 'path';
import { existsSync, statSync, readFileSync, readdirSync } from 'fs';
import { readJson, writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { execShell } from '../utils/shell.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS } from '../types/stage.js';
import type { Progress } from '../types/state.js';
import { spawnAgent } from '../core/agents/index.js';
import { verifyMultiModelGate, getMultiModelOutputFiles } from '../utils/multi-model-gate.js';

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
 * Project type definition for multi-framework support
 */
interface ProjectType {
  name: string;
  manifestFile: string;
  manifestGlob: string;
  buildCommand: string;
  testCommand: string;
}

const PROJECT_TYPES: ProjectType[] = [
  { name: 'node', manifestFile: 'package.json', manifestGlob: 'package.json', buildCommand: 'npm run build', testCommand: 'npm test' },
  { name: 'dotnet', manifestFile: '*.csproj', manifestGlob: '*.csproj', buildCommand: 'dotnet build', testCommand: 'dotnet test' },
  { name: 'python', manifestFile: 'pyproject.toml', manifestGlob: 'pyproject.toml', buildCommand: 'python -m py_compile', testCommand: 'pytest' },
  { name: 'rust', manifestFile: 'Cargo.toml', manifestGlob: 'Cargo.toml', buildCommand: 'cargo build', testCommand: 'cargo test' },
  { name: 'go', manifestFile: 'go.mod', manifestGlob: 'go.mod', buildCommand: 'go build ./...', testCommand: 'go test ./...' },
];

/**
 * Detect the project type based on manifest files in the project root
 */
export function detectProjectType(projectRoot: string): ProjectType | null {
  for (const pt of PROJECT_TYPES) {
    if (pt.manifestGlob.includes('*')) {
      // Glob-style match (e.g., *.csproj)
      const ext = pt.manifestGlob.replace('*', '');
      try {
        const files = readdirSync(projectRoot);
        if (files.some((f) => f.endsWith(ext))) {
          return pt;
        }
      } catch {
        continue;
      }
    } else {
      if (existsSync(path.join(projectRoot, pt.manifestFile))) {
        return pt;
      }
    }
  }
  return null;
}

/**
 * Count source code files in the project root (recursive)
 */
export function countSourceFiles(projectRoot: string): number {
  const SOURCE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.cs', '.py', '.go', '.rs', '.java',
    '.vue', '.svelte', '.rb', '.php', '.swift', '.kt', '.scala',
  ]);

  const IGNORE_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
    'target', 'bin', 'obj', '.cache', 'coverage', '.turbo',
  ]);

  let count = 0;

  function walk(dir: string): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!IGNORE_DIRS.has(entry.name)) {
            walk(path.join(dir, entry.name));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SOURCE_EXTENSIONS.has(ext)) {
            count++;
          }
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  walk(projectRoot);
  return count;
}

/**
 * Validate source code existence and run build/test for code-producing stages
 */
async function validateCodeProducingStage(
  state: ValidationState,
  projectRoot: string,
  _stageId: StageId,
  minSourceFiles: number = 5
): Promise<void> {
  // 1. Count source files
  const sourceCount = countSourceFiles(projectRoot);
  const hasEnoughFiles = sourceCount >= minSourceFiles;
  state.addCheck(
    'Source file count',
    hasEnoughFiles,
    hasEnoughFiles
      ? `Found ${sourceCount} source files (>= ${minSourceFiles} required)`
      : `Only ${sourceCount} source files found (minimum ${minSourceFiles} required) — HARD FAIL`,
    true
  );

  // 2. Detect project type
  const projectType = detectProjectType(projectRoot);
  state.addCheck(
    'Project manifest',
    projectType !== null,
    projectType
      ? `Detected project type: ${projectType.name} (${projectType.manifestFile})`
      : 'No project manifest found (package.json, *.csproj, pyproject.toml, Cargo.toml, go.mod) — HARD FAIL',
    true
  );

  if (!projectType) {
    return; // Cannot run build/test without manifest
  }

  // 3. Build
  await runValidationCommand(state, 'build', projectType.buildCommand, projectRoot, true);

  // 4. Test
  await runValidationCommand(state, 'test', projectType.testCommand, projectRoot, true);

  // 5. Optional: E2E tests (Node.js only)
  if (projectType.name === 'node') {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      const pkgContent = readFileSync(pkgPath, 'utf-8');
      if (pkgContent.includes('test:e2e')) {
        await runValidationCommand(state, 'e2e', 'npm run test:e2e', projectRoot, false);
      }
      // Optional lint/typecheck
      await runValidationCommand(state, 'lint', 'npm run lint', projectRoot, false);
      if (pkgContent.includes('typecheck')) {
        await runValidationCommand(state, 'typecheck', 'npm run typecheck', projectRoot, false);
      }
    }
  }
}

/**
 * Validate stage outputs
 */
async function validateStageOutputs(
  state: ValidationState,
  projectRoot: string,
  stageId: StageId
): Promise<void> {
  // Multi-model gate check (before any other checks)
  const gateResult = await verifyMultiModelGate(projectRoot, stageId);
  state.addCheck(
    'Multi-model gate',
    gateResult.passed,
    gateResult.message,
    true
  );

  // Additional synthesis section checks for multi-model stages
  if (gateResult.details?.synthesisFound === false) {
    const outputFiles = getMultiModelOutputFiles(projectRoot, stageId);
    for (const file of outputFiles) {
      checkMarkdownSections(state, projectRoot, file, ['Synthesis Notes']);
    }
  }

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
      // Documentation outputs
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/implementation_log.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/test_summary.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/refactoring_report.md`, true);

      // Source code verification + build/test (HARD FAIL if missing)
      await validateCodeProducingStage(state, projectRoot, stageId, 5);
      break;

    case '07-qa':
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/qa_report.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/bug_list.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/test_report.md`, true);
      checkFileExists(state, projectRoot, `stages/${stageId}/outputs/coverage_report.md`, true);

      // Verify source code and build/test pass after QA + testing
      await validateCodeProducingStage(state, projectRoot, stageId, 5);
      break;

    case '08-deployment':
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
 * Run output validation using Validation Agent (new method)
 */
async function runValidationWithAgent(
  projectRoot: string,
  stageId: StageId
): Promise<ValidationSummary> {
  logInfo('Using Validation Agent for output validation');

  // Get validation rules for this stage
  const validationRules = getValidationRulesForStage(stageId);

  // Spawn validation agent using Task Tool
  const result = await spawnAgent(
    'validation-agent',
    {
      projectRoot,
      stage: stageId as string,
      data: { validationRules },
    },
    'foreground'
  );

  if (!result.success || !result.result) {
    // Agent failed - fallback to legacy validation
    logWarning('Validation agent failed, falling back to legacy validation');
    return runLegacyValidation(projectRoot, stageId);
  }

  // Parse agent result (expects JSON ValidationSummary)
  try {
    if (!result.result) {
      throw new Error('Agent returned empty result');
    }

    // Extract JSON from agent result (may contain markdown formatting)
    const jsonMatch = result.result.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr: string = jsonMatch && jsonMatch[1] ? jsonMatch[1] : result.result;
    const summary = JSON.parse(jsonStr) as ValidationSummary;

    // Ensure stage is set correctly (stageId is never undefined at this point due to earlier check)
    summary.stage = stageId;

    // Save results
    const validationsDir = path.join(projectRoot, 'state', 'validations');
    await ensureDirAsync(validationsDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    await writeJson(path.join(validationsDir, `${stageId}_${timestamp}.json`), summary);

    // Print summary
    printValidationSummary(summary);

    return summary;
  } catch (error) {
    logError(`Failed to parse agent result: ${error}`);
    logInfo('Agent result was:\n' + result.result);
    // Fallback to legacy validation
    return runLegacyValidation(projectRoot, stageId);
  }
}

/**
 * Get validation rules for a stage
 */
function getValidationRulesForStage(stageId: StageId): Record<string, any> {
  // Map stage ID to validation rules
  const rules: Record<StageId, any> = {
    '01-brainstorm': {
      files: [
        { path: 'stages/01-brainstorm/outputs/ideas.md', required: true, minSize: 500 },
        { path: 'stages/01-brainstorm/outputs/requirements_analysis.md', required: true, sections: ['Functional', 'Non-functional'] },
      ],
    },
    '02-research': {
      files: [
        { path: 'stages/02-research/outputs/tech_research.md', required: true, minSize: 2000 },
        { path: 'stages/02-research/outputs/feasibility_report.md', required: true },
      ],
    },
    '03-planning': {
      files: [
        { path: 'stages/03-planning/outputs/architecture.md', required: true },
        { path: 'stages/03-planning/outputs/tech_stack.md', required: true },
        { path: 'stages/03-planning/outputs/project_plan.md', required: true },
      ],
    },
    '04-ui-ux': {
      files: [
        { path: 'stages/04-ui-ux/outputs/wireframes.md', required: true },
        { path: 'stages/04-ui-ux/outputs/design_system.md', required: false },
      ],
    },
    '05-task-management': {
      files: [
        { path: 'stages/05-task-management/outputs/tasks.md', required: true },
      ],
    },
    '06-implementation': {
      sourceCodeCheck: {
        minFiles: 5,
        requireManifest: true,
        requireBuild: true,
        requireTest: true,
      },
      files: [
        { path: 'stages/06-implementation/outputs/implementation_log.md', required: true },
        { path: 'stages/06-implementation/outputs/test_summary.md', required: true },
        { path: 'stages/06-implementation/outputs/refactoring_report.md', required: true },
      ],
    },
    '07-qa': {
      sourceCodeCheck: {
        minFiles: 5,
        requireManifest: true,
        requireBuild: true,
        requireTest: true,
      },
      files: [
        { path: 'stages/07-qa/outputs/qa_report.md', required: true },
        { path: 'stages/07-qa/outputs/bug_list.md', required: false },
      ],
    },
    '08-deployment': {
      files: [
        { path: 'stages/08-deployment/outputs/deployment_guide.md', required: true },
        { path: 'stages/08-deployment/outputs/ci_config.yaml', required: false },
      ],
    },
  };

  return rules[stageId] || {};
}

/**
 * Run legacy validation (original implementation)
 */
async function runLegacyValidation(
  projectRoot: string,
  stageId: StageId
): Promise<ValidationSummary> {
  console.log('');
  console.log('==========================================');
  console.log(`  Output Validation (Legacy): ${stageId}`);
  console.log('==========================================');
  console.log('');

  const state = new ValidationState();
  await validateStageOutputs(state, projectRoot, stageId);

  const summary: ValidationSummary = {
    stage: stageId,
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
  await writeJson(path.join(validationsDir, `${stageId}_${timestamp}.json`), summary);

  // Print summary
  printValidationSummary(summary);

  return summary;
}

/**
 * Print validation summary to console
 */
function printValidationSummary(summary: ValidationSummary): void {
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
}

/**
 * Run output validation (public API)
 * Supports both agent-based and legacy validation
 */
export async function runOutputValidation(
  projectRoot: string,
  stageId?: StageId,
  useAgent: boolean = true
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

  // Check if validation agent exists
  const agentDir = path.join(projectRoot, 'template', '.claude', 'agents', 'validation-agent');
  const agentExists = existsSync(agentDir);

  if (useAgent && agentExists) {
    // Use agent-based validation
    return runValidationWithAgent(projectRoot, stage);
  } else {
    // Use legacy validation
    if (useAgent && !agentExists) {
      logWarning('Validation agent not found, using legacy validation');
    }
    return runLegacyValidation(projectRoot, stage);
  }
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
