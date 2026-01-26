/**
 * Tests for JSONC utilities
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  loadJsonc,
  loadJsoncWithSchema,
  saveJsonc,
  jsoncExists,
  getJsoncValue,
  setJsoncValue,
  mergeJsonc,
  yamlToJsonc,
  getConfigPath,
} from '../../src/utils/jsonc.js';
import { z } from 'zod';

const TEST_DIR = path.join(process.cwd(), 'test', '.tmp');
const TEST_FILE = path.join(TEST_DIR, 'test.jsonc');

describe('JSONC Utilities', () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('loadJsonc', () => {
    it('should load a valid JSONC file', async () => {
      const content = `{
        // This is a comment
        "name": "test",
        "value": 42
      }`;
      await fs.writeFile(TEST_FILE, content);

      const result = await loadJsonc<{ name: string; value: number }>(TEST_FILE);
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should return null for non-existent file', async () => {
      const result = await loadJsonc('/non/existent/file.jsonc');
      expect(result).toBeNull();
    });

    it('should handle trailing commas', async () => {
      const content = `{
        "items": [1, 2, 3,],
        "name": "test",
      }`;
      await fs.writeFile(TEST_FILE, content);

      const result = await loadJsonc<{ items: number[]; name: string }>(TEST_FILE);
      expect(result).toEqual({ items: [1, 2, 3], name: 'test' });
    });
  });

  describe('loadJsoncWithSchema', () => {
    const TestSchema = z.object({
      name: z.string(),
      value: z.number(),
    });

    it('should validate and return data matching schema', async () => {
      const content = `{ "name": "test", "value": 42 }`;
      await fs.writeFile(TEST_FILE, content);

      const result = await loadJsoncWithSchema(TEST_FILE, TestSchema);
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should return null for invalid schema', async () => {
      const content = `{ "name": 123, "value": "invalid" }`;
      await fs.writeFile(TEST_FILE, content);

      const result = await loadJsoncWithSchema(TEST_FILE, TestSchema);
      expect(result).toBeNull();
    });
  });

  describe('saveJsonc', () => {
    it('should save data with formatting', async () => {
      const data = { name: 'test', items: [1, 2, 3] };
      await saveJsonc(TEST_FILE, data);

      const content = await fs.readFile(TEST_FILE, 'utf8');
      expect(content).toContain('"name": "test"');
      expect(content).toContain('  '); // Has indentation
    });

    it('should add $schema reference when provided', async () => {
      const data = { name: 'test' };
      await saveJsonc(TEST_FILE, data, './schema.json');

      const content = await fs.readFile(TEST_FILE, 'utf8');
      expect(content).toContain('"$schema": "./schema.json"');
    });
  });

  describe('jsoncExists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(TEST_FILE, '{}');
      expect(jsoncExists(TEST_FILE)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      expect(jsoncExists('/non/existent/file.jsonc')).toBe(false);
    });
  });

  describe('getJsoncValue', () => {
    it('should get nested value by path', async () => {
      const content = `{
        "config": {
          "settings": {
            "debug": true
          }
        }
      }`;
      await fs.writeFile(TEST_FILE, content);

      const result = await getJsoncValue<boolean>(TEST_FILE, 'config.settings.debug');
      expect(result).toBe(true);
    });

    it('should return undefined for non-existent path', async () => {
      const content = `{ "name": "test" }`;
      await fs.writeFile(TEST_FILE, content);

      const result = await getJsoncValue(TEST_FILE, 'non.existent.path');
      expect(result).toBeUndefined();
    });
  });

  describe('setJsoncValue', () => {
    it('should set value at nested path', async () => {
      const content = `{ "config": {} }`;
      await fs.writeFile(TEST_FILE, content);

      await setJsoncValue(TEST_FILE, 'config.debug', true);

      const result = await loadJsonc<{ config: { debug: boolean } }>(TEST_FILE);
      expect(result?.config.debug).toBe(true);
    });

    it('should create nested objects if needed', async () => {
      await fs.writeFile(TEST_FILE, '{}');

      await setJsoncValue(TEST_FILE, 'a.b.c', 'value');

      const result = await loadJsonc<{ a: { b: { c: string } } }>(TEST_FILE);
      expect(result?.a.b.c).toBe('value');
    });
  });

  describe('mergeJsonc', () => {
    it('should merge updates into existing file', async () => {
      const content = `{ "a": 1, "b": { "c": 2 } }`;
      await fs.writeFile(TEST_FILE, content);

      await mergeJsonc(TEST_FILE, { b: { d: 3 }, e: 4 });

      const result = await loadJsonc<Record<string, unknown>>(TEST_FILE);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('yamlToJsonc', () => {
    it('should convert YAML data to JSONC string', () => {
      const data = { name: 'test', items: [1, 2, 3] };
      const result = yamlToJsonc(data);

      expect(result).toContain('"name": "test"');
      expect(JSON.parse(result)).toEqual(data);
    });

    it('should add schema reference', () => {
      const data = { name: 'test' };
      const result = yamlToJsonc(data, './schema.json');

      expect(result).toContain('"$schema": "./schema.json"');
    });

    it('should add top comment', () => {
      const data = { name: 'test' };
      const result = yamlToJsonc(data, undefined, 'This is a config file');

      expect(result).toMatch(/^\/\/ This is a config file/);
    });
  });

  describe('getConfigPath', () => {
    it('should return JSONC path if exists', async () => {
      const jsoncPath = path.join(TEST_DIR, 'config.jsonc');
      await fs.writeFile(jsoncPath, '{}');

      const result = getConfigPath(TEST_DIR, 'config');
      expect(result.format).toBe('jsonc');
      expect(result.path).toBe(jsoncPath);
    });

    it('should fall back to YAML path', () => {
      const result = getConfigPath(TEST_DIR, 'nonexistent');
      expect(result.format).toBe('yaml');
      expect(result.path).toContain('.yaml');
    });
  });
});
