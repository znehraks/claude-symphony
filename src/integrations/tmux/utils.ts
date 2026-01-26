/**
 * tmux utilities following oh-my-opencode pattern
 * Uses execa for shell command execution
 */
import { execa } from 'execa';

let tmuxPath: string | null = null;

/**
 * Get the path to the tmux executable
 */
export async function getTmuxPath(): Promise<string | null> {
  if (tmuxPath !== null) return tmuxPath;

  try {
    const { stdout } = await execa('which', ['tmux']);
    tmuxPath = stdout.trim();
    return tmuxPath;
  } catch {
    tmuxPath = '';
    return null;
  }
}

/**
 * Check if we're running inside a tmux session
 */
export function isInsideTmux(): boolean {
  return !!process.env.TMUX;
}

/**
 * Get the current tmux pane ID
 */
export function getCurrentPaneId(): string | undefined {
  return process.env.TMUX_PANE;
}

/**
 * Get the current tmux session name
 */
export async function getCurrentSessionName(): Promise<string | null> {
  const tmux = await getTmuxPath();
  if (!tmux || !isInsideTmux()) return null;

  try {
    const { stdout } = await execa(tmux, ['display-message', '-p', '#S']);
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Check if a tmux session exists
 */
export async function sessionExists(sessionName: string): Promise<boolean> {
  const tmux = await getTmuxPath();
  if (!tmux) return false;

  try {
    await execa(tmux, ['has-session', '-t', sessionName]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a new tmux session
 */
export async function createSession(
  sessionName: string,
  options: {
    command?: string;
    detached?: boolean;
    windowName?: string;
  } = {}
): Promise<boolean> {
  const tmux = await getTmuxPath();
  if (!tmux) return false;

  try {
    const args = ['new-session'];

    if (options.detached !== false) {
      args.push('-d');
    }

    args.push('-s', sessionName);

    if (options.windowName) {
      args.push('-n', options.windowName);
    }

    if (options.command) {
      args.push(options.command);
    }

    await execa(tmux, args);
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill a tmux session
 */
export async function killSession(sessionName: string): Promise<boolean> {
  const tmux = await getTmuxPath();
  if (!tmux) return false;

  try {
    await execa(tmux, ['kill-session', '-t', sessionName]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Send keys to a tmux pane/session
 */
export async function sendKeys(
  target: string,
  keys: string,
  options: { enter?: boolean } = {}
): Promise<boolean> {
  const tmux = await getTmuxPath();
  if (!tmux) return false;

  try {
    const args = ['send-keys', '-t', target, keys];
    if (options.enter !== false) {
      args.push('Enter');
    }
    await execa(tmux, args);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get output from a tmux pane
 */
export async function capturePane(
  target: string,
  options: { start?: number; end?: number } = {}
): Promise<string | null> {
  const tmux = await getTmuxPath();
  if (!tmux) return null;

  try {
    const args = ['capture-pane', '-t', target, '-p'];
    if (options.start !== undefined) {
      args.push('-S', String(options.start));
    }
    if (options.end !== undefined) {
      args.push('-E', String(options.end));
    }
    const { stdout } = await execa(tmux, args);
    return stdout;
  } catch {
    return null;
  }
}

/**
 * Wait for a tmux channel signal
 * This blocks until another process signals the channel
 */
export async function waitForChannel(channel: string): Promise<boolean> {
  const tmux = await getTmuxPath();
  if (!tmux) return false;

  try {
    await execa(tmux, ['wait-for', channel]);
    return true;
  } catch {
    return false;
  }
}
