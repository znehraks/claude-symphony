# claude-symphony Sub-Agent 도입 로드맵

**버전**: v1.0 (Context Analyzer 제거)
**작성일**: 2026-01-28
**총 Agent 수**: 14개
**예상 구현 기간**: 7.5개월
**예상 컨텍스트 절감**: 113-148% (프로젝트 전체 사이클)

---

## 📑 목차

- [빠른 참조 테이블](#빠른-참조-테이블)
- [Tier 1: Critical & High Priority](#tier-1-critical--high-priority)
  - [1. HANDOFF Generator Agent](#1-handoff-generator-agent)
  - [2. Output Synthesis Agent](#2-output-synthesis-agent)
  - [3. Research Analysis Agent](#3-research-analysis-agent)
  - [4. Architecture Review Agent](#4-architecture-review-agent)
  - [5. Refactoring Analysis Agent](#5-refactoring-analysis-agent)
- [Tier 2: Medium Priority](#tier-2-medium-priority)
  - [6. QA & Bug Analysis Agent](#6-qa--bug-analysis-agent)
  - [7. Checkpoint Manager Agent](#7-checkpoint-manager-agent)
  - [8. AI Benchmark Analyzer Agent](#8-ai-benchmark-analyzer-agent)
  - [9. Test Execution & Reporting Agent](#9-test-execution--reporting-agent)
- [Tier 3: Medium-Low Priority](#tier-3-medium-low-priority)
  - [10. Requirements Validation Agent](#10-requirements-validation-agent)
  - [11. Task Decomposition Agent](#11-task-decomposition-agent)
  - [12. Moodboard Analysis Agent](#12-moodboard-analysis-agent)
  - [13. CI/CD Validation Agent](#13-cicd-validation-agent)
  - [14. Smart Rollback Agent](#14-smart-rollback-agent)
- [구현 타임라인](#구현-타임라인)
- [예상 효과](#예상-효과)

---

## 빠른 참조 테이블

| # | Agent 명 | 우선순위 | 컨텍스트 절감 | 주요 역할 | 구현 주차 |
|---|----------|----------|--------------|-----------|----------|
| 1 | [HANDOFF Generator](#1-handoff-generator-agent) | CRITICAL | 8-12% | 스테이지 전환 핸드오프 자동 생성 | 1-3주 |
| 2 | [Output Synthesis](#2-output-synthesis-agent) | HIGH | 10-15% | 병렬 AI 출력 통합 | 2-4주 |
| 3 | [Research Analysis](#3-research-analysis-agent) | HIGH | 10-12% | Stage 02 연구 크로스 분석 | 6-8주 |
| 4 | [Architecture Review](#4-architecture-review-agent) | HIGH | 12-15% | Stage 03 아키텍처 검증 | 5-7주 |
| 5 | [Refactoring Analysis](#5-refactoring-analysis-agent) | HIGH | 10-15% | Stage 07 리팩토링 분석 | 9-10주 |
| 6 | [QA Analysis](#6-qa--bug-analysis-agent) | MEDIUM | 8-9% | Stage 08 보안/품질 분석 | 13-15주 |
| 7 | [Checkpoint Manager](#7-checkpoint-manager-agent) | MEDIUM | 7-8% | 자동 체크포인트 생성 | 19-21주 |
| 8 | [Benchmark Analyzer](#8-ai-benchmark-analyzer-agent) | MEDIUM | 10-14% | AI 모델 성능 벤치마킹 | 22-24주 |
| 9 | [Test Execution](#9-test-execution--reporting-agent) | MEDIUM | 6-7% | 테스트 실행 및 리포팅 | 16-18주 |
| 10 | [Requirements Validation](#10-requirements-validation-agent) | MEDIUM-LOW | 6-8% | INVEST 기준 검증 | 25-26주 |
| 11 | [Task Decomposition](#11-task-decomposition-agent) | MEDIUM-LOW | 8-10% | 태스크 분해 및 의존성 | 29-30주 |
| 12 | [Moodboard Analysis](#12-moodboard-analysis-agent) | MEDIUM-LOW | 6-8% | 디자인 토큰 추출 | 27-28주 |
| 13 | [CI/CD Validation](#13-cicd-validation-agent) | MEDIUM-LOW | 5-7% | CI/CD 설정 검증 | 33-34주 |
| 14 | [Smart Rollback](#14-smart-rollback-agent) | MEDIUM-LOW | 6-8% | 지능형 롤백 전략 | 31-32주 |

**총 누적 절감**: 113-148% (프로젝트 전체 사이클 기준)

> **Note**: Context 분석/압축은 기존 `auto-compact` 기능 활용

---

## Tier 1: Critical & High Priority

### 1. HANDOFF Generator Agent

**우선순위**: CRITICAL 🔴
**컨텍스트 절감**: 8-12% (per HANDOFF)
**총 영향**: 100-120% (프로젝트당 10-12회 전환)

#### 역할
스테이지 전환 시 대화 이력에서 핵심 정보를 추출하여 스마트 HANDOFF.md를 자동 생성

#### 트리거
- 스테이지 완료 시 (`/next` 명령 전)
- `/handoff` 수동 호출
- 에픽 사이클 경계
- 컨텍스트 임계점 (40% 이하)

#### 처리 과정
1. **콘텐츠 추출**: 대화 이력에서 결정, 파일 변경, 이슈, AI 호출 내역 추출
2. **우선순위 부여**: 블로킹 이슈 > 키 결정 > 파일 변경 순으로 가중치 적용
3. **조건부 섹션**: `epic_cycle`, `implementation_order`, `moodboard` 등 스테이지별 조건부 포함
4. **압축**: 타겟 토큰 예산(기본 4000)에 맞춰 semantic 압축
5. **템플릿 적용**: default, compact, recovery, epic_transition 중 상황별 선택

#### 출력물
- `stages/XX-stage/HANDOFF.md` - 메인 핸드오프 파일
- `state/handoffs/archive/handoff_YYYYMMDD_HHMMSS.md` - 아카이브
- 추출 메트릭 로그 (압축률, 추출 항목 수)

#### 구현 단계
- **Phase 1 (1주)**: 코어 추출 로직 (결정, 파일, 이슈 감지)
- **Phase 2 (1주)**: 스마트 기능 (압축, 조건부 섹션, 템플릿)
- **Phase 3 (1주)**: 고급 인텔리전스 (extended thinking, 메모리 통합)

#### 예상 효과
- HANDOFF 생성 시간: 5-10분 → 30초 (90% 절감)
- 전환당 컨텍스트 절감: 8-12%
- 스테이지 전환 품질: +40%

---

### 2. Output Synthesis Agent

**우선순위**: HIGH 🟠
**컨텍스트 절감**: 10-15% (per 통합)
**총 영향**: 60% (5개 병렬 스테이지)

#### 역할
병렬 AI 출력(Gemini+Claude, Codex+Claude)을 분석하여 최종 통합 결과물 생성

#### 트리거
- 병렬 AI 실행 완료 후 자동
- `/synthesize` 수동 호출
- `/synthesize --verbose` (상세 분석)

#### 처리 과정
1. **수집**: 모든 모델 출력 파일 수집
2. **공통점 분석**: 합의 비율 계산 (consensus_ratio)
3. **차이점 평가**: 고유 인사이트 비교 및 가치 평가
4. **통합**: 공통점 우선 + 보완적 고유 인사이트 병합
5. **품질 검증**: consensus_ratio + keyword_coverage ≥ 0.8

#### 영향받는 스테이지
| Stage | 병렬 모델 | 출력물 |
|-------|----------|--------|
| 01-brainstorm | Gemini + Claude | ideas.md |
| 03-planning | Gemini + Claude | architecture.md |
| 04-ui-ux | Gemini + Claude | wireframes.md |
| 07-refactoring | Codex + Claude | refactoring_report.md |
| 09-testing | Codex + Claude | tests/ |

#### 출력물
- 최종 통합 파일 (스테이지별 요구 출력)
- `state/collaborations/synthesis_log.md` - 통합 로그 및 메트릭

#### 구현 단계
- **Phase 1 (1주)**: 기본 통합 (수집, 합의 추출, 병합)
- **Phase 2 (1주)**: 고급 분석 (키워드 감지, 가중 품질 메트릭)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, 자동 개선 제안)

#### 예상 효과
- 통합당 컨텍스트 절감: 10-15%
- 출력 품질 점수: ≥ 0.8 보장
- 인사이트 다양성: +35%

---

### 3. Research Analysis Agent

**우선순위**: HIGH 🟠
**컨텍스트 절감**: 10-12%
**총 영향**: Stage 02 품질 +40%

#### 역할
Stage 02 연구 출력물(tech_research.md, market_analysis.md, competitor_research.md)을 크로스 분석하여 feasibility_report.md 생성

#### 트리거
- Stage 02 완료 시 자동
- 웹 연구 MCP 호출 완료 후
- feasibility_report.md 생성 직전

#### 처리 과정
1. **소스 파싱**: 3개 연구 문서에서 주장, 데이터, 참조 추출
2. **크로스 레퍼런스**: 모순 식별, 상호 지지 증거 탐색
3. **발견사항 종합**: 기술 타당성, 시장 기회, 리스크 종합
4. **리포트 생성**: 구조화된 feasibility_report.md 작성

#### 출력물
- `stages/02-research/outputs/feasibility_report.md` - 주요 결과물
- `state/research/cross_analysis_{timestamp}.json` - 분석 메타데이터

#### 구현 단계
- **Phase 1 (1주)**: 소스 파싱 및 크로스 레퍼런싱
- **Phase 2 (1주)**: 고급 분석 (소스 신뢰도, 증거 매핑, 리스크 식별)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, Go/No-Go 추천)

#### 예상 효과
- 연구당 컨텍스트 절감: 10-12%
- 타당성 평가 완전성: ≥ 0.9
- 모순 감지율: 100%

---

### 4. Architecture Review Agent

**우선순위**: HIGH 🟠
**컨텍스트 절감**: 12-15%
**총 영향**: Stage 06 재작업 50-100% 방지

#### 역할
architecture.md 및 implementation.yaml 검증, 의존성 분석, 아키텍처 이슈 조기 감지

#### 트리거
- Stage 03 완료 시 자동
- `/arch-review` 수동 호출
- implementation.yaml 생성 후

#### 처리 과정
1. **아키텍처 검증**: 필수 섹션, 다이어그램, 순환 의존성 체크
2. **implementation.yaml 검증**: 필수 키, 일관성 검증
3. **크로스 문서 일관성**: 컴포넌트 이름 일치, 마일스톤 정렬
4. **의존성 분석**: 누락된 의존성, 버전 충돌, API 통합 포인트

#### 출력물
- `state/validations/03-planning_architecture_{timestamp}.json` - 검증 리포트
- 콘솔 요약 (우선순위별 이슈 리스트)

#### 구현 단계
- **Phase 1 (1주)**: 문서 검증 (섹션, 키, 기본 일관성)
- **Phase 2 (1주)**: 고급 분석 (의존성 그래프, 순환 감지)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, 수정 제안)

#### 예상 효과
- 기획당 컨텍스트 절감: 12-15%
- Stage 06 재작업 방지: 50-100%
- 아키텍처 이슈 감지율: 95%+

---

### 5. Refactoring Analysis Agent

**우선순위**: HIGH 🟠
**컨텍스트 절감**: 10-15%
**총 영향**: Stage 07 품질 +30%

#### 역할
Codex+Claude 리팩토링 권장사항 통합 및 검증, 성능/복잡도 메트릭 측정

#### 트리거
- Stage 07 완료 시 (병렬 실행 후) 자동
- `/refactor-analyze` 수동 호출

#### 처리 과정
1. **권장사항 수집**: Codex(성능 중심), Claude(명확성/유지보수 중심)
2. **공통점 분석**: 두 모델 모두 제안 → 높은 우선순위
3. **차이점 평가**: 모델별 고유 인사이트 비교
4. **최종 계획 종합**: 우선순위별 리팩토링 계획 문서화
5. **개선사항 검증**: lint, test, 성능 메트릭 측정

#### 출력물
- `stages/07-refactoring/outputs/refactoring_report.md` - 주요 결과물
- `state/refactoring/synthesis_{timestamp}.json` - 통합 메타데이터

#### 구현 단계
- **Phase 1 (1주)**: 권장사항 통합 (수집, 합의, 병합)
- **Phase 2 (1주)**: 검증 및 메트릭 (lint+test, 성능, 복잡도)
- **Phase 3 (1주)**: 인텔리전스 (extended thinking, 우선순위, 상세 리포트)

#### 예상 효과
- 리팩토링당 컨텍스트 절감: 10-15%
- 파괴적 변경: 0% (테스트 통과 보장)
- 성능 개선: ≥ 10%, 복잡도 감소: ≥ 20%

---

## Tier 2: Medium Priority

### 6. QA & Bug Analysis Agent

**우선순위**: MEDIUM 🟡
**컨텍스트 절감**: 8-9%
**총 영향**: OWASP 취약점 95%+ 탐지

#### 역할
Stage 08 보안 스캔, 코드 품질 분석, 버그 우선순위 분류

#### 트리거
- Stage 08 시작 시 (자동 스캔)
- `/qa-analyze` 수동 호출
- 08 → 09 전환 전 필수

#### 주요 기능
- **보안 스캔**: npm audit, OWASP Top 10 패턴 매칭, 하드코딩된 시크릿
- **코드 품질**: ESLint, TypeScript 에러, 복잡도 메트릭 (cyclomatic complexity)
- **버그 분류**: Critical/High/Medium/Low 우선순위, 수정 시간 추정

#### 출력물
- `state/qa_analysis/security_report_{timestamp}.json` - 보안 리포트
- `state/qa_analysis/quality_metrics_{timestamp}.json` - 품질 메트릭
- `state/qa_analysis/bug_categories.md` - 버그 분류 리스트

#### 예상 효과
- 분석당 컨텍스트 절감: 8-9%
- OWASP 취약점 탐지: 95%+
- 수동 QA 시간: -70%

---

### 7. Checkpoint Manager Agent

**우선순위**: MEDIUM 🟡
**컨텍스트 절감**: 7-8%
**총 영향**: 파괴적 작업 전 100% 커버리지

#### 역할
트리거 조건 평가 후 자동 체크포인트 생성 및 정리

#### 트리거 조건
| 트리거 | 조건 | 위험 점수 |
|--------|------|----------|
| 태스크 기반 | 5개 완료 | 0.3 |
| 파일 변경 | 100+ 라인 | 0.5 |
| 파괴적 작업 | rm, delete 패턴 | 0.9 |
| 시간 기반 | 30분 경과 | 0.2 |
| 스테이지 완료 | 06, 07, 08 완료 | 0.7 |

#### 주요 기능
- **트리거 평가**: 위험 점수 합산 (≥ 0.8 시 생성)
- **체크포인트 생성**: 메타데이터, 아카이브, git tag
- **정리 관리**: 최대 20개 유지, 마일스톤 영구 보존

#### 출력물
- `state/checkpoints/checkpoint_{timestamp}/` - 아카이브
- `state/checkpoints/registry.json` - 메타데이터
- Git tag: `checkpoint-{timestamp}`

#### 예상 효과
- 결정당 컨텍스트 절감: 7-8%
- 파괴적 작업 전 커버리지: 100%
- 수동 체크포인트 결정 시간: -100%

---

### 8. AI Benchmark Analyzer Agent

**우선순위**: MEDIUM 🟡
**컨텍스트 절감**: 10-14%
**총 영향**: 최적 모델 선택으로 15-20% 성능 향상

#### 역할
AI 모델 성능 추적을 통한 동적 모델 선택 및 벤치마킹

#### 트리거
- `/benchmark` 수동 호출
- 스테이지 시작 (06, 07, 09) 자동
- 주간 자동 벤치마크 (금요일 저녁)

#### 주요 기능
- **벤치마크 실행**: code_generation, refactoring, test_generation 태스크
- **점수 계산**: 정확도(40%), 성능(30%), 스타일(20%), 가독성(10%)
- **모델 추천**: 가중 점수 비교, 이력 트렌드 분석

#### 출력물
- `state/ai_benchmarks/results/{task}_{timestamp}.json` - 결과
- `state/ai_benchmarks/reports/summary_{timestamp}.md` - 리포트
- `state/ai_benchmarks/trends.json` - 트렌드 데이터

#### 예상 효과
- 사이클당 컨텍스트 절감: 10-14%
- 최적 모델 선택 정확도: 85%+
- 태스크별 성능 향상: 15-20%

---

### 9. Test Execution & Reporting Agent

**우선순위**: MEDIUM 🟡
**컨텍스트 절감**: 6-7%
**총 영향**: 100% 테스트 자동화

#### 역할
테스트 실행, 커버리지 분석, 불안정 테스트(flaky test) 감지

#### 트리거
- Stage 09 시작 시 자동
- 코드 변경 후 (Stage 06)
- `/test-run` 수동 호출

#### 주요 기능
- **테스트 실행**: unit, integration, E2E (Playwright)
- **커버리지 분석**: 80%+ 임계값 확인, 미커버 함수 리스트
- **불안정 테스트 감지**: 3회 실행, 성공률 < 100% → flaky
- **회귀 감지**: 이전 결과와 비교, 새 실패 케이스 식별

#### 출력물
- `state/test_reports/results_{timestamp}.json` - 테스트 결과
- `state/test_reports/coverage_{timestamp}.html` - 커버리지 리포트
- `state/test_reports/flaky_tests.json` - 불안정 테스트 레지스트리

#### 예상 효과
- 사이클당 컨텍스트 절감: 6-7%
- 테스트 자동화: 100%
- 불안정 테스트 감지: 90%+

---

## Tier 3: Medium-Low Priority

### 10. Requirements Validation Agent

**우선순위**: MEDIUM-LOW 🟢 (최고 ROI)
**컨텍스트 절감**: 6-8%
**총 영향**: 요구사항 명확성 +25%

#### 역할
`/refine` 워크플로우에서 INVEST 기준 검증 및 크기 임계값 체크

#### 트리거
- `/refine --validate` 호출
- Stage 03 완료 시 자동

#### 주요 기능
- **INVEST 검증**: Independent, Negotiable, Valuable, Estimable, Small, Testable
- **크기 임계값**: Feature ≤ 40h, Task ≤ 8h
- **순환 의존성 감지**: 태스크 간 순환 참조

#### 출력물
- `state/validations/requirements_validation_{timestamp}.json` - 검증 결과

#### 예상 효과
- 검증당 컨텍스트 절감: 6-8%
- 요구사항 명확성: +25%
- 크기 정확도: +30%

---

### 11. Task Decomposition Agent

**우선순위**: MEDIUM-LOW 🟢
**컨텍스트 절감**: 8-10%
**총 영향**: 태스크 크기 정확도 +35%

#### 역할
태스크 분해, 의존성 분석, 용량 계획 (스프린트 할당)

#### 트리거
- Stage 05 진입 시 자동
- `/tasks` 명령
- 에픽 분해 요청

#### 주요 기능
- **태스크 추출**: PRD에서 태스크 추출 및 의존성 그래프 생성
- **MoSCoW 분류**: Must/Should/Could/Won't 우선순위
- **용량 계획**: 스프린트 할당, 병목 식별

#### 출력물
- `stages/05-task-management/outputs/tasks.json` - 구조화된 태스크
- `stages/05-task-management/outputs/dependency_graph.mermaid` - 의존성 다이어그램

#### 예상 효과
- 세션당 컨텍스트 절감: 8-10%
- 태스크 크기 정확도: +35%
- 스프린트 계획 시간: -50%

---

### 12. Moodboard Analysis Agent

**우선순위**: MEDIUM-LOW 🟢
**컨텍스트 절감**: 6-8%
**총 영향**: 디자인 시스템 생성 시간 -70%

#### 역할
무드보드 이미지에서 디자인 토큰(색상, 타이포, 레이아웃) 추출

#### 트리거
- `/moodboard analyze` 호출
- Stage 04 UI/UX 단계

#### 주요 기능
- **색상 추출**: 5-7 dominant colors, 접근성 대비 검사(WCAG AA)
- **타이포그래피 감지**: 폰트 패밀리, 크기, line-height, letter-spacing
- **레이아웃 분석**: 그리드 시스템, 간격 패턴(4px, 8px 등)

#### 출력물
- `stages/04-ui-ux/outputs/design_tokens.json` - 디자인 토큰
- `stages/04-ui-ux/outputs/color_palette.svg` - 색상 팔레트

#### 예상 효과
- 분석당 컨텍스트 절감: 6-8%
- 디자인 토큰 정확도: 85%
- 디자인 시스템 생성: -70% 시간

---

### 13. CI/CD Validation Agent

**우선순위**: MEDIUM-LOW 🟢
**컨텍스트 절감**: 5-7%
**총 영향**: 배포 실패 80% 예방

#### 역할
GitHub Actions YAML 검증, 배포 설정 감사, 보안 체크

#### 트리거
- Stage 10 진입 시 자동
- `/deploy` 검증 단계

#### 주요 기능
- **YAML 구문 검증**: 파서로 구문 오류 체크
- **워크플로우 로직 검증**: 단계 의존성, 환경 분리(dev/staging/prod)
- **시크릿 관리 감사**: 하드코딩 체크, GitHub Secrets 사용 권장

#### 출력물
- `state/validations/cicd_validation_{timestamp}.json` - 검증 결과

#### 예상 효과
- 검증당 컨텍스트 절감: 5-7%
- 보안 이슈 감지: 95%
- 배포 실패 예방: 80%

---

### 14. Smart Rollback Agent

**우선순위**: MEDIUM-LOW 🟢
**컨텍스트 절감**: 6-8%
**총 영향**: 복구 시간 -60%

#### 역할
에러 분석 및 지능형 롤백 전략 제안 (최소 범위 롤백)

#### 트리거
- 빌드/테스트 실패 감지
- `/restore --smart` 명령

#### 주요 기능
- **에러 패턴 인식**: build/test/runtime/config 오류 분류
- **체크포인트 스코어링**: 최신성(30%), 안정성(40%), 관련성(30%)
- **롤백 범위 계산**: 파일 레벨 > 함수 레벨 > 스테이지 레벨

#### 출력물
- `state/rollback_suggestions/{error_id}.json` - 롤백 제안

#### 예상 효과
- 롤백당 컨텍스트 절감: 6-8%
- 롤백 범위 최소화: 70%
- 복구 시간: -60%

---

## 구현 타임라인

### Phase 1: Foundation (3개월)

**Month 1: Tier 1 Critical**
- Week 1-3: HANDOFF Generator Agent
- Week 2-4: Output Synthesis Agent (병렬)

**Month 2: Tier 1 High**
- Week 5-7: Architecture Review Agent
- Week 6-8: Research Analysis Agent (병렬)

**Month 3: Tier 1 완료**
- Week 9-10: Refactoring Analysis Agent

### Phase 2: Automation (3개월)

**Month 4-6: Tier 2**
- Week 13-15: QA Analysis Agent
- Week 16-18: Test Execution Agent (병렬)
- Week 19-21: Checkpoint Manager Agent
- Week 22-24: Benchmark Analyzer Agent

### Phase 3: Enhancement (2.5개월)

**Month 7-8.5: Tier 3**
- Week 25-26: Requirements Validation Agent (최고 ROI)
- Week 27-28: Moodboard Analysis Agent (병렬)
- Week 29-30: Task Decomposition Agent
- Week 31-32: Smart Rollback Agent
- Week 33-34: CI/CD Validation Agent

**총 예상 기간**: 7.5개월 (병렬 구현 활용 시)

---

## 예상 효과

### 컨텍스트 절감 종합

| Tier | Agent 수 | 총 절감 | 주요 영향 |
|------|----------|---------|-----------|
| Tier 1 | 5개 | 50-69% | HANDOFF, 통합 (고빈도) |
| Tier 2 | 4개 | 31-38% | QA, 테스트, 체크포인트 (자동화) |
| Tier 3 | 5개 | 31-39% | 검증, 롤백, CI/CD (품질) |
| **총계** | **14개** | **112-146%** | **누적 절감** |

> **Note**: Context 분석/압축은 기존 auto-compact 기능 활용

### 품질 지표 개선

| 지표 | 개선률 | 관련 Agent |
|------|--------|-----------|
| 요구사항 명확성 | +25% | #10 Requirements Validation |
| 태스크 크기 정확도 | +30-35% | #10, #11 |
| 디자인 일관성 | +40% | #12 Moodboard Analysis |
| 아키텍처 이슈 감지 | 95%+ | #4 Architecture Review |
| 보안 취약점 감지 | 95%+ | #6, #13 |
| 테스트 자동화 | 100% | #9 Test Execution |

### 자동화 수준

| 작업 | 수동 시간 | 자동화 후 | 절감률 |
|------|----------|----------|--------|
| HANDOFF 생성 | 5-10분 | 30초 | 90% |
| 출력 통합 | 10-15분 | 1분 | 93% |
| QA 분석 | 30분 | 5분 | 83% |
| 체크포인트 결정 | 5분 | 자동 | 100% |
| 테스트 실행 | 10분 | 2분 | 80% |
| 요구사항 검증 | 20분 | 3분 | 85% |
| 디자인 토큰 추출 | 1시간 | 10분 | 83% |

---

## 다음 단계

### Immediate Actions

1. **플랜 승인 받기** - 사용자 최종 확인
2. **우선순위 조정** (선택) - 프로젝트 상황에 맞게
3. **파일럿 Agent 선정** - HANDOFF Generator 또는 Requirements Validation (빠른 승리)
4. **리소스 할당** - 개발 인력, 시간 배정

### Phase 1 착수 시 필요 사항

- [ ] Agent 개발 환경 설정
- [ ] 테스트 프레임워크 구축 (Jest + fixtures)
- [ ] CI/CD 파이프라인에 Agent 테스트 추가
- [ ] 문서 템플릿 정리 (CLAUDE.md, README.md)
- [ ] 성능 벤치마크 기준선 측정

---

## 참고 자료

### 핵심 파일 (구현 시 참조)

1. `template/.claude/agents/validation-agent/CLAUDE.md` - Agent 인스트럭션 패턴
2. `src/core/agents/task-spawner.ts` - Agent 스폰 메커니즘
3. `src/core/agents/registry.ts` - Agent 로딩 시스템
4. `template/config/*.jsonc` - 각 기능별 설정 규칙

### Agent 파일 구조 표준

```
template/.claude/agents/{agent-name}/
├── agent.json              # 에이전트 설정
├── CLAUDE.md              # 시스템 프롬프트
└── [optional] README.md   # 문서
```

### agent.json 템플릿

```json
{
  "$schema": "https://raw.githubusercontent.com/znehraks/claude-symphony/main/schemas/agent.schema.json",
  "name": "agent-name",
  "description": "한 줄 설명 (100자 이내)",
  "tools": ["Read", "Glob", "Grep", "Bash"],
  "model": "sonnet",
  "permissionMode": "acceptEdits",
  "extendedThinking": true,
  "executionMode": "foreground"
}
```

---

**End of Document**

이 로드맵은 3개의 Explore 에이전트와 3개의 Plan 에이전트의 분석 결과를 종합하여 작성되었습니다.
validation-agent 패턴을 참조하여 실행 가능성을 검증하였으며, 사용자 피드백을 반영하여 Context Analyzer Agent를 제거하고 기존 auto-compact 기능을 활용하는 것으로 최종 결정하였습니다.

**원본 플랜 파일**: `/Users/youjungmin/.claude/plans/sequential-splashing-pony.md`
