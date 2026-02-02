/**
 * Project creation command — simplified "one question" init
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { log } from '../../utils/logger.js';
import { copyDirSync, ensureDir } from '../../utils/fs.js';
import { batchSetJsoncValues } from '../../utils/jsonc.js';
import { resolveModels, assignModelsToRoles } from '../../core/models/index.js';
import type { ModelAssignment } from '../../core/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateOptions {
  skipPrompts: boolean;
  auto?: boolean;
}


/**
 * Generate project brief from description
 */
function generateBriefContent(projectName: string, description: string): string {
  return `# Project Brief

## Project Name
${projectName}

## Description
${description || '[Describe your project]'}

## What to Build
Based on the description above, the AI pipeline will:
1. Brainstorm features and requirements
2. Research technology options
3. Plan architecture and data models
4. Design UI/UX components
5. Break down into implementable tasks
6. Write the code
7. Refactor for quality
8. Run QA checks
9. Write tests
10. Set up deployment

## Notes
- Drop reference files into \`references/<stage>/\` folders for additional context
- Run \`/auto-pilot\` to start the automatic pipeline
- Run \`/status\` to check progress at any time
`;
}

/**
 * Remove nested .git directories
 */
function removeNestedGitDirs(dir: string, isRoot = true): void {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      if (item === '.git' && !isRoot) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else if (item !== '.git') {
        removeNestedGitDirs(itemPath, false);
      }
    }
  }
}

/**
 * Apply resolved model assignments to debate.jsonc and stage_personas.jsonc
 */
async function applyModelAssignments(
  targetDir: string,
  assignments: ModelAssignment
): Promise<void> {
  const debatePath = path.join(targetDir, 'config', 'debate.jsonc');
  const personasPath = path.join(targetDir, 'config', 'stage_personas.jsonc');

  // Build batch updates for debate.jsonc
  const debateUpdates: Array<{ path: (string | number)[]; value: unknown }> = [];

  for (const [stage, defaultTier] of Object.entries(assignments.stageDefaults)) {
    debateUpdates.push({
      path: ['debate', 'stage_roles', stage, 'default_model'],
      value: defaultTier,
    });
  }

  for (const [stage, roles] of Object.entries(assignments.stageRoles)) {
    for (const [indexStr, tier] of Object.entries(roles)) {
      debateUpdates.push({
        path: ['debate', 'stage_roles', stage, 'roles', Number(indexStr), 'model'],
        value: tier,
      });
    }
  }

  // Build batch updates for stage_personas.jsonc
  const personaUpdates: Array<{ path: (string | number)[]; value: unknown }> = [];

  for (const [stage, tier] of Object.entries(assignments.personas)) {
    personaUpdates.push({
      path: ['stage_personas', 'personas', stage, 'model'],
      value: tier,
    });
  }

  await Promise.all([
    batchSetJsoncValues(debatePath, debateUpdates),
    batchSetJsoncValues(personasPath, personaUpdates),
  ]);
}

/**
 * Main project creation function
 */
export async function createProject(
  options: CreateOptions
): Promise<void> {
  const { skipPrompts, auto } = options;

  // Project name
  let projectName = '.';
  if (!skipPrompts) {
    projectName = await input({
      message: 'Project name (or . for current directory):',
      default: '.',
      validate: (value) => {
        if (value !== '.' && !/^[a-z0-9-]+$/.test(value)) {
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    });
  }

  // Find template directory
  const packageRoot = path.resolve(__dirname, '..', '..');
  const templateDir = path.join(packageRoot, 'template');
  const targetDir = path.resolve(projectName);
  const actualProjectName = projectName === '.' ? path.basename(targetDir) : projectName;

  // Template existence check
  if (!fs.existsSync(templateDir)) {
    log(`Error: Template directory not found: ${templateDir}`, 'red');
    process.exit(1);
  }

  // Target directory check
  if (projectName !== '.' && fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      log(`Error: Directory is not empty: ${targetDir}`, 'red');
      process.exit(1);
    }
  }

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`  Creating claude-symphony project: ${actualProjectName}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log('');

  // THE one question
  let description = '';
  if (!skipPrompts) {
    description = await input({
      message: 'What do you want to build?',
      validate: (v) => (v.length > 0 ? true : 'Please describe what you want to build'),
    });
  }

  // Create target directory
  ensureDir(targetDir);
  log('  Project directory ready', 'green');

  // Copy template
  copyDirSync(templateDir, targetDir);
  log('  Template installed', 'green');

  // Remove nested .git directories
  removeNestedGitDirs(targetDir);

  // Resolve and apply optimal model assignments
  const modelSpinner = ora('Detecting available models...').start();
  try {
    const resolved = await resolveModels();
    const assignments = assignModelsToRoles(resolved);
    await applyModelAssignments(targetDir, assignments);
    modelSpinner.succeed(`Models configured (source: ${resolved.source})`);
  } catch {
    modelSpinner.info('Using default model configuration');
  }

  // Initialize progress.json
  const progressTemplatePath = path.join(targetDir, 'state', 'progress.json.template');
  const progressPath = path.join(targetDir, 'state', 'progress.json');

  if (fs.existsSync(progressTemplatePath)) {
    let progressContent = fs.readFileSync(progressTemplatePath, 'utf8');
    const timestamp = new Date().toISOString();

    progressContent = progressContent
      .replace('{{PROJECT_NAME}}', actualProjectName)
      .replace('{{STARTED_AT}}', timestamp);

    fs.writeFileSync(progressPath, progressContent);
    fs.unlinkSync(progressTemplatePath);
  }
  log('  Progress tracking initialized', 'green');

  // Create project_brief.md
  const briefPath = path.join(targetDir, 'stages', '01-brainstorm', 'inputs', 'project_brief.md');
  const briefDir = path.dirname(briefPath);

  ensureDir(briefDir);
  const briefContent = generateBriefContent(actualProjectName, description);
  fs.writeFileSync(briefPath, briefContent);
  log('  Project brief created', 'green');

  // Completion
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log(`  Project '${actualProjectName}' created!`, 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  console.log('');

  // Next steps
  log('Next steps:', 'yellow');
  if (projectName !== '.') {
    console.log(chalk.gray('  1. ') + chalk.cyan(`cd ${projectName}`));
    console.log(chalk.gray('  2. ') + chalk.cyan('claude'));
    console.log(chalk.gray('  3. ') + chalk.cyan('/auto-pilot'));
  } else {
    console.log(chalk.gray('  1. ') + chalk.cyan('claude'));
    console.log(chalk.gray('  2. ') + chalk.cyan('/auto-pilot'));
  }
  console.log('');

  if (auto) {
    log('Auto-pilot mode enabled. The pipeline will start automatically.', 'cyan');
    log('Run /auto-pilot in your Claude Code session to begin.', 'cyan');
    console.log('');
  }

  log('Tip: Drop reference files into references/<stage>/ folders for additional context.', 'blue');
  console.log('');
}
