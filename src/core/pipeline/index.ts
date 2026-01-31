/**
 * Pipeline module — auto-pilot orchestration
 */
export {
  prepareStageExecution,
  finalizeStage,
  getPipelineStatus,
  buildStagePrompt,
  loadStagePersona,
  loadStageReferences,
  loadStageInstructions,
  loadPreviousHandoff,
  validateStage,
  generateStageHandoff,
} from './orchestrator.js';

export type {
  StagePersona,
  StageReferences,
  StageExecutionResult,
  PipelineResult,
  OrchestratorConfig,
} from './orchestrator.js';
