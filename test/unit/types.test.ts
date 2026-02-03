/**
 * Unit tests for types/stage.ts
 * Updated for v2 5-stage pipeline
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
    it('should have 5 stages', () => {
      expect(STAGE_IDS).toHaveLength(5);
    });

    it('should contain all expected stages', () => {
      expect(STAGE_IDS).toContain('01-planning');
      expect(STAGE_IDS).toContain('02-ui-ux');
      expect(STAGE_IDS).toContain('03-implementation');
      expect(STAGE_IDS).toContain('04-qa');
      expect(STAGE_IDS).toContain('05-deployment');
    });

    it('should be in correct order', () => {
      expect(STAGE_IDS[0]).toBe('01-planning');
      expect(STAGE_IDS[4]).toBe('05-deployment');
    });
  });

  describe('getStageName', () => {
    it('should return correct name for planning stage', () => {
      expect(getStageName('01-planning')).toBe('Planning & Architecture');
    });

    it('should return correct name for implementation stage', () => {
      expect(getStageName('03-implementation')).toBe('Implementation');
    });

    it('should return correct name for deployment stage', () => {
      expect(getStageName('05-deployment')).toBe('Deployment');
    });
  });

  describe('getNextStage', () => {
    it('should return next stage for first stage', () => {
      expect(getNextStage('01-planning')).toBe('02-ui-ux');
    });

    it('should return completed for last stage', () => {
      expect(getNextStage('05-deployment')).toBe('completed');
    });

    it('should return correct middle stage transitions', () => {
      expect(getNextStage('02-ui-ux')).toBe('03-implementation');
      expect(getNextStage('03-implementation')).toBe('04-qa');
    });
  });

  describe('getPrevStage', () => {
    it('should return none for first stage', () => {
      expect(getPrevStage('01-planning')).toBe('none');
    });

    it('should return previous stage for second stage', () => {
      expect(getPrevStage('02-ui-ux')).toBe('01-planning');
    });

    it('should return correct middle stage transitions', () => {
      expect(getPrevStage('03-implementation')).toBe('02-ui-ux');
      expect(getPrevStage('04-qa')).toBe('03-implementation');
    });
  });

  describe('isValidStageId', () => {
    it('should return true for valid stage IDs', () => {
      expect(isValidStageId('01-planning')).toBe(true);
      expect(isValidStageId('03-implementation')).toBe(true);
      expect(isValidStageId('05-deployment')).toBe(true);
    });

    it('should return false for invalid stage IDs', () => {
      expect(isValidStageId('invalid')).toBe(false);
      expect(isValidStageId('01-brainstorm')).toBe(false); // old stage ID
      expect(isValidStageId('06-implementation')).toBe(false); // old stage ID
      expect(isValidStageId('')).toBe(false);
    });
  });
});
