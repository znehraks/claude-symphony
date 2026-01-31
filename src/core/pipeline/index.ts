/**
 * Pipeline module — auto-pilot orchestration
 */
export {
  prepareStageExecution,
  finalizeStage,
  finalizeStageWithRetry,
  buildRetryPrompt,
  getPipelineStatus,
  buildStagePrompt,
  loadStagePersona,
  loadStageReferences,
  loadStageInstructions,
  loadPreviousHandoff,
  validateStage,
  generateStageHandoff,
  loadPipelineState,
  savePipelineState,
  pausePipeline,
  resumePipeline,
  skipStage,
} from './orchestrator.js';

export type {
  StagePersona,
  StageReferences,
  StageExecutionResult,
  PipelineResult,
  OrchestratorConfig,
  StageRetryState,
  PipelineState,
} from './orchestrator.js';
