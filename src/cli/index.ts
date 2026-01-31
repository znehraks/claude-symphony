/**
 * claude-symphony CLI entry point
 * Migrated from bin/create.js to TypeScript
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { Command } from 'commander';
import { createProject } from './commands/create.js';
import { runStage, nextStage, gotoStage, listStages } from './commands/stage.js';
import { showStatus, showDashboard } from './commands/status.js';
import { validateConfig } from './commands/validate.js';
import {
  createCheckpointCommand,
  restoreCheckpointCommand,
  deleteCheckpointCommand,
  cleanupCheckpointsCommand,
} from './commands/checkpoint.js';
import { importProject } from './commands/import.js';
import { aiCallCommand } from './commands/ai-call.js';
import type { StageId } from '../types/stage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get package version from package.json
 */
function getPackageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const program = new Command();

program
  .name('claude-symphony')
  .description('One command. Production-grade software. From idea to deployment.')
  .version(getPackageVersion());

// init command: create project
program
  .command('init')
  .description('Initialize a new claude-symphony project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--auto', 'Start auto-pilot after initialization')
  .action(async (options: { yes?: boolean; auto?: boolean }) => {
    await createProject({ skipPrompts: options.yes ?? false, auto: options.auto });
  });

// import command: import existing project
program
  .command('import <path>')
  .description('Import an existing project into claude-symphony')
  .option('--dry-run', 'Analyze without modifying files')
  .action(async (targetPath: string, options: { dryRun?: boolean }) => {
    await importProject(targetPath, { dryRun: options.dryRun });
  });

// run-stage command
program
  .command('run-stage <stage-id>')
  .description('Run a specific stage')
  .option('--complete', 'Mark stage as complete')
  .action(async (stageId: string, options: { complete?: boolean }) => {
    const projectRoot = process.cwd();
    const success = await runStage(projectRoot, stageId as StageId, { complete: options.complete });
    process.exit(success ? 0 : 1);
  });

// next command
program
  .command('next')
  .description('Transition to next stage (or next sprint)')
  .option('--stage', 'Force stage transition (skip sprint check)')
  .option('--preview', 'Preview transition without executing')
  .option('--no-handoff', 'Skip HANDOFF.md check')
  .option('-f, --force', 'Force transition even if checks fail')
  .action(async (options: {
    stage?: boolean;
    preview?: boolean;
    handoff?: boolean;
    force?: boolean;
  }) => {
    const projectRoot = process.cwd();
    const success = await nextStage(projectRoot, {
      stage: options.stage,
      preview: options.preview,
      noHandoff: options.handoff === false,
      force: options.force,
    });
    process.exit(success ? 0 : 1);
  });

// goto command
program
  .command('goto [stage-id]')
  .description('Jump to a previous stage (loop-back)')
  .option('--list', 'List available stages')
  .option('--history', 'Show loop-back history')
  .option('-r, --reason <text>', 'Record reason for stage transition')
  .action(async (stageId: string | undefined, options: { list?: boolean; history?: boolean; reason?: string }) => {
    const projectRoot = process.cwd();
    const success = await gotoStage(projectRoot, stageId as StageId | undefined, options);
    process.exit(success ? 0 : 1);
  });

// stages command
program
  .command('stages')
  .description('List all stages with status')
  .action(async () => {
    const projectRoot = process.cwd();
    await listStages(projectRoot);
  });

// status command
program
  .command('status')
  .description('Show pipeline status')
  .action(async () => {
    const projectRoot = process.cwd();
    await showStatus(projectRoot);
  });

// dashboard command
program
  .command('dashboard')
  .description('Show full dashboard')
  .action(async () => {
    const projectRoot = process.cwd();
    await showDashboard(projectRoot);
  });

// validate command
program
  .command('validate')
  .description('Validate configuration')
  .option('--fix', 'Attempt to fix issues')
  .option('-v, --verbose', 'Show detailed output')
  .option('--stage <stage-id>', 'Validate specific stage only')
  .option('--rule <rule-name>', 'Run specific rule only')
  .option('--json', 'Output as JSON')
  .option('--recovery-guide', 'Show recovery guide')
  .action(async (options: {
    fix?: boolean;
    verbose?: boolean;
    stage?: string;
    rule?: string;
    json?: boolean;
    recoveryGuide?: boolean;
  }) => {
    const projectRoot = process.cwd();
    const exitCode = await validateConfig(projectRoot, options);
    process.exit(exitCode);
  });

// checkpoint command
program
  .command('checkpoint')
  .description('Create a checkpoint')
  .option('-m, --message <description>', 'Checkpoint description')
  .option('--include-config', 'Include config files')
  .action(async (options: { message?: string; includeConfig?: boolean }) => {
    const projectRoot = process.cwd();
    const success = await createCheckpointCommand(projectRoot, {
      description: options.message,
      includeConfig: options.includeConfig,
    });
    process.exit(success ? 0 : 1);
  });

// restore command
program
  .command('restore [checkpoint-id]')
  .description('Restore from checkpoint')
  .option('--list', 'List available checkpoints')
  .option('--partial', 'Partial restore')
  .option('--files <files...>', 'Files to restore (with --partial)')
  .option('--restore-config', 'Also restore config files')
  .action(async (checkpointId: string | undefined, options: {
    list?: boolean;
    partial?: boolean;
    files?: string[];
    restoreConfig?: boolean;
  }) => {
    const projectRoot = process.cwd();
    const success = await restoreCheckpointCommand(projectRoot, checkpointId, options);
    process.exit(success ? 0 : 1);
  });

// checkpoint-delete command
program
  .command('checkpoint-delete <checkpoint-id>')
  .description('Delete a checkpoint')
  .action(async (checkpointId: string) => {
    const projectRoot = process.cwd();
    const success = await deleteCheckpointCommand(projectRoot, checkpointId);
    process.exit(success ? 0 : 1);
  });

// checkpoint-cleanup command
program
  .command('checkpoint-cleanup')
  .description('Cleanup old checkpoints')
  .option('-n, --max <count>', 'Maximum checkpoints to retain', '10')
  .action(async (options: { max: string }) => {
    const projectRoot = process.cwd();
    const maxRetention = parseInt(options.max, 10);
    await cleanupCheckpointsCommand(projectRoot, maxRetention);
  });

// ai-call command: call external AI model for a pipeline stage
program
  .command('ai-call')
  .description('Call external AI model for a pipeline stage')
  .requiredOption('--stage <id>', 'Stage ID (e.g. 01-brainstorm)')
  .option('--prompt <text>', 'Prompt text')
  .option('--prompt-file <path>', 'Path to prompt file')
  .option('--timeout <seconds>', 'Timeout in seconds', '300')
  .action(async (options: { stage: string; prompt?: string; promptFile?: string; timeout?: string }) => {
    const exitCode = await aiCallCommand(options);
    process.exit(exitCode);
  });

program.parse();
