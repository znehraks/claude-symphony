/**
 * Import command — analyze an existing project and set up claude-symphony
 *
 * Detects which pipeline stages are already "done" based on project analysis,
 * installs the symphony template, and prepares to run remaining stages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { log } from '../../utils/logger.js';
import { copyDirSync, ensureDir } from '../../utils/fs.js';
import { STAGE_IDS, STAGE_NAMES } from '../../types/stage.js';
import type { StageId } from '../../types/stage.js';
import { createInitialProgress } from '../../types/state.js';
import { saveProgress } from '../../core/state/progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Stage detection result
 */
interface StageDetection {
  stageId: StageId;
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

/**
 * Detect if a project has existing code (stage 06)
 */
function detectImplementation(projectRoot: string): StageDetection {
  const evidence: string[] = [];
  const srcPatterns = ['src/', 'app/', 'lib/', 'pages/', 'components/'];

  for (const pattern of srcPatterns) {
    const dir = path.join(projectRoot, pattern);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const codeFiles = files.filter((f) =>
        /\.(ts|tsx|js|jsx|py|go|rs|java|rb)$/.test(f)
      );
      if (codeFiles.length > 0) {
        evidence.push(`Found ${codeFiles.length} source files in ${pattern}`);
      }
    }
  }

  // Check for package.json or similar project files
  const projectFiles = ['package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'Gemfile'];
  for (const file of projectFiles) {
    if (fs.existsSync(path.join(projectRoot, file))) {
      evidence.push(`Found ${file}`);
    }
  }

  return {
    stageId: '06-implementation',
    detected: evidence.length >= 2,
    confidence: evidence.length >= 3 ? 'high' : evidence.length >= 2 ? 'medium' : 'low',
    evidence,
  };
}

/**
 * Detect if a project has tests (stage 09)
 */
function detectTests(projectRoot: string): StageDetection {
  const evidence: string[] = [];
  const testDirs = ['test/', 'tests/', '__tests__/', 'spec/', 'e2e/'];

  for (const dir of testDirs) {
    const testPath = path.join(projectRoot, dir);
    if (fs.existsSync(testPath)) {
      evidence.push(`Found test directory: ${dir}`);
    }
  }

  // Check for test config files
  const testConfigs = [
    'vitest.config.ts', 'vitest.config.js',
    'jest.config.ts', 'jest.config.js', 'jest.config.json',
    'playwright.config.ts', 'cypress.config.ts',
    'pytest.ini', 'setup.cfg',
  ];
  for (const config of testConfigs) {
    if (fs.existsSync(path.join(projectRoot, config))) {
      evidence.push(`Found test config: ${config}`);
    }
  }

  // Check package.json for test script
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
        evidence.push('Found test script in package.json');
      }
    } catch { /* skip */ }
  }

  return {
    stageId: '09-testing',
    detected: evidence.length >= 2,
    confidence: evidence.length >= 3 ? 'high' : evidence.length >= 2 ? 'medium' : 'low',
    evidence,
  };
}

/**
 * Detect CI/CD setup (stage 10)
 */
function detectDeployment(projectRoot: string): StageDetection {
  const evidence: string[] = [];

  const ciPaths = [
    '.github/workflows/',
    '.gitlab-ci.yml',
    '.circleci/',
    'Jenkinsfile',
    '.travis.yml',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    'vercel.json',
    'netlify.toml',
    'railway.json',
    'fly.toml',
    'render.yaml',
  ];

  for (const ciPath of ciPaths) {
    const fullPath = path.join(projectRoot, ciPath);
    if (fs.existsSync(fullPath)) {
      evidence.push(`Found CI/CD config: ${ciPath}`);
    }
  }

  return {
    stageId: '10-deployment',
    detected: evidence.length >= 1,
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  };
}

/**
 * Detect existing documentation (stages 01-03)
 */
function detectDocumentation(projectRoot: string): StageDetection[] {
  const detections: StageDetection[] = [];

  // README as basic documentation
  const hasReadme = fs.existsSync(path.join(projectRoot, 'README.md'));
  const hasArchDocs = ['ARCHITECTURE.md', 'docs/architecture.md', 'docs/ARCHITECTURE.md']
    .some((p) => fs.existsSync(path.join(projectRoot, p)));
  const hasDocs = fs.existsSync(path.join(projectRoot, 'docs/'));

  // Stage 01: Brainstorm — skip if README exists with substance
  const brainstormEvidence: string[] = [];
  if (hasReadme) {
    const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf-8');
    if (readme.length > 500) {
      brainstormEvidence.push('README.md with substantial content');
    }
  }
  detections.push({
    stageId: '01-brainstorm',
    detected: brainstormEvidence.length > 0,
    confidence: 'medium',
    evidence: brainstormEvidence,
  });

  // Stage 03: Planning — skip if architecture docs exist
  const planningEvidence: string[] = [];
  if (hasArchDocs) planningEvidence.push('Architecture documentation found');
  if (hasDocs) planningEvidence.push('docs/ directory exists');
  detections.push({
    stageId: '03-planning',
    detected: planningEvidence.length > 0,
    confidence: planningEvidence.length >= 2 ? 'high' : 'medium',
    evidence: planningEvidence,
  });

  return detections;
}

/**
 * Detect existing UI components (stage 04)
 */
function detectUIUX(projectRoot: string): StageDetection {
  const evidence: string[] = [];

  const uiDirs = [
    'components/', 'src/components/', 'app/components/',
    'src/ui/', 'styles/', 'src/styles/',
  ];
  for (const dir of uiDirs) {
    if (fs.existsSync(path.join(projectRoot, dir))) {
      evidence.push(`Found UI directory: ${dir}`);
    }
  }

  // CSS/style files
  const styleConfigs = [
    'tailwind.config.ts', 'tailwind.config.js',
    'postcss.config.js', 'postcss.config.cjs',
    '.storybook/',
  ];
  for (const config of styleConfigs) {
    if (fs.existsSync(path.join(projectRoot, config))) {
      evidence.push(`Found style config: ${config}`);
    }
  }

  return {
    stageId: '04-ui-ux',
    detected: evidence.length >= 2,
    confidence: evidence.length >= 3 ? 'high' : evidence.length >= 2 ? 'medium' : 'low',
    evidence,
  };
}

/**
 * Detect linting/QA setup (stage 08)
 */
function detectQA(projectRoot: string): StageDetection {
  const evidence: string[] = [];

  const qaConfigs = [
    '.eslintrc', '.eslintrc.js', '.eslintrc.json', 'eslint.config.js', 'eslint.config.mjs',
    '.prettierrc', '.prettierrc.js', 'prettier.config.js',
    'biome.json', 'biome.jsonc',
    '.stylelintrc',
  ];
  for (const config of qaConfigs) {
    if (fs.existsSync(path.join(projectRoot, config))) {
      evidence.push(`Found QA config: ${config}`);
    }
  }

  // TypeScript strict mode
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = fs.readFileSync(tsconfigPath, 'utf-8');
      if (tsconfig.includes('"strict"') || tsconfig.includes('"strict": true')) {
        evidence.push('TypeScript strict mode enabled');
      }
    } catch { /* skip */ }
  }

  return {
    stageId: '08-qa',
    detected: evidence.length >= 2,
    confidence: evidence.length >= 3 ? 'high' : 'medium',
    evidence,
  };
}

/**
 * Run all detections and produce a full analysis
 */
function analyzeProject(projectRoot: string): StageDetection[] {
  const detections: StageDetection[] = [];

  // Documentation-based stages
  detections.push(...detectDocumentation(projectRoot));

  // Add research as always not detected (hard to detect)
  detections.push({
    stageId: '02-research',
    detected: false,
    confidence: 'low',
    evidence: ['Research stage cannot be auto-detected'],
  });

  // UI/UX
  detections.push(detectUIUX(projectRoot));

  // Task management — always not detected
  detections.push({
    stageId: '05-task-management',
    detected: false,
    confidence: 'low',
    evidence: ['Task management stage cannot be auto-detected'],
  });

  // Implementation
  detections.push(detectImplementation(projectRoot));

  // Refactoring — skip if implementation exists (assume done)
  const impl = detections.find((d) => d.stageId === '06-implementation');
  detections.push({
    stageId: '07-refactoring',
    detected: impl?.detected ?? false,
    confidence: 'low',
    evidence: impl?.detected ? ['Inferred from existing implementation'] : [],
  });

  // QA
  detections.push(detectQA(projectRoot));

  // Testing
  detections.push(detectTests(projectRoot));

  // Deployment
  detections.push(detectDeployment(projectRoot));

  // Sort by stage order
  return detections.sort((a, b) => STAGE_IDS.indexOf(a.stageId) - STAGE_IDS.indexOf(b.stageId));
}

/**
 * Main import function
 */
export async function importProject(
  targetPath: string,
  options: { dryRun?: boolean } = {}
): Promise<void> {
  const projectRoot = path.resolve(targetPath);

  if (!fs.existsSync(projectRoot)) {
    log(`Error: Directory not found: ${projectRoot}`, 'red');
    process.exit(1);
  }

  // Check if already a symphony project
  if (fs.existsSync(path.join(projectRoot, 'state', 'progress.json'))) {
    log('This project already has claude-symphony installed.', 'yellow');
    log('Use /auto-pilot or /resume to continue the pipeline.', 'yellow');
    return;
  }

  const projectName = path.basename(projectRoot);

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`  Analyzing project: ${projectName}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log('');

  // Analyze existing project
  const detections = analyzeProject(projectRoot);

  // Display results
  log('Stage Detection Results:', 'white');
  console.log('');
  for (const detection of detections) {
    const icon = detection.detected ? chalk.green('SKIP') : chalk.yellow('RUN ');
    const conf = detection.confidence === 'high'
      ? chalk.green(`[${detection.confidence}]`)
      : detection.confidence === 'medium'
        ? chalk.yellow(`[${detection.confidence}]`)
        : chalk.dim(`[${detection.confidence}]`);

    console.log(`  ${icon} ${detection.stageId} ${STAGE_NAMES[detection.stageId]} ${conf}`);
    for (const e of detection.evidence) {
      console.log(chalk.dim(`       - ${e}`));
    }
  }

  const skippedCount = detections.filter((d) => d.detected).length;
  const runCount = detections.filter((d) => !d.detected).length;

  console.log('');
  log(`  ${skippedCount} stages detected as complete → will be skipped`, 'green');
  log(`  ${runCount} stages remaining → will be executed`, 'yellow');
  console.log('');

  if (options.dryRun) {
    log('Dry run complete. No files modified.', 'cyan');
    return;
  }

  // Install symphony template (non-destructive)
  log('Installing claude-symphony...', 'cyan');

  const packageRoot = path.resolve(__dirname, '..', '..');
  const templateDir = path.join(packageRoot, 'template');

  if (!fs.existsSync(templateDir)) {
    log(`Error: Template directory not found: ${templateDir}`, 'red');
    process.exit(1);
  }

  // Create symphony directories (don't overwrite existing files)
  const symphonyDirs = [
    'stages', 'state', 'config', 'references',
    '.claude/commands', '.claude/agents',
  ];
  for (const dir of symphonyDirs) {
    ensureDir(path.join(projectRoot, dir));
  }

  // Copy template files selectively (don't overwrite)
  const templateFiles = [
    'CLAUDE.md',
    'config/pipeline.jsonc',
    'config/stage_personas.jsonc',
    'config/handoff_intelligence.jsonc',
    'config/context.jsonc',
    'config/output_validation.jsonc',
    '.claude/settings.json',
  ];

  for (const file of templateFiles) {
    const src = path.join(templateDir, file);
    const dest = path.join(projectRoot, file);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
    }
  }

  // Copy all commands
  const commandsDir = path.join(templateDir, '.claude', 'commands');
  if (fs.existsSync(commandsDir)) {
    const destCommands = path.join(projectRoot, '.claude', 'commands');
    ensureDir(destCommands);
    for (const cmd of fs.readdirSync(commandsDir)) {
      const dest = path.join(destCommands, cmd);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(commandsDir, cmd), dest);
      }
    }
  }

  // Copy agent definitions
  const agentsDir = path.join(templateDir, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const agent of fs.readdirSync(agentsDir)) {
      const agentSrc = path.join(agentsDir, agent);
      const agentDest = path.join(projectRoot, '.claude', 'agents', agent);
      if (fs.statSync(agentSrc).isDirectory() && !fs.existsSync(agentDest)) {
        copyDirSync(agentSrc, agentDest);
      }
    }
  }

  // Copy stage CLAUDE.md files
  for (const stageId of STAGE_IDS) {
    const stageDir = path.join(projectRoot, 'stages', stageId);
    ensureDir(path.join(stageDir, 'outputs'));
    const claudeSrc = path.join(templateDir, 'stages', stageId, 'CLAUDE.md');
    const claudeDest = path.join(stageDir, 'CLAUDE.md');
    if (fs.existsSync(claudeSrc) && !fs.existsSync(claudeDest)) {
      fs.copyFileSync(claudeSrc, claudeDest);
    }
  }

  // Create references directories
  for (const stageId of STAGE_IDS) {
    ensureDir(path.join(projectRoot, 'references', stageId));
  }

  log('  Template installed (non-destructive)', 'green');

  // Initialize progress with detected stages marked as skipped
  const progress = createInitialProgress(projectName);

  for (const detection of detections) {
    if (detection.detected && progress.stages[detection.stageId]) {
      progress.stages[detection.stageId]!.status = 'skipped';
      progress.stages[detection.stageId]!.completed_at = new Date().toISOString();
    }
  }

  // Set current stage to first non-skipped stage
  const firstRunStage = detections.find((d) => !d.detected);
  if (firstRunStage) {
    progress.current_stage = firstRunStage.stageId;
  }

  await saveProgress(projectRoot, progress);
  log('  Progress initialized with detected stages', 'green');

  // Completion
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log(`  Project '${projectName}' imported!`, 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  console.log('');
  log('Next steps:', 'yellow');
  console.log(chalk.gray('  1. ') + chalk.cyan('claude'));
  console.log(chalk.gray('  2. ') + chalk.cyan('/auto-pilot'));
  console.log('');
  log(`The pipeline will skip ${skippedCount} detected stages and run the remaining ${runCount}.`, 'cyan');
  console.log('');
}
