/**
 * AI Selector hook logic
 * Dynamic AI model selection based on stage and task
 * Migrated from .claude/hooks/ai-selector.sh
 */
import path from 'path';
import { readJson } from '../utils/fs.js';
import { logInfo, logSuccess } from '../utils/logger.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS } from '../types/stage.js';
import type { Progress } from '../types/state.js';

/**
 * AI Model types
 */
export type AIModelType = 'claudecode' | 'claude' | 'gemini' | 'codex';

/**
 * Task types for model selection
 */
export type TaskType =
  | 'brainstorming'
  | 'creative'
  | 'ideation'
  | 'research'
  | 'analysis'
  | 'documentation'
  | 'implementation'
  | 'debugging'
  | 'review'
  | 'refactoring'
  | 'testing'
  | 'optimization';

/**
 * Model selection result
 */
export interface ModelSelectionResult {
  model: AIModelType;
  reason: string;
}

/**
 * Stage to model mapping (v2: 5 stages)
 */
const STAGE_MODEL_MAP: Record<StageId, AIModelType> = {
  '01-planning': 'claude',
  '02-ui-ux': 'gemini',
  '03-implementation': 'claudecode',
  '04-qa': 'claudecode',
  '05-deployment': 'claudecode',
};

/**
 * Task type to model mapping
 */
const TASK_MODEL_MAP: Record<TaskType, AIModelType> = {
  brainstorming: 'gemini',
  creative: 'gemini',
  ideation: 'gemini',
  research: 'claude',
  analysis: 'claude',
  documentation: 'claude',
  implementation: 'claudecode',
  debugging: 'claudecode',
  review: 'claudecode',
  refactoring: 'codex',
  testing: 'codex',
  optimization: 'codex',
};

/**
 * Model info descriptions
 */
const MODEL_INFO: Record<AIModelType, string> = {
  claudecode: 'Claude Code - Accurate code generation, complex logic analysis',
  claude: 'Claude - Deep research, document analysis and summarization',
  gemini: 'Gemini - Creative ideas, diverse perspective exploration',
  codex: 'Codex - Code analysis, refactoring, test generation',
};

/**
 * Get model based on stage
 */
export function getStageModel(stageId: StageId): AIModelType {
  return STAGE_MODEL_MAP[stageId] ?? 'claudecode';
}

/**
 * Get model based on task type
 */
export function getTaskModel(taskType: TaskType): AIModelType {
  return TASK_MODEL_MAP[taskType] ?? 'claudecode';
}

/**
 * Get current stage from progress
 */
async function getCurrentStage(projectRoot: string): Promise<StageId | null> {
  const progressPath = path.join(projectRoot, 'state', 'progress.json');
  const progress = await readJson<Progress>(progressPath);

  if (progress?.current_stage && STAGE_IDS.includes(progress.current_stage as StageId)) {
    return progress.current_stage as StageId;
  }

  return null;
}

/**
 * Select best model for a stage
 */
export async function selectBestModel(
  stageId: StageId,
  taskType: TaskType = 'implementation',
  verbose: boolean = false
): Promise<ModelSelectionResult> {
  const stageModel = getStageModel(stageId);
  const taskModel = getTaskModel(taskType);

  if (verbose) {
    logInfo('Model selection analysis:');
    logInfo(`  Stage-based: ${stageModel}`);
    logInfo(`  Task-based: ${taskModel}`);
  }

  // Stage-based model takes priority
  const selectedModel = stageModel;

  if (verbose) {
    logSuccess(`Selected model: ${selectedModel}`);
  }

  return {
    model: selectedModel,
    reason: `Stage ${stageId} recommends ${selectedModel}`,
  };
}

/**
 * Get model info description
 */
export function getModelInfo(model: AIModelType): string {
  return MODEL_INFO[model] ?? 'Unknown model';
}

/**
 * Get recommended model for current stage
 */
export async function getRecommendedModel(
  projectRoot: string
): Promise<{ stage: StageId | null; model: AIModelType; info: string }> {
  const stage = await getCurrentStage(projectRoot);

  if (!stage) {
    return {
      stage: null,
      model: 'claudecode',
      info: MODEL_INFO.claudecode,
    };
  }

  const model = getStageModel(stage);

  return {
    stage,
    model,
    info: MODEL_INFO[model],
  };
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const action = process.argv[2];
  const projectRoot = process.cwd();

  switch (action) {
    case 'stage': {
      const stageId = process.argv[3] as StageId;
      if (stageId && STAGE_IDS.includes(stageId)) {
        console.log(getStageModel(stageId));
      } else {
        const current = await getCurrentStage(projectRoot);
        if (current) {
          console.log(getStageModel(current));
        }
      }
      break;
    }
    case 'task': {
      const taskType = process.argv[3] as TaskType;
      console.log(getTaskModel(taskType));
      break;
    }
    case 'select': {
      const stage = (process.argv[3] as StageId) || (await getCurrentStage(projectRoot));
      const task = (process.argv[4] as TaskType) || 'implementation';

      if (stage) {
        const result = await selectBestModel(stage, task, true);
        console.log(result.model);
      }
      break;
    }
    case 'info': {
      const model = process.argv[3] as AIModelType;
      console.log(getModelInfo(model));
      break;
    }
    case 'current': {
      const result = await getRecommendedModel(projectRoot);
      if (result.stage) {
        logInfo(`Current stage: ${result.stage}`);
        logInfo(`Recommended model: ${result.model}`);
        console.log(result.info);
      } else {
        console.log('Could not determine current stage');
      }
      break;
    }
    default:
      console.log('Usage: ai-selector {stage|task|select|info|current} [args]');
      console.log('');
      console.log('Commands:');
      console.log('  stage [stage_id]     - Stage-based model selection');
      console.log('  task [task_type]     - Task type-based model selection');
      console.log('  select [stage] [task] - Comprehensive model selection');
      console.log('  info [model]         - Print model info');
      console.log('  current              - Recommended model for current stage');
      process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('ai-selector')) {
  main().catch(console.error);
}
