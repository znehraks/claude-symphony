#!/usr/bin/env tsx
/**
 * Migrate YAML configuration files to JSONC format
 * Converts template/config YAML files and stage config files to JSONC
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT_DIR, 'template');
const CONFIG_DIR = path.join(TEMPLATE_DIR, 'config');
const STAGES_DIR = path.join(TEMPLATE_DIR, 'stages');

// Schema URL base for $schema references (relative from template/config/)
const SCHEMA_BASE_CONFIG = '../../schemas';
// Schema URL base for stage configs (relative from template/stages/XX-stage/)
const SCHEMA_BASE_STAGE = '../../../schemas';

// Mapping of config files to their schema names
const CONFIG_SCHEMA_MAP: Record<string, string> = {
  pipeline: 'pipeline',
  models: 'models',
  context: 'context',
  ai_collaboration: 'ai_collaboration',
  auto_checkpoint: 'auto_checkpoint',
  git: 'git',
  output_validation: 'output_validation',
  tech_stack_presets: 'tech_stack',
  // Other configs without specific schemas will use a generic approach
};

interface MigrationResult {
  source: string;
  target: string;
  success: boolean;
  error?: string;
}

/**
 * Convert YAML content to JSONC with optional schema reference
 */
function yamlToJsonc(
  yamlContent: string,
  schemaRef?: string,
  comment?: string
): string {
  // Parse YAML
  const data = yaml.load(yamlContent);

  // Build the object with $schema first if provided
  const output: Record<string, unknown> = {};
  if (schemaRef) {
    output.$schema = schemaRef;
  }

  // Merge the parsed data
  Object.assign(output, data);

  // Convert to JSON with formatting
  let jsonContent = JSON.stringify(output, null, 2);

  // Add top comment if provided
  if (comment) {
    jsonContent = `// ${comment}\n${jsonContent}`;
  }

  return jsonContent;
}

/**
 * Extract comment from YAML file (first line if it starts with #)
 */
function extractYamlComment(content: string): string | undefined {
  const lines = content.split('\n');
  if (lines[0]?.startsWith('#')) {
    return lines[0].substring(1).trim();
  }
  return undefined;
}

/**
 * Migrate a single YAML file to JSONC
 */
async function migrateFile(
  sourcePath: string,
  targetPath: string,
  schemaName?: string,
  schemaBase?: string
): Promise<MigrationResult> {
  try {
    // Read YAML content
    const yamlContent = await fs.readFile(sourcePath, 'utf8');

    // Extract comment from YAML
    const comment = extractYamlComment(yamlContent);

    // Determine schema reference
    let schemaRef: string | undefined;
    if (schemaName && schemaBase) {
      schemaRef = `${schemaBase}/${schemaName}.schema.json`;
    }

    // Convert to JSONC
    const jsoncContent = yamlToJsonc(yamlContent, schemaRef, comment);

    // Write JSONC file
    await fs.writeFile(targetPath, jsoncContent, 'utf8');

    return {
      source: sourcePath,
      target: targetPath,
      success: true,
    };
  } catch (error) {
    return {
      source: sourcePath,
      target: targetPath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Migrate all config files in template/config/
 */
async function migrateConfigFiles(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  try {
    const files = await fs.readdir(CONFIG_DIR);
    const yamlFiles = files.filter((f) => f.endsWith('.yaml'));

    for (const file of yamlFiles) {
      const baseName = file.replace('.yaml', '');
      const sourcePath = path.join(CONFIG_DIR, file);
      const targetPath = path.join(CONFIG_DIR, `${baseName}.jsonc`);

      // Get schema name if available
      const schemaName = CONFIG_SCHEMA_MAP[baseName];

      const result = await migrateFile(sourcePath, targetPath, schemaName, SCHEMA_BASE_CONFIG);
      results.push(result);
    }
  } catch (error) {
    console.error('Error reading config directory:', error);
  }

  return results;
}

/**
 * Migrate all stage config files in template/stages subdirectories
 */
async function migrateStageConfigs(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  try {
    const stages = await fs.readdir(STAGES_DIR);

    for (const stage of stages) {
      const stagePath = path.join(STAGES_DIR, stage);
      const stat = await fs.stat(stagePath);

      if (!stat.isDirectory()) continue;

      const sourceConfig = path.join(stagePath, 'config.yaml');
      const targetConfig = path.join(stagePath, 'config.jsonc');

      // Check if config.yaml exists
      try {
        await fs.access(sourceConfig);
        const result = await migrateFile(sourceConfig, targetConfig, 'stage', SCHEMA_BASE_STAGE);
        results.push(result);
      } catch {
        // config.yaml doesn't exist, skip
      }
    }
  } catch (error) {
    console.error('Error reading stages directory:', error);
  }

  return results;
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('Migrating YAML files to JSONC...\n');

  // Migrate config files
  console.log('Config files (template/config/):');
  const configResults = await migrateConfigFiles();
  for (const result of configResults) {
    const status = result.success ? '✓' : '✗';
    const fileName = path.basename(result.target);
    console.log(`  ${status} ${fileName}${result.error ? ` - ${result.error}` : ''}`);
  }

  // Migrate stage configs
  console.log('\nStage configs (template/stages/*/config.yaml):');
  const stageResults = await migrateStageConfigs();
  for (const result of stageResults) {
    const status = result.success ? '✓' : '✗';
    const relativePath = path.relative(TEMPLATE_DIR, result.target);
    console.log(`  ${status} ${relativePath}${result.error ? ` - ${result.error}` : ''}`);
  }

  // Summary
  const allResults = [...configResults, ...stageResults];
  const successCount = allResults.filter((r) => r.success).length;
  const failCount = allResults.filter((r) => !r.success).length;

  console.log(`\nMigration complete:`);
  console.log(`  ${successCount} files converted`);
  if (failCount > 0) {
    console.log(`  ${failCount} files failed`);
  }

  console.log(`\nNote: Original .yaml files are preserved.`);
  console.log(`To remove them after verification, run:`);
  console.log(`  rm template/config/*.yaml template/stages/*/config.yaml`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const removeYaml = args.includes('--remove-yaml');

if (dryRun) {
  console.log('Dry run mode - no files will be modified\n');
  // TODO: Implement dry run logic
}

// Run migration
migrate()
  .then(async () => {
    if (removeYaml) {
      console.log('\nRemoving original YAML files...');
      // This is a placeholder - implement if needed
    }
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
