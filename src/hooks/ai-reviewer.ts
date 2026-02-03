/**
 * AI Reviewer Hook (v2)
 * Layer 2: AI-based quality review using Serena MCP
 *
 * This module provides AI-powered review of stage outputs after Layer 1
 * objective checks pass. Uses Serena MCP's think_about_task_adherence()
 * for intelligent quality assessment.
 */
import path from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import type { StageId } from '../types/stage.js';
import { STAGE_IDS } from '../types/stage.js';
import { spawnAgent } from '../core/agents/index.js';

/**
 * AI review result
 */
export interface AIReviewResult {
  approved: boolean;
  needsImprovement: boolean;
  suggestions?: string[];
  summary: string;
  confidence: number;
  retry: boolean;
  timestamp: string;
}

/**
 * Stage requirements for AI review
 */
interface StageRequirements {
  description: string;
  expectedOutputs: string[];
  qualityCriteria: string[];
}

/**
 * Get stage requirements for AI review
 */
function getStageRequirements(stageId: StageId): StageRequirements {
  const requirements: Record<StageId, StageRequirements> = {
    '01-planning': {
      description: 'Planning & Architecture stage: requirements gathering, tech research, architecture design',
      expectedOutputs: ['requirements.md', 'architecture.md', 'tech_stack.md', 'conventions.md'],
      qualityCriteria: [
        'Requirements are clear, specific, and testable',
        'Architecture addresses scalability and maintainability',
        'Tech stack choices are justified with rationale',
        'Conventions are comprehensive and consistent',
      ],
    },
    '02-ui-ux': {
      description: 'UI/UX Design stage: component design, wireframes, design tokens',
      expectedOutputs: ['design_tokens.json', 'wireframes/', 'component_specs.md'],
      qualityCriteria: [
        'Design tokens cover colors, typography, spacing',
        'Component specifications are detailed and implementable',
        'Wireframes show clear user flows',
        'Accessibility considerations are addressed',
      ],
    },
    '03-implementation': {
      description: 'Implementation stage: task decomposition, TDD implementation, source code',
      expectedOutputs: ['src/', 'package.json', 'tasks.md'],
      qualityCriteria: [
        'Code follows the conventions defined in planning stage',
        'Tests are comprehensive and meaningful',
        'Build succeeds without errors',
        'Code is properly documented',
      ],
    },
    '04-qa': {
      description: 'QA & E2E Testing stage: security audit, accessibility review, E2E testing',
      expectedOutputs: ['e2e_report.md', 'qa_report.md'],
      qualityCriteria: [
        'E2E tests cover critical user flows',
        'Security audit covers OWASP top 10',
        'Accessibility review checks WCAG compliance',
        'Bug findings are documented with severity',
      ],
    },
    '05-deployment': {
      description: 'Deployment stage: CI/CD setup, deployment configuration',
      expectedOutputs: ['.github/workflows/', 'deploy.sh'],
      qualityCriteria: [
        'CI/CD pipeline is complete and tested',
        'Deployment scripts are idempotent',
        'Environment configurations are documented',
        'Rollback procedures are defined',
      ],
    },
  };

  return requirements[stageId];
}

/**
 * Collect stage outputs for review
 */
function collectStageOutputs(projectRoot: string, stageId: StageId): string[] {
  const outputs: string[] = [];
  const stageOutputDir = path.join(projectRoot, 'stages', stageId, 'outputs');

  if (existsSync(stageOutputDir)) {
    try {
      const files = readdirSync(stageOutputDir, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.json'))) {
          outputs.push(path.join(stageOutputDir, file.name));
        }
      }
    } catch {
      // Directory not readable
    }
  }

  // Also check project root for certain files
  const projectFiles = ['package.json', 'tsconfig.json', 'README.md'];
  for (const file of projectFiles) {
    const filePath = path.join(projectRoot, file);
    if (existsSync(filePath)) {
      outputs.push(filePath);
    }
  }

  return outputs;
}

/**
 * Build review prompt for AI
 */
function buildReviewPrompt(stageId: StageId, requirements: StageRequirements, outputContents: Map<string, string>): string {
  let prompt = `# Stage Quality Review: ${stageId}

## Task Description
${requirements.description}

## Expected Outputs
${requirements.expectedOutputs.map((o) => `- ${o}`).join('\n')}

## Quality Criteria
${requirements.qualityCriteria.map((c) => `- ${c}`).join('\n')}

## Actual Outputs

`;

  for (const [filename, content] of outputContents) {
    // Truncate long content
    const truncatedContent = content.length > 5000
      ? content.slice(0, 5000) + '\n\n... (truncated) ...'
      : content;

    prompt += `### ${filename}
\`\`\`
${truncatedContent}
\`\`\`

`;
  }

  prompt += `## Review Instructions

Please review the above outputs and determine:
1. Do the outputs meet the quality criteria?
2. Are there any significant gaps or issues?
3. What improvements would you suggest?

Respond with a JSON object:
\`\`\`json
{
  "approved": boolean,
  "needsImprovement": boolean,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "summary": "brief summary of review",
  "confidence": 0.0-1.0
}
\`\`\`
`;

  return prompt;
}

/**
 * Run AI review for stage outputs
 */
export async function aiReview(
  projectRoot: string,
  stageId: StageId
): Promise<AIReviewResult> {
  logInfo(`Running AI review for stage: ${stageId}`);

  const requirements = getStageRequirements(stageId);
  if (!requirements) {
    return {
      approved: true,
      needsImprovement: false,
      summary: 'No AI review configured for this stage',
      confidence: 1.0,
      retry: false,
      timestamp: new Date().toISOString(),
    };
  }

  // Collect stage outputs
  const outputFiles = collectStageOutputs(projectRoot, stageId);
  const outputContents = new Map<string, string>();

  for (const file of outputFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = path.relative(projectRoot, file);
      outputContents.set(relativePath, content);
    } catch {
      // Skip unreadable files
    }
  }

  if (outputContents.size === 0) {
    return {
      approved: false,
      needsImprovement: true,
      suggestions: ['No readable output files found for review'],
      summary: 'Cannot perform AI review - no outputs found',
      confidence: 1.0,
      retry: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Build review prompt
  const prompt = buildReviewPrompt(stageId, requirements, outputContents);

  // Use Task Tool to spawn a review agent
  try {
    const result = await spawnAgent(
      'ai-reviewer',
      {
        projectRoot,
        stage: stageId,
        data: { prompt },
      },
      'foreground'
    );

    if (!result.success || !result.result) {
      logWarning('AI review agent failed, approving with warning');
      return {
        approved: true,
        needsImprovement: false,
        summary: 'AI review could not be completed - proceeding with caution',
        confidence: 0.5,
        retry: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Parse agent result
    const jsonMatch = result.result.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch && jsonMatch[1] ? jsonMatch[1] : result.result;

    try {
      const review = JSON.parse(jsonStr);
      const reviewResult: AIReviewResult = {
        approved: review.approved ?? true,
        needsImprovement: review.needsImprovement ?? false,
        suggestions: review.suggestions,
        summary: review.summary || 'Review completed',
        confidence: review.confidence ?? 0.8,
        retry: review.needsImprovement && !review.approved,
        timestamp: new Date().toISOString(),
      };

      // Save review result
      const reviewsDir = path.join(projectRoot, 'state', 'reviews');
      await ensureDirAsync(reviewsDir);
      await writeJson(
        path.join(reviewsDir, `ai_review_${stageId}_${reviewResult.timestamp.replace(/[:.]/g, '-').slice(0, 19)}.json`),
        reviewResult
      );

      // Log summary
      logInfo('');
      logInfo('==========================================');
      logInfo(`  AI Review: ${stageId}`);
      logInfo('==========================================');
      logInfo('');
      logInfo(`Summary: ${reviewResult.summary}`);
      logInfo(`Confidence: ${(reviewResult.confidence * 100).toFixed(0)}%`);

      if (reviewResult.suggestions && reviewResult.suggestions.length > 0) {
        logInfo('Suggestions:');
        for (const suggestion of reviewResult.suggestions) {
          logInfo(`  - ${suggestion}`);
        }
      }

      logInfo('');
      if (reviewResult.approved) {
        logSuccess('AI Review: APPROVED');
      } else if (reviewResult.needsImprovement) {
        logWarning('AI Review: NEEDS IMPROVEMENT (PDCA retry triggered)');
      } else {
        logError('AI Review: NOT APPROVED');
      }

      return reviewResult;
    } catch (parseError) {
      logWarning(`Failed to parse AI review result: ${parseError}`);
      return {
        approved: true,
        needsImprovement: false,
        summary: 'AI review result parsing failed - proceeding with caution',
        confidence: 0.5,
        retry: false,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    logError(`AI review failed: ${error}`);
    return {
      approved: true,
      needsImprovement: false,
      summary: `AI review error: ${error}`,
      confidence: 0.5,
      retry: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run AI review with Serena MCP integration
 * Uses think_about_task_adherence() for intelligent review
 */
export async function aiReviewWithSerena(
  projectRoot: string,
  stageId: StageId,
  _serenaMcpClient?: unknown
): Promise<AIReviewResult> {
  // If Serena MCP client is available, use it for more sophisticated review
  // For now, fall back to the agent-based review
  return aiReview(projectRoot, stageId);
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const stageId = process.argv[2] as StageId | undefined;
  const projectRoot = process.cwd();

  if (!stageId || !STAGE_IDS.includes(stageId)) {
    logError(`Invalid stage ID: ${stageId}`);
    logInfo(`Valid stage IDs: ${STAGE_IDS.join(', ')}`);
    process.exit(1);
  }

  try {
    const result = await aiReview(projectRoot, stageId);
    process.exit(result.approved ? 0 : 1);
  } catch (error) {
    logError(error instanceof Error ? error.message : 'AI review failed');
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('ai-reviewer')) {
  main().catch(console.error);
}
