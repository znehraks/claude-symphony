/**
 * Session Start hook logic
 * Session start auto-recovery
 * Migrated from .claude/hooks/session-start.sh
 */
import path from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { readJson, writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess } from '../utils/logger.js';
import type { StageId } from '../types/stage.js';
import type { Progress } from '../types/state.js';

/**
 * Context trigger state
 */
interface ContextTrigger {
  triggered?: boolean;
  compact_scheduled?: boolean;
  remaining?: number;
  level?: 'warning' | 'critical';
  timestamp?: string;
  recovered?: boolean;
  recovery_time?: string;
}

/**
 * Session recovery result
 */
export interface SessionRecoveryResult {
  needsRecovery: boolean;
  snapshotFile?: string;
  currentStage?: StageId;
  timestamp?: string;
  context?: string;
}

/**
 * Find latest snapshot in context directory
 */
function findLatestSnapshot(contextDir: string): string | null {
  if (!existsSync(contextDir)) {
    return null;
  }

  const files = readdirSync(contextDir)
    .filter((f) => f.startsWith('auto-snapshot-') && f.endsWith('.md'))
    .sort()
    .reverse();

  const firstFile = files[0];
  if (!firstFile) {
    return null;
  }

  return path.join(contextDir, firstFile);
}

/**
 * Get current stage from progress
 */
async function getCurrentStage(projectRoot: string): Promise<StageId | null> {
  const progressPath = path.join(projectRoot, 'state', 'progress.json');
  const progress = await readJson<Progress>(progressPath);

  return (progress?.current_stage as StageId) ?? null;
}

/**
 * Check if session recovery is needed
 */
export async function checkSessionRecovery(projectRoot: string): Promise<SessionRecoveryResult> {
  const triggerFile = path.join(projectRoot, 'state', 'context', 'auto-trigger.json');
  const contextDir = path.join(projectRoot, 'state', 'context');

  // Ensure context directory exists
  await ensureDirAsync(contextDir);

  // Check if trigger file exists
  if (!existsSync(triggerFile)) {
    return { needsRecovery: false };
  }

  const trigger = await readJson<ContextTrigger>(triggerFile);

  // Check if compact was scheduled
  if (!trigger?.compact_scheduled) {
    return { needsRecovery: false };
  }

  // Find latest snapshot
  const snapshotFile: string | null = findLatestSnapshot(contextDir);

  if (snapshotFile === null) {
    // No snapshot - cleanup trigger file
    try {
      const fs = await import('fs/promises');
      await fs.unlink(triggerFile);
    } catch {
      // Ignore cleanup errors
    }
    return { needsRecovery: false };
  }

  // Get current stage
  const currentStage = await getCurrentStage(projectRoot);

  return {
    needsRecovery: true,
    snapshotFile,
    currentStage: currentStage ?? undefined,
    timestamp: trigger.timestamp,
  };
}

/**
 * Generate recovery context
 */
export async function generateRecoveryContext(
  _projectRoot: string,
  recovery: SessionRecoveryResult
): Promise<string> {
  if (!recovery.needsRecovery || !recovery.snapshotFile) {
    return '';
  }

  // Read snapshot content (first 50 lines)
  let snapshotContent = '';
  try {
    const content = readFileSync(recovery.snapshotFile, 'utf-8');
    const lines = content.split('\n').slice(0, 50);
    snapshotContent = lines.join('\n');
  } catch {
    snapshotContent = '(Could not read snapshot content)';
  }

  const context = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Session Recovery - Restart after auto /compact
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Recovery Information
- Snapshot: ${path.basename(recovery.snapshotFile)}
- Stage: ${recovery.currentStage ?? 'unknown'}
- Save time: ${recovery.timestamp ?? 'unknown'}

## Snapshot Contents
${snapshotContent}

## Recovery Instructions
1. Review snapshot contents above to understand work context
2. Check stages/${recovery.currentStage ?? 'XX-stage'}/CLAUDE.md
3. Resume from interrupted work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return context;
}

/**
 * Mark recovery as complete
 */
export async function markRecoveryComplete(projectRoot: string): Promise<void> {
  const triggerFile = path.join(projectRoot, 'state', 'context', 'auto-trigger.json');

  if (!existsSync(triggerFile)) {
    return;
  }

  const trigger = await readJson<ContextTrigger>(triggerFile);

  if (trigger) {
    trigger.recovered = true;
    trigger.recovery_time = new Date().toISOString();
    await writeJson(triggerFile, trigger);
  }
}

/**
 * Run session start hook
 */
export async function runSessionStart(projectRoot: string): Promise<{
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext: string;
  };
}> {
  const recovery = await checkSessionRecovery(projectRoot);

  if (!recovery.needsRecovery) {
    return {};
  }

  logInfo('Session recovery detected');
  logInfo(`Snapshot: ${recovery.snapshotFile}`);
  logInfo(`Stage: ${recovery.currentStage ?? 'unknown'}`);

  const context = await generateRecoveryContext(projectRoot, recovery);

  // Mark recovery complete
  await markRecoveryComplete(projectRoot);

  logSuccess('Recovery context prepared');

  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  };
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const cwd = process.cwd();

  try {
    const result = await runSessionStart(cwd);

    if (result.hookSpecificOutput) {
      // Output JSON for Claude to consume
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    // Silent exit on error (don't block session start)
    process.exit(0);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('session-start')) {
  main().catch(() => process.exit(0));
}
