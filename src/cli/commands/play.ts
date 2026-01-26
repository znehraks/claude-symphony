/**
 * Memory Relay play command
 * Auto-installs and starts Claude with Memory Relay orchestration
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { logInfo, logSuccess, logError, logWarning } from '../../utils/logger.js';
import { commandExists, execShell } from '../../utils/shell.js';
import { copyDirSync, ensureDir, pathExists } from '../../utils/fs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELAY_DIR = path.join(os.homedir(), '.claude/memory-relay');

export interface PlayOptions {
  directory?: string;
}

export interface PlayLogsOptions {
  follow?: boolean;
}

/**
 * Get package root directory
 */
function getPackageRoot(): string {
  // From dist/cli/commands/play.js, go up 3 levels to package root
  return path.resolve(__dirname, '../../..');
}

/**
 * Install Memory Relay to ~/.claude/memory-relay
 */
async function installMemoryRelay(): Promise<boolean> {
  logInfo('Installing Memory Relay...');

  const packageRoot = getPackageRoot();
  const source = path.join(packageRoot, 'scripts/memory-relay');

  if (!fs.existsSync(source)) {
    logError(`Memory Relay source not found at ${source}`);
    return false;
  }

  try {
    // Create target directories
    ensureDir(RELAY_DIR);
    ensureDir(path.join(RELAY_DIR, 'orchestrator'));
    ensureDir(path.join(RELAY_DIR, 'orchestrator/signals'));
    ensureDir(path.join(RELAY_DIR, 'logs'));
    ensureDir(path.join(RELAY_DIR, 'handoffs'));
    ensureDir(path.join(RELAY_DIR, 'queue'));

    // Copy files
    copyDirSync(source, RELAY_DIR);

    // Make scripts executable
    const scripts = [
      'orchestrator/orchestrator.sh',
      'orchestrator/claude-wrapper.sh',
      'orchestrator/tmux-startup.sh',
      'orchestrator/claude-symphony-play',
    ];

    for (const script of scripts) {
      const scriptPath = path.join(RELAY_DIR, script);
      if (fs.existsSync(scriptPath)) {
        fs.chmodSync(scriptPath, 0o755);
      }
    }

    logSuccess('Memory Relay installed successfully!');
    return true;
  } catch (error) {
    logError(`Installation failed: ${error}`);
    return false;
  }
}

/**
 * Main play command - start Claude with Memory Relay
 */
export async function playCommand(options: PlayOptions): Promise<void> {
  // 1. Check tmux
  if (!(await commandExists('tmux'))) {
    logError('tmux is required for Memory Relay');
    logWarning('Install with: brew install tmux (macOS) or apt install tmux (Linux)');
    process.exit(1);
  }

  // 2. Check claude
  if (!(await commandExists('claude'))) {
    logWarning('claude CLI not found in PATH');
  }

  // 3. Install if needed
  if (!pathExists(RELAY_DIR)) {
    const installed = await installMemoryRelay();
    if (!installed) {
      process.exit(1);
    }
  }

  // 4. Start tmux session
  const workDir = options.directory || process.cwd();
  const startupScript = path.join(RELAY_DIR, 'orchestrator/tmux-startup.sh');

  logInfo('Starting Memory Relay session...');

  const result = await execShell(`"${startupScript}" "${workDir}"`, {
    stdio: 'inherit',
  });

  process.exit(result.exitCode);
}

/**
 * Show Memory Relay status
 */
export async function playStatus(): Promise<void> {
  const orchestratorScript = path.join(RELAY_DIR, 'orchestrator/orchestrator.sh');

  if (!pathExists(orchestratorScript)) {
    logWarning('Memory Relay not installed. Run: claude-symphony play');
    return;
  }

  await execShell(`"${orchestratorScript}" status`, { stdio: 'inherit' });
}

/**
 * View Memory Relay logs
 */
export async function playLogs(options: PlayLogsOptions): Promise<void> {
  const logFile = path.join(RELAY_DIR, 'logs/orchestrator.log');

  if (!pathExists(logFile)) {
    logWarning('No logs found. Start a session first: claude-symphony play');
    return;
  }

  const cmd = options.follow ? `tail -f "${logFile}"` : `tail -50 "${logFile}"`;
  await execShell(cmd, { stdio: 'inherit' });
}

/**
 * Stop Memory Relay orchestrator
 */
export async function playStop(): Promise<void> {
  const orchestratorScript = path.join(RELAY_DIR, 'orchestrator/orchestrator.sh');

  if (!pathExists(orchestratorScript)) {
    logWarning('Memory Relay not installed.');
    return;
  }

  await execShell(`"${orchestratorScript}" stop`, { stdio: 'inherit' });
}
