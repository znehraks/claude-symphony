/**
 * Hooks module barrel export
 */

// Pre-stage hook
export { runPreStageChecks, type PreStageResult } from './pre-stage.js';

// Post-stage hook
export { runPostStageTasks, type PostStageResult } from './post-stage.js';

// Auto-checkpoint hook
export {
  runAutoCheckpoint,
  shouldTriggerCheckpoint,
  incrementTaskCount,
  recordFileChanges,
  isDestructiveOperation,
  type TriggerType,
  type AutoCheckpointOptions,
} from './auto-checkpoint.js';

// AI selector hook
export {
  getStageModel,
  getTaskModel,
  selectBestModel,
  getModelInfo,
  getRecommendedModel,
  type AIModelType,
  type TaskType,
  type ModelSelectionResult,
} from './ai-selector.js';

// Output validator hook
export {
  runOutputValidation,
  type ValidationCheck,
  type ValidationSummary,
} from './output-validator.js';

// Session start hook
export {
  checkSessionRecovery,
  generateRecoveryContext,
  markRecoveryComplete,
  runSessionStart,
  type SessionRecoveryResult,
} from './session-start.js';
