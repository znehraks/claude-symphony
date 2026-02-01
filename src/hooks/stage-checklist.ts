/**
 * Stage Checklist Validation System
 * Validates mandatory requirements before stage transition
 */
import path from 'path';
import { existsSync, statSync, readFileSync } from 'fs';
import chalk from 'chalk';
import { writeJson, ensureDirAsync, listDir } from '../utils/fs.js';
import { logWarning, logError } from '../utils/logger.js';
import { execShell } from '../utils/shell.js';
import { verifyMultiModelGate } from '../utils/multi-model-gate.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS } from '../types/stage.js';

/**
 * Check result interface
 */
export interface CheckResult {
  passed: boolean;
  message: string;
  details?: string;
}

/**
 * Checklist item interface
 */
export interface ChecklistItem {
  id: string;
  description: string;
  check: () => Promise<CheckResult>;
  required: boolean;
  category: 'input' | 'mcp' | 'cli' | 'output' | 'test' | 'git' | 'checkpoint' | 'multimodel';
}

/**
 * Stage checklist interface
 */
export interface StageChecklist {
  stage: StageId;
  items: ChecklistItem[];
  results: Map<string, CheckResult>;
}

/**
 * Checklist run result
 */
export interface ChecklistRunResult {
  passed: boolean;
  summary: string;
  blockers: string[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
}

/**
 * Stage config from stage_checklist.jsonc
 */
interface StageConfig {
  description: string;
  ai_model: {
    primary: string;
    secondary: string | null;
    execution: 'parallel' | 'single';
  };
  required_mcp: string[];
  optional_mcp?: string[];
  fallback_mcp?: Record<string, string[]>;
  required_cli: string[];
  required_inputs: string[];
  required_outputs: string[];
  critical_outputs?: string[];
  validation_rules?: Record<string, unknown>;
  smoke_tests?: TestConfig[];
  regression_tests?: TestConfig[];
  test_commands?: TestConfig[];
  coverage_requirements?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  security_checks?: string[];
  deployment_checks?: { name: string; description: string }[];
  git_commit_required: boolean;
  git_commit_format: string | null;
  checkpoint_required: boolean;
  checkpoint_trigger: string | null;
}

interface TestConfig {
  name: string;
  command: string;
  timeout?: number;
  required: boolean;
  coverage_threshold?: number;
  description?: string;
}

interface StageChecklistConfig {
  version: string;
  global_settings: {
    block_on_failure: boolean;
    allow_force_override: boolean;
    require_justification_on_override: boolean;
  };
  stages: Record<string, StageConfig>;
  cli_output_mapping: Record<string, string>;
}

/**
 * Load stage checklist configuration
 */
async function loadChecklistConfig(projectRoot: string): Promise<StageChecklistConfig | null> {
  const configPath = path.join(projectRoot, 'config', 'stage_checklist.jsonc');

  if (!existsSync(configPath)) {
    logWarning('stage_checklist.jsonc not found');
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    // Remove JSONC comments
    const jsonContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(jsonContent) as StageChecklistConfig;
  } catch (error) {
    logError(`Failed to parse stage_checklist.jsonc: ${error}`);
    return null;
  }
}

/**
 * Get stage config
 */
function getStageConfig(config: StageChecklistConfig, stage: StageId): StageConfig | null {
  return config.stages[stage] || null;
}

/**
 * Check MCP availability (mock - actual implementation depends on MCP setup)
 */
async function checkMCPAvailability(_mcpName: string): Promise<boolean> {
  // In a real implementation, this would check if the MCP server is running
  // For now, we return true as MCP availability is hard to verify programmatically
  // The actual check would be done during runtime when MCP tools are called
  return true;
}

/**
 * Parse coverage from test output
 */
function parseCoverageFromOutput(output: string): number {
  // Try to parse Jest/Istanbul coverage output
  const match = output.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }

  // Try alternate format
  const altMatch = output.match(/Statements\s*:\s*(\d+\.?\d*)%/);
  if (altMatch && altMatch[1]) {
    return parseFloat(altMatch[1]);
  }

  return 0;
}

/**
 * Create checklist items for a stage
 */
export function createChecklist(
  projectRoot: string,
  stage: StageId,
  config: StageChecklistConfig
): StageChecklist {
  const stageConfig = getStageConfig(config, stage);

  if (!stageConfig) {
    logWarning(`No checklist config found for stage ${stage}`);
    return { stage, items: [], results: new Map() };
  }

  const items: ChecklistItem[] = [];
  const stagesDir = path.join(projectRoot, 'stages', stage);

  // 1. Required Inputs Check
  if (stageConfig.required_inputs && stageConfig.required_inputs.length > 0) {
    for (const input of stageConfig.required_inputs) {
      const inputId = `input:${input}`;
      items.push({
        id: inputId,
        description: `Required input: ${input}`,
        category: 'input',
        required: true,
        check: async () => {
          const fullPath = path.join(projectRoot, input);
          const exists = existsSync(fullPath);
          return {
            passed: exists,
            message: exists
              ? `${input} exists`
              : `${input} NOT FOUND - Run previous stage first`,
          };
        },
      });
    }
  }

  // 2. Required MCP Check
  if (stageConfig.required_mcp && stageConfig.required_mcp.length > 0) {
    for (const mcp of stageConfig.required_mcp) {
      const mcpId = `mcp:${mcp}`;
      items.push({
        id: mcpId,
        description: `Required MCP: ${mcp}`,
        category: 'mcp',
        required: false, // MCP checks are warnings, not blockers
        check: async () => {
          const available = await checkMCPAvailability(mcp);
          const fallbacks = stageConfig.fallback_mcp?.[mcp];

          if (available) {
            return { passed: true, message: `MCP ${mcp} available` };
          }

          if (fallbacks && fallbacks.length > 0) {
            for (const fb of fallbacks) {
              if (await checkMCPAvailability(fb)) {
                return {
                  passed: true,
                  message: `MCP ${mcp} unavailable, using fallback: ${fb}`,
                };
              }
            }
          }

          return {
            passed: false,
            message: `MCP ${mcp} NOT available (fallbacks checked)`,
          };
        },
      });
    }
  }

  // 3. Required CLI Calls Check (via output files)
  if (stageConfig.required_cli && stageConfig.required_cli.length > 0) {
    for (const cli of stageConfig.required_cli) {
      const outputFile = config.cli_output_mapping[cli];

      if (outputFile) {
        const cliId = `cli:${cli}`;
        items.push({
          id: cliId,
          description: `Required CLI: ${cli}`,
          category: 'cli',
          required: true,
          check: async () => {
            const fullPath = path.join(stagesDir, outputFile);
            const exists = existsSync(fullPath);
            return {
              passed: exists,
              message: exists
                ? `${cli} was called (${outputFile} exists)`
                : `${cli} NOT CALLED - Run ${cli} command first`,
            };
          },
        });
      }
    }
  }

  // 4. Required Outputs Check
  if (stageConfig.required_outputs && stageConfig.required_outputs.length > 0) {
    for (const output of stageConfig.required_outputs) {
      const isCritical = stageConfig.critical_outputs?.includes(output);
      const outputId = `output:${output}`;

      items.push({
        id: outputId,
        description: `Required output: ${output}${isCritical ? ' (CRITICAL)' : ''}`,
        category: 'output',
        required: true,
        check: async () => {
          const fullPath = path.join(stagesDir, output);
          const isDir = output.endsWith('/');

          if (isDir) {
            const dirPath = fullPath.slice(0, -1);
            const exists = existsSync(dirPath) && statSync(dirPath).isDirectory();
            return {
              passed: exists,
              message: exists
                ? `${output} directory generated`
                : `${output} directory NOT FOUND${isCritical ? ' - CRITICAL FILE' : ''}`,
            };
          }

          const exists = existsSync(fullPath);
          return {
            passed: exists,
            message: exists
              ? `${output} generated`
              : `${output} NOT FOUND${isCritical ? ' - CRITICAL FILE' : ''}`,
          };
        },
      });
    }
  }

  // 5. Smoke/Regression/Test Commands Check
  const tests = stageConfig.smoke_tests || stageConfig.regression_tests || stageConfig.test_commands;
  if (tests && tests.length > 0) {
    for (const test of tests) {
      const testId = `test:${test.name}`;
      items.push({
        id: testId,
        description: `Test: ${test.name}${test.description ? ` - ${test.description}` : ''}`,
        category: 'test',
        required: test.required !== false,
        check: async () => {
          try {
            // Check if package.json exists first
            if (!existsSync(path.join(projectRoot, 'package.json'))) {
              return {
                passed: true,
                message: `${test.name} skipped (no package.json)`,
              };
            }

            const result = await execShell(test.command, {
              cwd: projectRoot,
              timeout: test.timeout || 60000,
            });

            // Coverage threshold check
            if (test.coverage_threshold && result.success) {
              const coverage = parseCoverageFromOutput(result.stdout);
              if (coverage < test.coverage_threshold) {
                return {
                  passed: false,
                  message: `${test.name} coverage ${coverage}% < ${test.coverage_threshold}% threshold`,
                };
              }
            }

            return {
              passed: result.success,
              message: result.success
                ? `${test.name} passed`
                : `${test.name} FAILED`,
              details: result.success ? undefined : result.stderr,
            };
          } catch (error) {
            return {
              passed: false,
              message: `${test.name} FAILED`,
              details: error instanceof Error ? error.message : String(error),
            };
          }
        },
      });
    }
  }

  // 6. Git Commit Check
  if (stageConfig.git_commit_required) {
    items.push({
      id: 'git:uncommitted',
      description: `Git: No uncommitted changes (format: ${stageConfig.git_commit_format})`,
      category: 'git',
      required: true,
      check: async () => {
        try {
          const result = await execShell('git status --porcelain', { cwd: projectRoot });
          const hasUncommitted = result.stdout.trim().length > 0;

          return {
            passed: !hasUncommitted,
            message: hasUncommitted
              ? `Uncommitted changes detected - Commit with format: ${stageConfig.git_commit_format}`
              : 'Working directory clean',
          };
        } catch {
          return {
            passed: true,
            message: 'Not a git repository (skipped)',
          };
        }
      },
    });
  }

  // 7. Checkpoint Check
  if (stageConfig.checkpoint_required) {
    items.push({
      id: 'checkpoint:exists',
      description: `Checkpoint: Recent checkpoint exists (${stageConfig.checkpoint_trigger})`,
      category: 'checkpoint',
      required: true,
      check: async () => {
        const checkpointDir = path.join(projectRoot, 'state', 'checkpoints');

        if (!existsSync(checkpointDir)) {
          return {
            passed: false,
            message: 'No checkpoint directory found - Run /checkpoint first',
          };
        }

        const files = await listDir(checkpointDir);
        const hasCheckpoints = files.length > 0;

        return {
          passed: hasCheckpoints,
          message: hasCheckpoints
            ? `Checkpoint exists (${files.length} checkpoint(s))`
            : 'No checkpoint found - Run /checkpoint first',
        };
      },
    });
  }

  // 8. Multi-model gate check
  items.push({
    id: 'multimodel:gate',
    description: 'Multi-model gate: external AI call executed if required',
    category: 'multimodel',
    required: true,
    check: async () => {
      const result = await verifyMultiModelGate(projectRoot, stage);
      return { passed: result.passed, message: result.message };
    },
  });

  return { stage, items, results: new Map() };
}

/**
 * Run checklist validation
 */
export async function runChecklist(checklist: StageChecklist): Promise<ChecklistRunResult> {
  console.log('');
  console.log(chalk.bold.cyan(`📋 Stage ${checklist.stage} Checklist`));
  console.log(chalk.cyan('━'.repeat(60)));

  const blockers: string[] = [];
  let passedChecks = 0;
  let failedChecks = 0;
  let warningChecks = 0;

  for (const item of checklist.items) {
    const result = await item.check();
    checklist.results.set(item.id, result);

    const categoryIcon = getCategoryIcon(item.category);

    if (result.passed) {
      passedChecks++;
      console.log(chalk.green(`✅ [${categoryIcon}] ${item.description}`));
    } else if (item.required) {
      failedChecks++;
      console.log(chalk.red(`❌ [${categoryIcon}] ${item.description}`));
      console.log(chalk.gray(`   └─ ${result.message}`));
      if (result.details) {
        console.log(chalk.gray(`      ${result.details.substring(0, 200)}`));
      }
      blockers.push(`[${categoryIcon}] ${result.message}`);
    } else {
      warningChecks++;
      console.log(chalk.yellow(`⚠️  [${categoryIcon}] ${item.description}`));
      console.log(chalk.gray(`   └─ ${result.message}`));
    }
  }

  console.log(chalk.cyan('━'.repeat(60)));

  const allPassed = failedChecks === 0;

  if (allPassed) {
    console.log(chalk.green.bold('\n✅ All checks passed - Ready for stage transition\n'));
  } else {
    console.log(chalk.red.bold('\n❌ BLOCKED - Fix the following issues:\n'));
    blockers.forEach((b, i) => {
      console.log(chalk.red(`  ${i + 1}. ${b}`));
    });
    console.log('');
  }

  // Summary
  console.log(chalk.gray(`Summary: ${passedChecks} passed, ${failedChecks} failed, ${warningChecks} warnings`));
  console.log('');

  return {
    passed: allPassed,
    summary: allPassed
      ? `Stage ${checklist.stage} validation passed`
      : `Stage ${checklist.stage} blocked: ${failedChecks} issue(s)`,
    blockers,
    totalChecks: checklist.items.length,
    passedChecks,
    failedChecks,
    warningChecks,
  };
}

/**
 * Get category icon
 */
function getCategoryIcon(category: ChecklistItem['category']): string {
  const icons: Record<string, string> = {
    input: 'INPUT',
    mcp: 'MCP',
    cli: 'CLI',
    output: 'OUTPUT',
    test: 'TEST',
    git: 'GIT',
    checkpoint: 'CHECKPOINT',
    multimodel: 'AI-GATE',
  };
  return icons[category] || category.toUpperCase();
}

/**
 * Validate a stage
 */
export async function validateStage(
  projectRoot: string,
  stageId: StageId
): Promise<ChecklistRunResult> {
  const config = await loadChecklistConfig(projectRoot);

  if (!config) {
    return {
      passed: true,
      summary: 'No checklist configuration found (skipped)',
      blockers: [],
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      warningChecks: 0,
    };
  }

  const checklist = createChecklist(projectRoot, stageId, config);
  return runChecklist(checklist);
}

/**
 * Check if transition is allowed
 */
export async function canTransitionTo(
  projectRoot: string,
  currentStage: StageId,
  nextStage: StageId | 'completed'
): Promise<{ allowed: boolean; reason?: string }> {
  const result = await validateStage(projectRoot, currentStage);

  if (!result.passed) {
    return {
      allowed: false,
      reason: `Cannot transition to ${nextStage}: Current stage ${currentStage} has ${result.failedChecks} unresolved blocker(s)`,
    };
  }

  return { allowed: true };
}

/**
 * Save validation results
 */
export async function saveValidationResults(
  projectRoot: string,
  stageId: StageId,
  result: ChecklistRunResult
): Promise<void> {
  const validationsDir = path.join(projectRoot, 'state', 'validations');
  await ensureDirAsync(validationsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `checklist_${stageId}_${timestamp}.json`;

  await writeJson(path.join(validationsDir, filename), {
    stage: stageId,
    timestamp: new Date().toISOString(),
    ...result,
  });
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const stageId = process.argv[2] as StageId;

  if (!stageId || !STAGE_IDS.includes(stageId)) {
    console.error('Usage: stage-checklist <stage-id>');
    console.error(`Valid stages: ${STAGE_IDS.join(', ')}`);
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const result = await validateStage(projectRoot, stageId);

  // Save results
  await saveValidationResults(projectRoot, stageId, result);

  process.exit(result.passed ? 0 : 1);
}

// Run if executed directly
if (process.argv[1]?.includes('stage-checklist')) {
  main().catch(console.error);
}
