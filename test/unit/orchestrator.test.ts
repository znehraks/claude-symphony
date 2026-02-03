/**
 * Unit Tests for PipelineOrchestrator
 * Updated for v2 5-stage pipeline
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadStagePersona,
  loadStageReferences,
  loadStageInstructions,
  loadPreviousHandoff,
  buildStagePrompt,
  buildRetryPrompt,
  loadPipelineState,
  savePipelineState,
  pausePipeline,
  resumePipeline,
} from '../../src/core/pipeline/orchestrator.js';
import type { StageRetryState, PipelineState } from '../../src/core/pipeline/orchestrator.js';

let tmpDir: string;

function createTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'symphony-test-'));

  // Create minimal project structure for v2 5-stage pipeline
  fs.mkdirSync(path.join(dir, 'stages', '01-planning', 'outputs'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'stages', '01-planning', 'inputs'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'stages', '02-ui-ux', 'outputs'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'references', '01-planning'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'config'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'state'), { recursive: true });

  return dir;
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('Orchestrator', () => {
  beforeEach(() => {
    tmpDir = createTmpProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  describe('loadStageInstructions', () => {
    it('should load CLAUDE.md from stage directory', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'stages', '01-planning', 'CLAUDE.md'),
        '# Planning Stage\nCreate architecture.'
      );
      const result = loadStageInstructions(tmpDir, '01-planning');
      expect(result).toContain('Planning Stage');
      expect(result).toContain('Create architecture');
    });

    it('should return default text when CLAUDE.md missing', () => {
      const result = loadStageInstructions(tmpDir, '01-planning');
      expect(result).toContain('Execute stage 01-planning');
    });
  });

  describe('loadStagePersona', () => {
    it('should return null when no config exists', () => {
      const result = loadStagePersona(tmpDir, '01-planning');
      expect(result).toBeNull();
    });

    it('should load persona from stage_personas.jsonc', () => {
      const personas = {
        stage_personas: {
          stages: {
            planning: {
              role: 'Architect',
              temperature: 0.7,
              model: 'sonnet',
              focus: 'system design',
            },
          },
        },
      };
      fs.writeFileSync(
        path.join(tmpDir, 'config', 'stage_personas.jsonc'),
        JSON.stringify(personas)
      );

      const result = loadStagePersona(tmpDir, '01-planning');
      expect(result).not.toBeNull();
      expect(result!.role).toBe('Architect');
      expect(result!.temperature).toBe(0.7);
      expect(result!.model).toBe('sonnet');
    });
  });

  describe('loadStageReferences', () => {
    it('should return empty when no references directory', () => {
      const result = loadStageReferences(tmpDir, '03-implementation');
      expect(result.files).toHaveLength(0);
    });

    it('should load text files from references directory', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'references', '01-planning', 'competitor.md'),
        '# Competitor Analysis\nDetails here.'
      );
      const result = loadStageReferences(tmpDir, '01-planning');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('competitor.md');
      expect(result.files[0].content).toContain('Competitor Analysis');
    });

    it('should skip non-text files', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'references', '01-planning', 'image.png'),
        Buffer.from([0x89, 0x50, 0x4e, 0x47])
      );
      const result = loadStageReferences(tmpDir, '01-planning');
      expect(result.files).toHaveLength(0);
    });
  });

  describe('loadPreviousHandoff', () => {
    it('should return null for first stage', () => {
      const result = loadPreviousHandoff(tmpDir, '01-planning');
      expect(result).toBeNull();
    });

    it('should load previous stage HANDOFF.md', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'stages', '01-planning', 'HANDOFF.md'),
        '# Handoff\nPlanning complete.'
      );
      const result = loadPreviousHandoff(tmpDir, '02-ui-ux');
      expect(result).toContain('Planning complete');
    });

    it('should fall back to root HANDOFF.md', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'HANDOFF.md'),
        '# Root Handoff'
      );
      const result = loadPreviousHandoff(tmpDir, '02-ui-ux');
      expect(result).toContain('Root Handoff');
    });
  });

  describe('buildStagePrompt', () => {
    it('should include stage name and instructions', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'stages', '01-planning', 'CLAUDE.md'),
        '# Instructions\nDo planning.'
      );
      const prompt = buildStagePrompt(tmpDir, '01-planning');
      expect(prompt).toContain('01-planning');
      expect(prompt).toContain('Planning');
      expect(prompt).toContain('Do planning');
    });

    it('should include project brief for first stage', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'stages', '01-planning', 'inputs', 'project_brief.md'),
        '# Brief\nBuild a todo app.'
      );
      const prompt = buildStagePrompt(tmpDir, '01-planning');
      expect(prompt).toContain('Project Brief');
      expect(prompt).toContain('Build a todo app');
    });

    it('should include output directory instruction', () => {
      const prompt = buildStagePrompt(tmpDir, '02-ui-ux');
      expect(prompt).toContain('stages/02-ui-ux/outputs/');
    });

    it('should include reference materials', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'references', '01-planning', 'ref.md'),
        'Reference content'
      );
      const prompt = buildStagePrompt(tmpDir, '01-planning');
      expect(prompt).toContain('Reference Materials');
      expect(prompt).toContain('Reference content');
    });
  });

  describe('buildRetryPrompt', () => {
    it('should include retry attempt number and errors', () => {
      const retryState: StageRetryState = {
        stageId: '01-planning',
        attempt: 2,
        maxAttempts: 3,
        validationErrors: ['Missing architecture.md', 'requirements.md too short'],
        lastScore: 0.3,
      };
      const prompt = buildRetryPrompt(tmpDir, '01-planning', retryState);
      expect(prompt).toContain('RETRY ATTEMPT 2 of 3');
      expect(prompt).toContain('Missing architecture.md');
      expect(prompt).toContain('requirements.md too short');
      expect(prompt).toContain('0.30');
    });
  });

  describe('Pipeline State', () => {
    it('should return null when no state file', () => {
      const state = loadPipelineState(tmpDir);
      expect(state).toBeNull();
    });

    it('should save and load pipeline state', () => {
      const state: PipelineState = {
        status: 'running',
        currentStage: '01-planning',
        retryState: null,
        startedAt: '2026-01-31T00:00:00Z',
      };
      savePipelineState(tmpDir, state);

      const loaded = loadPipelineState(tmpDir);
      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe('running');
      expect(loaded!.currentStage).toBe('01-planning');
    });

    it('should pause pipeline', () => {
      const state: PipelineState = {
        status: 'running',
        currentStage: '02-ui-ux',
        retryState: null,
        startedAt: '2026-01-31T00:00:00Z',
      };
      savePipelineState(tmpDir, state);

      const paused = pausePipeline(tmpDir);
      expect(paused.status).toBe('paused');
      expect(paused.pausedAt).toBeDefined();
    });

    it('should resume paused pipeline', () => {
      const state: PipelineState = {
        status: 'paused',
        currentStage: '02-ui-ux',
        retryState: null,
        startedAt: '2026-01-31T00:00:00Z',
        pausedAt: '2026-01-31T01:00:00Z',
      };
      savePipelineState(tmpDir, state);

      const resumed = resumePipeline(tmpDir);
      expect(resumed).not.toBeNull();
      expect(resumed!.status).toBe('running');
      expect(resumed!.pausedAt).toBeUndefined();
    });

    it('should return null when resuming non-paused pipeline', () => {
      const state: PipelineState = {
        status: 'running',
        currentStage: '02-ui-ux',
        retryState: null,
        startedAt: '2026-01-31T00:00:00Z',
      };
      savePipelineState(tmpDir, state);

      const result = resumePipeline(tmpDir);
      expect(result).toBeNull();
    });
  });
});
