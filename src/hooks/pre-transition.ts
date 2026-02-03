/**
 * Pre-transition validation hook
 * Validates stage completion before allowing transition to next stage
 */
import path from 'path';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { validateStage, saveValidationResults } from './stage-checklist.js';
import { readJson } from '../utils/fs.js';
import { logError } from '../utils/logger.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS, getNextStage, getStageName } from '../types/stage.js';
import type { Progress } from '../types/state.js';

/**
 * Pre-transition result
 */
export interface PreTransitionResult {
  allowed: boolean;
  currentStage: StageId;
  nextStage: StageId | 'completed';
  blockers: string[];
  summary: string;
}

/**
 * Get current stage from progress.json
 */
async function getCurrentStage(projectRoot: string): Promise<StageId | null> {
  const progressPath = path.join(projectRoot, 'state', 'progress.json');

  if (!existsSync(progressPath)) {
    return null;
  }

  const progress = await readJson<Progress>(progressPath);

  if (progress?.current_stage && STAGE_IDS.includes(progress.current_stage as StageId)) {
    return progress.current_stage as StageId;
  }

  return null;
}

/**
 * Run pre-transition validation
 */
export async function runPreTransition(
  projectRoot: string,
  currentStageArg?: StageId,
  nextStageArg?: StageId
): Promise<PreTransitionResult> {
  console.log('');
  console.log(chalk.bold.cyan('🔍 Pre-Transition Validation'));
  console.log(chalk.cyan('━'.repeat(60)));

  // Determine current stage
  const currentStage = currentStageArg || (await getCurrentStage(projectRoot));

  if (!currentStage) {
    logError('Cannot determine current stage');
    console.log(chalk.gray('  Check state/progress.json or provide stage as argument'));
    return {
      allowed: false,
      currentStage: '01-planning',
      nextStage: '02-ui-ux',
      blockers: ['Cannot determine current stage'],
      summary: 'Pre-transition failed: Cannot determine current stage',
    };
  }

  // Determine next stage
  const nextStage = nextStageArg || getNextStage(currentStage);

  console.log(`${chalk.gray('Current:')} ${chalk.bold(currentStage)} (${getStageName(currentStage)})`);
  console.log(`${chalk.gray('Next:')} ${chalk.bold(String(nextStage))}${nextStage !== 'completed' ? ` (${getStageName(nextStage as StageId)})` : ''}`);
  console.log('');

  // Run stage validation
  const validationResult = await validateStage(projectRoot, currentStage);

  // Save validation results
  await saveValidationResults(projectRoot, currentStage, validationResult);

  // Check transition eligibility
  if (!validationResult.passed) {
    console.log(chalk.red.bold('🚫 STAGE TRANSITION BLOCKED'));
    console.log('');
    console.log(chalk.yellow('Fix all blockers before proceeding to the next stage.'));
    console.log(chalk.gray('Run the checklist again after fixing issues.'));
    console.log('');

    // Suggest fixes
    if (validationResult.blockers.length > 0) {
      console.log(chalk.yellow.bold('Suggested Actions:'));
      suggestFixes(validationResult.blockers, currentStage);
    }

    return {
      allowed: false,
      currentStage,
      nextStage,
      blockers: validationResult.blockers,
      summary: `Pre-transition blocked: ${validationResult.failedChecks} issue(s) found`,
    };
  }

  console.log(chalk.green.bold('✅ STAGE TRANSITION ALLOWED'));
  console.log('');
  console.log(chalk.gray(`Ready to proceed from ${currentStage} to ${nextStage}`));
  console.log('');

  return {
    allowed: true,
    currentStage,
    nextStage,
    blockers: [],
    summary: `Pre-transition passed: Ready to proceed to ${nextStage}`,
  };
}

/**
 * Suggest fixes based on blockers
 */
function suggestFixes(blockers: string[], _stage: StageId): void {
  const suggestions: string[] = [];

  for (const blocker of blockers) {
    const blockerLower = blocker.toLowerCase();

    // HANDOFF.md missing
    if (blockerLower.includes('handoff.md')) {
      suggestions.push('Run `/handoff` to generate HANDOFF.md');
    }

    // CLI not called (Gemini/Codex)
    if (blockerLower.includes('/gemini') || blockerLower.includes('output_gemini')) {
      suggestions.push('Run `/gemini` command to generate parallel AI output');
    }

    if (blockerLower.includes('/codex') || blockerLower.includes('output_codex')) {
      suggestions.push('Run `/codex` command to generate parallel AI output');
    }

    // Git uncommitted
    if (blockerLower.includes('uncommitted')) {
      suggestions.push('Commit changes with proper format before transition');
    }

    // Checkpoint missing
    if (blockerLower.includes('checkpoint')) {
      suggestions.push('Run `/checkpoint` to create a checkpoint');
    }

    // Test failures
    if (blockerLower.includes('test') && blockerLower.includes('failed')) {
      suggestions.push('Fix failing tests before transition');
    }

    // Coverage
    if (blockerLower.includes('coverage')) {
      suggestions.push('Add more tests to increase coverage above threshold');
    }

    // Input files
    if (blockerLower.includes('input')) {
      suggestions.push('Complete previous stage to generate required input files');
    }

    // implementation.yaml
    if (blockerLower.includes('implementation.yaml')) {
      suggestions.push('Generate implementation.yaml in Stage 03 planning');
    }
  }

  // Remove duplicates
  const uniqueSuggestions = [...new Set(suggestions)];

  if (uniqueSuggestions.length === 0) {
    uniqueSuggestions.push('Review the blockers above and fix each issue');
  }

  uniqueSuggestions.forEach((suggestion, i) => {
    console.log(chalk.cyan(`  ${i + 1}. ${suggestion}`));
  });

  console.log('');

  // Force override info
  console.log(chalk.gray('To force transition (not recommended):'));
  console.log(chalk.gray('  /next --force --reason "justification"'));
  console.log('');
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const currentStage = args[0] as StageId | undefined;
  const nextStage = args[1] as StageId | undefined;

  // Validate stage IDs if provided
  if (currentStage && !STAGE_IDS.includes(currentStage)) {
    console.error(`Invalid current stage: ${currentStage}`);
    console.error(`Valid stages: ${STAGE_IDS.join(', ')}`);
    process.exit(1);
  }

  if (nextStage && !STAGE_IDS.includes(nextStage)) {
    console.error(`Invalid next stage: ${nextStage}`);
    console.error(`Valid stages: ${STAGE_IDS.join(', ')}`);
    process.exit(1);
  }

  const projectRoot = process.cwd();

  try {
    const result = await runPreTransition(projectRoot, currentStage, nextStage);
    process.exit(result.allowed ? 0 : 1);
  } catch (error) {
    logError(error instanceof Error ? error.message : 'Pre-transition validation failed');
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('pre-transition')) {
  main().catch(console.error);
}
