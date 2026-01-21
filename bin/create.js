#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { input } from '@inquirer/prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 색상 코드
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
  log('📝 프로젝트 브리프를 작성합니다. (Enter만 누르면 건너뜁니다)', 'yellow');
  console.log('');

  const info = {};

  // 순차적으로 질문 (각 input()이 완료되어야 다음으로 진행)
  info.description = await input({ message: '한 줄 설명:' });
  info.problem = await input({ message: '문제 정의 (해결하려는 문제):' });
  info.targetUser = await input({ message: '타겟 사용자:' });
  info.successCriteria = await input({ message: '성공 기준:' });
  info.constraintSchedule = await input({ message: '제약조건 - 일정:' });
  info.constraintBudget = await input({ message: '제약조건 - 예산:' });
  info.constraintTech = await input({ message: '제약조건 - 기술:' });
  info.references = await input({ message: '참고 자료 (URL 또는 문서):' });

  // 핵심 기능 - 여러 개 입력 (별도 루프)
  console.log('');
  log('핵심 기능 (빈 입력 시 종료):', 'reset');
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
  // 핵심 기능 포맷팅
  let featuresContent;
  if (info.features && info.features.length > 0) {
    featuresContent = info.features.map((f, i) => `${i + 1}. ${f}`).join('\n');
  } else {
    featuresContent = '1. [기능 1]\n2. [기능 2]\n3. [기능 3]';
  }

  return `# Project Brief

## 프로젝트 이름
${projectName}

## 한 줄 설명
${info.description || '[프로젝트를 한 줄로 설명해주세요]'}

## 문제 정의
${info.problem || '[해결하려는 문제는 무엇인가요?]'}

## 타겟 사용자
${info.targetUser || '[주요 사용자는 누구인가요?]'}

## 핵심 기능 (초안)
${featuresContent}

## 성공 기준
${info.successCriteria || '[프로젝트가 성공했다고 판단하는 기준은?]'}

## 제약조건
- 일정: ${info.constraintSchedule || ''}
- 예산: ${info.constraintBudget || ''}
- 기술: ${info.constraintTech || ''}

## 참고 자료
- ${info.references || '[URL 또는 문서]'}
`;
}

async function main() {
  const args = process.argv.slice(2);

  // 도움말 체크 (가장 먼저 처리)
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}create-ax-project${colors.reset} - Multi-AI Workflow Pipeline 프로젝트 생성

${colors.yellow}사용법:${colors.reset}
  npx create-ax-project <project-name>
  npx create-ax-project .  (현재 디렉토리에 생성)

${colors.yellow}옵션:${colors.reset}
  --yes, -y    프롬프트 없이 기본값으로 생성

${colors.yellow}예시:${colors.reset}
  npx create-ax-project my-saas-app
  npx create-ax-project my-game
  npx create-ax-project my-project --yes

${colors.yellow}생성 후:${colors.reset}
  1. cd <project-name>
  2. stages/01-brainstorm/inputs/project_brief.md 작성
  3. /run-stage 01-brainstorm 실행
`);
    process.exit(0);
  }

  const skipPrompts = args.includes('--yes') || args.includes('-y');
  const projectName = args.find(arg => !arg.startsWith('-')) || '.';

  // 프로젝트 이름 검증
  if (projectName !== '.' && !/^[a-z0-9-]+$/.test(projectName)) {
    log('오류: 프로젝트 이름은 영문 소문자, 숫자, 하이픈만 허용됩니다.', 'red');
    process.exit(1);
  }

  const templateDir = path.join(__dirname, '..', 'template');
  const targetDir = path.resolve(projectName);
  const actualProjectName = projectName === '.' ? path.basename(targetDir) : projectName;

  // 템플릿 존재 확인
  if (!fs.existsSync(templateDir)) {
    log(`오류: 템플릿 디렉토리를 찾을 수 없습니다: ${templateDir}`, 'red');
    process.exit(1);
  }

  // 대상 디렉토리 확인
  if (projectName !== '.' && fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      log(`오류: 디렉토리가 비어있지 않습니다: ${targetDir}`, 'red');
      process.exit(1);
    }
  }

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`🚀 ax-templates 프로젝트 생성: ${actualProjectName}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log('');

  // 1. 대상 디렉토리 생성
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  log(`✓ 프로젝트 디렉토리: ${targetDir}`, 'green');

  // 2. 프로젝트 브리프 정보 수집 (--yes 플래그가 없을 때만)
  let briefInfo = {};
  if (!skipPrompts) {
    briefInfo = await collectBriefInfo();
  }

  // 3. 템플릿 복사
  log('  템플릿 복사 중...', 'blue');
  copyRecursiveSync(templateDir, targetDir);
  log('✓ 템플릿 복사 완료', 'green');

  // 4. progress.json 초기화
  const progressTemplatePath = path.join(targetDir, 'state', 'progress.json.template');
  const progressPath = path.join(targetDir, 'state', 'progress.json');

  if (fs.existsSync(progressTemplatePath)) {
    let progressContent = fs.readFileSync(progressTemplatePath, 'utf8');
    const timestamp = new Date().toISOString();

    progressContent = progressContent
      .replace('{{PROJECT_NAME}}', actualProjectName)
      .replace('{{STARTED_AT}}', timestamp);

    fs.writeFileSync(progressPath, progressContent);
    fs.unlinkSync(progressTemplatePath); // 템플릿 파일 삭제
    log('✓ progress.json 초기화 완료', 'green');
  }

  // 5. project_brief.md 생성
  const briefPath = path.join(targetDir, 'stages', '01-brainstorm', 'inputs', 'project_brief.md');
  const briefDir = path.dirname(briefPath);

  if (!fs.existsSync(briefDir)) {
    fs.mkdirSync(briefDir, { recursive: true });
  }

  const briefContent = generateBriefContent(actualProjectName, briefInfo);
  fs.writeFileSync(briefPath, briefContent);
  log('✓ project_brief.md 생성 완료', 'green');

  // 6. 완료 메시지
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log(`✓ 프로젝트 '${actualProjectName}' 생성 완료!`, 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  console.log('');
  log('다음 단계:', 'yellow');
  if (projectName !== '.') {
    console.log(`  1. cd ${projectName}`);
    console.log('  2. stages/01-brainstorm/inputs/project_brief.md 작성');
    console.log('  3. /run-stage 01-brainstorm 실행');
  } else {
    console.log('  1. stages/01-brainstorm/inputs/project_brief.md 작성');
    console.log('  2. /run-stage 01-brainstorm 실행');
  }
  console.log('');
  log('파이프라인 스테이지:', 'cyan');
  console.log('  01-brainstorm → 02-research → 03-planning → 04-ui-ux');
  console.log('  → 05-task-management → 06-implementation → 07-refactoring');
  console.log('  → 08-qa → 09-testing → 10-deployment');
  console.log('');
}

main().catch(err => {
  log(`오류: ${err.message}`, 'red');
  process.exit(1);
});
