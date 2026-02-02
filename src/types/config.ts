/**
 * Configuration type definitions and Zod schemas
 * With .describe() annotations for JSON Schema generation
 */
import { z } from 'zod';
import { StageIdSchema, AIModelSchema, ExecutionModeSchema, CollaborationModeSchema } from './stage.js';

/**
 * Stage config.yaml schema
 */
export const StageConfigSchema = z.object({
  stage: z.object({
    id: StageIdSchema.describe('Stage identifier'),
    name: z.string().describe('Human-readable stage name'),
    description: z.string().optional().describe('Stage description'),
  }).describe('Stage metadata'),
  models: z.object({
    primary: AIModelSchema.describe('Primary AI model for this stage'),
    secondary: AIModelSchema.optional().describe('Secondary AI model for parallel execution'),
    collaboration: CollaborationModeSchema.optional().describe('How primary and secondary models collaborate'),
  }).describe('AI model configuration'),
  execution: z.object({
    mode: ExecutionModeSchema.describe('Execution mode for the stage'),
    timeout: z.number().positive().optional().describe('Stage timeout in seconds'),
  }).optional().describe('Execution settings'),
  inputs: z.object({
    required: z.array(z.string()).optional().describe('Required input files from previous stages'),
    optional: z.array(z.string()).optional().describe('Optional input files'),
  }).optional().describe('Input file requirements'),
  outputs: z.object({
    required: z.array(z.string()).optional().describe('Required output files to generate'),
    templates: z.array(z.string()).optional().describe('Template files to use for outputs'),
  }).optional().describe('Output file configuration'),
  auto_invoke: z.object({
    enabled: z.boolean().describe('Whether to auto-invoke external AI'),
    model: AIModelSchema.optional().describe('Model to invoke'),
    wrapper: z.string().optional().describe('Wrapper script path'),
    prompt_file: z.string().optional().describe('Prompt file to use'),
    fallback: z.object({
      enabled: z.boolean().describe('Enable fallback on failure'),
      model: AIModelSchema.optional().describe('Fallback model'),
    }).optional().describe('Fallback configuration'),
  }).optional().describe('Auto-invocation settings for external AI'),
  transition: z.object({
    prerequisites: z.array(StageIdSchema).optional().describe('Stages that must complete first'),
    require_handoff: z.boolean().optional().describe('Require HANDOFF.md for transition'),
    require_checkpoint: z.boolean().optional().describe('Require checkpoint for transition'),
  }).optional().describe('Stage transition requirements'),
  mcp_servers: z.array(z.string()).optional().describe('Required MCP servers for this stage'),
}).describe('Stage configuration');

export type StageConfig = z.infer<typeof StageConfigSchema>;

/**
 * Pipeline config schema
 */
export const PipelineConfigSchema = z.object({
  pipeline: z.object({
    name: z.string().describe('Pipeline name'),
    version: z.string().describe('Pipeline version (semver)'),
    description: z.string().optional().describe('Pipeline description'),
  }).describe('Pipeline metadata'),
  stages: z.array(z.object({
    id: StageIdSchema.describe('Stage identifier'),
    name: z.string().describe('Stage display name'),
    description: z.string().optional().describe('Stage description'),
  })).describe('10-stage pipeline definition'),
  sprint_mode: z.object({
    enabled: z.boolean().describe('Enable sprint-based iteration'),
    sprint_config: z.object({
      default_sprints: z.number().positive().describe('Default number of sprints'),
      max_sprints: z.number().positive().optional().describe('Maximum sprints allowed'),
    }).describe('Sprint configuration'),
  }).optional().describe('Sprint mode settings'),
  context_management: z.object({
    warning_threshold: z.number().min(0).max(100).describe('Warning threshold (% remaining)'),
    action_threshold: z.number().min(0).max(100).describe('Action threshold (% remaining)'),
    critical_threshold: z.number().min(0).max(100).describe('Critical threshold (% remaining)'),
    auto_save_interval: z.number().positive().describe('Tasks between auto-saves'),
  }).optional().describe('Context management thresholds'),
}).describe('Pipeline configuration');

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

/**
 * Models config schema
 */
export const ModelsConfigSchema = z.object({
  models: z.record(z.string(), z.object({
    name: z.string().describe('Model display name'),
    cli_command: z.string().optional().describe('CLI command to invoke'),
    wrapper: z.string().optional().describe('Wrapper script path'),
    modes: z.record(z.string(), z.object({
      enabled: z.boolean().describe('Mode availability'),
      description: z.string().optional().describe('Mode description'),
    })).optional().describe('Available execution modes'),
    fallback_to: z.string().optional().describe('Fallback model on error'),
  })).describe('AI model definitions'),
}).describe('Models configuration');

export type ModelsConfig = z.infer<typeof ModelsConfigSchema>;

/**
 * AI collaboration config schema
 */
export const AICollaborationConfigSchema = z.object({
  execution_policy: z.object({
    default_mode: CollaborationModeSchema.describe('Default collaboration mode'),
    stage_classification: z.object({
      parallel_capable: z.array(StageIdSchema).describe('Stages supporting parallel execution'),
      sequential_only: z.array(StageIdSchema).describe('Stages requiring sequential execution'),
    }).describe('Stage capability classification'),
  }).describe('Execution policy settings'),
  consolidation: z.object({
    default_strategy: z.string().describe('Output consolidation strategy'),
    quality_threshold: z.number().min(0).max(1).describe('Quality threshold (0-1)'),
  }).optional().describe('Output consolidation settings'),
}).describe('AI collaboration configuration');

export type AICollaborationConfig = z.infer<typeof AICollaborationConfigSchema>;

/**
 * Tech stack config schema
 */
export const TechStackConfigSchema = z.object({
  tech_stack: z.object({
    preset: z.string().describe('Tech stack preset name'),
    database: z.object({
      provider: z.string().describe('Database provider'),
      configured: z.boolean().describe('Configuration status'),
    }).describe('Database configuration'),
    hosting: z.object({
      provider: z.string().describe('Hosting provider'),
      auto_deploy: z.boolean().describe('Enable auto-deployment'),
      configured: z.boolean().describe('Configuration status'),
    }).describe('Hosting configuration'),
    env_vars: z.object({
      required: z.array(z.string()).describe('Required environment variables'),
      configured: z.boolean().describe('Configuration status'),
    }).describe('Environment variables'),
    selected_at: z.string().optional().describe('Selection timestamp'),
  }).describe('Tech stack selection'),
}).describe('Tech stack configuration');

export type TechStackConfig = z.infer<typeof TechStackConfigSchema>;


/**
 * Auto checkpoint config schema
 */
export const AutoCheckpointConfigSchema = z.object({
  auto_checkpoint: z.object({
    enabled: z.boolean().describe('Enable auto-checkpoint'),
    triggers: z.object({
      task_completion: z.object({
        enabled: z.boolean().describe('Trigger on task completion'),
        threshold: z.number().positive().describe('Tasks before checkpoint'),
      }).describe('Task-based trigger'),
      file_changes: z.object({
        enabled: z.boolean().describe('Trigger on file changes'),
        threshold: z.number().positive().describe('Lines changed threshold'),
      }).describe('File change trigger'),
      destructive_operation: z.object({
        enabled: z.boolean().describe('Trigger before destructive ops'),
        patterns: z.array(z.string()).describe('Patterns: rm, delete, drop, etc.'),
      }).describe('Destructive operation trigger'),
      time_based: z.object({
        enabled: z.boolean().describe('Trigger on time interval'),
        interval_minutes: z.number().positive().describe('Minutes between checkpoints'),
      }).describe('Time-based trigger'),
    }).describe('Checkpoint triggers'),
    retention: z.object({
      max_checkpoints: z.number().positive().describe('Maximum checkpoints to keep'),
      preserve_milestones: z.boolean().describe('Preserve stage completion checkpoints'),
    }).describe('Checkpoint retention policy'),
  }).describe('Auto-checkpoint settings'),
}).describe('Auto-checkpoint configuration');

export type AutoCheckpointConfig = z.infer<typeof AutoCheckpointConfigSchema>;

/**
 * Git config schema
 */
export const GitConfigSchema = z.object({
  auto_commit: z.object({
    enabled: z.boolean().describe('Enable auto-commit'),
    triggers: z.object({
      on_task_completion: z.boolean().describe('Commit on task completion'),
      on_stage_completion: z.boolean().describe('Commit on stage completion'),
      on_checkpoint: z.boolean().describe('Commit on checkpoint creation'),
    }).describe('Auto-commit triggers'),
  }).describe('Auto-commit settings'),
  commit_format: z.object({
    type: z.string().describe('Conventional commit type'),
    scope_by_stage: z.record(z.string(), z.string()).optional().describe('Scope mapping by stage'),
  }).describe('Commit message format'),
  branch_naming: z.object({
    pattern: z.string().describe('Branch naming pattern'),
    include_stage: z.boolean().describe('Include stage in branch name'),
  }).optional().describe('Branch naming convention'),
}).describe('Git configuration');

export type GitConfig = z.infer<typeof GitConfigSchema>;

/**
 * Output validation config schema
 */
export const OutputValidationConfigSchema = z.object({
  validation: z.object({
    enabled: z.boolean().describe('Enable output validation'),
    stages: z.record(z.string(), z.object({
      required_outputs: z.array(z.string()).describe('Required output files'),
      validation_commands: z.array(z.object({
        command: z.string().describe('Validation command'),
        description: z.string().optional().describe('Command description'),
      })).optional().describe('Validation commands to run'),
    })).describe('Stage-specific validation rules'),
  }).describe('Validation settings'),
  quality_thresholds: z.object({
    code_quality: z.number().min(0).max(1).describe('Code quality threshold (0-1)'),
    test_coverage: z.number().min(0).max(100).describe('Test coverage threshold (%)'),
  }).describe('Quality thresholds'),
}).describe('Output validation configuration');

export type OutputValidationConfig = z.infer<typeof OutputValidationConfigSchema>;

/**
 * Agent definition schema (agent.json)
 */
export const AgentConfigSchema = z.object({
  name: z.string().describe('Agent name (should match directory name)'),
  description: z.string().describe('Human-readable description of the agent\'s purpose'),
  tools: z.array(z.string()).optional().describe('Allowed tools (if undefined, inherits all tools)'),
  model: z.enum(['reasoning', 'balanced', 'fast', 'inherit']).optional().describe('Model role: reasoning (deep thinking), balanced (general), fast (quick tasks)'),
  permissionMode: z.enum(['default', 'acceptEdits', 'bypassPermissions', 'plan']).optional()
    .describe('Permission mode for tool execution'),
  extendedThinking: z.boolean().optional().describe('Enable extended thinking (increases quality, 2-3x cost)'),
  sessionPersistence: z.boolean().optional().describe('Enable session persistence across invocations'),
  mcpServers: z.array(z.string()).optional().describe('MCP server names to enable (e.g., serena, context7, playwright)'),
  executionMode: z.enum(['foreground', 'background']).optional().describe('Execution mode (foreground blocks, background runs async)'),
}).describe('Agent configuration');

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
