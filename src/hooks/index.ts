/**
 * Hooks module barrel export (v2)
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

// v2: Quality validator hook (Layer 1 objective checks)
export {
  validateStageQuality,
  loadStageConfig,
  checkOutputsExist,
  runQualityCheck,
  type QualityLevel,
  type QualityCheckConfig,
  type QualityCheckResult,
  type QualityResult,
} from './quality-validator.js';

// v2: AI reviewer hook (Layer 2 AI review)
export {
  aiReview,
  aiReviewWithSerena,
  type AIReviewResult,
} from './ai-reviewer.js';

// v2: Discovery phase hook
export {
  runDiscovery,
  checkApiKeys,
  isDiscoveryComplete,
  updateDiscoveryState,
  loadDiscoveryConfig,
  type DiscoveryConfig,
  type DiscoveryState,
  type ApiKeyCheckResult,
} from './discovery-phase.js';

// v2: Tech research hook (Preparation phase)
export {
  runPreparation,
  parseTechStack,
  researchTechStack,
  researchTechnology,
  cacheOfficialDocs,
  saveToMemory,
  type TechPreferences,
  type TechResearchResult,
  type PreparationState,
} from './tech-research.js';
