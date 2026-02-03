/**
 * Quality Validator Hook (v2)
 * Layer 1: Objective quality checks for stage outputs
 *
 * This module implements quality-based validation that checks output quality
 * rather than MCP usage. MCP usage is recommended but not required.
 */
import path from 'path';
import { existsSync, statSync, readFileSync, readdirSync } from 'fs';
import { readJson, writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { execShell } from '../utils/shell.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS } from '../types/stage.js';
import { parseJsonc } from '../utils/jsonc.js';

/**
 * Quality check levels
 */
export type QualityLevel = 'blocking' | 'critical' | 'non-critical';

/**
 * Quality check configuration from pipeline.jsonc
 */
export interface QualityCheckConfig {
  name: string;
  type: 'section' | 'file_exists' | 'directory_not_empty' | 'command' | 'component_count' | 'section_count' | 'file_count';
  level: QualityLevel;
  sections?: string[];
  files?: string[];
  directories?: string[];
  command?: string;
  min_pass_rate?: number;
  min?: number;
  pattern?: string;
  section_pattern?: string;
  target_files?: string[];
}

/**
 * Quality check result
 */
export interface QualityCheckResult {
  name: string;
  passed: boolean;
  message: string;
  level: QualityLevel;
}

/**
 * Stage quality result
 */
export interface QualityResult {
  success: boolean;
  stageId: StageId;
  level?: QualityLevel;
  error?: string;
  warnings?: QualityCheckResult[];
  checks: QualityCheckResult[];
  timestamp: string;
}

/**
 * Stage configuration from pipeline.jsonc
 */
interface StageConfig {
  id: string;
  name: string;
  required_outputs?: string[];
  quality_checks?: QualityCheckConfig[];
}

/**
 * Pipeline configuration
 */
interface PipelineConfig {
  stages: StageConfig[];
}

/**
 * Load stage configuration from pipeline.jsonc
 */
export async function loadStageConfig(projectRoot: string, stageId: StageId): Promise<StageConfig | null> {
  const pipelinePath = path.join(projectRoot, 'config', 'pipeline.jsonc');

  if (!existsSync(pipelinePath)) {
    logWarning(`pipeline.jsonc not found at ${pipelinePath}`);
    return null;
  }

  try {
    const content = readFileSync(pipelinePath, 'utf-8');
    const config = parseJsonc(content) as PipelineConfig;
    return config.stages.find((s) => s.id === stageId) || null;
  } catch (error) {
    logError(`Failed to load pipeline.jsonc: ${error}`);
    return null;
  }
}

/**
 * Check if required outputs exist
 */
export async function checkOutputsExist(
  projectRoot: string,
  stageId: StageId,
  requiredOutputs: string[]
): Promise<{ passed: boolean; missing: string[] }> {
  const stageDir = path.join(projectRoot, 'stages', stageId, 'outputs');
  const missing: string[] = [];

  for (const output of requiredOutputs) {
    const outputPath = output.endsWith('/')
      ? path.join(stageDir, output)
      : path.join(stageDir, output);

    if (!existsSync(outputPath)) {
      // Also check project root for certain files
      const rootPath = path.join(projectRoot, output);
      if (!existsSync(rootPath)) {
        missing.push(output);
      }
    }
  }

  return {
    passed: missing.length === 0,
    missing,
  };
}

/**
 * Run individual quality check
 */
export async function runQualityCheck(
  projectRoot: string,
  stageId: StageId,
  check: QualityCheckConfig
): Promise<QualityCheckResult> {
  const stageOutputDir = path.join(projectRoot, 'stages', stageId, 'outputs');

  switch (check.type) {
    case 'file_exists': {
      const files = check.files || [];
      const missing: string[] = [];

      for (const file of files) {
        const outputPath = path.join(stageOutputDir, file);
        const rootPath = path.join(projectRoot, file);
        if (!existsSync(outputPath) && !existsSync(rootPath)) {
          missing.push(file);
        }
      }

      return {
        name: check.name,
        passed: missing.length === 0,
        message: missing.length === 0
          ? `All required files exist: ${files.join(', ')}`
          : `Missing files: ${missing.join(', ')}`,
        level: check.level,
      };
    }

    case 'directory_not_empty': {
      const directories = check.directories || [];
      const empty: string[] = [];

      for (const dir of directories) {
        const dirPath = path.join(stageOutputDir, dir);
        const rootDirPath = path.join(projectRoot, dir);
        const targetPath = existsSync(dirPath) ? dirPath : rootDirPath;

        if (!existsSync(targetPath)) {
          empty.push(dir);
        } else {
          try {
            const entries = readdirSync(targetPath);
            if (entries.length === 0) {
              empty.push(dir);
            }
          } catch {
            empty.push(dir);
          }
        }
      }

      return {
        name: check.name,
        passed: empty.length === 0,
        message: empty.length === 0
          ? `All directories have content: ${directories.join(', ')}`
          : `Empty or missing directories: ${empty.join(', ')}`,
        level: check.level,
      };
    }

    case 'section': {
      const sections = check.sections || [];
      const targetFiles = check.target_files || [];
      const missingSections: string[] = [];

      for (const file of targetFiles) {
        const outputPath = path.join(stageOutputDir, file);
        const rootPath = path.join(projectRoot, file);
        const filePath = existsSync(outputPath) ? outputPath : rootPath;

        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          for (const section of sections) {
            const pattern = new RegExp(`^#{1,3}.*${section}`, 'im');
            if (!pattern.test(content)) {
              missingSections.push(`${file}: ${section}`);
            }
          }
        } else {
          for (const section of sections) {
            missingSections.push(`${file} (missing): ${section}`);
          }
        }
      }

      return {
        name: check.name,
        passed: missingSections.length === 0,
        message: missingSections.length === 0
          ? `All required sections found`
          : `Missing sections: ${missingSections.join(', ')}`,
        level: check.level,
      };
    }

    case 'section_count': {
      const pattern = check.section_pattern || '## ';
      const targetFiles = check.target_files || [];
      const minCount = check.min || 1;
      let totalCount = 0;

      for (const file of targetFiles) {
        const outputPath = path.join(stageOutputDir, file);
        const rootPath = path.join(projectRoot, file);
        const filePath = existsSync(outputPath) ? outputPath : rootPath;

        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          const matches = content.match(new RegExp(pattern, 'gim'));
          totalCount += matches?.length || 0;
        }
      }

      return {
        name: check.name,
        passed: totalCount >= minCount,
        message: totalCount >= minCount
          ? `Found ${totalCount} sections (>= ${minCount} required)`
          : `Only ${totalCount} sections found (minimum ${minCount} required)`,
        level: check.level,
      };
    }

    case 'component_count': {
      const minCount = check.min || 5;
      const targetFiles = check.target_files || ['component_specs.md'];
      let componentCount = 0;

      for (const file of targetFiles) {
        const outputPath = path.join(stageOutputDir, file);
        const rootPath = path.join(projectRoot, file);
        const filePath = existsSync(outputPath) ? outputPath : rootPath;

        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          // Count component definitions (## Component, ### Component, or similar patterns)
          const matches = content.match(/^#{2,3}\s+\w+/gm);
          componentCount += matches?.length || 0;
        }
      }

      return {
        name: check.name,
        passed: componentCount >= minCount,
        message: componentCount >= minCount
          ? `Found ${componentCount} components (>= ${minCount} required)`
          : `Only ${componentCount} components found (minimum ${minCount} required)`,
        level: check.level,
      };
    }

    case 'file_count': {
      const pattern = check.pattern || '**/*';
      const minCount = check.min || 1;

      // Simple glob implementation for source files
      const countFiles = (dir: string, ext: string[]): number => {
        let count = 0;
        const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'target']);

        const walk = (currentDir: string): void => {
          try {
            const entries = readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                if (!IGNORE_DIRS.has(entry.name)) {
                  walk(path.join(currentDir, entry.name));
                }
              } else if (entry.isFile()) {
                const fileExt = path.extname(entry.name).toLowerCase();
                if (ext.includes(fileExt)) {
                  count++;
                }
              }
            }
          } catch {
            // Skip unreadable directories
          }
        };

        if (existsSync(dir)) {
          walk(dir);
        }
        return count;
      };

      // Extract extensions from pattern like "src/**/*.{ts,tsx,js,jsx}"
      const extMatch = pattern.match(/\.\{([^}]+)\}/);
      const extensions = extMatch
        ? extMatch[1].split(',').map((e) => `.${e.trim()}`)
        : ['.ts', '.tsx', '.js', '.jsx'];

      // Extract directory from pattern
      const dirMatch = pattern.match(/^([^*]+)/);
      const searchDir = dirMatch ? path.join(projectRoot, dirMatch[1]) : projectRoot;

      const fileCount = countFiles(searchDir, extensions);

      return {
        name: check.name,
        passed: fileCount >= minCount,
        message: fileCount >= minCount
          ? `Found ${fileCount} source files (>= ${minCount} required)`
          : `Only ${fileCount} source files found (minimum ${minCount} required)`,
        level: check.level,
      };
    }

    case 'command': {
      const command = check.command || 'echo "No command"';
      const minPassRate = check.min_pass_rate;

      try {
        const result = await execShell(command, { cwd: projectRoot });

        // For test commands, check pass rate if specified
        if (minPassRate !== undefined && result.output) {
          // Try to parse test output for pass rate
          const passMatch = result.output.match(/(\d+)\s+pass/i);
          const failMatch = result.output.match(/(\d+)\s+fail/i);

          if (passMatch) {
            const passed = parseInt(passMatch[1], 10);
            const failed = failMatch ? parseInt(failMatch[1], 10) : 0;
            const total = passed + failed;
            const rate = total > 0 ? passed / total : 1;

            return {
              name: check.name,
              passed: rate >= minPassRate,
              message: rate >= minPassRate
                ? `Command passed with ${(rate * 100).toFixed(0)}% pass rate`
                : `Pass rate ${(rate * 100).toFixed(0)}% below minimum ${(minPassRate * 100).toFixed(0)}%`,
              level: check.level,
            };
          }
        }

        return {
          name: check.name,
          passed: result.success,
          message: result.success
            ? `Command "${command}" succeeded`
            : `Command "${command}" failed: ${result.error || 'Unknown error'}`,
          level: check.level,
        };
      } catch (error) {
        return {
          name: check.name,
          passed: false,
          message: `Command "${command}" failed: ${error}`,
          level: check.level,
        };
      }
    }

    default:
      return {
        name: check.name,
        passed: false,
        message: `Unknown check type: ${check.type}`,
        level: check.level,
      };
  }
}

/**
 * Main function: Validate stage quality
 */
export async function validateStageQuality(
  projectRoot: string,
  stageId: StageId
): Promise<QualityResult> {
  logInfo(`Running quality validation for stage: ${stageId}`);

  const config = await loadStageConfig(projectRoot, stageId);

  if (!config) {
    return {
      success: false,
      stageId,
      level: 'blocking',
      error: `Stage configuration not found for ${stageId}`,
      checks: [],
      timestamp: new Date().toISOString(),
    };
  }

  const checks: QualityCheckResult[] = [];

  // 1. Check required outputs exist
  if (config.required_outputs && config.required_outputs.length > 0) {
    const outputCheck = await checkOutputsExist(projectRoot, stageId, config.required_outputs);
    checks.push({
      name: 'required_outputs',
      passed: outputCheck.passed,
      message: outputCheck.passed
        ? `All required outputs exist`
        : `Missing required outputs: ${outputCheck.missing.join(', ')}`,
      level: 'blocking',
    });

    if (!outputCheck.passed) {
      return {
        success: false,
        stageId,
        level: 'blocking',
        error: `Missing required outputs: ${outputCheck.missing.join(', ')}`,
        checks,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 2. Run quality checks
  const qualityChecks = config.quality_checks || [];
  for (const check of qualityChecks) {
    const result = await runQualityCheck(projectRoot, stageId, check);
    checks.push(result);
  }

  // 3. Analyze results
  const failed = checks.filter((c) => !c.passed);
  const hasBlocking = failed.some((f) => f.level === 'blocking');
  const hasCritical = failed.some((f) => f.level === 'critical');
  const warnings = failed.filter((f) => f.level === 'non-critical');

  // Save results
  const validationsDir = path.join(projectRoot, 'state', 'validations');
  await ensureDirAsync(validationsDir);

  const timestamp = new Date().toISOString();
  const result: QualityResult = {
    success: !hasBlocking && !hasCritical,
    stageId,
    level: hasBlocking ? 'blocking' : hasCritical ? 'critical' : undefined,
    error: hasBlocking || hasCritical
      ? `Quality checks failed: ${failed.filter((f) => f.level !== 'non-critical').map((f) => f.name).join(', ')}`
      : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    checks,
    timestamp,
  };

  await writeJson(
    path.join(validationsDir, `quality_${stageId}_${timestamp.replace(/[:.]/g, '-').slice(0, 19)}.json`),
    result
  );

  // Log summary
  logInfo('');
  logInfo('==========================================');
  logInfo(`  Quality Validation: ${stageId}`);
  logInfo('==========================================');
  logInfo('');

  for (const check of checks) {
    if (check.passed) {
      logSuccess(`[PASS] ${check.name}: ${check.message}`);
    } else if (check.level === 'blocking') {
      logError(`[BLOCKING] ${check.name}: ${check.message}`);
    } else if (check.level === 'critical') {
      logError(`[CRITICAL] ${check.name}: ${check.message}`);
    } else {
      logWarning(`[WARNING] ${check.name}: ${check.message}`);
    }
  }

  logInfo('');
  if (result.success) {
    logSuccess('Quality validation PASSED');
  } else if (result.level === 'blocking') {
    logError('Quality validation BLOCKED - Stage cannot proceed');
  } else if (result.level === 'critical') {
    logError('Quality validation FAILED - PDCA retry required');
  }

  return result;
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const stageId = process.argv[2] as StageId | undefined;
  const projectRoot = process.cwd();

  if (!stageId || !STAGE_IDS.includes(stageId)) {
    logError(`Invalid stage ID: ${stageId}`);
    logInfo(`Valid stage IDs: ${STAGE_IDS.join(', ')}`);
    process.exit(1);
  }

  try {
    const result = await validateStageQuality(projectRoot, stageId);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    logError(error instanceof Error ? error.message : 'Quality validation failed');
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('quality-validator')) {
  main().catch(console.error);
}
