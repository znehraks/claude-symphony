/**
 * Configuration Validator
 * Validates cross-file YAML consistency across configuration files.
 * Migrated from validate-config.sh
 */
import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { loadYaml } from '../../utils/yaml.js';
import { commandExists } from '../../utils/shell.js';
import { log, result } from '../../utils/logger.js';
import type { StageId } from '../../types/stage.js';
import { STAGE_IDS } from '../../types/stage.js';

/**
 * Validation severity levels
 */
export type Severity = 'critical' | 'high' | 'medium';

/**
 * Validation result entry
 */
export interface ValidationResult {
  severity: Severity;
  rule: string;
  stage?: string;
  message: string;
  fixable: boolean;
  fixed?: boolean;
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  critical: number;
  high: number;
  medium: number;
  passed: number;
  fixed: number;
  results: ValidationResult[];
}

/**
 * Validator options
 */
export interface ValidatorOptions {
  fix?: boolean;
  verbose?: boolean;
  stage?: string;
  rule?: string;
}

/**
 * Available validation rules
 */
export const VALIDATION_RULES = [
  'model_references',
  'parallel_alignment',
  'collaboration_consistency',
  'file_references',
  'auto_invoke',
  'execution_mode',
  'ai_wrapper_health',
  'mcp_servers',
  'epic_cycles',
  'requirements_refinement',
  'implementation_order',
  'notion_integration',
  'prerequisites',
] as const;

export type ValidationRule = (typeof VALIDATION_RULES)[number];

/**
 * Configuration Validator class
 */
export class ConfigValidator {
  private projectRoot: string;
  private configDir: string;
  private stagesDir: string;
  private options: ValidatorOptions;
  private summary: ValidationSummary;

  constructor(projectRoot: string, options: ValidatorOptions = {}) {
    this.projectRoot = projectRoot;
    this.configDir = path.join(projectRoot, 'config');
    this.stagesDir = path.join(projectRoot, 'stages');
    this.options = options;
    this.summary = {
      critical: 0,
      high: 0,
      medium: 0,
      passed: 0,
      fixed: 0,
      results: [],
    };
  }

  /**
   * Add a validation result
   */
  private addResult(
    severity: Severity,
    rule: string,
    message: string,
    stage?: string,
    fixable: boolean = false,
    fixed: boolean = false
  ): void {
    if (fixed) {
      this.summary.fixed++;
      result.fixed(`${stage ? `${stage}: ` : ''}${message}`);
    } else {
      switch (severity) {
        case 'critical':
          this.summary.critical++;
          result.critical(`${stage ? `${stage}: ` : ''}${message}`);
          break;
        case 'high':
          this.summary.high++;
          result.high(`${stage ? `${stage}: ` : ''}${message}`);
          break;
        case 'medium':
          this.summary.medium++;
          result.medium(`${stage ? `${stage}: ` : ''}${message}`);
          break;
      }
    }

    this.summary.results.push({
      severity,
      rule,
      stage,
      message,
      fixable,
      fixed,
    });
  }

  /**
   * Add a pass result
   */
  private addPass(message: string, stage?: string): void {
    this.summary.passed++;
    if (this.options.verbose) {
      result.pass(`${stage ? `${stage}: ` : ''}${message}`);
    }
  }

  /**
   * Get stages to validate
   */
  private getStagesToValidate(): string[] {
    if (this.options.stage) {
      return [this.options.stage];
    }
    return [...STAGE_IDS];
  }

  /**
   * Get defined models from models.yaml
   */
  private async getDefinedModels(): Promise<string[]> {
    const modelsConfig = await loadYaml<{ models: Record<string, unknown> }>(
      path.join(this.configDir, 'models.yaml')
    );
    if (!modelsConfig?.models) return [];
    return Object.keys(modelsConfig.models);
  }

  /**
   * Get parallel capable stages from ai_collaboration.yaml
   */
  private async getParallelStages(): Promise<string[]> {
    const collabConfig = await loadYaml<{
      execution_policy?: {
        stage_classification?: {
          parallel_capable?: string[];
        };
      };
    }>(path.join(this.configDir, 'ai_collaboration.yaml'));
    return collabConfig?.execution_policy?.stage_classification?.parallel_capable ?? [];
  }

  /**
   * Rule 1: Model References (CRITICAL)
   * Every model in stage config must exist in models.yaml
   */
  async validateModelReferences(): Promise<void> {
    log('\n▸ Rule: model_references [CRITICAL]', 'blue');

    const definedModels = await this.getDefinedModels();
    const stages = this.getStagesToValidate();

    for (const stage of stages) {
      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) continue;

      const stageConfig = await loadYaml<{
        models?: {
          primary?: string;
          secondary?: string;
        };
        auto_invoke?: {
          model?: string;
          fallback?: {
            model?: string;
          };
        };
      }>(configPath);

      if (!stageConfig) continue;

      // Check primary model
      const primary = stageConfig.models?.primary;
      if (primary) {
        if (definedModels.includes(primary)) {
          this.addPass(`primary model '${primary}' valid`, stage);
        } else {
          this.addResult('critical', 'model_references', `primary model '${primary}' not defined in models.yaml`, stage);
        }
      }

      // Check secondary model
      const secondary = stageConfig.models?.secondary;
      if (secondary) {
        if (definedModels.includes(secondary)) {
          this.addPass(`secondary model '${secondary}' valid`, stage);
        } else {
          this.addResult('critical', 'model_references', `secondary model '${secondary}' not defined in models.yaml`, stage);
        }
      }

      // Check auto_invoke model
      const autoModel = stageConfig.auto_invoke?.model;
      if (autoModel) {
        if (definedModels.includes(autoModel)) {
          this.addPass(`auto_invoke model '${autoModel}' valid`, stage);
        } else {
          this.addResult('critical', 'model_references', `auto_invoke model '${autoModel}' not defined in models.yaml`, stage);
        }
      }

      // Check fallback model
      const fallbackModel = stageConfig.auto_invoke?.fallback?.model;
      if (fallbackModel) {
        if (definedModels.includes(fallbackModel)) {
          this.addPass(`fallback model '${fallbackModel}' valid`, stage);
        } else {
          this.addResult('critical', 'model_references', `fallback model '${fallbackModel}' not defined in models.yaml`, stage);
        }
      }
    }
  }

  /**
   * Rule 2: Parallel Alignment (CRITICAL)
   * parallel_capable stages must match config.yaml collaboration settings
   */
  async validateParallelAlignment(): Promise<void> {
    log('\n▸ Rule: parallel_alignment [CRITICAL]', 'blue');

    const parallelStages = await this.getParallelStages();
    const stages = this.getStagesToValidate();

    for (const stage of stages) {
      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) continue;

      const stageConfig = await loadYaml<{
        models?: {
          collaboration?: string;
        };
      }>(configPath);

      if (!stageConfig) continue;

      const collabMode = stageConfig.models?.collaboration;
      const isParallelCapable = parallelStages.includes(stage);

      if (isParallelCapable) {
        if (collabMode === 'parallel') {
          this.addPass(`parallel classification matches config (parallel)`, stage);
        } else {
          this.addResult(
            'critical',
            'parallel_alignment',
            `listed as parallel_capable but config has collaboration='${collabMode}'`,
            stage,
            true
          );
        }
      } else {
        if (collabMode === 'parallel') {
          this.addResult(
            'critical',
            'parallel_alignment',
            `has parallel collaboration but not in parallel_capable list`,
            stage
          );
        } else {
          this.addPass(`sequential classification matches config`, stage);
        }
      }
    }
  }

  /**
   * Rule 3: Collaboration Consistency (CRITICAL)
   * Parallel stages need 2+ models configured
   */
  async validateCollaborationConsistency(): Promise<void> {
    log('\n▸ Rule: collaboration_consistency [CRITICAL]', 'blue');

    const parallelStages = await this.getParallelStages();

    for (const stage of parallelStages) {
      if (this.options.stage && this.options.stage !== stage) continue;

      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) {
        this.addResult('critical', 'collaboration_consistency', `parallel stage missing config.yaml`, stage);
        continue;
      }

      const stageConfig = await loadYaml<{
        models?: {
          primary?: string;
          secondary?: string;
        };
      }>(configPath);

      if (!stageConfig) continue;

      let modelCount = 0;
      if (stageConfig.models?.primary) modelCount++;
      if (stageConfig.models?.secondary) modelCount++;

      if (modelCount >= 2) {
        this.addPass(`has ${modelCount} models for parallel execution`, stage);
      } else {
        this.addResult(
          'critical',
          'collaboration_consistency',
          `parallel stage needs 2+ models, has ${modelCount}`,
          stage
        );
      }
    }
  }

  /**
   * Rule 4: File References (HIGH)
   * Required input/output files exist
   */
  async validateFileReferences(): Promise<void> {
    log('\n▸ Rule: file_references [HIGH]', 'blue');

    const stages = this.getStagesToValidate();

    for (const stage of stages) {
      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) continue;

      const stageConfig = await loadYaml<{
        inputs?: {
          required?: string[];
        };
      }>(configPath);

      if (!stageConfig) continue;

      // Check required input files
      const requiredInputs = stageConfig.inputs?.required ?? [];
      for (const input of requiredInputs) {
        const inputPath = path.join(this.stagesDir, stage, input);
        if (existsSync(inputPath)) {
          this.addPass(`input file exists: ${input}`, stage);
        } else if (input.startsWith('../')) {
          // Cross-stage reference
          const refPath = path.join(this.stagesDir, stage, input);
          if (existsSync(refPath)) {
            this.addPass(`cross-stage input exists: ${input}`, stage);
          } else {
            this.addResult('high', 'file_references', `required input missing: ${input}`, stage);
          }
        } else {
          this.addResult('high', 'file_references', `required input missing: ${input}`, stage);
        }
      }

      // Check templates directory
      const templatesDir = path.join(this.stagesDir, stage, 'templates');
      if (existsSync(templatesDir)) {
        const templates = readdirSync(templatesDir).filter(f => f.endsWith('.md'));
        if (templates.length > 0) {
          this.addPass(`${templates.length} output template(s) found`, stage);
        }
      }

      // Check CLAUDE.md exists
      const claudeMd = path.join(this.stagesDir, stage, 'CLAUDE.md');
      if (existsSync(claudeMd)) {
        this.addPass(`CLAUDE.md exists`, stage);
      } else {
        this.addResult('high', 'file_references', `CLAUDE.md missing (stage cannot execute properly)`, stage);
      }
    }
  }

  /**
   * Rule 5: Auto-Invoke (HIGH)
   * Wrapper scripts exist, fallback model defined
   */
  async validateAutoInvoke(): Promise<void> {
    log('\n▸ Rule: auto_invoke [HIGH]', 'blue');

    const stages = this.getStagesToValidate();

    for (const stage of stages) {
      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) continue;

      const stageConfig = await loadYaml<{
        auto_invoke?: {
          enabled?: boolean;
          wrapper?: string;
          prompt_file?: string;
          fallback?: {
            enabled?: boolean;
            model?: string;
          };
        };
      }>(configPath);

      if (!stageConfig?.auto_invoke?.enabled) continue;

      // Check wrapper script
      const wrapper = stageConfig.auto_invoke.wrapper;
      if (wrapper) {
        const wrapperPath = path.join(this.projectRoot, wrapper);
        if (existsSync(wrapperPath)) {
          try {
            const stat = statSync(wrapperPath);
            // Check if executable (Unix mode bits: 0o111)
            const isExecutable = (stat.mode & 0o111) !== 0;
            if (isExecutable) {
              this.addPass(`wrapper script exists and executable`, stage);
            } else {
              this.addResult('high', 'auto_invoke', `wrapper script exists but not executable: ${wrapper}`, stage, true);
            }
          } catch {
            this.addResult('high', 'auto_invoke', `wrapper script not found: ${wrapper}`, stage);
          }
        } else {
          this.addResult('high', 'auto_invoke', `wrapper script not found: ${wrapper}`, stage);
        }
      }

      // Check prompt file
      const promptFile = stageConfig.auto_invoke.prompt_file;
      if (promptFile) {
        const promptPath = path.join(this.stagesDir, stage, promptFile);
        if (existsSync(promptPath)) {
          this.addPass(`prompt file exists: ${promptFile}`, stage);
        } else {
          this.addResult('high', 'auto_invoke', `auto_invoke prompt file missing: ${promptFile}`, stage);
        }
      }

      // Check fallback configuration
      if (stageConfig.auto_invoke.fallback?.enabled) {
        const fallbackModel = stageConfig.auto_invoke.fallback.model;
        if (fallbackModel) {
          this.addPass(`fallback model configured: ${fallbackModel}`, stage);
        } else {
          this.addResult('high', 'auto_invoke', `fallback enabled but no model specified`, stage);
        }
      }
    }
  }

  /**
   * Rule 6: Execution Mode (HIGH)
   * Stage mode aligns with model capabilities
   */
  async validateExecutionMode(): Promise<void> {
    log('\n▸ Rule: execution_mode [HIGH]', 'blue');

    const stages = this.getStagesToValidate();
    const modelsConfig = await loadYaml<{
      models: Record<string, { modes?: Record<string, unknown> }>;
    }>(path.join(this.configDir, 'models.yaml'));

    for (const stage of stages) {
      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) continue;

      const stageConfig = await loadYaml<{
        execution?: {
          mode?: string;
        };
        models?: {
          primary?: string;
        };
      }>(configPath);

      if (!stageConfig?.execution?.mode) continue;

      const execMode = stageConfig.execution.mode;
      const primary = stageConfig.models?.primary;

      if (!primary || !modelsConfig?.models?.[primary]?.modes) continue;

      const modelModes = Object.keys(modelsConfig.models[primary].modes ?? {});

      if (modelModes.includes(execMode)) {
        this.addPass(`execution mode '${execMode}' supported by ${primary}`, stage);
      } else {
        this.addResult('high', 'execution_mode', `execution mode '${execMode}' may not be supported by ${primary}`, stage);
      }
    }
  }

  /**
   * Rule 7: AI Wrapper Health (HIGH)
   * AI wrapper scripts are executable and functional
   */
  async validateAIWrapperHealth(): Promise<void> {
    log('\n▸ Rule: ai_wrapper_health [HIGH]', 'blue');

    const wrappers = ['ai-call.sh', 'gemini-wrapper.sh', 'codex-wrapper.sh'];

    for (const wrapper of wrappers) {
      const wrapperPath = path.join(this.projectRoot, 'scripts', wrapper);

      if (!existsSync(wrapperPath)) {
        this.addResult('high', 'ai_wrapper_health', `Wrapper script not found: scripts/${wrapper}`);
        continue;
      }

      try {
        const stat = statSync(wrapperPath);
        const isExecutable = (stat.mode & 0o111) !== 0;

        if (!isExecutable) {
          this.addResult('high', 'ai_wrapper_health', `Wrapper script not executable: scripts/${wrapper}`, undefined, true);
          continue;
        }

        this.addPass(`Wrapper script valid: scripts/${wrapper}`);
      } catch {
        this.addResult('high', 'ai_wrapper_health', `Wrapper script error: scripts/${wrapper}`);
      }
    }

    // Check optional AI CLIs
    for (const cli of ['gemini', 'codex']) {
      if (await commandExists(cli)) {
        this.addPass(`${cli} CLI is installed`);
      }
    }
  }

  /**
   * Rule 8: MCP Servers (MEDIUM)
   * Referenced MCP servers have fallback configs
   */
  async validateMCPServers(): Promise<void> {
    log('\n▸ Rule: mcp_servers [MEDIUM]', 'blue');

    const fallbackConfig = await loadYaml<{
      servers?: Record<string, unknown>;
    }>(path.join(this.configDir, 'mcp_fallbacks.yaml'));

    if (!fallbackConfig) {
      this.addResult('medium', 'mcp_servers', `mcp_fallbacks.yaml not found, cannot validate MCP fallbacks`);
      return;
    }

    const stages = this.getStagesToValidate();

    for (const stage of stages) {
      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) continue;

      const stageConfig = await loadYaml<{
        mcp_servers?: string[];
      }>(configPath);

      const mcpServers = stageConfig?.mcp_servers ?? [];
      if (mcpServers.length === 0) continue;

      for (const server of mcpServers) {
        if (fallbackConfig.servers?.[server]) {
          this.addPass(`MCP server '${server}' has fallback config`, stage);
        } else {
          this.addResult('medium', 'mcp_servers', `MCP server '${server}' has no fallback configuration`, stage);
        }
      }
    }
  }

  /**
   * Rule 9: Epic Cycles (MEDIUM)
   * Validate epic_cycles.yaml structure and settings
   */
  async validateEpicCycles(): Promise<void> {
    log('\n▸ Rule: epic_cycles [MEDIUM]', 'blue');

    const epicConfig = await loadYaml<{
      epic_cycles?: {
        enabled?: boolean;
        cycle_config?: {
          max_cycles?: number;
          default_preset?: string;
          preserve_outputs?: boolean;
        };
        presets?: Record<string, unknown>;
      };
    }>(path.join(this.configDir, 'epic_cycles.yaml'));

    if (!epicConfig) {
      this.addResult('medium', 'epic_cycles', `epic_cycles.yaml not found`);
      return;
    }

    // Check required fields
    const cycleConfigKeys = ['max_cycles', 'default_preset', 'preserve_outputs'] as const;
    for (const key of cycleConfigKeys) {
      if (epicConfig.epic_cycles?.cycle_config?.[key] !== undefined) {
        this.addPass(`epic_cycles: cycle_config.${key} is defined`);
      } else {
        this.addResult('medium', 'epic_cycles', `cycle_config.${key} is missing`);
      }
    }

    // Check presets are defined
    const presets = epicConfig.epic_cycles?.presets;
    const presetCount = presets ? Object.keys(presets).length : 0;
    if (presetCount > 0) {
      this.addPass(`epic_cycles: ${presetCount} preset(s) defined`);
    } else {
      this.addResult('medium', 'epic_cycles', `no presets defined`);
    }

    // Check that enabled field is NOT present (should be in progress.json)
    if (epicConfig.epic_cycles?.enabled !== undefined) {
      this.addResult('medium', 'epic_cycles', `'enabled' field should be in progress.json, not epic_cycles.yaml`, undefined, true);
    } else {
      this.addPass(`epic_cycles: no conflicting 'enabled' field`);
    }
  }

  /**
   * Rule 10: Requirements Refinement (MEDIUM)
   */
  async validateRequirementsRefinement(): Promise<void> {
    log('\n▸ Rule: requirements_refinement [MEDIUM]', 'blue');

    const reqConfig = await loadYaml<{
      invest_criteria?: Record<string, { weight?: number }>;
      breakdown_rules?: unknown;
      refinement_workflow?: {
        stages?: unknown[];
      };
    }>(path.join(this.configDir, 'requirements_refinement.yaml'));

    if (!reqConfig) {
      this.addResult('medium', 'requirements_refinement', `requirements_refinement.yaml not found`);
      return;
    }

    // Check INVEST criteria
    const investFields = ['independent', 'negotiable', 'valuable', 'estimable', 'small', 'testable'];
    for (const field of investFields) {
      if (reqConfig.invest_criteria?.[field]?.weight !== undefined) {
        this.addPass(`requirements_refinement: INVEST.${field} weight defined`);
      } else {
        this.addResult('medium', 'requirements_refinement', `INVEST.${field} weight missing`);
      }
    }

    // Check breakdown rules
    if (reqConfig.breakdown_rules) {
      this.addPass(`requirements_refinement: breakdown_rules defined`);
    } else {
      this.addResult('medium', 'requirements_refinement', `breakdown_rules missing`);
    }

    // Check workflow stages
    const workflowStages = reqConfig.refinement_workflow?.stages?.length ?? 0;
    if (workflowStages > 0) {
      this.addPass(`requirements_refinement: ${workflowStages} workflow stage(s) defined`);
    } else {
      this.addResult('medium', 'requirements_refinement', `no workflow stages defined`);
    }
  }

  /**
   * Rule 11: Implementation Order (MEDIUM)
   */
  async validateImplementationOrder(): Promise<void> {
    log('\n▸ Rule: implementation_order [MEDIUM]', 'blue');

    const implConfig = await loadYaml<{
      implementation_order?: {
        current_order?: string | null;
        orders?: Record<string, { phases?: unknown[] }>;
      };
    }>(path.join(this.configDir, 'implementation_order.yaml'));

    if (!implConfig) {
      this.addResult('medium', 'implementation_order', `implementation_order.yaml not found`);
      return;
    }

    const orders = ['frontend_first', 'backend_first', 'parallel'];
    for (const order of orders) {
      if (implConfig.implementation_order?.orders?.[order]) {
        this.addPass(`implementation_order: order '${order}' defined`);

        // Check phases
        const phases = implConfig.implementation_order.orders[order].phases?.length ?? 0;
        if (phases > 0) {
          this.addPass(`implementation_order: ${order} has ${phases} phase(s)`);
        } else {
          this.addResult('medium', 'implementation_order', `${order} has no phases defined`);
        }
      } else {
        this.addResult('medium', 'implementation_order', `order '${order}' missing`);
      }
    }

    // Check current_order validity
    const currentOrder = implConfig.implementation_order?.current_order;
    if (currentOrder === null || currentOrder === undefined) {
      // Acceptable - will prompt user
    } else if (orders.includes(currentOrder)) {
      this.addPass(`implementation_order: current_order '${currentOrder}' is valid`);
    } else {
      this.addResult('medium', 'implementation_order', `current_order '${currentOrder}' is not a valid option`);
    }
  }

  /**
   * Rule 12: Notion Integration (MEDIUM)
   */
  async validateNotionIntegration(): Promise<void> {
    log('\n▸ Rule: notion_integration [MEDIUM]', 'blue');

    const fallbackConfig = await loadYaml<{
      servers?: {
        notion?: {
          fallbacks?: unknown[];
          json_fallback?: {
            enabled?: boolean;
            file_path?: string;
          };
          on_error?: {
            action?: string;
          };
        };
      };
    }>(path.join(this.configDir, 'mcp_fallbacks.yaml'));

    if (!fallbackConfig) {
      this.addResult('medium', 'notion_integration', `mcp_fallbacks.yaml not found, cannot validate Notion integration`);
      return;
    }

    const notionConfig = fallbackConfig.servers?.notion;
    if (!notionConfig) {
      this.addResult('medium', 'notion_integration', `Notion configuration missing in mcp_fallbacks.yaml`);
      return;
    }

    // Check fallbacks
    const fallbackCount = notionConfig.fallbacks?.length ?? 0;
    if (fallbackCount > 0) {
      this.addPass(`Notion: ${fallbackCount} fallback(s) configured`);
    } else {
      this.addResult('medium', 'notion_integration', `Notion: no fallbacks configured (may fail if Notion unavailable)`);
    }

    // Check JSON fallback
    if (notionConfig.json_fallback?.enabled) {
      this.addPass(`Notion: JSON file fallback enabled`);

      if (notionConfig.json_fallback.file_path) {
        this.addPass(`Notion: JSON fallback path defined: ${notionConfig.json_fallback.file_path}`);
      } else {
        this.addResult('medium', 'notion_integration', `Notion: JSON fallback enabled but file_path not defined`);
      }
    } else {
      this.addResult('medium', 'notion_integration', `Notion: JSON file fallback not enabled (recommended for offline support)`);
    }

    // Check on_error action
    if (notionConfig.on_error?.action) {
      this.addPass(`Notion: on_error action defined: ${notionConfig.on_error.action}`);
    } else {
      this.addResult('medium', 'notion_integration', `Notion: on_error action not defined`);
    }
  }

  /**
   * Rule 13: Prerequisites (MEDIUM)
   */
  async validatePrerequisites(): Promise<void> {
    log('\n▸ Rule: prerequisites [MEDIUM]', 'blue');

    const stages = this.getStagesToValidate();

    for (const stage of stages) {
      const configPath = path.join(this.stagesDir, stage, 'config.yaml');
      if (!existsSync(configPath)) continue;

      const stageConfig = await loadYaml<{
        transition?: {
          prerequisites?: string[];
        };
      }>(configPath);

      const prereqs = stageConfig?.transition?.prerequisites ?? [];
      if (prereqs.length === 0) continue;

      for (const prereq of prereqs) {
        if (STAGE_IDS.includes(prereq as StageId)) {
          this.addPass(`prerequisite '${prereq}' is valid`, stage);
        } else {
          this.addResult('medium', 'prerequisites', `prerequisite '${prereq}' is not a valid stage ID`, stage);
        }
      }
    }
  }

  /**
   * Run all validations
   */
  async validate(): Promise<ValidationSummary> {
    const rules = this.options.rule ? [this.options.rule] : VALIDATION_RULES;

    for (const rule of rules) {
      switch (rule) {
        case 'model_references':
          await this.validateModelReferences();
          break;
        case 'parallel_alignment':
          await this.validateParallelAlignment();
          break;
        case 'collaboration_consistency':
          await this.validateCollaborationConsistency();
          break;
        case 'file_references':
          await this.validateFileReferences();
          break;
        case 'auto_invoke':
          await this.validateAutoInvoke();
          break;
        case 'execution_mode':
          await this.validateExecutionMode();
          break;
        case 'ai_wrapper_health':
          await this.validateAIWrapperHealth();
          break;
        case 'mcp_servers':
          await this.validateMCPServers();
          break;
        case 'epic_cycles':
          await this.validateEpicCycles();
          break;
        case 'requirements_refinement':
          await this.validateRequirementsRefinement();
          break;
        case 'implementation_order':
          await this.validateImplementationOrder();
          break;
        case 'notion_integration':
          await this.validateNotionIntegration();
          break;
        case 'prerequisites':
          await this.validatePrerequisites();
          break;
      }
    }

    return this.summary;
  }

  /**
   * Get exit code based on results
   */
  getExitCode(): number {
    if (this.summary.critical > 0) return 1;
    if (this.summary.high > 0 || this.summary.medium > 0) return 2;
    return 0;
  }
}

/**
 * Print validation summary
 */
export function printValidationSummary(summary: ValidationSummary): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📊 Validation Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`  Severity      Count`);
  console.log(`  ────────────  ─────`);
  result.critical(`CRITICAL     ${summary.critical}`);
  result.high(`HIGH         ${summary.high}`);
  result.medium(`MEDIUM       ${summary.medium}`);
  result.pass(`PASSED       ${summary.passed}`);

  if (summary.fixed > 0) {
    console.log('');
    result.fixed(`FIXED        ${summary.fixed}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (summary.critical > 0) {
    console.log(`  ❌ ${summary.critical} critical issues found. Please fix before running pipeline.`);
    console.log('  Run with --recovery-guide to see detailed fix instructions');
  } else if (summary.high > 0) {
    console.log(`  ⚠ ${summary.high} high-severity warnings. Review recommended.`);
    console.log('  Run with --recovery-guide to see detailed fix instructions');
  } else if (summary.medium > 0) {
    console.log(`  ○ ${summary.medium} medium-severity notices. Optional improvements available.`);
  } else {
    console.log('  ✅ All validations passed!');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Print recovery guide
 */
export function printRecoveryGuide(): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔧 Error Recovery Guide');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('[CRITICAL] Model not defined in models.yaml');
  console.log('  Problem: Stage config references a model that doesn\'t exist');
  console.log('  Recovery:');
  console.log('    1. Open config/models.yaml');
  console.log('    2. Add the missing model definition under "models:"');
  console.log('    3. Or update the stage config to use an existing model\n');

  console.log('[CRITICAL] Parallel alignment mismatch');
  console.log('  Problem: Stage is listed as parallel_capable but config has different mode');
  console.log('  Recovery:');
  console.log('    1. Open stages/XX-stage/config.yaml');
  console.log('    2. Set models.collaboration to "parallel"');
  console.log('    3. Or remove stage from parallel_capable list in ai_collaboration.yaml');
  console.log('  Auto-fix: Run with --fix flag\n');

  console.log('[CRITICAL] Parallel stage missing models');
  console.log('  Problem: Parallel stage needs 2+ models but has fewer configured');
  console.log('  Recovery:');
  console.log('    1. Open stages/XX-stage/config.yaml');
  console.log('    2. Add both primary and secondary models\n');

  console.log('[HIGH] Required input file missing');
  console.log('  Problem: Stage config requires an input file that doesn\'t exist');
  console.log('  Recovery:');
  console.log('    1. Check if previous stage was completed');
  console.log('    2. Generate missing output from previous stage');
  console.log('    3. Or update inputs.required in stage config\n');

  console.log('[HIGH] CLAUDE.md missing');
  console.log('  Problem: Stage cannot execute without CLAUDE.md instructions');
  console.log('  Recovery:');
  console.log('    1. Create stages/XX-stage/CLAUDE.md');
  console.log('    2. Copy from template and customize\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Validate configuration (convenience function)
 */
export async function validateConfig(
  projectRoot: string,
  options: ValidatorOptions = {}
): Promise<ValidationSummary> {
  const validator = new ConfigValidator(projectRoot, options);
  return validator.validate();
}
