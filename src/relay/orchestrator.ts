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
import { getConfig, getRelayDir } from './config.js';
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
  log('INFO', 'Orchestrator shutting down...');

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
 * Send ACK back to Claude session via tmux
 */
function sendAck(sourcePane: string, newPane: string): boolean {
  const ackMessage = `RELAY_ACK:${newPane}`;
  log('INFO', `Sending ACK to pane ${sourcePane}: ${ackMessage}`);

  try {
    execSync(`tmux send-keys -t "${sourcePane}" "# ${ackMessage}" Enter`, { stdio: 'pipe' });
    log('INFO', 'ACK sent successfully');
    return true;
  } catch {
    log('WARN', `Failed to send ACK to pane ${sourcePane}`);
    return false;
  }
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
 */
function handleRelaySignal(signal: RelaySignal): void {
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

  const workDir = path.dirname(signal.handoffPath);
  log('INFO', 'Creating new tmux pane for Claude session');

  try {
    // Create new pane with Claude wrapper
    const relayDir = getRelayDir();
    const wrapperScript = path.join(relayDir, 'orchestrator/claude-wrapper.sh');

    const result = execSync(
      `tmux split-window -h -P -F "#{pane_id}" -c "${workDir}" "${wrapperScript} '${signal.handoffPath}'"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );

    const newPane = result.trim();

    if (newPane) {
      log('INFO', `New pane created: ${newPane}`);

      // Wait for pane to initialize
      execSync('sleep 2', { stdio: 'pipe' });

      // Verify pane exists
      try {
        const panes = execSync('tmux list-panes -F "#{pane_id}"', { encoding: 'utf8', stdio: 'pipe' });
        if (panes.includes(newPane)) {
          log('INFO', 'New Claude session started successfully');
          sendAck(signal.paneId, newPane);
          archiveHandoff(signal.handoffPath);
        } else {
          log('ERROR', `New pane ${newPane} not found after creation`);
        }
      } catch {
        log('ERROR', 'Failed to verify new pane');
      }
    } else {
      log('ERROR', 'Failed to create new pane: empty result');
    }
  } catch (error) {
    log('ERROR', `Failed to create new pane: ${error}`);
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
      handleRelaySignal(signal);
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
    log('WARN', `Orchestrator already running (PID: ${status.pid})`);
    console.log('Orchestrator is already running');
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

  log('INFO', `Orchestrator starting (PID: ${process.pid})`);

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
    console.log('Orchestrator not running');
    return;
  }

  try {
    const pid = parseInt(fs.readFileSync(config.pidFile, 'utf8').trim(), 10);

    // Check if process is alive
    try {
      process.kill(pid, 0);
      log('INFO', `Stopping orchestrator (PID: ${pid})`);
      process.kill(pid, 'SIGTERM');
      fs.unlinkSync(config.pidFile);
      console.log('Orchestrator stopped');
    } catch {
      console.log('Orchestrator not running (stale PID)');
      fs.unlinkSync(config.pidFile);
    }
  } catch {
    console.log('Orchestrator not running');
  }
}

/**
 * Show orchestrator status
 */
function showStatus(): void {
  const config = getConfig();

  console.log(chalk.blue('Memory Relay Orchestrator Status'));
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
