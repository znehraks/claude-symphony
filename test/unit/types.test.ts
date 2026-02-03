/**
 * Unit tests for types/stage.ts
 */
import { describe, it, expect } from 'vitest';
import {
  STAGE_IDS,
  StageId,
  getStageName,
  getNextStage,
  getPrevStage,
  isValidStageId,
} from '../../src/types/stage.js';

describe('Stage Types', () => {
  describe('STAGE_IDS', () => {
    it('should have 8 stages', () => {
      expect(STAGE_IDS).toHaveLength(8);
    });

    it('should contain all expected stages', () => {
      expect(STAGE_IDS).toContain('01-brainstorm');
      expect(STAGE_IDS).toContain('06-implementation');
      expect(STAGE_IDS).toContain('07-qa');
      expect(STAGE_IDS).toContain('08-deployment');
    });

    it('should be in correct order', () => {
      expect(STAGE_IDS[0]).toBe('01-brainstorm');
      expect(STAGE_IDS[7]).toBe('08-deployment');
    });
  });

  describe('getStageName', () => {
    it('should return correct name for brainstorm stage', () => {
      expect(getStageName('01-brainstorm')).toBe('Brainstorming');
    });

    it('should return correct name for implementation stage', () => {
      expect(getStageName('06-implementation')).toBe('Implementation');
    });

    it('should return correct name for deployment stage', () => {
      expect(getStageName('08-deployment')).toBe('Deployment');
    });
  });

  describe('getNextStage', () => {
    it('should return next stage for first stage', () => {
      expect(getNextStage('01-brainstorm')).toBe('02-research');
    });

    it('should return completed for last stage', () => {
      expect(getNextStage('08-deployment')).toBe('completed');
    });

    it('should return correct middle stage transitions', () => {
      expect(getNextStage('05-task-management')).toBe('06-implementation');
    });
  });

  describe('getPrevStage', () => {
    it('should return none for first stage', () => {
      expect(getPrevStage('01-brainstorm')).toBe('none');
    });

    it('should return previous stage for second stage', () => {
      expect(getPrevStage('02-research')).toBe('01-brainstorm');
    });

    it('should return correct middle stage transitions', () => {
      expect(getPrevStage('06-implementation')).toBe('05-task-management');
    });
  });

  describe('isValidStageId', () => {
    it('should return true for valid stage IDs', () => {
      expect(isValidStageId('01-brainstorm')).toBe(true);
      expect(isValidStageId('06-implementation')).toBe(true);
      expect(isValidStageId('08-deployment')).toBe(true);
    });

    it('should return false for invalid stage IDs', () => {
      expect(isValidStageId('invalid')).toBe(false);
      expect(isValidStageId('11-extra')).toBe(false);
      expect(isValidStageId('')).toBe(false);
    });
  });
});
