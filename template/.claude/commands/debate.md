# Debate: Run Multi-Agent Debate for Current Stage

You are the debate orchestrator. Run a multi-agent debate for the current (or specified) stage.

## Usage

```
/debate              # Debate for current stage
/debate 03-planning  # Debate for specific stage
```

## Protocol

1. **Determine stage**: Read `state/progress.json` to find the current stage, or use the argument if provided.

2. **Load debate config**: Read `config/debate.jsonc` to get:
   - Intensity profile for this stage (full/standard/light)
   - Role definitions (agent names and directives)
   - Dynamic round settings (contention threshold, max rounds)

3. **Load stage context**: Assemble the base prompt from:
   - `stages/<stage-id>/CLAUDE.md` (stage instructions)
   - Previous stage's `HANDOFF.md` (context)
   - `references/<stage-id>/` (user-provided materials)

4. **Execute Round 1 — Independent Production**:
   - Launch N Task tool agents **in a single message** (parallel)
   - Each agent gets: base prompt + role-specific directive
   - **Model routing**: Pass each role's `model` field from debate config to the Task tool's `model` parameter. If a role has no `model` field, use the stage's `default_model`. If neither exists, fall back to `"sonnet"`.
   - Each writes to `state/debate/<stage-id>/round1/<role-name>.md`
   - No cross-visibility between agents

5. **Execute Round 2 — Cross-Review** (skip for `light` intensity):
   - Launch N Task tool agents in parallel
   - Each reads ALL Round 1 outputs + writes review
   - **Model routing**: Same per-role model assignment as Round 1
   - Output to `state/debate/<stage-id>/round2/<role-name>_review.md`
   - No repetition of Round 1 content — reviews/rebuttals only

6. **Evaluate Contention** (for `full` and `standard` intensity):
   - Launch 1 synthesizer agent (`.claude/agents/debate-synthesizer-agent/`)
   - Reads all round outputs, assigns contention score (0.0–1.0)
   - **MANDATORY: If current round < min_rounds → ALWAYS continue (minimum depth enforced)**
   - If score >= 0.5 and rounds < max_rounds: repeat with focused rebuttal round
   - If score < 0.5 and rounds >= min_rounds: proceed to synthesis
   - If max_rounds reached: proceed to synthesis

7. **Final Synthesis**:
   - Launch 1 synthesizer agent
   - Reads ALL round outputs
   - Applies synthesis rules from `config/debate.jsonc`
   - Writes final outputs to `stages/<stage-id>/outputs/`
   - Includes mandatory `## Debate Notes` section

8. **Log**: Append to `state/ai-call-log.jsonl`:
   ```jsonl
   {"stage":"<stage-id>","type":"debate","rounds":<N>,"agents":<N>,"contention_scores":[...],"action":"synthesized","ts":"<ISO-8601>"}
   ```

## Graceful Degradation

- 1+ agent success → continue synthesis
- All agents fail → single-agent fallback (no debate)
- Token overflow → compress previous round outputs
- Agent failure in extra rounds → continue with remaining agents

## Display

Show progress after each round:
```
[Round 1] 3/3 agents completed (Visionary, Skeptic, Integrator)
[Round 2] 3/3 reviews completed
[Contention] Score: 0.82 → extending to Round 3
[Round 3] 3/3 rebuttals completed
[Contention] Score: 0.45 → proceeding to synthesis
[Synthesis] Final outputs written to stages/01-brainstorm/outputs/
```

$ARGUMENTS
