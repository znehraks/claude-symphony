/**
 * Terminal UI for pipeline progress display
 * Uses chalk for styling (already in deps)
 */
import chalk from 'chalk';
import { STAGE_NAMES } from '../../types/stage.js';
import type { StageId, StageStatus } from '../../types/stage.js';

/**
 * Stage display info
 */
interface StageDisplay {
  id: StageId;
  name: string;
  status: StageStatus;
  elapsed?: string;
}

/**
 * Pipeline display options
 */
interface PipelineDisplayOptions {
  projectName: string;
  stages: StageDisplay[];
  currentPersona?: string;
  progress: number;
}

/**
 * Get status icon for a stage
 */
function getStatusIcon(status: StageStatus, _isCurrent: boolean): string {
  switch (status) {
    case 'completed':
      return chalk.green('OK');
    case 'in_progress':
      return chalk.yellow('>>');
    case 'skipped':
      return chalk.gray('--');
    case 'pending':
    default:
      return chalk.dim('  ');
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: StageStatus, elapsed?: string): string {
  switch (status) {
    case 'completed':
      return chalk.green('Done') + (elapsed ? chalk.gray(` (${elapsed})`) : '');
    case 'in_progress':
      return chalk.yellow('Running...') + (elapsed ? chalk.gray(` (${elapsed} elapsed)`) : '');
    case 'skipped':
      return chalk.gray('Skipped');
    case 'pending':
    default:
      return chalk.dim('');
  }
}

/**
 * Render pipeline progress to terminal
 */
export function renderPipelineProgress(options: PipelineDisplayOptions): string {
  const { projectName, stages, currentPersona, progress } = options;
  const width = 60;

  const lines: string[] = [];

  // Header
  lines.push(chalk.cyan(`┌─ claude-symphony: ${projectName} ${'─'.repeat(Math.max(0, width - 22 - projectName.length))}┐`));
  lines.push(chalk.cyan('│') + ' '.repeat(width - 2) + chalk.cyan('│'));

  // Stage list
  for (const stage of stages) {
    const icon = getStatusIcon(stage.status, stage.status === 'in_progress');
    const label = getStatusLabel(stage.status, stage.elapsed);
    const stageNum = stage.id.slice(0, 2);
    const stageName = stage.name;
    const dots = '.'.repeat(Math.max(1, 30 - stageName.length));

    const line = `  ${icon} ${stageNum} ${stageName} ${chalk.dim(dots)} ${label}`;
    const rawLength = `  XX ${stageNum} ${stageName} ${dots} ${stage.status === 'completed' ? 'Done' : stage.status === 'in_progress' ? 'Running...' : ''}`.length;
    const padding = ' '.repeat(Math.max(0, width - 4 - rawLength));

    lines.push(chalk.cyan('│') + line + padding + chalk.cyan('│'));
  }

  // Separator
  lines.push(chalk.cyan('│') + ' '.repeat(width - 2) + chalk.cyan('│'));

  // Current persona
  if (currentPersona) {
    const personaLine = `  Current persona: ${currentPersona}`;
    lines.push(chalk.cyan('│') + chalk.dim(personaLine) + ' '.repeat(Math.max(0, width - 2 - personaLine.length)) + chalk.cyan('│'));
  }

  // Progress bar
  const barWidth = width - 16;
  const filled = Math.round((progress / 100) * barWidth);
  const bar = chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(barWidth - filled));
  const progressLine = `  ${bar} ${progress}%`;
  lines.push(chalk.cyan('│') + progressLine + ' '.repeat(Math.max(0, width - 2 - barWidth - 8)) + chalk.cyan('│'));

  // Footer
  lines.push(chalk.cyan(`└${'─'.repeat(width - 2)}┘`));

  return lines.join('\n');
}

/**
 * Print pipeline progress to stdout
 */
export function printPipelineProgress(options: PipelineDisplayOptions): void {
  console.log(renderPipelineProgress(options));
}

/**
 * Quick helper to display pipeline status from stage statuses
 */
export function displayPipelineStatus(
  projectName: string,
  stageStatuses: Array<{ id: StageId; status: StageStatus }>,
  currentPersona?: string
): void {
  const stages: StageDisplay[] = stageStatuses.map((s) => ({
    id: s.id,
    name: STAGE_NAMES[s.id],
    status: s.status,
  }));

  const completed = stageStatuses.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;
  const progress = Math.round((completed / stageStatuses.length) * 100);

  printPipelineProgress({
    projectName,
    stages,
    currentPersona,
    progress,
  });
}
