/**
 * Unit Tests for Progress Display TUI
 */
import { describe, it, expect } from 'vitest';
import { renderPipelineProgress } from '../../src/cli/tui/progress-display.js';
import type { StageId, StageStatus } from '../../src/types/stage.js';

function makeStages(
  overrides: Partial<Record<StageId, StageStatus>> = {}
): Array<{ id: StageId; name: string; status: StageStatus }> {
  const defaults: Array<{ id: StageId; name: string; status: StageStatus }> = [
    { id: '01-brainstorm', name: 'Brainstorming', status: 'pending' },
    { id: '02-research', name: 'Research', status: 'pending' },
    { id: '03-planning', name: 'Planning', status: 'pending' },
    { id: '04-ui-ux', name: 'UI/UX Design', status: 'pending' },
    { id: '05-task-management', name: 'Task Management', status: 'pending' },
    { id: '06-implementation', name: 'Implementation', status: 'pending' },
    { id: '07-qa', name: 'QA & Full Testing', status: 'pending' },
    { id: '08-deployment', name: 'Deployment', status: 'pending' },
  ];

  return defaults.map((s) => ({
    ...s,
    status: overrides[s.id] ?? s.status,
  }));
}

describe('Progress Display', () => {
  describe('renderPipelineProgress', () => {
    it('should render all 8 stages', () => {
      const output = renderPipelineProgress({
        projectName: 'test-app',
        stages: makeStages(),
        progress: 0,
      });
      expect(output).toContain('test-app');
      expect(output).toContain('01');
      expect(output).toContain('08');
      expect(output).toContain('0%');
    });

    it('should show completed stages as Done', () => {
      const output = renderPipelineProgress({
        projectName: 'test-app',
        stages: makeStages({
          '01-brainstorm': 'completed',
          '02-research': 'completed',
        }),
        progress: 20,
      });
      expect(output).toContain('Done');
      expect(output).toContain('20%');
    });

    it('should show in-progress stage as Running', () => {
      const output = renderPipelineProgress({
        projectName: 'test-app',
        stages: makeStages({
          '01-brainstorm': 'completed',
          '02-research': 'in_progress',
        }),
        progress: 10,
      });
      expect(output).toContain('Running');
    });

    it('should show skipped stages', () => {
      const output = renderPipelineProgress({
        projectName: 'test-app',
        stages: makeStages({
          '04-ui-ux': 'skipped',
        }),
        progress: 10,
      });
      expect(output).toContain('Skipped');
    });

    it('should display current persona when provided', () => {
      const output = renderPipelineProgress({
        projectName: 'test-app',
        stages: makeStages(),
        currentPersona: 'Creative Explorer',
        progress: 0,
      });
      expect(output).toContain('Creative Explorer');
    });

    it('should handle 100% progress', () => {
      const allCompleted: Partial<Record<StageId, StageStatus>> = {};
      const ids: StageId[] = [
        '01-brainstorm', '02-research', '03-planning', '04-ui-ux',
        '05-task-management', '06-implementation', '07-qa',
        '08-deployment',
      ];
      for (const id of ids) {
        allCompleted[id] = 'completed';
      }

      const output = renderPipelineProgress({
        projectName: 'my-app',
        stages: makeStages(allCompleted),
        progress: 100,
      });
      expect(output).toContain('100%');
    });

    it('should render box characters', () => {
      const output = renderPipelineProgress({
        projectName: 'test',
        stages: makeStages(),
        progress: 0,
      });
      // Box drawing characters
      expect(output).toContain('┌');
      expect(output).toContain('┐');
      expect(output).toContain('└');
      expect(output).toContain('┘');
    });
  });
});
