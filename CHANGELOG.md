# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-02-01

### Multi-Model Restore & execa Refactor

### Changed
- **Multi-model pipeline restored**: Gemini and Codex model assignments returned to pipeline stages with automatic claudecode fallback
- **tmux → execa migration**: Replaced tmux-based CLI wrappers with direct execa calls (614 lines removed)
- **Zero system dependencies**: No longer requires tmux installation for AI CLI wrappers

### Removed
- `src/integrations/tmux/` directory (replaced by direct execa calls)

---

## [0.7.0] - 2026-01-31

### TDD-First Quality Gates — "Code exists ≠ Code works"

### Added
- **TDD-first implementation stage**: Stage 06 now enforces Write-Test-Verify loop per feature
  - Tests must be written BEFORE implementation code
  - `test_summary.md` required output with pass rates and coverage
  - 4-level quality gate: build → test → E2E → lint/typecheck
- **Enhanced output validator**: `src/hooks/output-validator.ts` now runs build, test, E2E, and lint for Stage 06
- **Retry prompt enhancement**: Test/build failure details injected into retry prompts for faster fixes
- **Stage role redefinition**:
  - Stage 07: Refactoring with test coverage maintenance
  - Stage 08: QA with E2E scenario expansion
  - Stage 09: Edge-case tests and performance benchmarks

### Changed
- **Pipeline config cleanup**: Removed vaporware (forking, epic_cycles, sprint_mode)
  - Replaced `test_first_flow` with simpler `quality_gates` config
- **Gemini/Codex integration simplified**: Replaced tmux-based wrappers with direct execa calls (~460 lines removed)
  - `src/integrations/tmux/` directory removed (310 lines)
  - `gemini.ts` and `codex.ts` rewritten from ~230 lines each to ~100 lines each
  - No longer requires tmux as a system dependency
- **Package hygiene**: Removed `scripts/` and `assets/` from npm package `files` array
- **Documentation**: Translated CLAUDE.md and CHANGELOG.md to English
- **Output validation config**: Stage 06 now requires test pass and coverage metrics

### Added (Documentation)
- `.npmignore` for optimized npm package size
- `docs/getting-started.md` — 5-minute quickstart guide
- `docs/how-it-works.md` — Pipeline architecture explanation

### Removed
- `forking` config section (unimplemented)
- `epic_cycles` config section (unimplemented)
- `sprint_mode` config section (unimplemented)
- `firecrawl` and `exa` MCP server references (unused)
- `src/integrations/tmux/` directory (replaced by direct execa calls)

---

## [0.6.0] - 2026-01-31

### Auto-Pilot Pipeline — "One Command, Production-Grade Software"

### Added
- **PipelineOrchestrator**: 10-stage auto-pilot execution engine (`src/core/pipeline/orchestrator.ts`)
  - Stage prompt building (instructions + persona + handoff + references)
  - Output validation and stage finalization
  - Automatic HANDOFF.md generation for stage transitions
- **Retry & Pipeline Controls**: 3-attempt retry with validation feedback injection
  - `pausePipeline()`, `resumePipeline()`, `skipStage()` functions
  - Pipeline state persistence (`state/pipeline_state.json`)
  - `/pause`, `/resume`, `/skip` slash commands
- **Import Mode**: `claude-symphony import ./path` for existing projects
  - Project structure analysis (source, tests, CI/CD, UI, QA)
  - Auto-detect completed stages and skip them
  - `--dry-run` option support
- **Core Sub-path Export**: Separate build for library consumers
  - `import { ... } from 'claude-symphony/core'` support
  - CLI (with shebang) / Library (without shebang) build separation
- **TUI Progress Display**: Pipeline progress terminal UI
- **`/auto-pilot` slash command**: 10-stage automatic execution
- **ProgressManager extensions**: `getNextStage()`, `isComplete()`, `getStageStatuses()`
- **37 new tests**: orchestrator (20), progress (10), TUI (7) — 141 total passing
- **Pencil.dev integration**: UI design tool with pre-start intake process
- **Sub-agent model policy**: Prompt-based model selection policy

### Changed
- **Framework pivot**: Manual orchestration → auto-pilot pipeline
- **Init command simplification**: Single question ("What do you want to build?")
- **Build config separation**: tsup config split into CLI/Library entries

### Removed
- **230+ unused template files**: 14 agents → 2 core (validation, handoff-generator)
- **28+ slash commands**: 34 → 6 essential commands
- **20+ config files**: 25 → 5 core configs
- **Stage boilerplate**: README, config.jsonc, HANDOFF.md.template, prompts/, outputs/, templates/
- **Internal tracking files**: IMPLEMENTATION_PROGRESS.md, PHASE3_IMPLEMENTATION_STATUS.md, state/ artifacts

---

## [0.5.1] - 2026-01-30

### Minor Fixes
- **Sub-agent model enforcement**: Prompt-based model selection policy
- **README cleanup**: Remove false claims and vaporware
- **Pencil.dev integration**: Add as primary UI tool
- **License**: Add missing LICENSE file, complete slash command categories

---

## [0.5.0] - 2026-01-30

### Documentation & Cleanup Release

**Status**: README fully synchronized with codebase, obsolete docs removed

### Changed

#### README.md Full Sync
- **Version references**: Updated `v0.3.x` → `v0.4.x` across all sections
- **Pipeline Stages**: Added `+ Claude` to parallel execution stages (03, 04, 07, 09)
- **Sub-Agent System**: Added Tier 2 (4 agents) and Tier 3 (6 agents) tables with status
- **CLI Commands**: Expanded from 2 to 6 commands (added `create`, `stage`, `validate`, `checkpoint`)
- **Slash Commands**: Reorganized into 5 categories covering all 34 commands
- **Repository Structure**: Expanded `src/` tree (core/, hooks/, integrations/, types/, utils/), added `test/`, `agents/`
- **Build Commands**: Expanded from 5 to 10 (added `test:watch`, `test:coverage`, `test:pipeline`, `benchmark`, `clean`)
- **Testing section**: Added Vitest framework mention, fixed broken docs references
- **Documentation references**: Replaced broken `docs/` paths with valid `template/.claude/agents/`, `template/docs/`, `CHANGELOG.md`

### Removed
- **`docs/` directory**: Removed 19 obsolete developer documentation files
- Documentation consolidated into `template/docs/` (end-user) and `CHANGELOG.md` (release history)

## [0.4.1] - 2026-01-29

### Testing & Benchmarking Release

**Status**: All infrastructure tests passing (109/109), benchmark suite operational

### Added
- **Automated Testing Infrastructure**: 109 tests covering core framework and agent system
  - Mock utilities for Task tool simulation (`test/helpers/task-tool-mock.ts`)
  - Unit tests for agent registry, spawner helpers, and utilities
  - Integration tests for 15 agent scenarios (loading, spawning, error handling)
- **Performance Benchmarking**: `pnpm run benchmark` command
  - Tests all 5 Tier 1 agents with infrastructure verification
  - Measures execution time and success rate
  - Saves results to `state/benchmarks/benchmark-{timestamp}.json`

### Fixed
- Task spawner error handling for non-existent agents
- Mock response format alignment with actual Task tool output
- Type safety in agent configuration extraction

### Documentation
- Updated README.md with comprehensive testing section
- Added benchmark script usage instructions
- Clarified testing approach (infrastructure vs E2E)

### Development
- Test coverage: 7.5% overall (agent infrastructure ~80%)
- All 109 tests passing with vitest
- Zero regressions from v0.4.0

---

## [0.4.0] - 2026-01-28

### Phase 3 Complete: All Tier 1 Sub-Agents Implemented

**Status**: 100% Complete (5/5 Tier 1 agents tested and working)

### Added

#### Sub-Agent System
- **Task Tool Integration**: Helper utilities for Claude Code to spawn agents in isolated contexts
  - `src/core/agents/spawner-helper.ts`: Prompt building, config extraction, output parsing
  - `buildAgentPrompt()`: Injects context variables into agent prompts
  - `getAgentConfig()`: Extracts agent configuration (model, tools, extendedThinking, MCP servers)
  - `parseAgentOutput<T>()`: Parses JSON from agent responses (handles markdown wrapping)

#### Tier 1 Agents (All Complete)
1. **validation-agent** (v0.3.1)
   - Validates stage outputs against quality criteria
   - 5 validation checks: file existence, size, markdown structure, key sections, completeness

2. **handoff-generator-agent** (v0.3.2)
   - Generates intelligent stage transition documents (HANDOFF.md)
   - Token budget management (target: 4000 tokens, compression ratio: ~30%)

3. **output-synthesis-agent** (Phase 3)
   - Consolidates parallel AI outputs
   - Consensus detection and quality scoring

4. **architecture-review-agent** (Phase 3)
   - Validates architecture.md and implementation.yaml
   - Circular dependency detection, cross-document consistency checks

5. **research-analysis-agent** (Phase 3)
   - Cross-references research outputs
   - Contradiction detection, risk assessment, GO/NO-GO recommendations

#### CLI & Hooks
- Updated `/validate` command to use validation-agent (auto-fallback to legacy)
- Updated `/handoff` command to use handoff-generator-agent
- Hook integration: Auto-validation on stage completion

### Changed
- **Agent Registry**: Added `loadAgentSync()` method for synchronous agent loading
- **Output Validator Hook**: Integrated validation-agent with fallback to legacy validation

## [0.3.2] - 2026-01-27

### Added
- Phase 2: CLI commands and hooks integration
- 5 CLI commands: `/handoff`, `/benchmark`, `/synthesize`, `/qa-analyze`, `/arch-review`
- 3 hooks: output-validator, statusline monitoring, stop hook
- Agent registry and task spawner infrastructure

### Changed
- Migrated from Agent SDK to native Task tool
- Reduced codebase: 266 lines (SDK) → 154 lines (Task tool)
- Zero external dependencies for agent system

## [0.3.1] - 2026-01-26

### Added
- Phase 1: Tier 1 & Tier 2 & Tier 3 sub-agent infrastructure
- 14 agent definitions (agent.json + CLAUDE.md)
- Type system: AgentDefinition, AgentContext, AgentExecutionResult
- validation-agent as reference implementation

## [0.3.0] - 2026-01-24

### Added
- Initial project structure
- 10-stage pipeline definition
- Configuration system (YAML)
- Template directory structure
- CLI initialization command
