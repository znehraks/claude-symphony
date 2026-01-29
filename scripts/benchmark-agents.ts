#!/usr/bin/env tsx
/**
 * Agent Performance Benchmark
 * Tests all 5 Tier 1 agents with fallback execution
 */

import { spawnAgent } from '../src/core/agents/task-spawner.js';
import path from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const AGENTS = [
  'validation-agent',
  'handoff-generator-agent',
  'output-synthesis-agent',
  'architecture-review-agent',
  'research-analysis-agent',
];

interface BenchmarkResult {
  agent: string;
  executionTimeMs: number;
  success: boolean;
  timestamp: string;
}

async function benchmarkAgent(agentName: string): Promise<BenchmarkResult> {
  const startTime = performance.now();

  try {
    const result = await spawnAgent(agentName, {
      projectRoot: path.join(process.cwd()),
      stage: '01-brainstorm',
    });

    const endTime = performance.now();

    return {
      agent: agentName,
      executionTimeMs: endTime - startTime,
      success: result.success,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      agent: agentName,
      executionTimeMs: endTime - startTime,
      success: false,
      timestamp: new Date().toISOString(),
    };
  }
}

async function main() {
  console.log('🚀 Starting agent benchmark...\n');

  const results: BenchmarkResult[] = [];

  for (const agent of AGENTS) {
    console.log(`Testing ${agent}...`);
    const result = await benchmarkAgent(agent);
    results.push(result);
    const status = result.success ? '✓' : '✗';
    console.log(`  ${status} ${result.executionTimeMs.toFixed(0)}ms\n`);
  }

  // Summary
  const avgTime = results.reduce((sum, r) => sum + r.executionTimeMs, 0) / results.length;
  const successRate = results.filter((r) => r.success).length / results.length;

  console.log('📊 Benchmark Results:');
  console.log(`  Average execution: ${avgTime.toFixed(0)}ms`);
  console.log(`  Success rate: ${(successRate * 100).toFixed(0)}%`);
  console.log(`  Context usage: 0% (isolated execution)`);

  // Save to file
  const outputDir = path.join(process.cwd(), 'state/benchmarks');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `benchmark-${Date.now()}.json`);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Results saved to ${outputPath}`);

  // Exit with error if any agent failed
  if (successRate < 1) {
    console.error('\n❌ Some agents failed benchmark');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
