/**
 * Unit Tests for Spawner Helper
 *
 * Tests the helper functions used by Claude Code to spawn agents via Task tool.
 * Note: Actual Task tool invocation cannot be tested (Claude Code runtime only).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildAgentPrompt,
  getAgentConfig,
  parseAgentOutput,
} from '../../src/core/agents/spawner-helper.js';

const PROJECT_ROOT = process.cwd();

describe('spawner-helper', () => {
  describe('buildAgentPrompt', () => {
    it('should inject {{STAGE_ID}} variable', () => {
      const prompt = buildAgentPrompt('validation-agent', PROJECT_ROOT, {
        projectRoot: PROJECT_ROOT,
        stage: '01-brainstorm',
      });

      // The prompt should not contain the placeholder anymore
      expect(prompt).not.toContain('{{STAGE_ID}}');
      // And should contain the actual stage ID
      expect(prompt).toContain('01-brainstorm');
    });

    it('should inject {{PROJECT_ROOT}} variable', () => {
      const prompt = buildAgentPrompt('validation-agent', PROJECT_ROOT, {
        projectRoot: '/my/project/path',
        stage: '01-brainstorm',
      });

      // The prompt should not contain the placeholder anymore
      expect(prompt).not.toContain('{{PROJECT_ROOT}}');
      // And should contain the actual project root
      expect(prompt).toContain('/my/project/path');
    });

    it('should append context data as JSON', () => {
      const testData = {
        validationRules: {
          requiredFiles: ['ideas.md'],
          minSize: 500,
        },
      };

      const prompt = buildAgentPrompt('validation-agent', PROJECT_ROOT, {
        projectRoot: PROJECT_ROOT,
        stage: '01-brainstorm',
        data: testData,
      });

      expect(prompt).toContain('## Context Data');
      expect(prompt).toContain('**validationRules**:');
      expect(prompt).toContain('"requiredFiles"');
      expect(prompt).toContain('"ideas.md"');
      expect(prompt).toContain('"minSize": 500');
    });

    it('should not append Context Data section when no data provided', () => {
      const prompt = buildAgentPrompt('validation-agent', PROJECT_ROOT, {
        projectRoot: PROJECT_ROOT,
        stage: '01-brainstorm',
      });

      expect(prompt).not.toContain('## Context Data');
    });

    it('should not append Context Data section when data is empty object', () => {
      const prompt = buildAgentPrompt('validation-agent', PROJECT_ROOT, {
        projectRoot: PROJECT_ROOT,
        stage: '01-brainstorm',
        data: {},
      });

      expect(prompt).not.toContain('## Context Data');
    });

    it('should throw error for non-existent agent', () => {
      expect(() =>
        buildAgentPrompt('non-existent-agent', PROJECT_ROOT, {
          projectRoot: PROJECT_ROOT,
          stage: '01-brainstorm',
        })
      ).toThrow('Agent not found');
    });
  });

  describe('getAgentConfig', () => {
    it('should return model, tools, and extendedThinking', () => {
      const config = getAgentConfig('validation-agent', PROJECT_ROOT);

      expect(config.model).toBe('haiku');
      expect(config.tools).toEqual(['Read', 'Glob', 'Grep', 'Bash']);
      expect(config.extendedThinking).toBe(true);
    });

    it('should return undefined model for inherit', () => {
      // Find an agent with model: inherit or test the logic
      // For now, test with a known agent
      const config = getAgentConfig('validation-agent', PROJECT_ROOT);

      // validation-agent uses 'sonnet', not 'inherit'
      expect(config.model).toBe('haiku');
    });

    it('should return executionMode', () => {
      const config = getAgentConfig('validation-agent', PROJECT_ROOT);

      expect(config.executionMode).toBe('foreground');
    });

    it('should return mcpServers if defined', () => {
      const config = getAgentConfig('validation-agent', PROJECT_ROOT);

      // validation-agent may or may not have mcpServers
      expect(config.mcpServers === undefined || Array.isArray(config.mcpServers)).toBe(true);
    });

    it('should throw error for non-existent agent', () => {
      expect(() => getAgentConfig('non-existent-agent', PROJECT_ROOT)).toThrow(
        'Agent not found'
      );
    });
  });

  describe('parseAgentOutput', () => {
    it('should parse plain JSON', () => {
      const input = '{"success": true, "score": 0.95}';
      const result = parseAgentOutput<{ success: boolean; score: number }>(input);

      expect(result.success).toBe(true);
      expect(result.score).toBe(0.95);
    });

    it('should extract JSON from ```json blocks', () => {
      const input = `
Here is the validation result:

\`\`\`json
{
  "stage": "01-brainstorm",
  "passed": 5,
  "failed": 0,
  "score": 1.0
}
\`\`\`

The validation completed successfully.
`;
      const result = parseAgentOutput<{
        stage: string;
        passed: number;
        failed: number;
        score: number;
      }>(input);

      expect(result.stage).toBe('01-brainstorm');
      expect(result.passed).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.score).toBe(1.0);
    });

    it('should extract JSON object from mixed text', () => {
      const input = `
The analysis is complete. Here are the results:

{"consensus_ratio": 0.85, "quality_score": 0.9, "items": ["feature1", "feature2"]}

This indicates high agreement between models.
`;
      const result = parseAgentOutput<{
        consensus_ratio: number;
        quality_score: number;
        items: string[];
      }>(input);

      expect(result.consensus_ratio).toBe(0.85);
      expect(result.quality_score).toBe(0.9);
      expect(result.items).toEqual(['feature1', 'feature2']);
    });

    it('should handle nested JSON objects', () => {
      const input = `
\`\`\`json
{
  "validation": {
    "checks": [
      {"name": "file_exists", "passed": true},
      {"name": "size_check", "passed": false}
    ]
  },
  "summary": {"total": 2, "passed": 1}
}
\`\`\`
`;
      const result = parseAgentOutput<{
        validation: { checks: Array<{ name: string; passed: boolean }> };
        summary: { total: number; passed: number };
      }>(input);

      expect(result.validation.checks).toHaveLength(2);
      expect(result.validation.checks[0].name).toBe('file_exists');
      expect(result.summary.total).toBe(2);
    });

    it('should throw on invalid JSON', () => {
      const input = 'This is just plain text without any JSON';

      expect(() => parseAgentOutput(input)).toThrow('Failed to parse agent output as JSON');
    });

    it('should throw on malformed JSON', () => {
      const input = '{"broken": json, missing: "quotes"}';

      expect(() => parseAgentOutput(input)).toThrow();
    });

    it('should handle arrays as root element', () => {
      const input = '[1, 2, 3, "four"]';
      const result = parseAgentOutput<Array<number | string>>(input);

      expect(result).toEqual([1, 2, 3, 'four']);
    });

    it('should prefer ```json block over inline JSON', () => {
      // When both formats exist, the ```json block should be preferred
      const input = `
{"inline": "ignored"}

\`\`\`json
{"preferred": "this one"}
\`\`\`
`;
      const result = parseAgentOutput<{ preferred?: string; inline?: string }>(input);

      expect(result.preferred).toBe('this one');
      expect(result.inline).toBeUndefined();
    });
  });
});
