/**
 * claude-symphony CLI entry point
 * Migrated from bin/create.js to TypeScript
 */
import { Command } from 'commander';
import { createProject } from './commands/create.js';
import { runStage, nextStage, gotoStage, listStages } from './commands/stage.js';
import { playCommand, playStatus, playLogs, playStop } from './commands/play.js';
import { showStatus, showDashboard, showContextStatus } from './commands/status.js';
import { validateConfig } from './commands/validate.js';
import {
  createCheckpointCommand,
  restoreCheckpointCommand,
  deleteCheckpointCommand,
  cleanupCheckpointsCommand,
} from './commands/checkpoint.js';
import type { StageId } from '../types/stage.js';

const program = new Command();

program
  .name('claude-symphony')
  .description('Multi-AI Orchestration Framework - 10-stage development workflow')
  .version('0.1.0');

// init command: create project
program
  .command('init [project-name]')
  .description('Initialize a new claude-symphony project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (projectName: string = '.', options: { yes?: boolean }) => {
    await createProject(projectName, { skipPrompts: options.yes ?? false });
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
  .action(async (stageId: string | undefined, options: { list?: boolean; history?: boolean }) => {
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

// context command
program
  .command('context')
  .description('Check context (token) status')
  .option('-r, --remaining <percent>', 'Override remaining percentage', '100')
  .action(async (options: { remaining: string }) => {
    const projectRoot = process.cwd();
    const remaining = parseInt(options.remaining, 10);
    await showContextStatus(projectRoot, remaining);
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

// play command
program
  .command('play')
  .description('Start Claude with Memory Relay orchestration (auto-installs if needed)')
  .option('-d, --directory <dir>', 'Working directory', process.cwd())
  .action(async (options: { directory: string }) => {
    await playCommand(options);
  });

// play:status command
program
  .command('play:status')
  .description('Show Memory Relay orchestrator status')
  .action(async () => {
    await playStatus();
  });

// play:logs command
program
  .command('play:logs')
  .description('View Memory Relay logs')
  .option('-f, --follow', 'Follow logs in real-time')
  .action(async (options: { follow?: boolean }) => {
    await playLogs(options);
  });

// play:stop command
program
  .command('play:stop')
  .description('Stop Memory Relay orchestrator')
  .action(async () => {
    await playStop();
  });

program.parse();
