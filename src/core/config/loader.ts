/**
 * Configuration loader
 * Loads and validates configuration files (JSONC preferred, YAML fallback)
 */
import path from 'path';
import { loadYaml, loadYamlWithSchema, yamlExists } from '../../utils/yaml.js';
import { loadJsonc, loadJsoncWithSchema, jsoncExists } from '../../utils/jsonc.js';
import {
  StageConfigSchema,
  PipelineConfigSchema,
  ModelsConfigSchema,
  AICollaborationConfigSchema,
  type StageConfig,
  type PipelineConfig,
  type ModelsConfig,
  type AICollaborationConfig,
} from '../../types/config.js';
import type { StageId } from '../../types/stage.js';
import type { z } from 'zod';

export interface ProjectPaths {
  root: string;
  config: string;
  stages: string;
  state: string;
  scripts: string;
}

/**
 * Get project paths from root directory
 */
export function getProjectPaths(projectRoot: string): ProjectPaths {
  return {
    root: projectRoot,
    config: path.join(projectRoot, 'config'),
    stages: path.join(projectRoot, 'stages'),
    state: path.join(projectRoot, 'state'),
    scripts: path.join(projectRoot, 'scripts'),
  };
}

/**
 * Load configuration with JSONC priority, YAML fallback
 */
async function loadConfigWithFallback<T extends z.ZodType>(
  basePath: string,
  configName: string,
  schema: T
): Promise<z.infer<T> | null> {
  const jsoncPath = `${basePath}/${configName}.jsonc`;
  const yamlPath = `${basePath}/${configName}.yaml`;

  // Try JSONC first
  if (jsoncExists(jsoncPath)) {
    return loadJsoncWithSchema(jsoncPath, schema);
  }

  // Fall back to YAML
  if (yamlExists(yamlPath)) {
    return loadYamlWithSchema(yamlPath, schema);
  }

  return null;
}

/**
 * Load raw configuration without schema validation (JSONC priority)
 */
async function loadRawConfigWithFallback<T>(
  basePath: string,
  configName: string
): Promise<T | null> {
  const jsoncPath = `${basePath}/${configName}.jsonc`;
  const yamlPath = `${basePath}/${configName}.yaml`;

  // Try JSONC first
  if (jsoncExists(jsoncPath)) {
    return loadJsonc<T>(jsoncPath);
  }

  // Fall back to YAML
  if (yamlExists(yamlPath)) {
    return loadYaml<T>(yamlPath);
  }

  return null;
}

/**
 * Load pipeline configuration
 */
export async function loadPipelineConfig(
  projectRoot: string
): Promise<PipelineConfig | null> {
  return loadConfigWithFallback(
    path.join(projectRoot, 'config'),
    'pipeline',
    PipelineConfigSchema
  );
}

/**
 * Load models configuration
 */
export async function loadModelsConfig(
  projectRoot: string
): Promise<ModelsConfig | null> {
  return loadConfigWithFallback(
    path.join(projectRoot, 'config'),
    'models',
    ModelsConfigSchema
  );
}

/**
 * Load AI collaboration configuration
 */
export async function loadAICollaborationConfig(
  projectRoot: string
): Promise<AICollaborationConfig | null> {
  return loadConfigWithFallback(
    path.join(projectRoot, 'config'),
    'ai_collaboration',
    AICollaborationConfigSchema
  );
}

/**
 * Load stage configuration
 */
export async function loadStageConfig(
  projectRoot: string,
  stageId: StageId
): Promise<StageConfig | null> {
  return loadConfigWithFallback(
    path.join(projectRoot, 'stages', stageId),
    'config',
    StageConfigSchema
  );
}

/**
 * Load any config file without schema validation (JSONC priority, YAML fallback)
 */
export async function loadConfig<T>(
  projectRoot: string,
  configName: string
): Promise<T | null> {
  return loadRawConfigWithFallback<T>(
    path.join(projectRoot, 'config'),
    configName
  );
}

/**
 * Check if a config file exists (checks both .jsonc and .yaml)
 */
export function configExists(projectRoot: string, configName: string): boolean {
  const jsoncPath = path.join(projectRoot, 'config', `${configName}.jsonc`);
  const yamlPath = path.join(projectRoot, 'config', `${configName}.yaml`);
  return jsoncExists(jsoncPath) || yamlExists(yamlPath);
}

/**
 * Check if a stage config exists (checks both .jsonc and .yaml)
 */
export function stageConfigExists(projectRoot: string, stageId: StageId): boolean {
  const jsoncPath = path.join(projectRoot, 'stages', stageId, 'config.jsonc');
  const yamlPath = path.join(projectRoot, 'stages', stageId, 'config.yaml');
  return jsoncExists(jsoncPath) || yamlExists(yamlPath);
}

/**
 * Get all available config file names (supports .jsonc and .yaml)
 */
export function getAvailableConfigs(projectRoot: string): string[] {
  const configDir = path.join(projectRoot, 'config');
  const fs = require('fs');

  try {
    const files = fs.readdirSync(configDir) as string[];
    const configNames = new Set<string>();

    for (const f of files) {
      if (f.endsWith('.jsonc')) {
        configNames.add(f.replace('.jsonc', ''));
      } else if (f.endsWith('.yaml')) {
        configNames.add(f.replace('.yaml', ''));
      }
    }

    return Array.from(configNames);
  } catch {
    return [];
  }
}

/**
 * Config loader class for managing multiple configurations
 */
export class ConfigLoader {
  private projectRoot: string;
  private cache: Map<string, unknown> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load config with caching
   */
  async load<T>(configName: string): Promise<T | null> {
    if (this.cache.has(configName)) {
      return this.cache.get(configName) as T;
    }

    const config = await loadConfig<T>(this.projectRoot, configName);
    if (config) {
      this.cache.set(configName, config);
    }
    return config;
  }

  /**
   * Load pipeline config
   */
  async loadPipeline(): Promise<PipelineConfig | null> {
    return loadPipelineConfig(this.projectRoot);
  }

  /**
   * Load models config
   */
  async loadModels(): Promise<ModelsConfig | null> {
    return loadModelsConfig(this.projectRoot);
  }

  /**
   * Load AI collaboration config
   */
  async loadAICollaboration(): Promise<AICollaborationConfig | null> {
    return loadAICollaborationConfig(this.projectRoot);
  }

  /**
   * Load stage config
   */
  async loadStage(stageId: StageId): Promise<StageConfig | null> {
    return loadStageConfig(this.projectRoot, stageId);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get project paths
   */
  getPaths(): ProjectPaths {
    return getProjectPaths(this.projectRoot);
  }
}
