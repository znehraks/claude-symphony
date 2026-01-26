#!/usr/bin/env tsx
/**
 * Build JSON Schema files from Zod schemas
 * Generates IDE-compatible schemas for JSONC configuration files
 */
import { zodToJsonSchema } from 'zod-to-json-schema';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Import all Zod schemas
import {
  StageConfigSchema,
  PipelineConfigSchema,
  ModelsConfigSchema,
  AICollaborationConfigSchema,
  ContextConfigSchema,
  AutoCheckpointConfigSchema,
  GitConfigSchema,
  OutputValidationConfigSchema,
  TechStackConfigSchema,
} from '../src/types/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SCHEMAS_DIR = path.join(ROOT_DIR, 'schemas');

// Schema definitions with metadata
const schemas = {
  stage: {
    schema: StageConfigSchema,
    title: 'Stage Configuration',
    description: 'Configuration for a pipeline stage',
  },
  pipeline: {
    schema: PipelineConfigSchema,
    title: 'Pipeline Configuration',
    description: 'Main pipeline configuration with 10 stages',
  },
  models: {
    schema: ModelsConfigSchema,
    title: 'Models Configuration',
    description: 'AI model definitions and assignments',
  },
  ai_collaboration: {
    schema: AICollaborationConfigSchema,
    title: 'AI Collaboration Configuration',
    description: 'Multi-AI collaboration mode settings',
  },
  context: {
    schema: ContextConfigSchema,
    title: 'Context Configuration',
    description: 'Context management thresholds and auto-save settings',
  },
  auto_checkpoint: {
    schema: AutoCheckpointConfigSchema,
    title: 'Auto Checkpoint Configuration',
    description: 'Automatic checkpoint triggers and retention',
  },
  git: {
    schema: GitConfigSchema,
    title: 'Git Configuration',
    description: 'Git auto-commit rules and commit format',
  },
  output_validation: {
    schema: OutputValidationConfigSchema,
    title: 'Output Validation Configuration',
    description: 'Stage output validation rules and quality thresholds',
  },
  tech_stack: {
    schema: TechStackConfigSchema,
    title: 'Tech Stack Configuration',
    description: 'Tech stack preset and provider configuration',
  },
};

async function buildSchemas(): Promise<void> {
  console.log('Building JSON Schemas from Zod schemas...\n');

  // Ensure schemas directory exists
  await fs.mkdir(SCHEMAS_DIR, { recursive: true });

  const results: { name: string; path: string; success: boolean }[] = [];

  for (const [name, { schema, title, description }] of Object.entries(schemas)) {
    try {
      // Convert Zod schema to JSON Schema
      const jsonSchema = zodToJsonSchema(schema, {
        name: title,
        $refStrategy: 'none', // Inline all references for better IDE support
        errorMessages: true,
      });

      // Add additional metadata
      const enhancedSchema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: `https://claude-symphony.dev/schemas/${name}.schema.json`,
        title,
        description,
        ...jsonSchema,
      };

      // Write schema file
      const schemaPath = path.join(SCHEMAS_DIR, `${name}.schema.json`);
      await fs.writeFile(
        schemaPath,
        JSON.stringify(enhancedSchema, null, 2),
        'utf8'
      );

      results.push({ name, path: schemaPath, success: true });
      console.log(`  ✓ ${name}.schema.json`);
    } catch (error) {
      results.push({ name, path: '', success: false });
      console.error(`  ✗ ${name}.schema.json - ${error}`);
    }
  }

  // Generate index file for easy imports
  const indexContent = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Claude Symphony Schema Index',
    description: 'Index of all configuration schemas',
    schemas: Object.keys(schemas).reduce(
      (acc, name) => {
        acc[name] = `./${name}.schema.json`;
        return acc;
      },
      {} as Record<string, string>
    ),
  };

  await fs.writeFile(
    path.join(SCHEMAS_DIR, 'index.json'),
    JSON.stringify(indexContent, null, 2),
    'utf8'
  );

  // Summary
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(`\nSchema build complete:`);
  console.log(`  ${successCount} schemas generated`);
  if (failCount > 0) {
    console.log(`  ${failCount} schemas failed`);
  }
  console.log(`  Output: ${SCHEMAS_DIR}/`);
}

// Run the build
buildSchemas().catch((error) => {
  console.error('Schema build failed:', error);
  process.exit(1);
});
