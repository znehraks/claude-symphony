/**
 * Memory Relay Startup
 * Replaces tmux-startup.sh
 *
 * Creates a tmux session with Claude and the relay orchestrator
 */
import { execSync, spawnSync } from 'child_process';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { getConfig, SESSION_NAME, getRelayDir } from './config.js';
import { commandExists } from '../utils/shell.js';
import { pathExists } from '../utils/fs.js';
import type { SessionOptions, SessionChoice } from './types.js';
import path from 'path';

/**
 * Check if required dependencies are installed
 */
export async function checkDependencies(): Promise<{ tmux: boolean; claude: boolean }> {
  const [tmux, claude] = await Promise.all([commandExists('tmux'), commandExists('claude')]);

  return { tmux, claude };
}

/**
 * Check if a tmux session exists
 */
export function sessionExists(sessionName: string = SESSION_NAME): boolean {
  try {
    execSync(`tmux has-session -t "${sessionName}" 2>/dev/null`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Handle existing session with user prompt
 */
export async function handleExistingSession(sessionName: string = SESSION_NAME): Promise<SessionChoice> {
  console.log(chalk.yellow(`Session '${sessionName}' already exists.`));
  console.log('');

  const choice = await select<SessionChoice>({
    message: 'What would you like to do?',
    choices: [
      { name: 'Attach to existing session', value: 'attach' },
      { name: 'Kill and recreate', value: 'recreate' },
      { name: 'Cancel', value: 'cancel' },
    ],
  });

  return choice;
}

/**
 * Kill an existing tmux session
 */
export function killSession(sessionName: string = SESSION_NAME): void {
  try {
    execSync(`tmux kill-session -t "${sessionName}"`, { stdio: 'pipe' });
  } catch {
    // Session might already be dead
  }
}

/**
 * Attach to an existing tmux session
 */
export function attachSession(sessionName: string = SESSION_NAME): void {
  console.log('Attaching to existing session...');
  spawnSync('tmux', ['attach-session', '-t', sessionName], { stdio: 'inherit' });
}

/**
 * Create a new tmux session with orchestrator and Claude panes
 */
export function createTmuxSession(options: SessionOptions): boolean {
  const sessionName = SESSION_NAME;

  try {
    // Create new tmux session (detached, with specific dimensions)
    execSync(
      `tmux new-session -d -s "${sessionName}" -c "${options.workDir}" -x 200 -y 50`,
      { stdio: 'pipe' }
    );

    // Rename the window
    execSync(`tmux rename-window -t "${sessionName}:0" "symphony"`, { stdio: 'pipe' });

    // Split 50/50 - orchestrator on left, Claude on right
    // -b flag creates new pane to the LEFT of current pane
    // -p 50 for 50% split
    execSync(
      `tmux split-window -h -b -t "${sessionName}:0" -p 50 -c "${options.workDir}"`,
      { stdio: 'pipe' }
    );

    // After -b split:
    // Pane 0: New pane (left) - Orchestrator
    // Pane 1: Original pane (right) - Claude

    // Start orchestrator in pane 0 (left side)
    const orchestratorCmd = buildOrchestratorCommand();
    execSync(`tmux send-keys -t "${sessionName}:0.0" '${orchestratorCmd}' Enter`, { stdio: 'pipe' });

    // Wait for orchestrator to initialize
    execSync('sleep 1', { stdio: 'pipe' });

    // Start Claude wrapper in pane 1 (right side)
    const wrapperCmd = buildWrapperCommand(options);
    execSync(`tmux send-keys -t "${sessionName}:0.1" '${wrapperCmd}' Enter`, { stdio: 'pipe' });

    // Select the Claude pane as active (right side)
    execSync(`tmux select-pane -t "${sessionName}:0.1"`, { stdio: 'pipe' });

    // Set up pane titles for clarity
    execSync(`tmux select-pane -t "${sessionName}:0.0" -T "Orchestrator"`, { stdio: 'pipe' });
    execSync(`tmux select-pane -t "${sessionName}:0.1" -T "Claude"`, { stdio: 'pipe' });

    // Enable pane titles display
    execSync(`tmux set-option -t "${sessionName}" pane-border-status top`, { stdio: 'pipe' });
    execSync(`tmux set-option -t "${sessionName}" pane-border-format " #{pane_title} "`, { stdio: 'pipe' });

    return true;
  } catch (error) {
    console.error(chalk.red('Failed to create tmux session:'), error);
    return false;
  }
}

/**
 * Build the orchestrator start command
 * Uses the shell script for now (FIFO reading requires bash)
 * Note: Returns unquoted path - caller wraps in single quotes for tmux send-keys
 */
function buildOrchestratorCommand(): string {
  const relayDir = getRelayDir();
  const orchestratorScript = path.join(relayDir, 'orchestrator/orchestrator.sh');

  // Return unquoted path - the tmux send-keys command will wrap it in single quotes
  return `${orchestratorScript} start`;
}

/**
 * Build the wrapper command for starting Claude
 * Note: Returns unquoted path - caller wraps in single quotes for tmux send-keys
 */
function buildWrapperCommand(options: SessionOptions): string {
  const relayDir = getRelayDir();
  const wrapperScript = path.join(relayDir, 'orchestrator/claude-wrapper.sh');

  // Check if the shell script exists
  if (pathExists(wrapperScript)) {
    const bypassArg = options.bypass ? ' --bypass' : '';
    // Use single quotes for handoff path to avoid nested quote issues
    const handoffArg = options.handoffFile ? ` '${options.handoffFile}'` : '';
    // Return unquoted path - the tmux send-keys command will wrap it in single quotes
    return `${wrapperScript}${bypassArg}${handoffArg}`;
  }

  // Direct claude command as fallback
  let cmd = 'claude';
  if (options.bypass) {
    cmd += ' --dangerously-skip-permissions';
  }
  if (options.handoffFile) {
    cmd += ` --resume '${options.handoffFile}'`;
  }
  return cmd;
}

/**
 * Show session layout information
 */
function showSessionLayout(): void {
  console.log('');
  console.log('Layout:');
  console.log('+--------------+------------------------+');
  console.log('|              |                        |');
  console.log('| Orchestrator |      Claude (50%)      |');
  console.log('|    (50%)     |                        |');
  console.log('|              |                        |');
  console.log('+--------------+------------------------+');
  console.log('');
}

/**
 * Main startup function
 * Entry point for starting a Memory Relay session
 */
export async function startSession(options: SessionOptions): Promise<void> {
  const config = getConfig();

  // Show header
  console.log(chalk.cyan('Claude Symphony - Memory Relay Session'));
  console.log('=======================================');
  console.log('');

  // Check dependencies
  const deps = await checkDependencies();

  if (!deps.tmux) {
    console.error(chalk.red('Error: tmux is not installed'));
    console.log('Install with: brew install tmux (macOS) or apt install tmux (Linux)');
    process.exit(1);
  }

  if (!deps.claude) {
    console.error(chalk.red('Error: claude CLI is not installed'));
    console.log('Please install Claude Code CLI first');
    process.exit(1);
  }

  // Handle existing session
  if (sessionExists()) {
    const choice = await handleExistingSession();

    switch (choice) {
      case 'attach':
        attachSession();
        return;
      case 'recreate':
        console.log('Killing existing session...');
        killSession();
        break;
      case 'cancel':
        console.log('Cancelled.');
        process.exit(0);
    }
  }

  // Create new session
  console.log('');
  console.log(`Creating new session: ${chalk.green(SESSION_NAME)}`);
  console.log(`Working directory: ${chalk.blue(options.workDir)}`);
  console.log(`Relay base: ${chalk.blue(config.baseDir)}`);
  console.log('');

  const created = createTmuxSession(options);

  if (!created) {
    console.error(chalk.red('Failed to create session'));
    process.exit(1);
  }

  console.log(chalk.green('Session created successfully!'));
  showSessionLayout();

  console.log(`Attaching to session ${chalk.green(SESSION_NAME)}...`);

  // Attach to the session
  attachSession();
}
