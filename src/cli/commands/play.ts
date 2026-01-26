/**
 * Memory Relay play command
 * Auto-installs and starts Claude with Memory Relay orchestration
 *
 * Uses TypeScript modules for core logic with shell script fallback for FIFO operations
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logSuccess, logError, logWarning } from '../../utils/logger.js';
import { commandExists, execShell } from '../../utils/shell.js';
import { copyDirSync, ensureDir, pathExists } from '../../utils/fs.js';
import {
  startSession,
  getStatus,
  getRelayDir,
  type SessionOptions as RelaySessionOptions,
} from '../../relay/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELAY_DIR = getRelayDir();

export interface PlayOptions {
  directory?: string;
  dangerouslySkipPermissions?: boolean;
}

export interface PlayLogsOptions {
  follow?: boolean;
}

/**
 * Get package root directory by finding package.json
 * More robust than relative paths - works regardless of build structure
 */
function getPackageRoot(): string {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // Fallback to relative path if package.json not found
  return path.resolve(__dirname, '../..');
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

  // 3. Install/update Memory Relay scripts (always update to ensure latest version)
  // This ensures the shell scripts for FIFO operations are available
  const installed = await installMemoryRelay();
  if (!installed) {
    process.exit(1);
  }

  // 4. Start session using TypeScript module
  const workDir = options.directory || process.cwd();

  logInfo('Starting Encore Mode session...');

  if (options.dangerouslySkipPermissions) {
    logWarning('Bypass mode enabled - Claude will skip all permission prompts');
  }

  // Use TypeScript startup module
  const sessionOptions: RelaySessionOptions = {
    workDir,
    bypass: options.dangerouslySkipPermissions ?? false,
  };

  try {
    await startSession(sessionOptions);
  } catch (error) {
    logError(`Failed to start session: ${error}`);
    process.exit(1);
  }
}

/**
 * Show Memory Relay status
 */
export async function playStatus(): Promise<void> {
  // Check if Memory Relay is installed
  if (!pathExists(RELAY_DIR)) {
    logWarning('Memory Relay not installed. Run: claude-symphony play');
    return;
  }

  // Use TypeScript module for status
  const status = getStatus();

  console.log('');
  console.log('Memory Relay Orchestrator Status');
  console.log('==================================');
  console.log(`Base: ${status.baseDir}`);
  console.log('');

  if (status.running) {
    logSuccess(`Status: Running (PID: ${status.pid})`);
  } else {
    logWarning('Status: Not running');
  }

  console.log('');
  console.log(`FIFO: ${status.fifoExists ? 'Exists' : 'Missing'}`);

  if (status.recentLogs && status.recentLogs.length > 0) {
    console.log('');
    console.log('Recent logs:');
    for (const line of status.recentLogs) {
      console.log(`  ${line}`);
    }
  }
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
  if (!pathExists(RELAY_DIR)) {
    logWarning('Memory Relay not installed.');
    return;
  }

  // Import and use stopOrchestrator from TypeScript module
  const { stopOrchestrator } = await import('../../relay/orchestrator.js');
  stopOrchestrator();
}
