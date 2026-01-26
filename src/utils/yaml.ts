/**
 * YAML utilities for loading and saving configuration files
 */
import fs from 'fs/promises';
import { existsSync } from 'fs';
import yaml from 'js-yaml';
import { z } from 'zod';

/**
 * Load a YAML file and return the parsed content
 */
export async function loadYaml<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return yaml.load(content) as T;
  } catch {
    return null;
  }
}

/**
 * Load a YAML file and validate with Zod schema
 */
export async function loadYamlWithSchema<T extends z.ZodType>(
  filePath: string,
  schema: T
): Promise<z.infer<T> | null> {
  const data = await loadYaml(filePath);
  if (!data) return null;

  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  console.error(`YAML validation error in ${filePath}:`, result.error.format());
  return null;
}

/**
 * Save data to a YAML file
 */
export async function saveYaml(filePath: string, data: unknown): Promise<boolean> {
  try {
    const content = yaml.dump(data, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to save YAML to ${filePath}:`, error);
    return false;
  }
}

/**
 * Check if a YAML file exists
 */
export function yamlExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Get a value from a YAML file using a dot-notation path
 */
export async function getYamlValue<T>(
  filePath: string,
  path: string
): Promise<T | null> {
  const data = await loadYaml<Record<string, unknown>>(filePath);
  if (!data) return null;

  const keys = path.split('.');
  let current: unknown = data;

  for (const key of keys) {
    if (current === null || current === undefined) return null;
    if (typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

/**
 * Set a value in a YAML file using a dot-notation path
 */
export async function setYamlValue(
  filePath: string,
  path: string,
  value: unknown
): Promise<boolean> {
  let data = await loadYaml<Record<string, unknown>>(filePath);
  if (!data) data = {};

  const keys = path.split('.');
  let current: Record<string, unknown> = data;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1]!;
  current[lastKey] = value;

  return saveYaml(filePath, data);
}

/**
 * Merge YAML content into an existing file
 */
export async function mergeYaml(
  filePath: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  let data = await loadYaml<Record<string, unknown>>(filePath);
  if (!data) data = {};

  const merged = deepMerge(data, updates);
  return saveYaml(filePath, merged);
}

/**
 * Deep merge two objects
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      result[key] = sourceVal;
    }
  }

  return result;
}
