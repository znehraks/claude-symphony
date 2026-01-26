/**
 * Memory Relay Module
 * TypeScript implementation of the Memory Relay orchestration system
 */

// Type exports
export type {
  RelayConfig,
  RelaySignal,
  SignalType,
  SessionOptions,
  OrchestratorCommand,
  OrchestratorStatus,
  PaneResult,
  SessionChoice,
  LogLevel,
} from './types.js';

// Config exports
export { getConfig, resetConfig, getRelayDir, SESSION_NAME } from './config.js';

// FIFO exports
export {
  isFifo,
  createFifo,
  removeFifo,
  writeToFifo,
  parseSignal,
  startFifoReader,
  startFifoReaderNode,
} from './fifo.js';

// Signal exports
export {
  signalRelayReady,
  isOrchestratorAvailable,
  getCurrentPaneId,
  isInsideTmux,
} from './signal.js';

// Wrapper exports
export {
  parseWrapperArgs,
  getClaudeCommand,
  showRelayBanner,
  showResumeBanner,
  launchClaude,
  spawnClaude,
  runWrapper,
} from './wrapper.js';

// Startup exports
export {
  checkDependencies,
  sessionExists,
  handleExistingSession,
  killSession,
  attachSession,
  createTmuxSession,
  startSession,
} from './startup.js';

// Orchestrator exports
export {
  runOrchestrator,
  startOrchestrator,
  stopOrchestrator,
  showStatus,
  getStatus,
} from './orchestrator.js';
