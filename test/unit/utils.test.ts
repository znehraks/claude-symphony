/**
 * Unit tests for utils module
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTimestamp, getReadableTimestamp } from '../../src/utils/shell.js';
import { formatBytes } from '../../src/utils/logger.js';

describe('Shell Utils', () => {
  describe('getTimestamp', () => {
    it('should return ISO format timestamp', () => {
      const timestamp = getTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should return current time', () => {
      const before = Date.now();
      const timestamp = getTimestamp();
      const after = Date.now();

      const parsed = new Date(timestamp).getTime();
      expect(parsed).toBeGreaterThanOrEqual(before);
      expect(parsed).toBeLessThanOrEqual(after);
    });
  });

  describe('getReadableTimestamp', () => {
    it('should return readable format', () => {
      const timestamp = getReadableTimestamp();
      // Format: MM/DD/YYYY HH:MM:SS
      expect(timestamp).toMatch(/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/);
    });
  });
});

describe('Logger Utils', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should handle decimal values', () => {
      expect(formatBytes(1536)).toBe('1.50 KB');
      expect(formatBytes(2560 * 1024)).toBe('2.50 MB');
    });

    it('should handle negative input gracefully', () => {
      expect(formatBytes(-100)).toBe('-100 B');
    });
  });
});
