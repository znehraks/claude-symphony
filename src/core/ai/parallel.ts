/**
 * Parallel AI Execution
 * Execute AI models in parallel for designated stages
 * Migrated from parallel-execute.sh
 */
import path from 'path';
import { existsSync, readdirSync } from 'fs';
import { writeFile, readFile, ensureDirAsync } from '../../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../../utils/logger.js';
import { callGemini } from '../../integrations/gemini.js';
import { callCodex } from '../../integrations/codex.js';
import { isModelAvailable, type AIModel } from './orchestrator.js';
import type { StageId } from '../../types/stage.js';

/**
 * Parallel-capable stages
 */
export const PARALLEL_STAGES: StageId[] = [
  '01-brainstorm',
  '03-planning',
  '04-ui-ux',
  '07-refactoring',
  '09-testing',
];

/**
 * Sequential-only stages
 */
export const SEQUENTIAL_STAGES: StageId[] = [
  '02-research',
  '05-task-management',
  '06-implementation',
  '08-qa',
  '10-deployment',
];

/**
 * Model assignment for parallel stages
 */
const STAGE_MODELS: Record<string, AIModel[]> = {
  '01-brainstorm': ['gemini', 'claudecode'],
  '03-planning': ['gemini', 'claudecode'],
  '04-ui-ux': ['gemini', 'claudecode'],
  '07-refactoring': ['codex', 'claudecode'],
  '09-testing': ['codex', 'claudecode'],
};

/**
 * Parallel execution result for a single model
 */
export interface ModelExecutionResult {
  model: AIModel;
  success: boolean;
  output?: string;
  outputFile?: string;
  error?: string;
}

/**
 * Parallel execution summary
 */
export interface ParallelExecutionResult {
  stage: StageId;
  timestamp: string;
  outputDir: string;
  models: ModelExecutionResult[];
  summaryFile: string;
  success: boolean;
}

/**
 * Parallel execution options
 */
export interface ParallelExecutionOptions {
  promptFile?: string;
  promptContent?: string;
  dryRun?: boolean;
  force?: boolean;
  timeout?: number;
}

/**
 * Check if a stage supports parallel execution
 */
export function isParallelStage(stage: StageId): boolean {
  return PARALLEL_STAGES.includes(stage);
}

/**
 * Get models assigned to a stage
 */
export function getStageModels(stage: StageId): AIModel[] {
  return STAGE_MODELS[stage] ?? ['claudecode'];
}

/**
 * Execute AI models in parallel for a stage
 */
export async function executeParallel(
  projectRoot: string,
  stage: StageId,
  options: ParallelExecutionOptions = {}
): Promise<ParallelExecutionResult> {
  const {
    promptFile,
    promptContent: providedPrompt,
    dryRun = false,
    force = false,
    timeout = 300,
  } = options;

  const stagesDir = path.join(projectRoot, 'stages');
  const stateDir = path.join(projectRoot, 'state');
  const outputBaseDir = path.join(stateDir, 'collaborations', stage);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(outputBaseDir, timestamp);

  // Validate stage exists
  if (!existsSync(path.join(stagesDir, stage))) {
    throw new Error(`Stage not found: ${stage}`);
  }

  // Check if parallel execution is appropriate
  if (!isParallelStage(stage) && !force) {
    throw new Error(
      `Stage ${stage} is sequential-only. Use force option to override.`
    );
  }

  // Get models for this stage
  const models = getStageModels(stage);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logInfo('Parallel AI Execution');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Stage: ${stage}`);
  console.log(`  Models: ${models.join(', ')}`);
  console.log(`  Output: ${outputDir}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Load prompt content
  let prompt = providedPrompt ?? '';
  if (!prompt && promptFile && existsSync(promptFile)) {
    prompt = (await readFile(promptFile)) ?? '';
    logInfo(`Prompt loaded from: ${promptFile}`);
  } else if (!prompt) {
    const defaultPrompt = path.join(stagesDir, stage, 'prompts', 'default.md');
    if (existsSync(defaultPrompt)) {
      prompt = (await readFile(defaultPrompt)) ?? '';
      logInfo('Using default stage prompt');
    } else {
      prompt = `Execute stage ${stage} tasks as defined in CLAUDE.md`;
      logWarning('Using generic prompt (no prompt file found)');
    }
  }

  // Dry run mode
  if (dryRun) {
    console.log('\n=== DRY RUN MODE ===');
    console.log('Would execute the following:');
    for (const model of models) {
      console.log(`  - ${model} → ${outputDir}/output_${model}.md`);
    }
    console.log('Synthesizer: ClaudeCode');
    console.log(`Final output: ${outputDir}/final_output.md`);

    return {
      stage,
      timestamp,
      outputDir,
      models: models.map(model => ({
        model,
        success: true,
        outputFile: path.join(outputDir, `output_${model}.md`),
      })),
      summaryFile: path.join(outputDir, 'execution_summary.md'),
      success: true,
    };
  }

  // Create output directory
  await ensureDirAsync(outputDir);

  // Execute each model
  const results: ModelExecutionResult[] = [];
  const promises: Promise<void>[] = [];

  for (const model of models) {
    const outputFile = path.join(outputDir, `output_${model}.md`);

    if (model === 'claudecode') {
      // ClaudeCode runs in current session
      logInfo('ClaudeCode will synthesize results');
      await writeFile(
        outputFile,
        `# ClaudeCode Output\n\nClaudeCode runs in the current session.\nThis output is a placeholder - actual work happens interactively.\n`
      );
      results.push({
        model,
        success: true,
        outputFile,
      });
      continue;
    }

    // Check CLI availability
    const available = await isModelAvailable(model);
    if (!available) {
      logWarning(`${model} CLI not available, skipping`);
      await writeFile(
        outputFile,
        `# ${model.charAt(0).toUpperCase() + model.slice(1)} Output (Skipped)\n\n${model} CLI not installed.\n`
      );
      results.push({
        model,
        success: false,
        outputFile,
        error: 'CLI not installed',
      });
      continue;
    }

    // Execute model in parallel
    const executeModel = async () => {
      logInfo(`Starting ${model}...`);

      let result;
      if (model === 'gemini') {
        result = await callGemini(prompt, { timeout });
      } else if (model === 'codex') {
        result = await callCodex(prompt, { timeout });
      } else {
        return;
      }

      if (result.success && result.output) {
        await writeFile(
          outputFile,
          `# ${model.charAt(0).toUpperCase() + model.slice(1)} Output\n\n${result.output}\n`
        );
        results.push({
          model,
          success: true,
          output: result.output,
          outputFile,
        });
        logSuccess(`${model} completed successfully`);
      } else {
        await writeFile(
          outputFile,
          `# ${model.charAt(0).toUpperCase() + model.slice(1)} Output (Error)\n\nError: ${result.fallbackReason ?? 'Unknown error'}\n`
        );
        results.push({
          model,
          success: false,
          outputFile,
          error: result.fallbackReason,
        });
        logError(`${model} completed with errors`);
      }
    };

    promises.push(executeModel());
  }

  // Wait for all parallel executions
  if (promises.length > 0) {
    logInfo('Waiting for parallel executions...');
    await Promise.all(promises);
  }

  // Create summary file
  const summaryFile = path.join(outputDir, 'execution_summary.md');
  const summaryContent = generateSummary(stage, timestamp, outputDir, results);
  await writeFile(summaryFile, summaryContent);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logSuccess('Parallel execution complete');
  console.log(`\n  Outputs: ${outputDir}/`);
  for (const model of models) {
    console.log(`    - output_${model}.md`);
  }
  console.log('    - execution_summary.md\n');
  logInfo('Run /synthesize to consolidate results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    stage,
    timestamp,
    outputDir,
    models: results,
    summaryFile,
    success: results.some(r => r.success),
  };
}

/**
 * Generate execution summary markdown
 */
function generateSummary(
  stage: StageId,
  timestamp: string,
  outputDir: string,
  results: ModelExecutionResult[]
): string {
  const modelsExecuted = results.map(r => r.model).join(', ');

  let content = `# Parallel Execution Summary

**Stage**: ${stage}
**Timestamp**: ${timestamp}
**Models Executed**: ${modelsExecuted}

## Output Files

| Model | Output File | Status |
|-------|-------------|--------|
`;

  for (const result of results) {
    const status = result.success ? '✓ Generated' : '⚠ Error';
    content += `| ${result.model} | output_${result.model}.md | ${status} |\n`;
  }

  content += `
## Next Steps

1. Review individual outputs in \`${outputDir}/\`
2. Run \`/synthesize\` to consolidate results
3. Or manually merge insights into final output

## Synthesis Command

\`\`\`bash
# Consolidate parallel outputs
/synthesize --stage ${stage} --dir ${outputDir}
\`\`\`
`;

  return content;
}

/**
 * Get latest parallel execution for a stage
 */
export async function getLatestParallelExecution(
  projectRoot: string,
  stage: StageId
): Promise<string | null> {
  const outputBaseDir = path.join(projectRoot, 'state', 'collaborations', stage);

  if (!existsSync(outputBaseDir)) {
    return null;
  }

  const dirs = readdirSync(outputBaseDir)
    .filter(d => d.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/))
    .sort()
    .reverse();

  if (dirs.length === 0) {
    return null;
  }

  return path.join(outputBaseDir, dirs[0]!);
}
