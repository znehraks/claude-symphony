/**
 * Unit tests for hooks module
 */
import { describe, it, expect } from 'vitest';
import {
  getStageModel,
  getTaskModel,
  getModelInfo,
} from '../../src/hooks/ai-selector.js';
import { isDestructiveOperation } from '../../src/hooks/auto-checkpoint.js';

describe('AI Selector Hook', () => {
  describe('getStageModel', () => {
    it('should return gemini for brainstorm stage', () => {
      expect(getStageModel('01-brainstorm')).toBe('gemini');
    });

    it('should return claude for research stage', () => {
      expect(getStageModel('02-research')).toBe('claude');
    });

    it('should return claudecode for implementation stage', () => {
      expect(getStageModel('06-implementation')).toBe('claudecode');
    });

    it('should return codex for refactoring stage', () => {
      expect(getStageModel('07-refactoring')).toBe('codex');
    });

    it('should return codex for testing stage', () => {
      expect(getStageModel('09-testing')).toBe('codex');
    });
  });

  describe('getTaskModel', () => {
    it('should return gemini for brainstorming tasks', () => {
      expect(getTaskModel('brainstorming')).toBe('gemini');
      expect(getTaskModel('creative')).toBe('gemini');
      expect(getTaskModel('ideation')).toBe('gemini');
    });

    it('should return claude for research tasks', () => {
      expect(getTaskModel('research')).toBe('claude');
      expect(getTaskModel('analysis')).toBe('claude');
      expect(getTaskModel('documentation')).toBe('claude');
    });

    it('should return claudecode for implementation tasks', () => {
      expect(getTaskModel('implementation')).toBe('claudecode');
      expect(getTaskModel('debugging')).toBe('claudecode');
      expect(getTaskModel('review')).toBe('claudecode');
    });

    it('should return codex for refactoring tasks', () => {
      expect(getTaskModel('refactoring')).toBe('codex');
      expect(getTaskModel('testing')).toBe('codex');
      expect(getTaskModel('optimization')).toBe('codex');
    });
  });

  describe('getModelInfo', () => {
    it('should return info for claudecode', () => {
      expect(getModelInfo('claudecode')).toContain('Claude Code');
    });

    it('should return info for gemini', () => {
      expect(getModelInfo('gemini')).toContain('Gemini');
    });

    it('should return info for codex', () => {
      expect(getModelInfo('codex')).toContain('Codex');
    });
  });
});

describe('Auto-Checkpoint Hook', () => {
  describe('isDestructiveOperation', () => {
    it('should detect rm -rf commands', () => {
      expect(isDestructiveOperation('rm -rf /some/path')).toBe(true);
      expect(isDestructiveOperation('rm -f file.txt')).toBe(true);
    });

    it('should detect delete keyword', () => {
      expect(isDestructiveOperation('DELETE FROM users')).toBe(true);
    });

    it('should detect drop keyword', () => {
      expect(isDestructiveOperation('DROP TABLE users')).toBe(true);
    });

    it('should detect truncate keyword', () => {
      expect(isDestructiveOperation('TRUNCATE TABLE logs')).toBe(true);
    });

    it('should detect git reset --hard', () => {
      expect(isDestructiveOperation('git reset --hard HEAD')).toBe(true);
    });

    it('should detect git clean -f', () => {
      expect(isDestructiveOperation('git clean -fd')).toBe(true);
    });

    it('should detect git checkout .', () => {
      expect(isDestructiveOperation('git checkout .')).toBe(true);
    });

    it('should not flag safe commands', () => {
      expect(isDestructiveOperation('npm install')).toBe(false);
      expect(isDestructiveOperation('git status')).toBe(false);
      expect(isDestructiveOperation('ls -la')).toBe(false);
      expect(isDestructiveOperation('cat file.txt')).toBe(false);
    });
  });
});
