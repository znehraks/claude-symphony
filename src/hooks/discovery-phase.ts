/**
 * Discovery Phase Hook (v2)
 * Phase 1: Socratic questioning to gather requirements and API keys
 *
 * This module implements the Discovery phase that uses /sc:brainstorm
 * to gather sufficient information before pipeline execution.
 */
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { writeJson, ensureDirAsync } from '../utils/fs.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logger.js';
import { parseJsonc } from '../utils/jsonc.js';

/**
 * Discovery configuration from discovery.jsonc
 */
export interface DiscoveryConfig {
  completion_criteria: {
    project_description_min_length: number;
    tech_preferences_defined: boolean;
    user_confirmed: boolean;
  };
  api_keys: {
    required: string[];
    optional: string[];
  };
  questions: {
    initial: string[];
    follow_up: Record<string, string[]>;
  };
}

/**
 * Discovery state
 */
export interface DiscoveryState {
  projectDescription: string;
  techPreferences: Record<string, string>;
  collectedApiKeys: string[];
  missingRequiredKeys: string[];
  missingOptionalKeys: string[];
  questionsAsked: number;
  isComplete: boolean;
  timestamp: string;
}

/**
 * API key check result
 */
export interface ApiKeyCheckResult {
  allRequiredPresent: boolean;
  requiredKeys: { key: string; present: boolean }[];
  optionalKeys: { key: string; present: boolean }[];
  message: string;
}

/**
 * Default discovery configuration
 */
const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  completion_criteria: {
    project_description_min_length: 100,
    tech_preferences_defined: true,
    user_confirmed: true,
  },
  api_keys: {
    required: ['ANTHROPIC_API_KEY'],
    optional: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY', 'GITHUB_TOKEN'],
  },
  questions: {
    initial: [
      'What problem does this project solve?',
      'Who are the target users?',
      'What are the core features you want to build?',
      'Do you have any technology preferences (frontend, backend, database)?',
      'What is the expected scale (users, data volume)?',
    ],
    follow_up: {
      frontend: [
        'Do you prefer React, Vue, or Svelte?',
        'Do you need SSR (Next.js, Nuxt, SvelteKit)?',
        'What styling approach (Tailwind, CSS-in-JS, plain CSS)?',
      ],
      backend: [
        'Do you prefer Node.js, Python, Go, or Rust?',
        'REST API, GraphQL, or tRPC?',
        'Do you need real-time features (WebSockets)?',
      ],
      database: [
        'PostgreSQL, MySQL, MongoDB, or SQLite?',
        'Do you need Supabase for BaaS features?',
        'Do you need caching (Redis)?',
      ],
    },
  },
};

/**
 * Load discovery configuration
 */
export async function loadDiscoveryConfig(projectRoot: string): Promise<DiscoveryConfig> {
  const configPath = path.join(projectRoot, 'config', 'discovery.jsonc');

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      const config = parseJsonc(content) as Partial<DiscoveryConfig>;
      return { ...DEFAULT_DISCOVERY_CONFIG, ...config };
    } catch (error) {
      logWarning(`Failed to load discovery.jsonc: ${error}`);
    }
  }

  return DEFAULT_DISCOVERY_CONFIG;
}

/**
 * Check API keys in environment
 */
export function checkApiKeys(config: DiscoveryConfig): ApiKeyCheckResult {
  const requiredKeys = config.api_keys.required.map((key) => ({
    key,
    present: !!process.env[key],
  }));

  const optionalKeys = config.api_keys.optional.map((key) => ({
    key,
    present: !!process.env[key],
  }));

  const missingRequired = requiredKeys.filter((k) => !k.present);
  const allRequiredPresent = missingRequired.length === 0;

  let message: string;
  if (allRequiredPresent) {
    const presentOptional = optionalKeys.filter((k) => k.present).length;
    message = `All required API keys present. ${presentOptional}/${optionalKeys.length} optional keys available.`;
  } else {
    message = `Missing required API keys: ${missingRequired.map((k) => k.key).join(', ')}`;
  }

  return {
    allRequiredPresent,
    requiredKeys,
    optionalKeys,
    message,
  };
}

/**
 * Check if discovery is complete
 */
export function isDiscoveryComplete(
  state: DiscoveryState,
  config: DiscoveryConfig
): { complete: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check project description length
  if (state.projectDescription.length < config.completion_criteria.project_description_min_length) {
    reasons.push(
      `Project description too short (${state.projectDescription.length}/${config.completion_criteria.project_description_min_length} chars)`
    );
  }

  // Check tech preferences
  if (config.completion_criteria.tech_preferences_defined && Object.keys(state.techPreferences).length === 0) {
    reasons.push('Tech preferences not defined');
  }

  // Check required API keys
  if (state.missingRequiredKeys.length > 0) {
    reasons.push(`Missing required API keys: ${state.missingRequiredKeys.join(', ')}`);
  }

  return {
    complete: reasons.length === 0,
    reasons,
  };
}

/**
 * Initialize discovery state
 */
export function initDiscoveryState(): DiscoveryState {
  return {
    projectDescription: '',
    techPreferences: {},
    collectedApiKeys: [],
    missingRequiredKeys: [],
    missingOptionalKeys: [],
    questionsAsked: 0,
    isComplete: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate discovery prompt for /sc:brainstorm
 */
export function generateDiscoveryPrompt(state: DiscoveryState, config: DiscoveryConfig): string {
  const apiKeyStatus = checkApiKeys(config);

  let prompt = `# Discovery Phase: Gather Project Requirements

You are in the Discovery phase of the claude-symphony pipeline. Your goal is to gather enough information to proceed with the automated development pipeline.

## Current State
- Project description: ${state.projectDescription.length > 0 ? 'Provided' : 'Not provided'}
- Tech preferences: ${Object.keys(state.techPreferences).length > 0 ? 'Defined' : 'Not defined'}
- Questions asked: ${state.questionsAsked}

## API Key Status
`;

  for (const key of apiKeyStatus.requiredKeys) {
    const status = key.present ? 'Present' : 'MISSING (Required)';
    prompt += `- ${key.key}: ${status}\n`;
  }

  for (const key of apiKeyStatus.optionalKeys) {
    const status = key.present ? 'Present' : 'Not set (Optional)';
    prompt += `- ${key.key}: ${status}\n`;
  }

  prompt += `
## Instructions

Use the Socratic method to gather project requirements:
1. Ask clarifying questions about the project goals
2. Understand the target users and their needs
3. Identify core features and priorities
4. Gather technology preferences
5. Assess expected scale and constraints

## Questions to Consider
${config.questions.initial.map((q) => `- ${q}`).join('\n')}

## Completion Criteria
- Project description: ${config.completion_criteria.project_description_min_length}+ characters
- Tech preferences: Must be defined
- Required API keys: ${config.api_keys.required.join(', ')}

When you have gathered sufficient information, summarize the requirements in a structured format that can be used for the Planning stage.

If API keys are missing, inform the user:
"To proceed with the full pipeline, please add the following to your .env file:
${config.api_keys.required.filter((k) => !process.env[k]).map((k) => `${k}=your_key_here`).join('\n')}"
`;

  return prompt;
}

/**
 * Run discovery phase
 * Returns a prompt for /sc:brainstorm to use
 */
export async function runDiscovery(projectRoot: string): Promise<{
  prompt: string;
  state: DiscoveryState;
  config: DiscoveryConfig;
  apiKeyCheck: ApiKeyCheckResult;
}> {
  logInfo('Initializing Discovery phase...');

  const config = await loadDiscoveryConfig(projectRoot);
  const state = initDiscoveryState();
  const apiKeyCheck = checkApiKeys(config);

  // Update state with API key info
  state.missingRequiredKeys = apiKeyCheck.requiredKeys.filter((k) => !k.present).map((k) => k.key);
  state.missingOptionalKeys = apiKeyCheck.optionalKeys.filter((k) => !k.present).map((k) => k.key);
  state.collectedApiKeys = [
    ...apiKeyCheck.requiredKeys.filter((k) => k.present).map((k) => k.key),
    ...apiKeyCheck.optionalKeys.filter((k) => k.present).map((k) => k.key),
  ];

  // Generate discovery prompt
  const prompt = generateDiscoveryPrompt(state, config);

  // Log status
  logInfo('');
  logInfo('==========================================');
  logInfo('  Discovery Phase');
  logInfo('==========================================');
  logInfo('');

  if (apiKeyCheck.allRequiredPresent) {
    logSuccess(`API Keys: ${apiKeyCheck.message}`);
  } else {
    logError(`API Keys: ${apiKeyCheck.message}`);
  }

  // Save state
  const stateDir = path.join(projectRoot, 'state', 'discovery');
  await ensureDirAsync(stateDir);
  await writeJson(path.join(stateDir, 'discovery_state.json'), state);

  return {
    prompt,
    state,
    config,
    apiKeyCheck,
  };
}

/**
 * Update discovery state with collected information
 */
export async function updateDiscoveryState(
  projectRoot: string,
  updates: Partial<DiscoveryState>
): Promise<DiscoveryState> {
  const stateDir = path.join(projectRoot, 'state', 'discovery');
  const statePath = path.join(stateDir, 'discovery_state.json');

  let state = initDiscoveryState();

  if (existsSync(statePath)) {
    try {
      const content = readFileSync(statePath, 'utf-8');
      state = JSON.parse(content) as DiscoveryState;
    } catch {
      // Use default state
    }
  }

  // Apply updates
  const updatedState: DiscoveryState = {
    ...state,
    ...updates,
    timestamp: new Date().toISOString(),
  };

  // Check completion
  const config = await loadDiscoveryConfig(projectRoot);
  const completionCheck = isDiscoveryComplete(updatedState, config);
  updatedState.isComplete = completionCheck.complete;

  // Save updated state
  await ensureDirAsync(stateDir);
  await writeJson(statePath, updatedState);

  // Log status
  if (updatedState.isComplete) {
    logSuccess('Discovery phase complete! Ready for Preparation phase.');
  } else {
    logInfo(`Discovery incomplete: ${completionCheck.reasons.join('; ')}`);
  }

  return updatedState;
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const projectRoot = process.cwd();

  try {
    const result = await runDiscovery(projectRoot);
    console.log('\n--- Discovery Prompt ---\n');
    console.log(result.prompt);
    process.exit(0);
  } catch (error) {
    logError(error instanceof Error ? error.message : 'Discovery phase failed');
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('discovery-phase')) {
  main().catch(console.error);
}
