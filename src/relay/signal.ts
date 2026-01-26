/**
 * Signal functions for Memory Relay
 * Used by Claude sessions to signal relay readiness
 */
import fs from 'fs';
import { getConfig } from './config.js';
import { isFifo, writeToFifo } from './fifo.js';
import chalk from 'chalk';

/**
 * Signal to the orchestrator that a relay is ready
 * This is called when Claude's context is running low
 *
 * @param handoffPath - Path to the handoff file
 * @returns true if signal was sent successfully
 */
export async function signalRelayReady(handoffPath: string): Promise<boolean> {
  const config = getConfig();
  const paneId = process.env.TMUX_PANE ?? 'unknown';

  // Validate handoff file exists
  if (!fs.existsSync(handoffPath)) {
    console.log(chalk.yellow('[Symphony Relay]'), `Handoff file not found: ${handoffPath}`);
    logToFile('ERROR', `Handoff file not found: ${handoffPath}`);
    return false;
  }

  // Validate FIFO exists
  if (!isFifo(config.fifoPath)) {
    console.log(chalk.yellow('[Symphony Relay]'), 'Orchestrator not running (FIFO missing)');
    logToFile('ERROR', `FIFO not found at ${config.fifoPath}`);
    return false;
  }

  console.log(chalk.blue('[Symphony Relay]'), 'Signaling relay ready...');
  console.log('  Handoff:', handoffPath);
  console.log('  Pane:', paneId);

  logToFile('INFO', 'Sending RELAY_READY signal');
  logToFile('INFO', `  Handoff: ${handoffPath}`);
  logToFile('INFO', `  Pane: ${paneId}`);

  // Build and send signal
  const signal = `RELAY_READY:${handoffPath}:${paneId}`;
  const sent = writeToFifo(signal);

  if (sent) {
    console.log(chalk.green('[Symphony Relay]'), 'Signal sent. Waiting for ACK...');
    logToFile('INFO', 'Signal sent, awaiting ACK');

    // Wait for acknowledgment (30 seconds timeout)
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log(chalk.green('[Symphony Relay]'), 'Relay initiated. New session should be starting.');
    console.log(chalk.yellow('[Symphony Relay]'), 'You may now safely exit this session.');
    logToFile('INFO', 'Relay handoff complete');

    return true;
  }

  logToFile('ERROR', 'Failed to send signal');
  return false;
}

/**
 * Check if the relay orchestrator is available
 */
export function isOrchestratorAvailable(): boolean {
  const config = getConfig();
  return isFifo(config.fifoPath);
}

/**
 * Get the current pane ID from tmux environment
 */
export function getCurrentPaneId(): string | undefined {
  return process.env.TMUX_PANE;
}

/**
 * Check if running inside a tmux session
 */
export function isInsideTmux(): boolean {
  return !!process.env.TMUX;
}

/**
 * Log to the relay log file
 */
function logToFile(level: string, message: string): void {
  const config = getConfig();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const logLine = `[${timestamp}] [WRAPPER] [${level}] ${message}\n`;
    fs.appendFileSync(config.relayLogFile, logLine);
  } catch {
    // Ignore logging errors
  }
}
