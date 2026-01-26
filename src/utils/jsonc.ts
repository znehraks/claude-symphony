/**
 * JSONC utilities for loading and saving configuration files with comments
 * JSONC (JSON with Comments) provides better IDE support with $schema references
 */
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { parse as parseJsonc, modify, applyEdits, format, type ParseError } from 'jsonc-parser';
import { z } from 'zod';

/**
 * Load a JSONC file and return the parsed content
 */
export async function loadJsonc<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const errors: ParseError[] = [];
    const result = parseJsonc(content, errors, {
      allowTrailingComma: true,
      allowEmptyContent: true,
    });

    if (errors.length > 0) {
      console.error(`JSONC parse errors in ${filePath}:`, errors);
    }

    return result as T;
  } catch {
    return null;
  }
}

/**
 * Load a JSONC file and validate with Zod schema
 */
export async function loadJsoncWithSchema<T extends z.ZodType>(
  filePath: string,
  schema: T
): Promise<z.infer<T> | null> {
  const data = await loadJsonc(filePath);
  if (!data) return null;

  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  console.error(`JSONC validation error in ${filePath}:`, result.error.format());
  return null;
}

/**
 * Save data to a JSONC file with formatting
 * Preserves $schema reference at the top
 */
export async function saveJsonc(
  filePath: string,
  data: unknown,
  schemaRef?: string
): Promise<boolean> {
  try {
    // Add $schema reference if provided
    const dataWithSchema = schemaRef
      ? { $schema: schemaRef, ...(data as object) }
      : data;

    // Format with 2-space indentation
    const content = JSON.stringify(dataWithSchema, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to save JSONC to ${filePath}:`, error);
    return false;
  }
}

/**
 * Check if a JSONC file exists
 */
export function jsoncExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Get a value from a JSONC file using a dot-notation path
 */
export async function getJsoncValue<T>(
  filePath: string,
  path: string
): Promise<T | undefined> {
  const data = await loadJsonc<Record<string, unknown>>(filePath);
  if (!data) return undefined;

  const keys = path.split('.');
  let current: unknown = data;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

/**
 * Set a value in a JSONC file using a dot-notation path
 * Preserves existing comments and formatting
 */
export async function setJsoncValue(
  filePath: string,
  path: string,
  value: unknown
): Promise<boolean> {
  try {
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      content = '{}';
    }

    // Convert dot-notation path to JSON path array
    const jsonPath = path.split('.');

    // Use modify to preserve formatting
    const edits = modify(content, jsonPath, value, {
      formattingOptions: {
        tabSize: 2,
        insertSpaces: true,
        eol: '\n',
      },
    });

    const newContent = applyEdits(content, edits);
    await fs.writeFile(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to set value in ${filePath}:`, error);
    return false;
  }
}

/**
 * Merge updates into an existing JSONC file
 * Preserves existing comments and formatting
 */
export async function mergeJsonc(
  filePath: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  try {
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      content = '{}';
    }

    // Parse existing content
    const existing = parseJsonc(content) as Record<string, unknown> | null;
    const merged = deepMerge(existing || {}, updates);

    // Format the merged content
    const formattedContent = format(JSON.stringify(merged), undefined, {
      tabSize: 2,
      insertSpaces: true,
      eol: '\n',
    });

    const formatted = applyEdits(JSON.stringify(merged), formattedContent);
    await fs.writeFile(filePath, formatted, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to merge JSONC in ${filePath}:`, error);
    return false;
  }
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

/**
 * Convert YAML content to JSONC with optional schema reference
 */
export function yamlToJsonc(
  yamlData: unknown,
  schemaRef?: string,
  topComment?: string
): string {
  const dataWithSchema = schemaRef
    ? { $schema: schemaRef, ...(yamlData as object) }
    : yamlData;

  let content = JSON.stringify(dataWithSchema, null, 2);

  // Add top comment if provided
  if (topComment) {
    content = `// ${topComment}\n${content}`;
  }

  return content;
}

/**
 * Determine config file path with extension detection
 * Returns JSONC path if exists, otherwise YAML path
 */
export function getConfigPath(
  baseDir: string,
  configName: string
): { path: string; format: 'jsonc' | 'yaml' } {
  const jsoncPath = `${baseDir}/${configName}.jsonc`;
  const yamlPath = `${baseDir}/${configName}.yaml`;

  if (jsoncExists(jsoncPath)) {
    return { path: jsoncPath, format: 'jsonc' };
  }
  return { path: yamlPath, format: 'yaml' };
}
