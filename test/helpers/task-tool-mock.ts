/**
 * Task Tool Mock Utilities
 *
 * Provides reusable mock responses for all Tier 1 agents.
 * Used in integration tests to simulate Task tool responses without actual agent execution.
 */

/**
 * Task tool mock configuration
 */
export interface TaskToolMockConfig {
  success: boolean;
  output: any; // Agent JSON output
  duration?: number;
  numTurns?: number;
}

/**
 * Standard Task tool response structure
 * Matches the actual Task tool return format expected by parseAgentResult
 */
export interface TaskToolResponse {
  success: boolean;
  output?: string; // Agent output (parseAgentResult expects 'output', not 'result')
  error?: string;
  task_id?: string;
  num_turns?: number;
  total_cost_usd?: number;
}

/**
 * Validation agent result structure
 */
export interface ValidationResult {
  passed: number;
  failed: number;
  total: number;
  score: number;
  details: Array<{
    rule: string;
    status: 'passed' | 'failed';
    message?: string;
  }>;
}

/**
 * HANDOFF generator result structure
 */
export interface HandoffResult {
  tasksCompleted: string[];
  keyDecisions: string[];
  modifiedFiles: string[];
  pendingIssues: string[];
  nextSteps: string[];
  aiCallLog: Array<{
    ai: string;
    time: string;
    prompt: string;
    result: string;
    status: string;
  }>;
}

/**
 * Output synthesis result structure
 */
export interface SynthesisResult {
  consensusRatio: number;
  qualityScore: number;
  synthesizedContent: string;
  commonalities: string[];
  differences: Array<{
    model: string;
    uniquePoints: string[];
  }>;
  recommendation: 'use_synthesis' | 'use_best_individual' | 'review_required';
}

/**
 * Architecture review result structure
 */
export interface ArchitectureReviewResult {
  overallScore: number;
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    recommendation: string;
  }>;
  strengths: string[];
  recommendation: 'approved' | 'needs_revision' | 'rejected';
}

/**
 * Research analysis result structure
 */
export interface ResearchAnalysisResult {
  contradictions: number;
  gapsIdentified: string[];
  sourcesAnalyzed: number;
  qualityScore: number;
  recommendation: 'GO' | 'NO-GO' | 'GO WITH CONDITIONS';
  conditions?: string[];
}

/**
 * Pre-defined mock responses for all Tier 1 agents
 */
export const MOCK_RESPONSES = {
  /**
   * Validation agent mock responses
   */
  'validation-agent': {
    success: (passed: number, total: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        passed,
        failed: total - passed,
        total,
        score: passed / total,
        details: Array.from({ length: total }, (_, i) => ({
          rule: `rule_${i + 1}`,
          status: i < passed ? 'passed' : 'failed',
          message: i < passed ? undefined : `Rule ${i + 1} failed`,
        })),
      } as ValidationResult),
      task_id: 'validation-agent-test',
      num_turns: 3,
    }),

    partialFail: (passed: number, total: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        passed,
        failed: total - passed,
        total,
        score: passed / total,
        details: Array.from({ length: total }, (_, i) => ({
          rule: `rule_${i + 1}`,
          status: i < passed ? 'passed' : 'failed',
          message: i < passed ? undefined : `Rule ${i + 1} validation failed`,
        })),
      } as ValidationResult),
      task_id: 'validation-agent-test',
      num_turns: 3,
    }),

    completeFail: (total: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        passed: 0,
        failed: total,
        total,
        score: 0,
        details: Array.from({ length: total }, (_, i) => ({
          rule: `rule_${i + 1}`,
          status: 'failed' as const,
          message: `Rule ${i + 1} failed completely`,
        })),
      } as ValidationResult),
      task_id: 'validation-agent-test',
      num_turns: 3,
    }),

    error: (message: string): TaskToolResponse => ({
      success: false,
      error: message,
      num_turns: 1,
    }),
  },

  /**
   * HANDOFF generator mock responses
   */
  'handoff-generator-agent': {
    full: (tasksCount: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        tasksCompleted: Array.from({ length: tasksCount }, (_, i) => `Task ${i + 1}`),
        keyDecisions: ['Decision 1', 'Decision 2', 'Decision 3'],
        modifiedFiles: ['file1.ts', 'file2.ts', 'file3.ts'],
        pendingIssues: [],
        nextSteps: ['Step 1', 'Step 2'],
        aiCallLog: [
          {
            ai: 'Gemini',
            time: '14:30',
            prompt: 'prompts/ideation.md',
            result: 'outputs/ideas.md',
            status: 'Success',
          },
        ],
      } as HandoffResult),
      task_id: 'handoff-generator-agent-test',
      num_turns: 5,
    }),

    minimal: (): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        tasksCompleted: ['Task 1'],
        keyDecisions: ['Decision 1'],
        modifiedFiles: ['file1.ts'],
        pendingIssues: ['Issue 1 pending'],
        nextSteps: ['Complete Issue 1'],
        aiCallLog: [],
      } as HandoffResult),
      task_id: 'handoff-generator-agent-test',
      num_turns: 3,
    }),

    error: (message: string): TaskToolResponse => ({
      success: false,
      error: message,
      num_turns: 1,
    }),
  },

  /**
   * Output synthesis mock responses
   */
  'output-synthesis-agent': {
    highConsensus: (consensusRatio: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        consensusRatio,
        qualityScore: 0.95,
        synthesizedContent: '# Synthesized Output\n\nHigh consensus achieved.',
        commonalities: ['Point 1', 'Point 2', 'Point 3'],
        differences: [
          {
            model: 'gemini',
            uniquePoints: ['Unique point from Gemini'],
          },
          {
            model: 'claude',
            uniquePoints: ['Unique point from Claude'],
          },
        ],
        recommendation: 'use_synthesis' as const,
      } as SynthesisResult),
      task_id: 'output-synthesis-agent-test',
      num_turns: 6,
    }),

    lowConsensus: (consensusRatio: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        consensusRatio,
        qualityScore: 0.6,
        synthesizedContent: '# Synthesized Output\n\nLow consensus - review required.',
        commonalities: ['Point 1'],
        differences: [
          {
            model: 'gemini',
            uniquePoints: ['Point A', 'Point B', 'Point C'],
          },
          {
            model: 'claude',
            uniquePoints: ['Point X', 'Point Y', 'Point Z'],
          },
        ],
        recommendation: 'review_required' as const,
      } as SynthesisResult),
      task_id: 'output-synthesis-agent-test',
      num_turns: 7,
    }),

    error: (message: string): TaskToolResponse => ({
      success: false,
      error: message,
      num_turns: 1,
    }),
  },

  /**
   * Architecture review mock responses
   */
  'architecture-review-agent': {
    approved: (): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        overallScore: 0.9,
        issues: [
          {
            severity: 'info' as const,
            category: 'documentation',
            description: 'Consider adding API docs',
            recommendation: 'Add OpenAPI spec',
          },
        ],
        strengths: ['Modular design', 'Good separation of concerns', 'Scalable'],
        recommendation: 'approved' as const,
      } as ArchitectureReviewResult),
      task_id: 'output-synthesis-agent-test',
      num_turns: 7,
    }),

    criticalIssues: (issueCount: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        overallScore: 0.4,
        issues: Array.from({ length: issueCount }, (_, i) => ({
          severity: i < 2 ? ('critical' as const) : ('warning' as const),
          category: 'security',
          description: `Critical issue ${i + 1}`,
          recommendation: `Fix issue ${i + 1} immediately`,
        })),
        strengths: ['Some good patterns'],
        recommendation: 'rejected' as const,
      } as ArchitectureReviewResult),
      task_id: 'architecture-review-agent-test',
      num_turns: 8,
    }),

    error: (message: string): TaskToolResponse => ({
      success: false,
      error: message,
      num_turns: 1,
    }),
  },

  /**
   * Research analysis mock responses
   */
  'research-analysis-agent': {
    go: (): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        contradictions: 0,
        gapsIdentified: [],
        sourcesAnalyzed: 10,
        qualityScore: 0.95,
        recommendation: 'GO' as const,
      } as ResearchAnalysisResult),
      task_id: 'architecture-review-agent-test',
      num_turns: 8,
    }),

    noGo: (contradictions: number): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        contradictions,
        gapsIdentified: ['Gap 1', 'Gap 2', 'Gap 3'],
        sourcesAnalyzed: 5,
        qualityScore: 0.3,
        recommendation: 'NO-GO' as const,
      } as ResearchAnalysisResult),
      task_id: 'research-analysis-agent-test',
      num_turns: 9,
    }),

    goWithConditions: (conditions: string[]): TaskToolResponse => ({
      success: true,
      output: JSON.stringify({
        contradictions: 2,
        gapsIdentified: ['Gap 1'],
        sourcesAnalyzed: 8,
        qualityScore: 0.7,
        recommendation: 'GO WITH CONDITIONS' as const,
        conditions,
      } as ResearchAnalysisResult),
      task_id: 'research-analysis-agent-test',
      num_turns: 8,
    }),

    error: (message: string): TaskToolResponse => ({
      success: false,
      error: message,
      num_turns: 1,
    }),
  },
};

/**
 * Helper to create a custom mock response
 */
export function createMockResponse(
  success: boolean,
  data?: any,
  error?: string,
  taskId = 'custom-agent-test',
  numTurns = 5
): TaskToolResponse {
  return {
    success,
    output: data ? JSON.stringify(data) : undefined,
    error,
    task_id: taskId,
    num_turns: numTurns,
  };
}
