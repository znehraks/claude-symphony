/**
 * File system utilities
 */
import fs from 'fs/promises';
import { existsSync, statSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Check if a path exists
 */
export function pathExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Check if a path is a directory
 */
export function isDirectory(filePath: string): boolean {
  try {
    return existsSync(filePath) && statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
export function isFile(filePath: string): boolean {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists
 */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Ensure a directory exists (async)
 */
export async function ensureDirAsync(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Read a file as string
 */
export async function readFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Write content to a file
 */
export async function writeFile(filePath: string, content: string): Promise<boolean> {
  try {
    await ensureDirAsync(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to write file ${filePath}:`, error);
    return false;
  }
}

/**
 * Read JSON file
 */
export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write JSON to file
 */
export async function writeJson(
  filePath: string,
  data: unknown,
  pretty = true
): Promise<boolean> {
  try {
    await ensureDirAsync(path.dirname(filePath));
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to write JSON file ${filePath}:`, error);
    return false;
  }
}

/**
 * Copy a file
 */
export function copyFile(src: string, dest: string): boolean {
  try {
    ensureDir(path.dirname(dest));
    copyFileSync(src, dest);
    return true;
  } catch (error) {
    console.error(`Failed to copy file from ${src} to ${dest}:`, error);
    return false;
  }
}

/**
 * Copy directory recursively (sync)
 */
export function copyDirSync(src: string, dest: string): void {
  if (!existsSync(src)) return;

  const stats = statSync(src);

  if (stats.isDirectory()) {
    ensureDir(dest);
    const entries = readdirSync(src);
    for (const entry of entries) {
      copyDirSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

/**
 * Remove a file or directory
 */
export async function remove(filePath: string): Promise<boolean> {
  try {
    if (!existsSync(filePath)) return true;
    await fs.rm(filePath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Failed to remove ${filePath}:`, error);
    return false;
  }
}

/**
 * List files in a directory
 */
export async function listDir(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * List files in a directory with full paths
 */
export async function listDirFullPath(dirPath: string): Promise<string[]> {
  const files = await listDir(dirPath);
  return files.map(f => path.join(dirPath, f));
}

/**
 * Get file stats
 */
export async function getStats(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

/**
 * Replace template variables in content
 */
export function replaceTemplateVars(
  content: string,
  vars: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}
