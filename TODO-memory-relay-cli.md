# Memory Relay CLI 통합 TODO

## 목표

`claude-symphony play` 명령어로 Memory Relay를 **자동 설치 + 실행**

## 현재 문제

```bash
# 현재 (2단계 - 번거로움)
./scripts/memory-relay/install.sh  # 1. 수동 설치
claude-symphony-play               # 2. 실행

# 원하는 결과 (1단계)
claude-symphony play               # 자동 설치 + 실행
```

---

## TODO 체크리스트

### Phase 1: play.ts 생성

- [ ] `src/cli/commands/play.ts` 파일 생성
- [ ] `playCommand()` 함수 구현
  - [ ] tmux 의존성 확인
  - [ ] `~/.claude/memory-relay` 존재 확인
  - [ ] 없으면 `installMemoryRelay()` 호출
  - [ ] tmux-startup.sh 실행
- [ ] `installMemoryRelay()` 함수 구현
  - [ ] 패키지 내 `scripts/memory-relay` 찾기
  - [ ] `~/.claude/memory-relay`로 복사
  - [ ] 실행 권한 설정 (chmod +x)
  - [ ] 필요 디렉토리 생성 (logs, signals, handoffs)
- [ ] `playStatus()` 함수 구현
- [ ] `playLogs()` 함수 구현
- [ ] `playStop()` 함수 구현

### Phase 2: CLI 등록

- [ ] `src/cli/index.ts`에 import 추가
- [ ] `play` 명령어 등록
- [ ] `play:status` 명령어 등록
- [ ] `play:logs` 명령어 등록
- [ ] `play:stop` 명령어 등록

### Phase 3: Package 설정

- [ ] `package.json`의 `files` 배열에 `"scripts/"` 추가

### Phase 4: 테스트

- [ ] `npm run build` 성공 확인
- [ ] `~/.claude/memory-relay` 삭제 후 테스트
- [ ] `claude-symphony play` 실행 시 자동 설치 확인
- [ ] tmux 세션 정상 시작 확인

---

## 구현 상세

### 1. src/cli/commands/play.ts

```typescript
/**
 * Memory Relay play command
 * Auto-installs and starts Claude with Memory Relay orchestration
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { log } from '../../utils/logger.js';
import { commandExists, execShell } from '../../utils/shell.js';
import { copyDirSync, ensureDir } from '../../utils/fs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELAY_DIR = path.join(os.homedir(), '.claude/memory-relay');
const SESSION_NAME = 'symphony-session';

interface PlayOptions {
  directory?: string;
}

/**
 * Get package root directory
 */
function getPackageRoot(): string {
  // From dist/cli/commands/play.js, go up 3 levels to package root
  return path.resolve(__dirname, '../../..');
}

/**
 * Install Memory Relay to ~/.claude/memory-relay
 */
async function installMemoryRelay(): Promise<boolean> {
  log(chalk.blue('Installing Memory Relay...'));

  const packageRoot = getPackageRoot();
  const source = path.join(packageRoot, 'scripts/memory-relay');

  if (!fs.existsSync(source)) {
    log(chalk.red(`Error: Memory Relay source not found at ${source}`));
    return false;
  }

  try {
    // Create target directories
    ensureDir(RELAY_DIR);
    ensureDir(path.join(RELAY_DIR, 'orchestrator'));
    ensureDir(path.join(RELAY_DIR, 'orchestrator/signals'));
    ensureDir(path.join(RELAY_DIR, 'logs'));
    ensureDir(path.join(RELAY_DIR, 'handoffs'));
    ensureDir(path.join(RELAY_DIR, 'queue'));

    // Copy files
    copyDirSync(source, RELAY_DIR);

    // Make scripts executable
    const scripts = [
      'orchestrator/orchestrator.sh',
      'orchestrator/claude-wrapper.sh',
      'orchestrator/tmux-startup.sh',
      'orchestrator/claude-symphony-play',
    ];

    for (const script of scripts) {
      const scriptPath = path.join(RELAY_DIR, script);
      if (fs.existsSync(scriptPath)) {
        fs.chmodSync(scriptPath, 0o755);
      }
    }

    log(chalk.green('Memory Relay installed successfully!'));
    return true;
  } catch (error) {
    log(chalk.red(`Installation failed: ${error}`));
    return false;
  }
}

/**
 * Main play command - start Claude with Memory Relay
 */
export async function playCommand(options: PlayOptions): Promise<void> {
  // 1. Check tmux
  if (!await commandExists('tmux')) {
    log(chalk.red('Error: tmux is required for Memory Relay'));
    log(chalk.yellow('Install with: brew install tmux (macOS) or apt install tmux (Linux)'));
    process.exit(1);
  }

  // 2. Check claude
  if (!await commandExists('claude')) {
    log(chalk.yellow('Warning: claude CLI not found in PATH'));
  }

  // 3. Install if needed
  if (!fs.existsSync(RELAY_DIR)) {
    const installed = await installMemoryRelay();
    if (!installed) {
      process.exit(1);
    }
  }

  // 4. Start tmux session
  const workDir = options.directory || process.cwd();
  const startupScript = path.join(RELAY_DIR, 'orchestrator/tmux-startup.sh');

  log(chalk.blue('Starting Memory Relay session...'));

  const result = await execShell(`"${startupScript}" "${workDir}"`, {
    stdio: 'inherit',
  });

  process.exit(result.exitCode);
}

/**
 * Show Memory Relay status
 */
export async function playStatus(): Promise<void> {
  const orchestratorScript = path.join(RELAY_DIR, 'orchestrator/orchestrator.sh');

  if (!fs.existsSync(orchestratorScript)) {
    log(chalk.yellow('Memory Relay not installed. Run: claude-symphony play'));
    return;
  }

  await execShell(`"${orchestratorScript}" status`, { stdio: 'inherit' });
}

/**
 * View Memory Relay logs
 */
export async function playLogs(options: { follow?: boolean }): Promise<void> {
  const logFile = path.join(RELAY_DIR, 'logs/orchestrator.log');

  if (!fs.existsSync(logFile)) {
    log(chalk.yellow('No logs found. Start a session first: claude-symphony play'));
    return;
  }

  const cmd = options.follow ? `tail -f "${logFile}"` : `tail -50 "${logFile}"`;
  await execShell(cmd, { stdio: 'inherit' });
}

/**
 * Stop Memory Relay orchestrator
 */
export async function playStop(): Promise<void> {
  const orchestratorScript = path.join(RELAY_DIR, 'orchestrator/orchestrator.sh');

  if (!fs.existsSync(orchestratorScript)) {
    log(chalk.yellow('Memory Relay not installed.'));
    return;
  }

  await execShell(`"${orchestratorScript}" stop`, { stdio: 'inherit' });
}
```

### 2. src/cli/index.ts 수정

```typescript
// 추가할 import
import { playCommand, playStatus, playLogs, playStop } from './commands/play.js';

// 추가할 commands (program.parse() 전에)

// play command
program
  .command('play')
  .description('Start Claude with Memory Relay orchestration (auto-installs if needed)')
  .option('-d, --directory <dir>', 'Working directory', process.cwd())
  .action(async (options: { directory: string }) => {
    await playCommand(options);
  });

// play:status command
program
  .command('play:status')
  .description('Show Memory Relay orchestrator status')
  .action(async () => {
    await playStatus();
  });

// play:logs command
program
  .command('play:logs')
  .description('View Memory Relay logs')
  .option('-f, --follow', 'Follow logs in real-time')
  .action(async (options: { follow?: boolean }) => {
    await playLogs(options);
  });

// play:stop command
program
  .command('play:stop')
  .description('Stop Memory Relay orchestrator')
  .action(async () => {
    await playStop();
  });
```

### 3. package.json 수정

```json
{
  "files": [
    "dist/",
    "template/",
    "assets/",
    "schemas/",
    "scripts/"
  ]
}
```

---

## 최종 사용자 경험

```bash
# 프로젝트 생성
npx claude-symphony my-project
cd my-project

# Memory Relay로 Claude 시작 (첫 실행 시 자동 설치)
claude-symphony play

# 상태 확인
claude-symphony play:status

# 로그 확인
claude-symphony play:logs -f

# 종료
claude-symphony play:stop
```
