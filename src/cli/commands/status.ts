/**
 * Status CLI commands
 * show-status, show-dashboard functionality
 * Migrated from show-status.sh, show-dashboard.sh
 */
import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { ProgressManager } from '../../core/state/progress.js';
import { listCheckpoints } from '../../core/state/checkpoint.js';
import { checkContextStatus } from '../../core/state/context.js';
import { STAGE_IDS, getStageName } from '../../types/stage.js';
import type { StageId } from '../../types/stage.js';
import { logWarning, logError } from '../../utils/logger.js';

/**
 * Show pipeline status
 */
export async function showStatus(projectRoot: string): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Pipeline Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const progressManager = new ProgressManager(projectRoot);
  const progress = await progressManager.load();

  if (!progress) {
    logError('Could not load progress.json');
    return;
  }

  // Pipeline info
  console.log('\n📌 Pipeline Info');
  console.log(`  Name: ${progress.pipeline?.name ?? 'Unknown'}`);
  console.log(`  Version: ${progress.pipeline?.version ?? '0.1.0'}`);
  console.log(`  Started: ${progress.pipeline?.started_at ?? 'N/A'}`);
  console.log(`  Updated: ${progress.pipeline?.updated_at ?? 'N/A'}`);

  // Current stage
  console.log('\n🎯 Current Stage');
  const currentStage = progress.current_stage as StageId;
  console.log(`  ${currentStage}: ${getStageName(currentStage)}`);

  // Sprint info (if applicable)
  if (progress.current_iteration) {
    const { current_sprint, total_sprints } = progress.current_iteration;
    console.log(`  Sprint: ${current_sprint ?? 1} / ${total_sprints ?? 3}`);
  }

  // Stage overview
  console.log('\n📋 Stage Overview');
  console.log('  ──────────────────────────────────────────────────────');

  let completedCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;

  for (const stage of STAGE_IDS) {
    const stageInfo = progress.stages?.[stage];
    const status = stageInfo?.status ?? 'pending';
    const isCurrent = stage === currentStage;

    const marker = isCurrent ? '→' : ' ';
    const icon = status === 'completed' ? '✓' :
                 status === 'in_progress' ? '⟳' : '○';

    console.log(`${marker} ${icon} ${stage}: ${getStageName(stage)}`);

    if (status === 'completed') completedCount++;
    else if (status === 'in_progress') inProgressCount++;
    else pendingCount++;
  }

  // Summary
  console.log('\n📈 Summary');
  console.log(`  Completed:   ${completedCount}/10`);
  console.log(`  In Progress: ${inProgressCount}`);
  console.log(`  Pending:     ${pendingCount}`);

  // Progress bar
  const progressPercent = Math.round((completedCount / 10) * 100);
  const filled = Math.round(progressPercent / 5);
  const empty = 20 - filled;
  console.log(`\n  [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progressPercent}%`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Show full dashboard
 */
export async function showDashboard(projectRoot: string): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   claude-symphony Dashboard                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const progressManager = new ProgressManager(projectRoot);
  const progress = await progressManager.load();

  if (!progress) {
    logError('Could not load progress.json');
    return;
  }

  // Pipeline overview
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 📊 Pipeline Overview                                         │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  const currentStage = progress.current_stage as StageId;
  console.log(`\n  Current: ${currentStage} (${getStageName(currentStage)})`);

  // Stage progress visualization
  console.log('\n  Stage Progress:');
  console.log('  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐');

  let stageRow = '  │';
  for (const stage of STAGE_IDS) {
    const stageInfo = progress.stages?.[stage];
    const status = stageInfo?.status ?? 'pending';
    const num = stage.substring(0, 2);

    if (status === 'completed') {
      stageRow += ` ✓${num}│`;
    } else if (status === 'in_progress') {
      stageRow += ` ▶${num}│`;
    } else {
      stageRow += ` ○${num}│`;
    }
  }
  console.log(stageRow);
  console.log('  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘');

  // Recent checkpoints
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 💾 Recent Checkpoints                                        │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  const checkpoints = await listCheckpoints(projectRoot);
  const recentCheckpoints = checkpoints.slice(0, 5);

  if (recentCheckpoints.length === 0) {
    console.log('\n  No checkpoints found.');
  } else {
    for (const cp of recentCheckpoints) {
      console.log(`  • ${cp.id}`);
      console.log(`    Stage: ${cp.stage}, Created: ${cp.createdAt}`);
      if (cp.description) {
        console.log(`    ${cp.description}`);
      }
    }
  }

  // Recent outputs
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 📁 Stage Outputs                                             │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  const stagesDir = path.join(projectRoot, 'stages');
  if (existsSync(stagesDir)) {
    for (const stage of STAGE_IDS) {
      const outputsDir = path.join(stagesDir, stage, 'outputs');
      if (existsSync(outputsDir)) {
        const files = readdirSync(outputsDir).filter(f => f.endsWith('.md'));
        if (files.length > 0) {
          console.log(`\n  ${stage}:`);
          for (const file of files.slice(0, 3)) {
            const filePath = path.join(outputsDir, file);
            const stat = statSync(filePath);
            const size = formatFileSize(stat.size);
            console.log(`    • ${file} (${size})`);
          }
          if (files.length > 3) {
            console.log(`    ... and ${files.length - 3} more`);
          }
        }
      }
    }
  }

  // Quick commands
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ ⚡ Quick Commands                                            │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n  /next           → Transition to next stage');
  console.log('  /handoff        → Generate HANDOFF.md');
  console.log('  /checkpoint     → Create checkpoint');
  console.log('  /validate       → Validate configuration');
  console.log('  /context        → Check context status');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              Run /help for all available commands             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

/**
 * Show context status
 */
export async function showContextStatus(
  projectRoot: string,
  remainingPercent: number = 100
): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧠 Context Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = await checkContextStatus(projectRoot, remainingPercent);

  console.log(`\n  Remaining: ${remainingPercent}%`);
  console.log(`  Level:     ${result.level.toUpperCase()}`);

  // Visual bar
  const filled = Math.round(remainingPercent / 5);
  const empty = 20 - filled;
  const color = result.level === 'critical' ? '🔴' :
                result.level === 'action' ? '🟡' :
                result.level === 'warning' ? '🟠' : '🟢';

  console.log(`\n  ${color} [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${remainingPercent}%`);

  // Recommendations
  console.log('\n  Recommended Action:');
  console.log(`    ${result.recommendedAction}`);

  if (result.shouldAutoSave) {
    logWarning('Auto-save recommended!');
  }

  // Thresholds
  console.log('\n  Thresholds:');
  console.log('    60% - Warning: Consider running /compact');
  console.log('    50% - Action:  Run /compact, save state');
  console.log('    40% - Critical: Generate HANDOFF.md, run /clear');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
