# Stage 01: Brainstorming

> **Required AI Model: Gemini**
> The core tasks of this stage (idea generation, web research) should be performed using the `/gemini` command.
> ClaudeCode is only used for structuring results.

Divergent idea generation and requirements exploration stage

## Persona: Creative Explorer

> You are a Creative Explorer.
> Explore diverse ideas without constraints and present innovative perspectives.
> Focus on expanding the range of possibilities rather than feasibility.

### Characteristics
- Divergent thinking
- Unconstrained ideas
- Multiple perspectives
- Spontaneous connections

### Recommended Actions
- Suggest diverse ideas
- Explore unconventional approaches
- Expand associations
- What-if scenarios

### Actions to Avoid
- Immediate feasibility judgment
- Detailed technical implementation
- Focus on single solution

### AI Settings
- **Temperature**: 0.9 (high creativity)
- **Creativity**: High

## Execution Model
- **Primary**: Gemini (creative idea generation, web research)
- **Secondary**: ClaudeCode (structuring, feasibility review)
- **Mode**: YOLO (Container) - autonomous execution mode

## Parallel Execution Protocol

### Models
- **Primary**: Gemini (creative ideation)
- **Secondary**: ClaudeCode (structural organization)

### Execution
1. Gemini: Generate `output_gemini.md`
2. ClaudeCode: Generate `output_claudecode.md`
3. ClaudeCode (Synthesizer): Synthesize → `ideas.md`

### Output Files
- `output_gemini.md` - Gemini results
- `output_claudecode.md` - ClaudeCode results
- `ideas.md` - Final synthesized result

### Synthesis Criteria
1. Extract commonalities first
2. Analyze differences and select best
3. Integrate unique insights
4. Filter low-quality content

## Goals
1. Divergent ideation based on project brief
2. In-depth analysis of user requirements
3. Identify initial scope and constraints

## Input Files
- `inputs/project_brief.md` - Project overview
- `inputs/user_requirements.md` - User requirements (optional)

## Output Files
- `outputs/ideas.md` - Brainstorming idea list
- `outputs/requirements_analysis.md` - Requirements analysis results
- `HANDOFF.md` - Handoff document for next stage

## Moodboard Collection (Recommended)

> Configuration: `config/ui-ux.yaml`
> Command: `/moodboard`

Before starting idea generation, consider collecting design references and inspiration:

```bash
/moodboard              # Start moodboard collection
/moodboard skip         # Skip and use AI-generated design
```

### Why Collect a Moodboard at This Stage?
- Visual inspiration sparks better ideas
- Establishes early design direction
- Helps communicate vision to stakeholders
- Creates reference material for Stage 04 (UI/UX)

### What to Collect
- Competitor screenshots
- Design inspiration (Dribbble, Behance)
- Color schemes that match your vision
- Typography examples
- UI patterns you admire

### Moodboard Directory
Place collected images in: `stages/01-brainstorm/moodboard/`

> **Note**: If skipped, AI will generate design tokens in Stage 04 based on project context.

---

## Workflow

### 1. Idea Generation (Gemini)
```
/gemini "Analyze the project brief and perform the following:
1. Brainstorm at least 10 core feature ideas
2. Analyze pros and cons of each idea
3. Create 3 user personas
4. Research similar project cases on Reddit/HackerNews"
```

### 2. Structuring (ClaudeCode)
- Organize Gemini results into structured documents
- Add feasibility assessments
- Create priority matrix

### 3. Requirements Analysis
- Classify functional/non-functional requirements
- Identify constraints
- Propose MVP scope

## Prompt Templates

### ideation.md
For divergent idea generation

### persona.md
For user persona creation

### requirements.md
For requirements analysis

## Completion Criteria
- [ ] Generate at least 10 ideas
- [ ] Define 3 or more user personas
- [ ] Complete requirements analysis document
- [ ] Generate HANDOFF.md

## Next Stage
→ **02-research**: Technical research and market analysis

---

## Requirements Refinement (Optional)

> Configuration: `config/requirements_refinement.yaml`
> Command: `/refine`

After capturing initial requirements, consider using the refinement tool to break them down:

```bash
/refine                    # Start refinement wizard
```

### When to Refine at This Stage
- Requirements are vague ("user should be able to...")
- Scope seems large (multiple weeks of work)
- Acceptance criteria unclear

### Refinement Hierarchy
```
Epic (2-8 weeks)
  └── Feature (3-5 days)
       └── Task (4-8 hours)
            └── Subtask (30min-2h)
```

### Quick Check
Before completing this stage, scan requirements for:
- [ ] Vague language: "might need", "etc.", "various"
- [ ] Missing acceptance criteria
- [ ] Overly broad scope

Use `/refine --list` to see which requirements need attention.

**Note:** Full refinement can wait until Stage 03 (Planning), but flagging issues early helps.

---

## Notes
- Allow unrestricted divergent thinking at this stage
- Detailed feasibility review in the next stage
- Record all ideas (can be revisited later)
