/**
 * Shell command execution utilities using execa
 * Replaces shell command execution from bash scripts
 */
import { execa, type Options as ExecaOptions } from 'execa';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: boolean;
  stdio?: 'pipe' | 'inherit' | 'ignore';
  input?: string;
}

/**
 * Execute a command and return the result
 */
export async function exec(
  command: string,
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> {
  try {
    const execaOptions: ExecaOptions = {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      timeout: options.timeout,
      shell: options.shell ?? false,
      stdio: options.stdio ?? 'pipe',
      reject: false,
      ...(options.input !== undefined && { input: options.input }),
    };

    const result = await execa(command, args, execaOptions);

    return {
      stdout: typeof result.stdout === 'string' ? result.stdout : '',
      stderr: typeof result.stderr === 'string' ? result.stderr : '',
      exitCode: result.exitCode ?? 0,
      success: result.exitCode === 0,
    };
  } catch (error) {
    const err = error as Error & { exitCode?: number; stderr?: string };
    return {
      stdout: '',
      stderr: err.message || err.stderr || 'Unknown error',
      exitCode: err.exitCode ?? 1,
      success: false,
    };
  }
}

/**
 * Execute a shell command string
 */
export async function execShell(
  command: string,
  options: CommandOptions = {}
): Promise<CommandResult> {
  return exec(command, [], { ...options, shell: true });
}

/**
 * Check if a command exists in PATH
 */
export async function commandExists(cmd: string): Promise<boolean> {
  const result = await exec('which', [cmd]);
  return result.success;
}

/**
 * Get current timestamp in ISO format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get readable timestamp
 */
export function getReadableTimestamp(): string {
  return new Date()
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(',', '');
}
