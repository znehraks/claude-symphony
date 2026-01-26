/**
 * Claude Wrapper for Memory Relay Orchestration
 * Replaces claude-wrapper.sh
 *
 * Starts Claude with relay support and handles handoff resumption
 */
import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import { getConfig } from './config.js';
import type { SessionOptions } from './types.js';

/**
 * Parse command line arguments for the wrapper
 */
export function parseWrapperArgs(argv: string[]): SessionOptions {
  const options: SessionOptions = {
    workDir: process.cwd(),
    bypass: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--bypass') {
      options.bypass = true;
    } else if (arg && !arg.startsWith('-')) {
      // Check if it's a handoff file
      try {
        const fs = require('fs');
        if (fs.existsSync(arg) && fs.statSync(arg).isFile()) {
          options.handoffFile = arg;
        }
      } catch {
        // Not a valid file, ignore
      }
    }
  }

  return options;
}

/**
 * Build the claude command with appropriate flags
 */
export function getClaudeCommand(options: SessionOptions): string[] {
  const args: string[] = [];

  if (options.bypass) {
    args.push('--dangerously-skip-permissions');
  }

  if (options.handoffFile) {
    args.push('--resume', options.handoffFile);
  }

  return args;
}

/**
 * Show the relay status banner
 */
export function showRelayBanner(): void {
  console.log('');
  console.log(chalk.cyan('+============================================================+'));
  console.log(chalk.cyan('|') + '           ' + chalk.green('Claude Symphony - Encore Mode') + '                  ' + chalk.cyan('|'));
  console.log(chalk.cyan('+============================================================+'));
  console.log(chalk.cyan('|') + '  Automatic session handoff at 50% context               ' + chalk.cyan('|'));
  console.log(chalk.cyan('|') + '  Claude never stops - your workflow continues forever   ' + chalk.cyan('|'));
  console.log(chalk.cyan('+============================================================+'));
  console.log('');
}

/**
 * Show the resume banner when resuming from a handoff
 */
export function showResumeBanner(handoffPath: string): void {
  console.log('');
  console.log(chalk.green('+============================================================+'));
  console.log(chalk.green('|') + '              ' + chalk.yellow('Resuming from Handoff') + '                       ' + chalk.green('|'));
  console.log(chalk.green('+============================================================+'));
  console.log(chalk.green('|') + `  Handoff: ${handoffPath}`);
  console.log(chalk.green('+============================================================+'));
  console.log('');
}

/**
 * Log to the relay log file
 */
function logToFile(message: string): void {
  const config = getConfig();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const fs = require('fs');
    const logLine = `[${timestamp}] [WRAPPER] ${message}\n`;
    fs.appendFileSync(config.relayLogFile, logLine);
  } catch {
    // Ignore logging errors
  }
}

/**
 * Launch Claude with the given options
 * Uses exec to replace the current process
 */
export function launchClaude(options: SessionOptions): void {
  const args = getClaudeCommand(options);

  // Set environment variables for relay support
  process.env.FIFO_PATH = getConfig().fifoPath;
  process.env.RELAY_BASE = getConfig().baseDir;
  process.env.LOG_FILE = getConfig().relayLogFile;

  if (options.handoffFile) {
    process.env.MEMORY_RELAY_HANDOFF = options.handoffFile;
    process.env.MEMORY_RELAY_RESUME = 'true';
    logToFile(`Starting Claude with handoff resume: ${options.handoffFile}`);
    showResumeBanner(options.handoffFile);
  } else {
    logToFile('Starting fresh Claude session with relay support');
  }

  showRelayBanner();

  // Use execSync to replace the process with Claude
  // This is similar to 'exec claude' in bash
  try {
    const claudeCommand = ['claude', ...args].join(' ');
    execSync(claudeCommand, {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (error) {
    // If claude --resume fails, try without resume
    if (options.handoffFile) {
      logToFile('Resume failed, starting fresh session');
      const fallbackArgs = options.bypass ? ['--dangerously-skip-permissions'] : [];
      const claudeCommand = ['claude', ...fallbackArgs].join(' ');
      execSync(claudeCommand, {
        stdio: 'inherit',
        env: process.env,
      });
    }
  }
}

/**
 * Launch Claude as a child process (non-blocking)
 * Returns the child process for monitoring
 */
export function spawnClaude(options: SessionOptions): ReturnType<typeof spawn> {
  const args = getClaudeCommand(options);

  // Set environment variables
  const env: Record<string, string | undefined> = {
    ...process.env,
    FIFO_PATH: getConfig().fifoPath,
    RELAY_BASE: getConfig().baseDir,
    LOG_FILE: getConfig().relayLogFile,
  };

  if (options.handoffFile) {
    env.MEMORY_RELAY_HANDOFF = options.handoffFile;
    env.MEMORY_RELAY_RESUME = 'true';
  }

  return spawn('claude', args, {
    stdio: 'inherit',
    env,
    cwd: options.workDir,
  });
}

/**
 * Main wrapper entry point
 * Called when wrapper.ts is run directly
 */
export async function runWrapper(argv: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseWrapperArgs(argv);
  launchClaude(options);
}
