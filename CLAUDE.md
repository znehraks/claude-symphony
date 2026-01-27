# claude-symphony Framework Development

이 파일은 claude-symphony **프레임워크 자체**를 개발하는 개발자를 위한 AI 지시문입니다.
**생성된 프로젝트**에서 작업하는 경우 `template/CLAUDE.md`를 참조하세요.

## 프로젝트 구조

```
/claude-symphony
├── src/                # TypeScript 소스코드
│   ├── cli/            # CLI 구현
│   └── hooks/          # Hook 구현
├── dist/               # 빌드 출력 (git 제외)
├── template/           # End-User 프로젝트 템플릿
├── schemas/            # JSON 스키마 (config 검증용)
├── scripts/            # 개발/테스트 스크립트
│   ├── dev/            # 개발 유틸리티
│   ├── test/           # 테스트 스크립트
│   ├── user/           # 사용자 유틸리티
│   └── memory-relay/   # 세션 오케스트레이션
└── docs/               # 개발자 문서
```

## 빌드 & 테스트

| 명령어 | 설명 |
|--------|------|
| `pnpm install` | 의존성 설치 |
| `pnpm run build` | TypeScript 컴파일 + 스키마 생성 |
| `pnpm run dev` | Watch 모드 |
| `pnpm run typecheck` | 타입 체크 |
| `pnpm run test` | Unit 테스트 |
| `pnpm run test:pipeline` | 파이프라인 테스트 |

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/cli/index.ts` | CLI 진입점 |
| `template/CLAUDE.md` | End-User AI 지시문 |
| `template/.claude/` | 명령어, 훅, 스킬 |
| `schemas/*.json` | Config 스키마 |
| `tsup.config.ts` | 빌드 설정 |

## MCP 서버 연동

### 사용 가능한 MCP 서버

| MCP 서버 | 용도 | 활용 |
|----------|------|------|
| **Serena** | 코드 심볼 분석 | `find_symbol`, `get_symbols_overview` 로 코드 탐색 |
| **Context7** | 라이브러리 문서 | 외부 패키지 문서 조회 |
| **Playwright** | E2E 테스트 | 브라우저 자동화 테스트 |

### Serena 활용 예시

```
# 심볼 검색
mcp__serena__find_symbol: "CLICommand"

# 파일 심볼 개요
mcp__serena__get_symbols_overview: "src/cli/index.ts"

# 참조 찾기
mcp__serena__find_referencing_symbols: "initProject"
```

## 기여 가이드

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 안정 버전 |
| `feature/*` | 새 기능 개발 |
| `fix/*` | 버그 수정 |
| `docs/*` | 문서 수정 |

### PR 규칙

1. **제목 형식**: `type(scope): description`
   - `feat(cli): add new command`
   - `fix(hooks): resolve fallback issue`
   - `docs(readme): update installation guide`

2. **필수 체크리스트**:
   - [ ] `pnpm run build` 성공
   - [ ] `pnpm run test` 통과
   - [ ] `pnpm run typecheck` 에러 없음

3. **리뷰 요청 전**:
   - 관련 문서 업데이트
   - CHANGELOG.md 항목 추가 (해당 시)

### 코드 스타일

- TypeScript strict mode
- ESLint 규칙 준수
- 함수/클래스에 JSDoc 주석
- 파일당 단일 책임 원칙

### 테스트 작성

```typescript
// tests/cli.test.ts
describe('CLI', () => {
  it('should initialize project', async () => {
    // ...
  });
});
```

## 릴리스 프로세스

1. `package.json` 버전 업데이트
2. `CHANGELOG.md` 작성
3. `pnpm run build && pnpm run test`
4. `git commit -m "chore: bump version to x.x.x"`
5. `git tag vx.x.x`
6. `npm publish`

## 수정 시 주의사항

| 영역 | 주의사항 |
|------|----------|
| `template/` | End-User에게 복사됨 - 개발자 전용 내용 금지 |
| `schemas/` | 수정 후 `build:schema` 실행 필요 |
| `src/` | 수정 후 빌드 필요 (`dist/`에 반영) |
| Config | `$schema` URL은 GitHub raw URL 사용 |

## 금지 사항

- template/ 내부에 개발자 전용 내용 추가 금지
- dist/ 직접 수정 금지 (빌드로 생성)
- node_modules/ 커밋 금지
- package-lock.json 사용 금지 (pnpm 사용)
