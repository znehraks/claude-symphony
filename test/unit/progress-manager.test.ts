/**
 * Unit Tests for ProgressManager (new methods)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ProgressManager } from '../../src/core/state/progress.js';
import { createInitialProgress } from '../../src/types/state.js';

let tmpDir: string;

function setupProject(projectName = 'test-project'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'symphony-progress-'));
  fs.mkdirSync(path.join(dir, 'state'), { recursive: true });

  const progress = createInitialProgress(projectName);
  fs.writeFileSync(
    path.join(dir, 'state', 'progress.json'),
    JSON.stringify(progress, null, 2)
  );

  return dir;
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('ProgressManager', () => {
  beforeEach(() => {
    tmpDir = setupProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  describe('getNextStage', () => {
    it('should return 02-research when current is 01-brainstorm', async () => {
      const pm = new ProgressManager(tmpDir);
      const next = await pm.getNextStage();
      expect(next).toBe('02-research');
    });

    it('should return null at last stage', async () => {
      const progress = createInitialProgress('test');
      progress.current_stage = '08-deployment';
      fs.writeFileSync(
        path.join(tmpDir, 'state', 'progress.json'),
        JSON.stringify(progress, null, 2)
      );

      const pm = new ProgressManager(tmpDir);
      const next = await pm.getNextStage();
      expect(next).toBeNull();
    });
  });

  describe('isComplete', () => {
    it('should return false when stages are pending', async () => {
      const pm = new ProgressManager(tmpDir);
      const complete = await pm.isComplete();
      expect(complete).toBe(false);
    });

    it('should return true when all stages completed', async () => {
      const progress = createInitialProgress('test');
      for (const key of Object.keys(progress.stages)) {
        progress.stages[key as keyof typeof progress.stages].status = 'completed';
      }
      fs.writeFileSync(
        path.join(tmpDir, 'state', 'progress.json'),
        JSON.stringify(progress, null, 2)
      );

      const pm = new ProgressManager(tmpDir);
      const complete = await pm.isComplete();
      expect(complete).toBe(true);
    });

    it('should return true when all stages completed or skipped', async () => {
      const progress = createInitialProgress('test');
      const stages = Object.keys(progress.stages) as Array<keyof typeof progress.stages>;
      for (let i = 0; i < stages.length; i++) {
        progress.stages[stages[i]].status = i % 2 === 0 ? 'completed' : 'skipped';
      }
      fs.writeFileSync(
        path.join(tmpDir, 'state', 'progress.json'),
        JSON.stringify(progress, null, 2)
      );

      const pm = new ProgressManager(tmpDir);
      const complete = await pm.isComplete();
      expect(complete).toBe(true);
    });
  });

  describe('getStageStatuses', () => {
    it('should return all 8 stages', async () => {
      const pm = new ProgressManager(tmpDir);
      const statuses = await pm.getStageStatuses();
      expect(statuses).toHaveLength(8);
    });

    it('should reflect updated status', async () => {
      const pm = new ProgressManager(tmpDir);
      await pm.setCurrentStage('01-brainstorm', 'in_progress');

      // Reload to get fresh data
      const pm2 = new ProgressManager(tmpDir);
      const statuses = await pm2.getStageStatuses();
      const brainstorm = statuses.find((s) => s.id === '01-brainstorm');
      expect(brainstorm?.status).toBe('in_progress');
    });

    it('should return empty array for missing progress', async () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'symphony-empty-'));
      fs.mkdirSync(path.join(emptyDir, 'state'), { recursive: true });

      const pm = new ProgressManager(emptyDir);
      const statuses = await pm.getStageStatuses();
      expect(statuses).toEqual([]);

      cleanup(emptyDir);
    });
  });

  describe('setCurrentStage', () => {
    it('should set stage and status', async () => {
      const pm = new ProgressManager(tmpDir);
      const result = await pm.setCurrentStage('03-planning', 'in_progress');
      expect(result).toBe(true);

      const pm2 = new ProgressManager(tmpDir);
      const current = await pm2.getCurrentStage();
      expect(current).toBe('03-planning');
    });
  });

  describe('completeCurrentStage', () => {
    it('should mark current stage as completed', async () => {
      const pm = new ProgressManager(tmpDir);
      await pm.setCurrentStage('01-brainstorm', 'in_progress');
      await pm.completeCurrentStage();

      const pm2 = new ProgressManager(tmpDir);
      const statuses = await pm2.getStageStatuses();
      const brainstorm = statuses.find((s) => s.id === '01-brainstorm');
      expect(brainstorm?.status).toBe('completed');
    });
  });
});
