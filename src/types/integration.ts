/**
 * Shared integration types for AI model wrappers
 */

/**
 * Fallback signal types
 */
export type FallbackSignal =
  | 'CLI_NOT_FOUND'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'OUTPUT_FAILED';

/**
 * Integration call metadata for traceability
 */
export interface IntegrationMetadata {
  command: string;
  exitCode: number;
  stderr: string;
  durationMs: number;
  stdoutLength: number;
  timestamp: string;
}
