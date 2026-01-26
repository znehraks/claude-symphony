/**
 * Codex CLI wrapper
 * tmux-based Codex CLI wrapper with channel-based synchronization
 * Migrated from codex-wrapper.sh
 */
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { commandExists, exec } from '../utils/shell.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import {
  getTmuxPath,
  sessionExists,
  createSession,
  sendKeys,
  waitForChannel,
} from './tmux/utils.js';

/**
 * Fallback signal types
 */
export type FallbackSignal =
  | 'CLI_NOT_FOUND'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'OUTPUT_FAILED';

/**
 * Codex call result
 */
export interface CodexResult {
  success: boolean;
  output?: string;
  fallbackRequired: boolean;
  fallbackSignal?: FallbackSignal;
  fallbackReason?: string;
}

/**
 * Codex wrapper options
 */
export interface CodexOptions {
  timeout?: number; // seconds, default 300
  sessionName?: string;
  fullAuto?: boolean; // default true
}

const DEFAULT_SESSION = 'ax-codex';
const DEFAULT_TIMEOUT = 300;

/**
 * Check if Codex CLI is available
 */
export async function isCodexAvailable(): Promise<boolean> {
  return commandExists('codex');
}

/**
 * Call Codex CLI via tmux
 */
export async function callCodex(
  prompt: string,
  options: CodexOptions = {}
): Promise<CodexResult> {
  const sessionName = options.sessionName ?? DEFAULT_SESSION;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const fullAuto = options.fullAuto ?? true;
  const channel = `${sessionName}-done-${process.pid}`;
  const outputFile = join(tmpdir(), `${sessionName}-output-${process.pid}`);

  // Check tmux availability
  const tmuxPath = await getTmuxPath();
  if (!tmuxPath) {
    logError('tmux is not installed.');
    console.log('Install: brew install tmux (macOS) or apt install tmux (Ubuntu)');
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'CLI_NOT_FOUND',
      fallbackReason: 'tmux not installed',
    };
  }

  // Check Codex CLI availability
  if (!(await isCodexAvailable())) {
    logWarning('codex CLI is not installed.');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logWarning('FALLBACK REQUIRED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Primary AI: codex');
    console.log('  Fallback AI: claudecode');
    console.log('  Reason: CLI not installed');
    console.log('\nPrompt to execute with ClaudeCode:');
    console.log('---');
    console.log(prompt);
    console.log('---\n');

    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'CLI_NOT_FOUND',
      fallbackReason: 'Codex CLI not installed',
    };
  }

  // Cleanup handler
  const cleanup = () => {
    if (existsSync(outputFile)) {
      try {
        unlinkSync(outputFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  };

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logInfo('Codex CLI Call');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Session: ${sessionName}`);
    console.log(`  Timeout: ${timeout}s`);
    console.log(`  Full Auto: ${fullAuto}\n`);

    // Ensure tmux session exists
    if (!(await sessionExists(sessionName))) {
      logWarning(`Creating new tmux session: ${sessionName}`);
      await createSession(sessionName);
      // Give session time to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Escape prompt for shell
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/'/g, "'\\''");

    // Execute Codex CLI (with --full-auto by default)
    logInfo(`Calling Codex...${fullAuto ? ' (--full-auto mode)' : ''}`);
    const codexCmd = fullAuto ? 'codex --full-auto' : 'codex';
    const command = `${codexCmd} "${escapedPrompt}" 2>&1 | tee ${outputFile}; tmux wait-for -S ${channel}`;
    await sendKeys(sessionName, command);

    // Set up timeout
    const timeoutPromise = new Promise<void>(resolve => {
      setTimeout(async () => {
        // Signal channel on timeout
        await exec('tmux', ['wait-for', '-S', channel]).catch(() => {});
        resolve();
      }, timeout * 1000);
    });

    // Wait for completion or timeout
    await Promise.race([
      waitForChannel(channel),
      timeoutPromise,
    ]);

    // Read output
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Codex Response:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!existsSync(outputFile)) {
      logError('Failed to capture output.');
      cleanup();
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'OUTPUT_FAILED',
        fallbackReason: 'Output capture failed',
      };
    }

    const output = readFileSync(outputFile, 'utf-8');

    // Check for empty output (timeout)
    if (!output.trim()) {
      logError('Empty response received (possible timeout).');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logWarning('FALLBACK REQUIRED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Primary AI: codex');
      console.log('  Fallback AI: claudecode');
      console.log('  Reason: API timeout or empty response');
      cleanup();
      return {
        success: false,
        fallbackRequired: true,
        fallbackSignal: 'TIMEOUT',
        fallbackReason: 'API timeout or empty response',
      };
    }

    // Check for error patterns
    const errorPatterns = /error|failed|rate.limit|quota/i;
    if (errorPatterns.test(output)) {
      console.log(output);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logWarning('FALLBACK RECOMMENDED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Primary AI: codex');
      console.log('  Fallback AI: claudecode');
      console.log('  Reason: API error detected in response');
      cleanup();
      return {
        success: false,
        output,
        fallbackRequired: true,
        fallbackSignal: 'API_ERROR',
        fallbackReason: 'API error detected in response',
      };
    }

    // Success
    console.log(output);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Codex call completed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    cleanup();
    return {
      success: true,
      output,
      fallbackRequired: false,
    };
  } catch (error) {
    cleanup();
    logError(`Codex call failed: ${error}`);
    return {
      success: false,
      fallbackRequired: true,
      fallbackSignal: 'API_ERROR',
      fallbackReason: String(error),
    };
  }
}
