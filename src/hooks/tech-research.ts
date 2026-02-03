/**
 * Tech Research Hook (v2)
 * Phase 2: Preparation - Tech stack research and pattern caching
 *
 * This module implements the Preparation phase that researches the
 * selected tech stack and caches patterns for implementation.
 */
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { parseJsonc } from '../utils/jsonc.js';
import { spawnAgent } from '../core/agents/index.js';

/**
 * Tech stack preferences from tech_preferences.jsonc
 */
export interface TechPreferences {
  frontend?: {
    framework?: string;
    styling?: string;
    state_management?: string;
  };
  backend?: {
    runtime?: string;
    framework?: string;
    api_style?: string;
  };
  database?: {
    type?: string;
    orm?: string;
  };
  infrastructure?: {
    hosting?: string;
    ci_cd?: string;
  };
  additional?: string[];
}

/**
 * Research result for a single technology
 */
export interface TechResearchResult {
  technology: string;
  category: string;
  bestPractices: string[];
  patterns: string[];
  pitfalls: string[];
  documentation?: string;
  timestamp: string;
}

/**
 * Preparation phase state
 */
export interface PreparationState {
  techStack: TechPreferences;
  researchResults: TechResearchResult[];
  cachedDocs: string[];
  memoryKeys: string[];
  isComplete: boolean;
  timestamp: string;
}

/**
 * Tech research queries mapping
 */
const TECH_RESEARCH_QUERIES: Record<string, string[]> = {
  // Frontend frameworks
  react: ['React 2024 best practices', 'React hooks patterns', 'React performance optimization'],
  vue: ['Vue 3 composition API best practices', 'Vue 3 patterns', 'Vuex/Pinia state management'],
  svelte: ['Svelte best practices', 'SvelteKit patterns', 'Svelte stores'],
  nextjs: ['Next.js 14 app router best practices', 'Next.js server components', 'Next.js performance'],
  nuxt: ['Nuxt 3 best practices', 'Nuxt 3 composables', 'Nuxt 3 data fetching'],

  // Styling
  tailwind: ['Tailwind CSS best practices', 'Tailwind component patterns', 'Tailwind design system'],
  'css-in-js': ['CSS-in-JS best practices', 'styled-components patterns', 'emotion patterns'],

  // Backend
  nodejs: ['Node.js security best practices', 'Node.js performance patterns', 'Node.js error handling'],
  express: ['Express.js middleware patterns', 'Express.js security', 'Express.js API design'],
  fastify: ['Fastify best practices', 'Fastify plugins', 'Fastify performance'],
  nestjs: ['NestJS architecture patterns', 'NestJS best practices', 'NestJS testing'],
  python: ['Python async patterns', 'Python type hints best practices', 'Python project structure'],
  fastapi: ['FastAPI best practices', 'FastAPI dependency injection', 'FastAPI testing'],
  django: ['Django best practices 2024', 'Django REST framework patterns', 'Django security'],
  go: ['Go project structure', 'Go error handling patterns', 'Go concurrency patterns'],
  rust: ['Rust web framework patterns', 'Actix-web best practices', 'Rust error handling'],

  // Databases
  postgresql: ['PostgreSQL optimization', 'PostgreSQL indexing strategies', 'PostgreSQL best practices'],
  mongodb: ['MongoDB schema design', 'MongoDB indexing', 'MongoDB aggregation patterns'],
  supabase: ['Supabase best practices', 'Supabase row level security', 'Supabase edge functions'],

  // ORM
  prisma: ['Prisma best practices', 'Prisma schema design', 'Prisma performance'],
  drizzle: ['Drizzle ORM patterns', 'Drizzle migrations', 'Drizzle queries'],
  typeorm: ['TypeORM best practices', 'TypeORM relations', 'TypeORM migrations'],

  // Testing
  jest: ['Jest testing patterns', 'Jest mocking best practices', 'Jest performance'],
  vitest: ['Vitest configuration', 'Vitest mocking', 'Vitest coverage'],
  playwright: ['Playwright E2E patterns', 'Playwright page objects', 'Playwright parallel testing'],
  cypress: ['Cypress best practices', 'Cypress component testing', 'Cypress custom commands'],

  // Infrastructure
  docker: ['Docker best practices', 'Dockerfile optimization', 'Docker compose patterns'],
  kubernetes: ['Kubernetes deployment patterns', 'Kubernetes best practices', 'Kubernetes security'],
  'github-actions': ['GitHub Actions workflow patterns', 'GitHub Actions caching', 'GitHub Actions secrets'],
  vercel: ['Vercel deployment best practices', 'Vercel edge functions', 'Vercel environment variables'],
  aws: ['AWS Lambda best practices', 'AWS ECS patterns', 'AWS security best practices'],
};

/**
 * Parse tech stack from tech_preferences.jsonc
 */
export async function parseTechStack(projectRoot: string): Promise<TechPreferences> {
  const configPath = path.join(projectRoot, 'config', 'tech_preferences.jsonc');

  if (!existsSync(configPath)) {
    logWarning('tech_preferences.jsonc not found, using defaults');
    return {
      frontend: { framework: 'react', styling: 'tailwind' },
      backend: { runtime: 'nodejs', framework: 'express' },
      database: { type: 'postgresql', orm: 'prisma' },
    };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return parseJsonc(content) as TechPreferences;
  } catch (error) {
    logError(`Failed to parse tech_preferences.jsonc: ${error}`);
    return {};
  }
}

/**
 * Extract technology identifiers from preferences
 */
function extractTechIdentifiers(prefs: TechPreferences): string[] {
  const techs: string[] = [];

  // Frontend
  if (prefs.frontend?.framework) {
    techs.push(prefs.frontend.framework.toLowerCase());
  }
  if (prefs.frontend?.styling) {
    techs.push(prefs.frontend.styling.toLowerCase());
  }
  if (prefs.frontend?.state_management) {
    techs.push(prefs.frontend.state_management.toLowerCase());
  }

  // Backend
  if (prefs.backend?.runtime) {
    techs.push(prefs.backend.runtime.toLowerCase());
  }
  if (prefs.backend?.framework) {
    techs.push(prefs.backend.framework.toLowerCase());
  }

  // Database
  if (prefs.database?.type) {
    techs.push(prefs.database.type.toLowerCase());
  }
  if (prefs.database?.orm) {
    techs.push(prefs.database.orm.toLowerCase());
  }

  // Infrastructure
  if (prefs.infrastructure?.hosting) {
    techs.push(prefs.infrastructure.hosting.toLowerCase());
  }
  if (prefs.infrastructure?.ci_cd) {
    techs.push(prefs.infrastructure.ci_cd.toLowerCase());
  }

  // Additional
  if (prefs.additional) {
    techs.push(...prefs.additional.map((t) => t.toLowerCase()));
  }

  return [...new Set(techs)]; // Remove duplicates
}

/**
 * Generate research prompt for a technology
 */
function generateResearchPrompt(tech: string, queries: string[]): string {
  return `# Tech Research: ${tech}

Research the following topics and provide a structured summary:

## Topics
${queries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Required Output Format

Respond with a JSON object:
\`\`\`json
{
  "technology": "${tech}",
  "bestPractices": ["practice1", "practice2", ...],
  "patterns": ["pattern1", "pattern2", ...],
  "pitfalls": ["pitfall1", "pitfall2", ...],
  "keyInsights": "Brief summary of key insights"
}
\`\`\`

Focus on practical, actionable advice that can be applied during implementation.
`;
}

/**
 * Research a single technology using /sc:research
 */
export async function researchTechnology(
  projectRoot: string,
  tech: string,
  category: string
): Promise<TechResearchResult> {
  const queries = TECH_RESEARCH_QUERIES[tech] || [`${tech} best practices`, `${tech} patterns`];
  const prompt = generateResearchPrompt(tech, queries);

  logInfo(`Researching: ${tech}...`);

  try {
    const result = await spawnAgent(
      'tech-researcher',
      {
        projectRoot,
        stage: 'preparation',
        data: { prompt, tech },
      },
      'foreground'
    );

    if (!result.success || !result.result) {
      return {
        technology: tech,
        category,
        bestPractices: [],
        patterns: [],
        pitfalls: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Parse result
    const jsonMatch = result.result.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch && jsonMatch[1] ? jsonMatch[1] : result.result;

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        technology: tech,
        category,
        bestPractices: parsed.bestPractices || [],
        patterns: parsed.patterns || [],
        pitfalls: parsed.pitfalls || [],
        documentation: parsed.keyInsights,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        technology: tech,
        category,
        bestPractices: [],
        patterns: [],
        pitfalls: [],
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    logError(`Research failed for ${tech}: ${error}`);
    return {
      technology: tech,
      category,
      bestPractices: [],
      patterns: [],
      pitfalls: [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Research entire tech stack
 */
export async function researchTechStack(projectRoot: string): Promise<TechResearchResult[]> {
  const prefs = await parseTechStack(projectRoot);
  const techs = extractTechIdentifiers(prefs);
  const results: TechResearchResult[] = [];

  logInfo(`Researching ${techs.length} technologies...`);

  // Research each technology (could be parallelized)
  for (const tech of techs) {
    const category = getCategoryForTech(tech, prefs);
    const result = await researchTechnology(projectRoot, tech, category);
    results.push(result);
  }

  return results;
}

/**
 * Get category for a technology based on preferences
 */
function getCategoryForTech(tech: string, prefs: TechPreferences): string {
  const techLower = tech.toLowerCase();

  if (prefs.frontend) {
    if (
      prefs.frontend.framework?.toLowerCase() === techLower ||
      prefs.frontend.styling?.toLowerCase() === techLower ||
      prefs.frontend.state_management?.toLowerCase() === techLower
    ) {
      return 'frontend';
    }
  }

  if (prefs.backend) {
    if (
      prefs.backend.runtime?.toLowerCase() === techLower ||
      prefs.backend.framework?.toLowerCase() === techLower
    ) {
      return 'backend';
    }
  }

  if (prefs.database) {
    if (
      prefs.database.type?.toLowerCase() === techLower ||
      prefs.database.orm?.toLowerCase() === techLower
    ) {
      return 'database';
    }
  }

  if (prefs.infrastructure) {
    if (
      prefs.infrastructure.hosting?.toLowerCase() === techLower ||
      prefs.infrastructure.ci_cd?.toLowerCase() === techLower
    ) {
      return 'infrastructure';
    }
  }

  return 'additional';
}

/**
 * Cache official documentation using Context7 MCP
 * Note: This is a placeholder - actual implementation depends on MCP availability
 */
export async function cacheOfficialDocs(
  _projectRoot: string,
  techs: string[]
): Promise<string[]> {
  const cachedDocs: string[] = [];

  logInfo('Caching official documentation...');

  // Context7 MCP integration would go here
  // For now, just log the techs that would be cached
  for (const tech of techs) {
    logInfo(`  Would cache docs for: ${tech}`);
    cachedDocs.push(`docs/${tech}`);
  }

  logSuccess(`Documentation references prepared for ${techs.length} technologies`);
  return cachedDocs;
}

/**
 * Save research results to Serena memory
 * Note: This is a placeholder - actual implementation depends on MCP availability
 */
export async function saveToMemory(
  projectRoot: string,
  results: TechResearchResult[]
): Promise<string[]> {
  const memoryKeys: string[] = [];

  logInfo('Saving patterns to memory...');

  // Save research results as local files (Serena integration would enhance this)
  const researchDir = path.join(projectRoot, 'state', 'research');
  await ensureDirAsync(researchDir);

  for (const result of results) {
    const key = `tech/${result.category}/${result.technology}`;
    const filePath = path.join(researchDir, `${result.technology}.json`);

    await writeJson(filePath, result);
    memoryKeys.push(key);
    logInfo(`  Saved: ${key}`);
  }

  // Also save a combined patterns file for easy reference
  const combinedPatterns = {
    timestamp: new Date().toISOString(),
    technologies: results.map((r) => ({
      name: r.technology,
      category: r.category,
      bestPractices: r.bestPractices,
      patterns: r.patterns,
    })),
  };

  await writeJson(path.join(researchDir, 'combined_patterns.json'), combinedPatterns);
  logSuccess(`Saved ${results.length} research results to memory`);

  return memoryKeys;
}

/**
 * Run preparation phase
 */
export async function runPreparation(projectRoot: string): Promise<PreparationState> {
  logInfo('');
  logInfo('==========================================');
  logInfo('  Preparation Phase: Tech Stack Research');
  logInfo('==========================================');
  logInfo('');

  // 1. Parse tech stack
  const techStack = await parseTechStack(projectRoot);
  const techs = extractTechIdentifiers(techStack);
  logInfo(`Tech stack: ${techs.join(', ')}`);

  // 2. Research each technology
  const researchResults = await researchTechStack(projectRoot);

  // 3. Cache official documentation
  const cachedDocs = await cacheOfficialDocs(projectRoot, techs);

  // 4. Save to memory
  const memoryKeys = await saveToMemory(projectRoot, researchResults);

  // 5. Create preparation state
  const state: PreparationState = {
    techStack,
    researchResults,
    cachedDocs,
    memoryKeys,
    isComplete: researchResults.length > 0,
    timestamp: new Date().toISOString(),
  };

  // Save state
  const stateDir = path.join(projectRoot, 'state', 'preparation');
  await ensureDirAsync(stateDir);
  await writeJson(path.join(stateDir, 'preparation_state.json'), state);

  // Log summary
  logInfo('');
  if (state.isComplete) {
    logSuccess('Preparation phase complete! Ready for Execution phase.');
  } else {
    logWarning('Preparation phase incomplete - some research may have failed.');
  }

  return state;
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const projectRoot = process.cwd();

  try {
    const state = await runPreparation(projectRoot);
    process.exit(state.isComplete ? 0 : 1);
  } catch (error) {
    logError(error instanceof Error ? error.message : 'Preparation phase failed');
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('tech-research')) {
  main().catch(console.error);
}
