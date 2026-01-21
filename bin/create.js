#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { input } from '@inquirer/prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function collectBriefInfo() {
  console.log('');
  log('📝 Creating project brief. (Press Enter to skip)', 'yellow');
  console.log('');

  const info = {};

  // Sequential questions (each input() must complete before proceeding)
  info.description = await input({ message: 'One-line description:' });
  info.problem = await input({ message: 'Problem definition (problem to solve):' });
  info.targetUser = await input({ message: 'Target users:' });
  info.successCriteria = await input({ message: 'Success criteria:' });
  info.constraintSchedule = await input({ message: 'Constraints - Schedule:' });
  info.constraintBudget = await input({ message: 'Constraints - Budget:' });
  info.constraintTech = await input({ message: 'Constraints - Technology:' });
  info.references = await input({ message: 'References (URL or documents):' });

  // Core features - multiple inputs (separate loop)
  console.log('');
  log('Core features (empty input to finish):', 'reset');
  info.features = [];
  let featureNum = 1;
  while (true) {
    const feature = await input({ message: `  ${featureNum}.` });
    if (!feature) break;
    info.features.push(feature);
    featureNum++;
  }

  return info;
}

function generateBriefContent(projectName, info) {
  // Core features formatting
  let featuresContent;
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

async function main() {
  const args = process.argv.slice(2);

  // Help check (process first)
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}claude-symphony${colors.reset} - Multi-AI Orchestration Framework project creation

${colors.yellow}Usage:${colors.reset}
  npx claude-symphony <project-name>
  npx claude-symphony .  (create in current directory)

${colors.yellow}Options:${colors.reset}
  --yes, -y    Create with defaults (no prompts)

${colors.yellow}Examples:${colors.reset}
  npx claude-symphony my-saas-app
  npx claude-symphony my-game
  npx claude-symphony my-project --yes

${colors.yellow}After creation:${colors.reset}
  1. cd <project-name>
  2. Edit stages/01-brainstorm/inputs/project_brief.md
  3. Run /run-stage 01-brainstorm
`);
    process.exit(0);
  }

  const skipPrompts = args.includes('--yes') || args.includes('-y');
  const projectName = args.find(arg => !arg.startsWith('-')) || '.';

  // Project name validation
  if (projectName !== '.' && !/^[a-z0-9-]+$/.test(projectName)) {
    log('Error: Project name must contain only lowercase letters, numbers, and hyphens.', 'red');
    process.exit(1);
  }

  const templateDir = path.join(__dirname, '..', 'template');
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

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`🎼 Creating claude-symphony project: ${actualProjectName}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log('');

  // 1. Create target directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  log(`✓ Project directory: ${targetDir}`, 'green');

  // 2. Collect project brief info (only when --yes flag is not present)
  let briefInfo = {};
  if (!skipPrompts) {
    briefInfo = await collectBriefInfo();
  }

  // 3. Copy template
  log('  Copying template...', 'blue');
  copyRecursiveSync(templateDir, targetDir);
  log('✓ Template copy complete', 'green');

  // 4. Initialize progress.json
  const progressTemplatePath = path.join(targetDir, 'state', 'progress.json.template');
  const progressPath = path.join(targetDir, 'state', 'progress.json');

  if (fs.existsSync(progressTemplatePath)) {
    let progressContent = fs.readFileSync(progressTemplatePath, 'utf8');
    const timestamp = new Date().toISOString();

    progressContent = progressContent
      .replace('{{PROJECT_NAME}}', actualProjectName)
      .replace('{{STARTED_AT}}', timestamp);

    fs.writeFileSync(progressPath, progressContent);
    fs.unlinkSync(progressTemplatePath); // Delete template file
    log('✓ progress.json initialized', 'green');
  }

  // 5. Create project_brief.md
  const briefPath = path.join(targetDir, 'stages', '01-brainstorm', 'inputs', 'project_brief.md');
  const briefDir = path.dirname(briefPath);

  if (!fs.existsSync(briefDir)) {
    fs.mkdirSync(briefDir, { recursive: true });
  }

  const briefContent = generateBriefContent(actualProjectName, briefInfo);
  fs.writeFileSync(briefPath, briefContent);
  log('✓ project_brief.md created', 'green');

  // 6. Completion message
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log(`✓ Project '${actualProjectName}' created successfully!`, 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  console.log('');
  log('Next steps:', 'yellow');
  if (projectName !== '.') {
    console.log(`  1. cd ${projectName}`);
    console.log('  2. Edit stages/01-brainstorm/inputs/project_brief.md');
    console.log('  3. Run /run-stage 01-brainstorm');
  } else {
    console.log('  1. Edit stages/01-brainstorm/inputs/project_brief.md');
    console.log('  2. Run /run-stage 01-brainstorm');
  }
  console.log('');
  log('Pipeline stages:', 'cyan');
  console.log('  01-brainstorm → 02-research → 03-planning → 04-ui-ux');
  console.log('  → 05-task-management → 06-implementation → 07-refactoring');
  console.log('  → 08-qa → 09-testing → 10-deployment');
  console.log('');
}

main().catch(err => {
  log(`Error: ${err.message}`, 'red');
  process.exit(1);
});
