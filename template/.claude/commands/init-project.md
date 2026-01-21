# /init-project

새 프로젝트를 claude-symphony 워크플로우로 초기화합니다.

## 사용법
```
/init-project [project-name]
```

## 동작

1. **프로젝트 디렉토리 생성**
   - `projects/[project-name]/` 생성
   - 스테이지별 작업 디렉토리 생성

2. **상태 파일 초기화**
   - `state/progress.json` 프로젝트 정보 업데이트
   - 타임스탬프 기록

3. **입력 파일 준비**
   - `stages/01-brainstorm/inputs/project_brief.md` 템플릿 생성

4. **첫 스테이지 안내**
   - 01-brainstorm 스테이지 CLAUDE.md 안내

## 실행 스크립트

```bash
scripts/init-project.sh "$ARGUMENTS"
```

## 예시

```
/init-project my-saas-app

출력:
✓ 프로젝트 'my-saas-app' 초기화 완료
✓ 작업 디렉토리: projects/my-saas-app/
✓ 상태 파일 업데이트됨

다음 단계:
1. stages/01-brainstorm/inputs/project_brief.md 작성
2. /run-stage 01-brainstorm 실행
```

## 주의사항
- 프로젝트 이름은 영문 소문자, 숫자, 하이픈만 허용
- 기존 프로젝트 덮어쓰기 불가
