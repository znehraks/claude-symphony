/**
 * Memory Relay Orchestrator
 * Replaces orchestrator.sh
 *
 * Listens for relay signals via FIFO and manages Claude session handoffs
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { getConfig } from './config.js';
import { createFifo, isFifo, startFifoReader } from './fifo.js';
import { ensureDir } from '../utils/fs.js';
import type { RelaySignal, OrchestratorCommand, OrchestratorStatus, LogLevel } from './types.js';

let cleanupFn: (() => void) | null = null;

/**
 * Log to console and file
 */
function log(level: LogLevel, message: string): void {
  const config = getConfig();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Ensure log directory exists
  ensureDir(config.logDir);

  // Write to log file
  try {
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(config.logFile, logLine);
  } catch {
    // Ignore logging errors
  }

  // Console output with colors
  switch (level) {
    case 'INFO':
      console.log(chalk.green('[INFO]'), message);
      break;
    case 'WARN':
      console.log(chalk.yellow('[WARN]'), message);
      break;
    case 'ERROR':
      console.log(chalk.red('[ERROR]'), message);
      break;
    case 'DEBUG':
      console.log(chalk.blue('[DEBUG]'), message);
      break;
  }
}

/**
 * Cleanup function for graceful shutdown
 */
function cleanup(): void {
  log('INFO', 'Context Manager shutting down...');

  const config = getConfig();

  // Remove PID file
  try {
    if (fs.existsSync(config.pidFile)) {
      fs.unlinkSync(config.pidFile);
    }
  } catch {
    // Ignore cleanup errors
  }

  // Stop FIFO reader if running
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
}

/**
 * Check if orchestrator is already running
 */
function checkRunning(): { running: boolean; pid?: number } {
  const config = getConfig();

  if (fs.existsSync(config.pidFile)) {
    try {
      const pid = parseInt(fs.readFileSync(config.pidFile, 'utf8').trim(), 10);

      // Check if process is alive
      try {
        process.kill(pid, 0);
        return { running: true, pid };
      } catch {
        // Process not running, remove stale PID file
        log('INFO', 'Removing stale PID file');
        fs.unlinkSync(config.pidFile);
      }
    } catch {
      // Invalid PID file
    }
  }

  return { running: false };
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for shell prompt to be ready (after terminating Claude session)
 */
async function waitForShellReady(paneId: string, timeout: number): Promise<void> {
  const startTime = Date.now();

  log('INFO', `Waiting for shell prompt in pane ${paneId} (timeout: ${timeout}ms)`);

  while (Date.now() - startTime < timeout) {
    try {
      // Capture last few lines of pane output
      const output = execSync(
        `tmux capture-pane -t "${paneId}" -p -S -3`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      // Check for shell prompt ready state ($ or % at end of line)
      const trimmed = output.trim();
      const lastLine = trimmed.split('\n').pop() || '';

      // Look for shell prompt indicators
      if (/[$%#>]\s*$/.test(lastLine) || lastLine === '') {
        await sleep(300); // Small stabilization delay
        log('INFO', 'Shell prompt is ready');
        return;
      }
    } catch {
      // Ignore capture errors, retry
    }

    await sleep(300);
  }

  throw new Error(`Timeout waiting for shell prompt after ${timeout}ms`);
}

/**
 * Terminate current Claude session in pane
 */
async function terminateClaudeSession(paneId: string): Promise<void> {
  log('INFO', `Terminating Claude session in pane ${paneId}`);

  try {
    // Send Ctrl+C to interrupt current Claude process
    execSync(`tmux send-keys -t "${paneId}" C-c`, { stdio: 'pipe' });
    await sleep(500);

    // Send another Ctrl+C in case of confirmation prompt
    execSync(`tmux send-keys -t "${paneId}" C-c`, { stdio: 'pipe' });
    await sleep(300);

    log('INFO', 'Claude session terminated');
  } catch (error) {
    log('WARN', `Error during session termination (may be normal): ${error}`);
  }
}

/**
 * Start new Claude session with handoff prompt
 */
function startNewClaudeSession(paneId: string, handoffPath: string): void {
  const prompt = buildContinuationPrompt(handoffPath);

  // Escape special characters for shell command
  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  // Build the claude command with --continue flag for conversation continuity
  // Using -p (print mode with --continue) for non-interactive handoff
  const claudeCommand = `claude -p --continue '${escapedPrompt}'`;

  log('INFO', `Starting new Claude session in pane ${paneId}`);
  log('DEBUG', `Command: ${claudeCommand}`);

  try {
    execSync(`tmux send-keys -t "${paneId}" "${claudeCommand}" Enter`, { stdio: 'pipe' });
    log('INFO', 'New Claude session started with handoff prompt');
  } catch (error) {
    log('ERROR', `Failed to start new Claude session: ${error}`);
    throw error;
  }
}

/**
 * Build continuation prompt for handoff
 */
function buildContinuationPrompt(handoffPath: string): string {
  return `${handoffPath} 파일을 읽고 이어서 작업을 진행해주세요.`;
}

/**
 * Archive a handoff file
 */
function archiveHandoff(handoffPath: string): void {
  const config = getConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15);
  const archiveName = `handoff_${timestamp}.md`;

  ensureDir(config.handoffsDir);

  try {
    fs.copyFileSync(handoffPath, path.join(config.handoffsDir, archiveName));
    log('INFO', `Handoff archived to ${config.handoffsDir}/${archiveName}`);
  } catch (error) {
    log('WARN', `Failed to archive handoff: ${error}`);
  }
}

/**
 * Handle a relay signal
 *
 * NOTE: Due to Claude Code's Ink library limitation, programmatic input via
 * tmux send-keys cannot trigger command submission (Enter is treated as newline).
 * See: https://github.com/anthropics/claude-code/issues/15553
 *
 * Solution: Instead of injecting /clear, we terminate the current Claude session
 * and start a new `claude -p --continue` process with the handoff prompt.
 */
async function handleRelaySignal(signal: RelaySignal): Promise<void> {
  log('INFO', `Received signal: ${signal.type}`);

  if (signal.type !== 'RELAY_READY') {
    log('WARN', `Unknown signal type: ${signal.type}`);
    return;
  }

  log('INFO', 'Processing relay request');
  log('INFO', `  Handoff path: ${signal.handoffPath}`);
  log('INFO', `  Source pane: ${signal.paneId}`);

  // Validate handoff file exists
  if (!fs.existsSync(signal.handoffPath)) {
    log('ERROR', `Handoff file not found: ${signal.handoffPath}`);
    return;
  }

  const { handoffPath, paneId } = signal;

  try {
    // Step 1: Terminate current Claude session (Ctrl+C)
    await terminateClaudeSession(paneId);

    // Step 2: Wait for shell prompt to be ready
    await waitForShellReady(paneId, 10000); // 10 second timeout

    // Step 3: Start new Claude session with handoff prompt
    startNewClaudeSession(paneId, handoffPath);

    log('INFO', 'Session handoff complete via new claude process');

    // Archive the handoff file
    archiveHandoff(handoffPath);
  } catch (error) {
    log('ERROR', `Session handoff failed: ${error}`);
  }
}

/**
 * Main orchestrator loop
 */
function mainLoop(): void {
  const config = getConfig();

  log('INFO', 'Orchestrator main loop started');
  log('INFO', `Listening on FIFO: ${config.fifoPath}`);

  // Start FIFO reader
  cleanupFn = startFifoReader(
    config.fifoPath,
    (signal) => {
      // Handle async signal processing
      handleRelaySignal(signal).catch((error) => {
        log('ERROR', `Failed to handle relay signal: ${error}`);
      });
    },
    (error) => {
      log('ERROR', `FIFO reader error: ${error.message}`);
    }
  );
}

/**
 * Start the orchestrator
 */
function startOrchestrator(): void {
  const config = getConfig();

  // Check if already running
  const status = checkRunning();
  if (status.running) {
    log('WARN', `Context Manager already running (PID: ${status.pid})`);
    console.log('Context Manager is already running');
    process.exit(1);
  }

  // Ensure directories exist
  ensureDir(config.signalsDir);
  ensureDir(config.logDir);

  // Create FIFO
  if (!createFifo()) {
    log('ERROR', 'Failed to create FIFO');
    process.exit(1);
  }

  // Write PID file
  fs.writeFileSync(config.pidFile, String(process.pid));

  log('INFO', `Context Manager starting (PID: ${process.pid})`);

  // Set up signal handlers
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);

  // Start main loop
  mainLoop();

  // Keep process running
  process.stdin.resume();
}

/**
 * Stop the orchestrator
 */
function stopOrchestrator(): void {
  const config = getConfig();

  if (!fs.existsSync(config.pidFile)) {
    console.log('Context Manager not running');
    return;
  }

  try {
    const pid = parseInt(fs.readFileSync(config.pidFile, 'utf8').trim(), 10);

    // Check if process is alive
    try {
      process.kill(pid, 0);
      log('INFO', `Stopping Context Manager (PID: ${pid})`);
      process.kill(pid, 'SIGTERM');
      fs.unlinkSync(config.pidFile);
      console.log('Context Manager stopped');
    } catch {
      console.log('Context Manager not running (stale PID)');
      fs.unlinkSync(config.pidFile);
    }
  } catch {
    console.log('Context Manager not running');
  }
}

/**
 * Show orchestrator status
 */
function showStatus(): void {
  const config = getConfig();

  console.log(chalk.blue('Memory Relay Context Manager Status'));
  console.log('==================================');
  console.log(`Base: ${config.baseDir}`);
  console.log('');

  const status = checkRunning();

  if (status.running) {
    console.log(`Status: ${chalk.green('Running')} (PID: ${status.pid})`);
  } else if (fs.existsSync(config.pidFile)) {
    console.log(`Status: ${chalk.red('Stopped')} (stale PID file)`);
  } else {
    console.log(`Status: ${chalk.yellow('Not running')}`);
  }

  console.log('');
  console.log(`FIFO Path: ${config.fifoPath}`);
  console.log(`FIFO: ${isFifo(config.fifoPath) ? chalk.green('Exists') : chalk.red('Missing')}`);

  console.log('');
  console.log('Recent logs:');

  if (fs.existsSync(config.logFile)) {
    try {
      const content = fs.readFileSync(config.logFile, 'utf8');
      const lines = content.trim().split('\n').slice(-5);
      for (const line of lines) {
        console.log(`  ${line}`);
      }
    } catch {
      console.log('  (no logs)');
    }
  } else {
    console.log('  (no logs)');
  }
}

/**
 * Get orchestrator status programmatically
 */
export function getStatus(): OrchestratorStatus {
  const config = getConfig();
  const runStatus = checkRunning();

  const status: OrchestratorStatus = {
    running: runStatus.running,
    pid: runStatus.pid,
    fifoExists: isFifo(config.fifoPath),
    baseDir: config.baseDir,
  };

  // Get recent logs
  if (fs.existsSync(config.logFile)) {
    try {
      const content = fs.readFileSync(config.logFile, 'utf8');
      status.recentLogs = content.trim().split('\n').slice(-5);
    } catch {
      // Ignore
    }
  }

  return status;
}

/**
 * Main orchestrator entry point
 * Called when orchestrator.ts is run directly
 */
export function runOrchestrator(command: OrchestratorCommand = 'start'): void {
  switch (command) {
    case 'start':
      startOrchestrator();
      break;
    case 'stop':
      stopOrchestrator();
      break;
    case 'status':
      showStatus();
      break;
    case 'restart':
      stopOrchestrator();
      setTimeout(() => startOrchestrator(), 1000);
      break;
    default:
      console.log('Usage: orchestrator {start|stop|status|restart}');
      process.exit(1);
  }
}

// Export functions for external use
export { startOrchestrator, stopOrchestrator, showStatus };
