/**
 * Context management
 * Manages token context state and compression
 */
import path from 'path';
import { ensureDirAsync, writeFile, readFile, pathExists } from '../../utils/fs.js';
import { loadYaml } from '../../utils/yaml.js';
import { getReadableTimestamp } from '../../utils/shell.js';
import type { ContextConfig } from '../../types/config.js';
import type { ContextState } from '../../types/state.js';
import type { StageId } from '../../types/stage.js';
// getStageName imported if needed for display

/**
 * Default context thresholds
 */
const DEFAULT_THRESHOLDS = {
  warning: 60,
  action: 50,
  critical: 40,
};

/**
 * Load context configuration
 */
export async function loadContextConfig(projectRoot: string): Promise<ContextConfig | null> {
  const configPath = path.join(projectRoot, 'config', 'context.yaml');
  return loadYaml<ContextConfig>(configPath);
}

/**
 * Get context thresholds
 */
export async function getContextThresholds(
  projectRoot: string
): Promise<{ warning: number; action: number; critical: number }> {
  const config = await loadContextConfig(projectRoot);
  return config?.thresholds ?? DEFAULT_THRESHOLDS;
}

/**
 * Estimate token count from text
 * Simple estimation: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Determine context level based on remaining percentage
 */
export function getContextLevel(
  remainingPercent: number,
  thresholds: { warning: number; action: number; critical: number }
): 'normal' | 'warning' | 'action' | 'critical' {
  if (remainingPercent <= thresholds.critical) return 'critical';
  if (remainingPercent <= thresholds.action) return 'action';
  if (remainingPercent <= thresholds.warning) return 'warning';
  return 'normal';
}

/**
 * Generate context state filename
 */
export function generateContextStateFilename(stageId: StageId): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `state_${timestamp}_${stageId}.md`;
}

/**
 * Get context state directory
 */
export function getContextStateDir(projectRoot: string): string {
  return path.join(projectRoot, 'state', 'context');
}

/**
 * Save context state to file
 */
export async function saveContextState(
  projectRoot: string,
  state: ContextState
): Promise<string | null> {
  try {
    const contextDir = getContextStateDir(projectRoot);
    await ensureDirAsync(contextDir);

    const filename = generateContextStateFilename(state.stageId as StageId);
    const filePath = path.join(contextDir, filename);

    const content = generateContextStateContent(state);
    await writeFile(filePath, content);

    return filePath;
  } catch (error) {
    console.error('Failed to save context state:', error);
    return null;
  }
}

/**
 * Generate context state markdown content
 */
function generateContextStateContent(state: ContextState): string {
  const timestamp = getReadableTimestamp();

  return `# Work State Save - ${timestamp}

## Context State
- Remaining context: ${state.remainingPercent}%
- Save trigger: ${state.saveTrigger}

## Current Stage
${state.stageId}: ${state.stageName}

## Progress
### Completed
${state.completedTasks.map(t => `- ${t}`).join('\n') || '- (none)'}

### In Progress
- ${state.currentTask || '(none)'}

### Pending
${state.pendingTasks.map(t => `- ${t}`).join('\n') || '- (none)'}

## Key Context
### Major Decisions
${state.majorDecisions.map(d => `- ${d}`).join('\n') || '- (none)'}

### Modified Files
${state.modifiedFiles.map(f => `- ${f}`).join('\n') || '- (none)'}

### Active Issues
${state.activeIssues.map(i => `- ${i}`).join('\n') || '- (none)'}

## Recovery Instructions
1. Read this file
2. Resume from: ${state.currentTask || 'the pending tasks'}
3. Key context above summarizes important state
`;
}

/**
 * Load latest context state
 */
export async function loadLatestContextState(
  projectRoot: string
): Promise<{ path: string; content: string } | null> {
  const contextDir = getContextStateDir(projectRoot);

  if (!pathExists(contextDir)) {
    return null;
  }

  const fs = await import('fs');
  const files = fs.readdirSync(contextDir)
    .filter(f => f.startsWith('state_') && f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  const latestFile = files[0]!;
  const filePath = path.join(contextDir, latestFile);
  const content = await readFile(filePath);

  if (!content) return null;

  return { path: filePath, content };
}

/**
 * Compress context by summarizing completed work
 */
export function compressContext(
  fullContext: string,
  strategy: 'summarize_completed' | 'externalize_code' | 'handoff_generation' = 'summarize_completed'
): string {
  switch (strategy) {
    case 'summarize_completed':
      // Replace detailed completed sections with summaries
      return fullContext
        .replace(/### Completed Tasks[\s\S]*?(?=###|$)/g, '### Completed Tasks\n- See previous context states for details\n\n')
        .replace(/```[\s\S]*?```/g, '[Code block externalized]');

    case 'externalize_code':
      // Replace code blocks with file references
      return fullContext.replace(/```[\s\S]*?```/g, '[Code externalized to file]');

    case 'handoff_generation':
      // Extract key information for handoff
      const lines = fullContext.split('\n');
      const keyLines = lines.filter(line =>
        line.startsWith('#') ||
        line.startsWith('- ') ||
        line.includes('Important') ||
        line.includes('Decision') ||
        line.includes('TODO') ||
        line.includes('FIXME')
      );
      return keyLines.join('\n');

    default:
      return fullContext;
  }
}

/**
 * Context check result
 */
export interface ContextCheckResult {
  level: 'normal' | 'warning' | 'action' | 'critical';
  remainingPercent: number;
  recommendedAction: string;
  shouldAutoSave: boolean;
}

/**
 * Check context status and get recommendations
 */
export async function checkContextStatus(
  projectRoot: string,
  remainingPercent: number
): Promise<ContextCheckResult> {
  const thresholds = await getContextThresholds(projectRoot);
  const level = getContextLevel(remainingPercent, thresholds);

  let recommendedAction = '';
  let shouldAutoSave = false;

  switch (level) {
    case 'critical':
      recommendedAction = 'Generate HANDOFF.md and run /clear immediately';
      shouldAutoSave = true;
      break;
    case 'action':
      recommendedAction = 'Run /compact and save state';
      shouldAutoSave = true;
      break;
    case 'warning':
      recommendedAction = 'Consider running /compact';
      shouldAutoSave = false;
      break;
    case 'normal':
      recommendedAction = 'Continue working';
      shouldAutoSave = false;
      break;
  }

  return {
    level,
    remainingPercent,
    recommendedAction,
    shouldAutoSave,
  };
}

/**
 * Context manager class
 */
export class ContextManager {
  private projectRoot: string;
  private taskCount = 0;
  private autoSaveInterval = 5;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Increment task count and check for auto-save
   */
  async incrementTaskCount(): Promise<boolean> {
    this.taskCount++;

    if (this.taskCount >= this.autoSaveInterval) {
      this.taskCount = 0;
      return true; // Should auto-save
    }

    return false;
  }

  /**
   * Check context status
   */
  async check(remainingPercent: number): Promise<ContextCheckResult> {
    return checkContextStatus(this.projectRoot, remainingPercent);
  }

  /**
   * Save current state
   */
  async saveState(state: ContextState): Promise<string | null> {
    return saveContextState(this.projectRoot, state);
  }

  /**
   * Load latest state
   */
  async loadLatestState(): Promise<{ path: string; content: string } | null> {
    return loadLatestContextState(this.projectRoot);
  }

  /**
   * Get thresholds
   */
  async getThresholds(): Promise<{ warning: number; action: number; critical: number }> {
    return getContextThresholds(this.projectRoot);
  }
}
