/**
 * Project creation command
 * Migrated from bin/create.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { input, confirm, select } from '@inquirer/prompts';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { log } from '../../utils/logger.js';
import { commandExists } from '../../utils/shell.js';
import { copyDirSync, ensureDir } from '../../utils/fs.js';
import { saveYaml } from '../../utils/yaml.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tech stack presets
const TECH_STACK_PRESETS = {
  easy: {
    name: 'Easy Stack (Recommended)',
    description: 'Supabase + Vercel - Perfect for MVPs',
    database: 'supabase',
    hosting: 'vercel',
    envVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  },
  fullstack: {
    name: 'Fullstack Stack',
    description: 'Supabase + Railway - Full backend support',
    database: 'supabase',
    hosting: 'railway',
    envVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'DATABASE_URL'],
  },
  serverless: {
    name: 'Serverless Stack',
    description: 'Firebase + Netlify - Real-time apps',
    database: 'firebase',
    hosting: 'netlify',
    envVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
  },
  enterprise: {
    name: 'Enterprise Stack',
    description: 'Neon + Render - Production-ready',
    database: 'neon',
    hosting: 'render',
    envVars: ['DATABASE_URL', 'DIRECT_URL'],
  },
  none: {
    name: 'No Database',
    description: 'Static site or external API only',
    database: 'none',
    hosting: 'vercel',
    envVars: [] as string[],
  },
} as const;

type TechStackPreset = keyof typeof TECH_STACK_PRESETS;

interface BriefInfo {
  description?: string;
  problem?: string;
  targetUser?: string;
  successCriteria?: string;
  constraintSchedule?: string;
  constraintBudget?: string;
  constraintTech?: string;
  references?: string;
  features?: string[];
  techStack?: string;
  database?: string;
  hosting?: string;
  envVars?: string[];
  sprintMode?: boolean;
  defaultSprints?: string;
  notionEnabled?: boolean;
  epicEnabled?: boolean;
  epicScope?: string;
  epicTotalCycles?: string;
  requirementsRefinement?: boolean;
  moodboardEnabled?: boolean;
  implementationOrder?: string | null;
  projectName?: string;
}

interface CreateOptions {
  skipPrompts: boolean;
}

/**
 * Check system dependencies
 */
async function checkDependencies(): Promise<{
  hasRequiredMissing: boolean;
  hasOptionalMissing: boolean;
  missingRequired: Array<{ cmd: string; purpose: string; install: string; impact: string }>;
  missingOptional: Array<{ cmd: string; purpose: string; install: string; fallback: string }>;
}> {
  const dependencies = {
    required: {
      jq: {
        purpose: 'State management (progress.json updates)',
        install: 'brew install jq',
        impact: 'Pipeline state tracking will not work!',
      },
      yq: {
        purpose: 'YAML config parsing (auto_invoke, model enforcement)',
        install: 'brew install yq',
        impact: 'Configuration settings cannot be read!',
      },
    },
    optional: {
      tmux: {
        purpose: 'External AI wrapper sessions (Gemini/Codex)',
        install: 'brew install tmux',
        fallback: 'External AI calls will fail; ClaudeCode will be used as fallback',
      },
      gemini: {
        purpose: 'Google Gemini CLI (stages 01, 03, 04)',
        install: 'See https://github.com/google/gemini-cli',
        fallback: 'Gemini stages will use ClaudeCode as fallback',
      },
      codex: {
        purpose: 'OpenAI Codex CLI (stages 07, 09)',
        install: 'npm install -g @openai/codex',
        fallback: 'Codex stages will use ClaudeCode as fallback',
      },
    },
  };

  const missingRequired: Array<{ cmd: string; purpose: string; install: string; impact: string }> = [];
  const missingOptional: Array<{ cmd: string; purpose: string; install: string; fallback: string }> = [];

  // Check required dependencies
  for (const [cmd, info] of Object.entries(dependencies.required)) {
    if (!(await commandExists(cmd))) {
      missingRequired.push({ cmd, ...info });
    }
  }

  // Check optional dependencies
  for (const [cmd, info] of Object.entries(dependencies.optional)) {
    if (!(await commandExists(cmd))) {
      missingOptional.push({ cmd, ...info });
    }
  }

  // Display warnings
  if (missingRequired.length > 0 || missingOptional.length > 0) {
    console.log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
    log('⚠️  Dependency Check Results', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  }

  if (missingRequired.length > 0) {
    console.log('');
    log('❌ REQUIRED dependencies missing (core functionality affected):', 'red');
    for (const dep of missingRequired) {
      console.log(`   ${chalk.red('•')} ${dep.cmd} - ${dep.purpose}`);
      console.log(`     Install: ${chalk.cyan(dep.install)}`);
      console.log(`     ${chalk.red(`Impact: ${dep.impact}`)}`);
    }
  }

  if (missingOptional.length > 0) {
    console.log('');
    log('⚠️  Optional dependencies missing (fallback available):', 'yellow');
    for (const dep of missingOptional) {
      console.log(`   ${chalk.yellow('•')} ${dep.cmd} - ${dep.purpose}`);
      console.log(`     Install: ${chalk.cyan(dep.install)}`);
      console.log(`     ${chalk.yellow(`Fallback: ${dep.fallback}`)}`);
    }
  }

  if (missingRequired.length > 0 || missingOptional.length > 0) {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
    console.log('');
  }

  return {
    hasRequiredMissing: missingRequired.length > 0,
    hasOptionalMissing: missingOptional.length > 0,
    missingRequired,
    missingOptional,
  };
}

/**
 * Display ASCII banner
 */
function displayAsciiBanner(): void {
  // Go up from dist/cli to project root, then to assets
  const bannerPath = path.join(__dirname, '..', '..', 'assets', 'claude_symphony_ascii.txt');
  if (fs.existsSync(bannerPath)) {
    const banner = fs.readFileSync(bannerPath, 'utf8');
    console.log(chalk.cyan(banner));
  }
}

/**
 * Select initialization mode
 */
async function selectInitMode(): Promise<'ai-assisted' | 'manual' | 'quick'> {
  console.log('');
  log('🎵 How would you like to set up your project?', 'cyan');
  console.log('');

  return select({
    message: 'Select setup mode:',
    choices: [
      { name: '🤖 AI-Assisted (Recommended) - Just describe your project', value: 'ai-assisted' as const },
      { name: '⚙️  Manual Setup - Configure everything step by step', value: 'manual' as const },
      { name: '⚡ Quick Start - Skip all questions, use defaults', value: 'quick' as const },
    ],
    default: 'ai-assisted' as const,
  });
}

/**
 * Collect AI-assisted setup info
 */
async function collectAIAssistedInfo(): Promise<BriefInfo> {
  console.log('');
  log('🤖 AI-Assisted Setup', 'cyan');
  log('   Just describe your project - AI handles the rest', 'cyan');
  console.log('');

  const description = await input({
    message: '📝 Describe your project in one sentence:',
    validate: (v) => (v.length > 0 ? true : 'Please enter a project description'),
  });

  // Detect project type from description
  const desc = description.toLowerCase();
  let detectedType = 'default';
  let recommendedPreset: TechStackPreset = 'easy';

  if (desc.includes('saas') || desc.includes('subscription') || desc.includes('dashboard')) {
    detectedType = 'SaaS';
    recommendedPreset = 'fullstack';
  } else if (desc.includes('mobile') || desc.includes('app') || desc.includes('ios') || desc.includes('android')) {
    detectedType = 'Mobile App';
    recommendedPreset = 'serverless';
  } else if (desc.includes('api') || desc.includes('backend') || desc.includes('microservice')) {
    detectedType = 'API/Backend';
    recommendedPreset = 'fullstack';
  } else if (desc.includes('shop') || desc.includes('ecommerce') || desc.includes('store') || desc.includes('payment')) {
    detectedType = 'E-commerce';
    recommendedPreset = 'enterprise';
  } else if (desc.includes('real-time') || desc.includes('chat') || desc.includes('live')) {
    detectedType = 'Real-time App';
    recommendedPreset = 'serverless';
  } else if (desc.includes('blog') || desc.includes('portfolio') || desc.includes('landing')) {
    detectedType = 'Static Site';
    recommendedPreset = 'easy';
  }

  const preset = TECH_STACK_PRESETS[recommendedPreset];

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🤖 AI Recommendations:', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log(`   Detected Type: ${detectedType}`);
  console.log(`   Recommended Stack: ${preset.name}`);
  console.log(`   Database: ${preset.database}`);
  console.log(`   Hosting: ${preset.hosting} (Git push auto-deploy)`);
  console.log('');

  const acceptRecommendation = await confirm({
    message: 'Accept these recommendations?',
    default: true,
  });

  if (acceptRecommendation) {
    return {
      description,
      techStack: recommendedPreset,
      database: preset.database,
      hosting: preset.hosting,
      envVars: [...preset.envVars],
      sprintMode: true,
      defaultSprints: '3',
      notionEnabled: true,
      epicEnabled: false,
      requirementsRefinement: true,
      moodboardEnabled: true,
      implementationOrder: null,
    };
  }

  // User declined - collect tech stack manually
  const techStackInfo = await collectTechStackInfo();
  return {
    description,
    ...techStackInfo,
    sprintMode: true,
    defaultSprints: '3',
    notionEnabled: true,
    epicEnabled: false,
    requirementsRefinement: true,
    moodboardEnabled: true,
    implementationOrder: null,
  };
}

/**
 * Collect quick start info (all defaults)
 */
function collectQuickStartInfo(): BriefInfo {
  console.log('');
  log('⚡ Quick Start - Using all defaults', 'cyan');
  console.log('');

  const preset = TECH_STACK_PRESETS.easy;

  return {
    description: '',
    techStack: 'easy',
    database: preset.database,
    hosting: preset.hosting,
    envVars: [...preset.envVars],
    sprintMode: true,
    defaultSprints: '3',
    notionEnabled: true,
    epicEnabled: false,
    requirementsRefinement: true,
    moodboardEnabled: true,
    implementationOrder: null,
  };
}

/**
 * Collect tech stack info
 */
async function collectTechStackInfo(): Promise<Partial<BriefInfo>> {
  console.log('');
  log('🗄️ Technology Stack Selection', 'yellow');
  console.log('');

  const database = await select({
    message: '🗄️ Select database:',
    choices: [
      { name: 'Supabase (Recommended) - PostgreSQL + APIs + Auth', value: 'supabase' },
      { name: 'Firebase - NoSQL + Real-time + Auth (Google)', value: 'firebase' },
      { name: 'PlanetScale - Serverless MySQL', value: 'planetscale' },
      { name: 'Neon - Serverless PostgreSQL', value: 'neon' },
      { name: 'None - Static site or external API', value: 'none' },
    ],
    default: 'supabase',
  });

  const hosting = await select({
    message: '🚀 Select hosting (all support Git auto-deploy):',
    choices: [
      { name: 'Vercel (Recommended) - Next.js optimized', value: 'vercel' },
      { name: 'Netlify - JAMstack optimized', value: 'netlify' },
      { name: 'Railway - Full-stack (frontend + backend)', value: 'railway' },
      { name: 'Render - Full-stack + managed PostgreSQL', value: 'render' },
    ],
    default: 'vercel',
  });

  const envVarsMap: Record<string, string[]> = {
    supabase: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    firebase: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
    planetscale: ['DATABASE_URL'],
    neon: ['DATABASE_URL', 'DIRECT_URL'],
    none: [],
  };

  const envVars = envVarsMap[database] || [];

  // Determine preset name
  let techStack = 'custom';
  if (database === 'supabase' && hosting === 'vercel') techStack = 'easy';
  else if (database === 'supabase' && hosting === 'railway') techStack = 'fullstack';
  else if (database === 'firebase' && hosting === 'netlify') techStack = 'serverless';
  else if (database === 'neon' && hosting === 'render') techStack = 'enterprise';

  return { database, hosting, envVars, techStack };
}

/**
 * Collect full brief info (manual mode)
 */
async function collectBriefInfo(): Promise<BriefInfo> {
  console.log('');
  log('📜 Creating project brief. (Press Enter to skip)', 'yellow');
  console.log('');

  const description = await input({ message: '📝 One-line description (Enter to skip):' });
  const problem = await input({ message: '🔍 Problem definition (Enter to skip):' });
  const targetUser = await input({ message: '🎯 Target users (Enter to skip):' });
  const successCriteria = await input({ message: '🏆 Success criteria (Enter to skip):' });
  const constraintSchedule = await input({ message: '⏰ Constraints - Schedule (Enter to skip):' });
  const constraintBudget = await input({ message: '💰 Constraints - Budget (Enter to skip):' });
  const constraintTech = await input({ message: '⚙️ Constraints - Technology (Enter to skip):' });
  const references = await input({ message: '🔗 References (Enter to skip):' });

  const techStackInfo = await collectTechStackInfo();

  // Core features
  console.log('');
  log('🎺 Core features (empty input to finish):', 'cyan');
  const features: string[] = [];
  let featureNum = 1;
  while (true) {
    const feature = await input({ message: `  ${featureNum}.` });
    if (!feature) {
      process.stdout.write('\x1b[1A\x1b[2K');
      break;
    }
    features.push(feature);
    featureNum++;
  }

  // Development mode configuration
  console.log('');
  log('⚙️ Development mode configuration', 'yellow');

  const sprintMode = await confirm({
    message: '🔄 Enable sprint-based iterative development?',
    default: true,
  });

  let defaultSprints = '3';
  if (sprintMode) {
    defaultSprints = await input({
      message: '📊 Default number of sprints:',
      default: '3',
      validate: (v) => {
        const num = parseInt(v);
        if (isNaN(num) || num < 1) return 'Enter a number >= 1';
        if (num > 100) return '⚠️ Maximum 100 sprints allowed';
        return true;
      },
    });
  }

  const notionEnabled = await confirm({
    message: '📋 Enable Notion task integration?',
    default: true,
  });

  // Epic & Workflow Configuration
  console.log('');
  log('🔄 Epic & Workflow Configuration', 'yellow');
  log('   (All settings can be modified later via commands)', 'cyan');

  const epicEnabled = await confirm({
    message: '🔄 Enable Epic Cycles? (repeat stages for iterative refinement)',
    default: false,
  });

  let epicScope = 'design';
  let epicTotalCycles = '2';

  if (epicEnabled) {
    epicScope = await select({
      message: '📍 Epic cycle scope: (which stages to repeat)',
      choices: [
        { name: 'Ideation (01-03) - concept exploration', value: 'ideation' },
        { name: 'Design (01-05) - full design iteration', value: 'design' },
        { name: 'Implementation (06-09) - code sprints', value: 'implementation' },
        { name: 'Full Pipeline (01-10) - end-to-end', value: 'full' },
      ],
      default: 'design',
    });

    epicTotalCycles = await input({
      message: '🔢 Total Epic cycles (1-5): (iterations for refinement)',
      default: '2',
      validate: (v) => {
        const num = parseInt(v);
        if (isNaN(num) || num < 1 || num > 5) return 'Enter 1-5';
        return true;
      },
    });
  }

  const implementationOrder = await select({
    message: '🏗️ Implementation order: (frontend-first vs backend-first)',
    choices: [
      { name: 'Frontend First - UI then APIs', value: 'frontend_first' },
      { name: 'Backend First - APIs then UI', value: 'backend_first' },
      { name: 'Parallel - both simultaneously', value: 'parallel' },
      { name: 'Decide Later', value: '' },
    ],
    default: '',
  });

  const requirementsRefinement = await confirm({
    message: '📋 Enable Requirements Refinement? (Epic→Feature→Task breakdown)',
    default: true,
  });

  const moodboardEnabled = await confirm({
    message: '🎨 Enable Moodboard collection? (visual references for UI/UX)',
    default: true,
  });

  return {
    description,
    problem,
    targetUser,
    successCriteria,
    constraintSchedule,
    constraintBudget,
    constraintTech,
    references,
    features,
    ...techStackInfo,
    sprintMode,
    defaultSprints,
    notionEnabled,
    epicEnabled,
    epicScope,
    epicTotalCycles,
    requirementsRefinement,
    moodboardEnabled,
    implementationOrder: implementationOrder || null,
  };
}

/**
 * Apply configuration settings
 */
async function applyConfigSettings(targetDir: string, info: BriefInfo): Promise<void> {
  const pipelinePath = path.join(targetDir, 'config', 'pipeline.yaml');
  const taskConfigPath = path.join(targetDir, 'stages', '05-task-management', 'config.yaml');
  const progressPath = path.join(targetDir, 'state', 'progress.json');

  // Sprint mode settings
  if (fs.existsSync(pipelinePath)) {
    try {
      const content = fs.readFileSync(pipelinePath, 'utf8');
      const config = yaml.load(content) as Record<string, unknown>;

      if (config.sprint_mode && typeof config.sprint_mode === 'object') {
        const sprintMode = config.sprint_mode as Record<string, unknown>;
        sprintMode.enabled = info.sprintMode ?? true;
        if (sprintMode.sprint_config && typeof sprintMode.sprint_config === 'object') {
          (sprintMode.sprint_config as Record<string, unknown>).default_sprints = parseInt(info.defaultSprints || '3');
        }
      }

      fs.writeFileSync(pipelinePath, yaml.dump(config, { lineWidth: -1 }));
    } catch {
      // Silently continue
    }
  }

  // Notion settings
  if (fs.existsSync(taskConfigPath)) {
    try {
      const content = fs.readFileSync(taskConfigPath, 'utf8');
      const config = yaml.load(content) as Record<string, unknown>;

      if (config) {
        if (!config.notion_integration) {
          config.notion_integration = { enabled: info.notionEnabled ?? true };
        } else if (typeof config.notion_integration === 'object') {
          (config.notion_integration as Record<string, unknown>).enabled = info.notionEnabled ?? true;
        }
      }

      fs.writeFileSync(taskConfigPath, yaml.dump(config, { lineWidth: -1 }));
    } catch {
      // Silently continue
    }
  }

  // Update progress.json with sprint count
  if (fs.existsSync(progressPath)) {
    try {
      const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8')) as Record<string, unknown>;
      const sprintCount = parseInt(info.defaultSprints || '3');

      if (progress.current_iteration && typeof progress.current_iteration === 'object') {
        (progress.current_iteration as Record<string, unknown>).total_sprints = sprintCount;
      }

      // Regenerate sprints object based on count
      if (progress.sprints) {
        progress.sprints = {};
        for (let i = 1; i <= sprintCount; i++) {
          (progress.sprints as Record<string, unknown>)[`Sprint ${i}`] = {
            status: 'pending',
            tasks_total: 0,
            tasks_completed: 0,
            checkpoint_id: null,
          };
        }
      }

      fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
    } catch {
      // Silently continue
    }
  }

  // Epic cycles and other settings
  const scopes: Record<string, { start: string; end: string }> = {
    ideation: { start: '01-brainstorm', end: '03-planning' },
    design: { start: '01-brainstorm', end: '05-task-management' },
    implementation: { start: '06-implementation', end: '09-testing' },
    full: { start: '01-brainstorm', end: '10-deployment' },
  };

  const epicPath = path.join(targetDir, 'config', 'epic_cycles.yaml');
  if (fs.existsSync(epicPath)) {
    try {
      const config = yaml.load(fs.readFileSync(epicPath, 'utf8')) as Record<string, unknown>;
      if (config.epic_cycles && typeof config.epic_cycles === 'object') {
        const epicCycles = config.epic_cycles as Record<string, unknown>;
        epicCycles.enabled = info.epicEnabled ?? false;
        if (info.epicEnabled && epicCycles.cycle_config && typeof epicCycles.cycle_config === 'object') {
          (epicCycles.cycle_config as Record<string, unknown>).default_cycles = parseInt(info.epicTotalCycles || '2');
        }
        if (info.epicEnabled && epicCycles.cycle_scope && typeof epicCycles.cycle_scope === 'object') {
          const scope = scopes[info.epicScope || 'design'] ?? scopes.design;
          const cycleScope = epicCycles.cycle_scope as Record<string, unknown>;
          if (scope) {
            cycleScope.start_stage = scope.start;
            cycleScope.end_stage = scope.end;
          }
        }
      }
      fs.writeFileSync(epicPath, yaml.dump(config, { lineWidth: -1 }));
    } catch {
      // Silently continue
    }
  }

  // Implementation order
  const implPath = path.join(targetDir, 'config', 'implementation_order.yaml');
  if (fs.existsSync(implPath)) {
    try {
      const config = yaml.load(fs.readFileSync(implPath, 'utf8')) as Record<string, unknown>;
      if (config.implementation_order && typeof config.implementation_order === 'object') {
        (config.implementation_order as Record<string, unknown>).current_order = info.implementationOrder ?? null;
      }
      fs.writeFileSync(implPath, yaml.dump(config, { lineWidth: -1 }));
    } catch {
      // Silently continue
    }
  }

  // Requirements refinement
  const reqPath = path.join(targetDir, 'config', 'requirements_refinement.yaml');
  if (fs.existsSync(reqPath)) {
    try {
      const config = yaml.load(fs.readFileSync(reqPath, 'utf8')) as Record<string, unknown>;
      if (config.requirements_refinement && typeof config.requirements_refinement === 'object') {
        (config.requirements_refinement as Record<string, unknown>).enabled = info.requirementsRefinement ?? true;
      }
      fs.writeFileSync(reqPath, yaml.dump(config, { lineWidth: -1 }));
    } catch {
      // Silently continue
    }
  }

  // UI-UX (Moodboard)
  const uiPath = path.join(targetDir, 'config', 'ui-ux.yaml');
  if (fs.existsSync(uiPath)) {
    try {
      const config = yaml.load(fs.readFileSync(uiPath, 'utf8')) as Record<string, unknown>;
      if (config.moodboard && typeof config.moodboard === 'object') {
        const moodboard = config.moodboard as Record<string, unknown>;
        if (moodboard.collection_flow && typeof moodboard.collection_flow === 'object') {
          (moodboard.collection_flow as Record<string, unknown>).enabled = info.moodboardEnabled ?? true;
        }
      }
      fs.writeFileSync(uiPath, yaml.dump(config, { lineWidth: -1 }));
    } catch {
      // Silently continue
    }
  }

  // Update progress.json with epic fields
  if (fs.existsSync(progressPath)) {
    try {
      const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8')) as Record<string, unknown>;

      if (progress.epic_cycle && typeof progress.epic_cycle === 'object') {
        const epicCycle = progress.epic_cycle as Record<string, unknown>;
        epicCycle.enabled = info.epicEnabled ?? false;
        if (info.epicEnabled) {
          epicCycle.total_cycles = parseInt(info.epicTotalCycles || '2');
          const scope = scopes[info.epicScope || 'design'] ?? scopes.design;
          if (scope && epicCycle.scope && typeof epicCycle.scope === 'object') {
            const epicScope = epicCycle.scope as Record<string, unknown>;
            epicScope.start_stage = scope.start;
            epicScope.end_stage = scope.end;
          }
        }
      }

      if (progress.current_iteration && typeof progress.current_iteration === 'object') {
        const currentIteration = progress.current_iteration as Record<string, unknown>;
        if (currentIteration.epic_context && typeof currentIteration.epic_context === 'object') {
          const epicContext = currentIteration.epic_context as Record<string, unknown>;
          epicContext.enabled = info.epicEnabled ?? false;
          epicContext.total_cycles = parseInt(info.epicTotalCycles || '1');
        }
      }

      if (progress.implementation_order && typeof progress.implementation_order === 'object') {
        (progress.implementation_order as Record<string, unknown>).selected = info.implementationOrder ?? null;
      }

      if (progress.requirements_refinement && typeof progress.requirements_refinement === 'object') {
        (progress.requirements_refinement as Record<string, unknown>).active = info.requirementsRefinement ?? true;
      }

      fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
    } catch {
      // Silently continue
    }
  }
}

/**
 * Generate .env.example file
 */
function generateEnvExample(targetDir: string, info: BriefInfo): void {
  const envLines = [
    `# ${info.projectName || 'Project'} Environment Variables`,
    `# Generated by claude-symphony`,
    `# Copy this file to .env.local and fill in the values`,
    ``,
    `# ============================================`,
    `# Application`,
    `# ============================================`,
    `NODE_ENV=development`,
    `NEXT_PUBLIC_APP_URL=http://localhost:3000`,
    ``,
  ];

  if (info.database === 'supabase') {
    envLines.push(
      `# ============================================`,
      `# Supabase Configuration`,
      `# Get from: https://supabase.com/dashboard/project/_/settings/api`,
      `# ============================================`,
      `NEXT_PUBLIC_SUPABASE_URL=your-project-url`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`,
      `# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`,
      ``
    );
  } else if (info.database === 'firebase') {
    envLines.push(
      `# ============================================`,
      `# Firebase Configuration`,
      `# Get from: Firebase Console > Project Settings > Service Accounts`,
      `# ============================================`,
      `FIREBASE_PROJECT_ID=your-project-id`,
      `FIREBASE_CLIENT_EMAIL=your-client-email`,
      `FIREBASE_PRIVATE_KEY=your-private-key`,
      ``
    );
  } else if (info.database === 'planetscale') {
    envLines.push(
      `# ============================================`,
      `# PlanetScale Configuration`,
      `# Get from: PlanetScale Dashboard > Connect`,
      `# ============================================`,
      `DATABASE_URL=your-connection-string`,
      ``
    );
  } else if (info.database === 'neon') {
    envLines.push(
      `# ============================================`,
      `# Neon Configuration`,
      `# Get from: Neon Console > Connection Details`,
      `# ============================================`,
      `DATABASE_URL=your-pooled-connection-string`,
      `# DIRECT_URL=your-direct-connection-string`,
      ``
    );
  }

  envLines.push(
    `# ============================================`,
    `# Add your custom environment variables below`,
    `# ============================================`
  );

  const envPath = path.join(targetDir, '.env.example');
  fs.writeFileSync(envPath, envLines.join('\n'));
}

/**
 * Save tech stack configuration
 */
async function saveTechStackConfig(targetDir: string, info: BriefInfo): Promise<void> {
  const configPath = path.join(targetDir, 'config', 'tech_stack.yaml');

  const techStackConfig = {
    tech_stack: {
      preset: info.techStack || 'custom',
      database: {
        provider: info.database || 'none',
        configured: false,
      },
      hosting: {
        provider: info.hosting || 'vercel',
        auto_deploy: true,
        configured: false,
      },
      env_vars: {
        required: info.envVars || [],
        configured: false,
      },
      selected_at: new Date().toISOString(),
    },
  };

  await saveYaml(configPath, techStackConfig);
}

/**
 * Generate project brief content
 */
function generateBriefContent(projectName: string, info: BriefInfo): string {
  let featuresContent: string;
  if (info.features && info.features.length > 0) {
    featuresContent = info.features.map((f, i) => `${i + 1}. ${f}`).join('\n');
  } else {
    featuresContent = '1. [Feature 1]\n2. [Feature 2]\n3. [Feature 3]';
  }

  return `# Project Brief

## Project Name
${projectName}

## One-line Description
${info.description || '[Describe your project in one line]'}

## Problem Definition
${info.problem || '[What problem are you trying to solve?]'}

## Target Users
${info.targetUser || '[Who are the main users?]'}

## Core Features (Draft)
${featuresContent}

## Success Criteria
${info.successCriteria || '[What criteria define project success?]'}

## Constraints
- Schedule: ${info.constraintSchedule || ''}
- Budget: ${info.constraintBudget || ''}
- Technology: ${info.constraintTech || ''}

## References
- ${info.references || '[URL or documents]'}
`;
}

/**
 * Remove nested .git directories
 */
function removeNestedGitDirs(dir: string, isRoot = true): void {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      if (item === '.git' && !isRoot) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else if (item !== '.git') {
        removeNestedGitDirs(itemPath, false);
      }
    }
  }
}

/**
 * Main project creation function
 */
export async function createProject(
  projectName: string,
  options: CreateOptions
): Promise<void> {
  const { skipPrompts } = options;

  // Project name validation
  if (projectName !== '.' && !/^[a-z0-9-]+$/.test(projectName)) {
    log('Error: Project name must contain only lowercase letters, numbers, and hyphens.', 'red');
    process.exit(1);
  }

  // Find template directory (relative to the package root)
  // When bundled, __dirname points to dist/cli, so we go up 2 levels to package root
  const packageRoot = path.resolve(__dirname, '..', '..');
  const templateDir = path.join(packageRoot, 'template');
  const targetDir = path.resolve(projectName);
  const actualProjectName = projectName === '.' ? path.basename(targetDir) : projectName;

  // Template existence check
  if (!fs.existsSync(templateDir)) {
    log(`Error: Template directory not found: ${templateDir}`, 'red');
    process.exit(1);
  }

  // Target directory check
  if (projectName !== '.' && fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      log(`Error: Directory is not empty: ${targetDir}`, 'red');
      process.exit(1);
    }
  }

  // Display ASCII banner
  displayAsciiBanner();

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`🎼 Creating claude-symphony project: ${actualProjectName}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log('');

  // Check system dependencies
  const depCheck = await checkDependencies();
  if (depCheck.hasRequiredMissing && !skipPrompts) {
    const continueAnyway = await confirm({
      message: 'Required dependencies are missing. Continue anyway?',
      default: false,
    });
    if (!continueAnyway) {
      log('Project creation cancelled. Please install required dependencies first.', 'yellow');
      process.exit(1);
    }
  }

  // Create target directory
  ensureDir(targetDir);
  log(`✓ Project directory: ${targetDir}`, 'green');

  // Collect project info based on selected mode
  let briefInfo: BriefInfo;
  if (!skipPrompts) {
    const initMode = await selectInitMode();

    switch (initMode) {
      case 'ai-assisted':
        briefInfo = await collectAIAssistedInfo();
        break;
      case 'quick':
        briefInfo = collectQuickStartInfo();
        break;
      case 'manual':
      default:
        briefInfo = await collectBriefInfo();
        break;
    }
  } else {
    briefInfo = collectQuickStartInfo();
  }

  // Copy template
  log('  Copying template...', 'blue');
  copyDirSync(templateDir, targetDir);
  log('✓ Template copy complete', 'green');

  // Remove nested .git directories
  removeNestedGitDirs(targetDir);
  log('✓ Cleaned up nested .git directories', 'green');

  // Initialize progress.json
  const progressTemplatePath = path.join(targetDir, 'state', 'progress.json.template');
  const progressPath = path.join(targetDir, 'state', 'progress.json');

  if (fs.existsSync(progressTemplatePath)) {
    let progressContent = fs.readFileSync(progressTemplatePath, 'utf8');
    const timestamp = new Date().toISOString();

    progressContent = progressContent
      .replace('{{PROJECT_NAME}}', actualProjectName)
      .replace('{{STARTED_AT}}', timestamp);

    fs.writeFileSync(progressPath, progressContent);
    fs.unlinkSync(progressTemplatePath);
    log('✓ progress.json initialized', 'green');
  }

  // Apply configuration settings
  await applyConfigSettings(targetDir, briefInfo);
  log('✓ Configuration settings applied', 'green');

  // Save tech stack configuration
  if (briefInfo.database || briefInfo.hosting) {
    await saveTechStackConfig(targetDir, briefInfo);
    log('✓ Tech stack configuration saved', 'green');
  }

  // Generate .env.example
  if (briefInfo.database && briefInfo.database !== 'none') {
    briefInfo.projectName = actualProjectName;
    generateEnvExample(targetDir, briefInfo);
    log('✓ .env.example generated', 'green');
  }

  // Create project_brief.md
  const briefPath = path.join(targetDir, 'stages', '01-brainstorm', 'inputs', 'project_brief.md');
  const briefDir = path.dirname(briefPath);

  ensureDir(briefDir);
  const briefContent = generateBriefContent(actualProjectName, briefInfo);
  fs.writeFileSync(briefPath, briefContent);
  log('✓ project_brief.md created', 'green');

  // Completion message
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log(`✓ Project '${actualProjectName}' created successfully!`, 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  log('🚀 Next steps:', 'yellow');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  console.log('');
  if (projectName !== '.') {
    console.log(`  1. cd ${projectName}`);
    console.log('  2. claude                      ← Start Claude Code');
    console.log('  3. Install plugin (in Claude Code):');
    log('     /plugin marketplace add jarrodwatts/claude-hud', 'cyan');
    log('     /plugin install claude-hud', 'cyan');
    console.log('  4. Edit stages/01-brainstorm/inputs/project_brief.md');
    console.log('  5. Run /run-stage 01-brainstorm');
  } else {
    console.log('  1. claude                      ← Start Claude Code');
    console.log('  2. Install plugin (in Claude Code):');
    log('     /plugin marketplace add jarrodwatts/claude-hud', 'cyan');
    log('     /plugin install claude-hud', 'cyan');
    console.log('  3. Edit stages/01-brainstorm/inputs/project_brief.md');
    console.log('  4. Run /run-stage 01-brainstorm');
  }
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📋 Pipeline stages:', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log('  01-brainstorm → 02-research → 03-planning → 04-ui-ux');
  console.log('  → 05-task-management → 06-implementation → 07-refactoring');
  console.log('  → 08-qa → 09-testing → 10-deployment');
  console.log('');
}
