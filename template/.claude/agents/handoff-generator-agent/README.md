# HANDOFF Generator Agent

**Priority**: CRITICAL (Tier 1)
**Context Savings**: 8-12% per transition
**Expected Impact**: 100-120% cumulative savings across project lifecycle

## Overview

The HANDOFF Generator Agent automatically creates intelligent stage transition documents that preserve critical context while optimizing token usage. It replaces the manual HANDOFF.md creation process with smart content extraction and compression.

## Key Features

### 1. Intelligent Content Extraction
- Analyzes conversation history and stage outputs
- Identifies completed tasks, key decisions, and blocking issues
- Extracts modified files and AI call history
- Prioritizes content by importance

### 2. Smart Compression
- Target token budget (default 4000 tokens)
- Priority-based inclusion (blocking issues > decisions > tasks)
- Compression techniques (summarization, abbreviation, tables)
- Quality guarantee (all critical info preserved)

### 3. Multiple Templates
- **default**: Standard stage transition
- **compact**: Minimal for low-context situations
- **recovery**: Detailed for context restoration
- **epic_transition**: End of epic cycle summary

### 4. Conditional Sections
- Epic cycle context (when in multi-cycle epic)
- Implementation order (Stage 03 → 04)
- Moodboard reference (Stage 04 with design tokens)

### 5. Extended Thinking
- Analyzes implicit decisions in conversation
- Prioritizes content when compression needed
- Resolves ambiguities in task status

## Usage

### Automatic Trigger

The agent is automatically invoked when:
1. User runs `/next` command (before stage transition)
2. User runs `/handoff` command explicitly
3. Context reaches 40% threshold (critical state)

### Manual Invocation

```typescript
import { spawnAgent } from '../core/agents/index.js';

const result = await spawnAgent(
  'handoff-generator-agent',
  {
    projectRoot: '/path/to/project',
    stage: '01-brainstorm',
    data: {
      conversationHistory: '/path/to/transcript.jsonl',
      outputsDir: 'stages/01-brainstorm/outputs',
      targetTokens: 4000,
      handoffTemplate: 'default',
      includeEpicContext: false,
    },
  },
  'foreground'
);

const handoffData = JSON.parse(result.result);
console.log('HANDOFF created:', handoffData.handoffPath);
```

### CLI Commands

```bash
# Generate HANDOFF for current stage (default template)
/handoff

# Generate compact HANDOFF (minimal content)
/handoff --compact

# Generate recovery HANDOFF (detailed state dump)
/handoff --recovery

# Generate with custom token budget
/handoff --tokens 2000

# Automatic generation on stage transition
/next  # HANDOFF is generated before transition
```

## Input Schema

```typescript
interface HandoffGeneratorInput {
  conversationHistory?: string;     // Path to conversation transcript
  outputsDir: string;                // Path to stage outputs directory
  targetTokens?: number;             // Target token budget (default 4000)
  handoffTemplate?: 'default' | 'compact' | 'recovery' | 'epic_transition';
  includeEpicContext?: boolean;     // Include epic cycle info
}
```

## Output Schema

```typescript
interface HandoffGeneratorOutput {
  handoffPath: string;               // Main HANDOFF file path
  archivePath: string;               // Archive copy path
  statistics: {
    targetTokens: number;
    actualTokens: number;
    compressionRatio: number;       // Achieved compression ratio
    sectionsIncluded: string[];     // Sections in final HANDOFF
    itemCounts: {
      completedTasks: number;
      keyDecisions: number;
      modifiedFiles: number;
      pendingIssues: number;
      aiCalls: number;
    };
  };
  nextStageContext: {
    criticalFiles: string[];        // Files next stage must read
    blockingIssues: string[];       // Unresolved blockers
    recommendedFirstAction: string; // What to do first
  };
}
```

## File Outputs

### Main HANDOFF
**Location**: `stages/{STAGE_ID}/HANDOFF.md`

The primary transition document that the next stage will read.

### Archive Copy
**Location**: `state/handoffs/archive/{STAGE_ID}_{TIMESTAMP}.md`

Timestamped backup for historical reference.

### Metadata
**Location**: `state/handoffs/metadata.json`

JSON file tracking all generated HANDOFFs with statistics:
```json
{
  "handoffs": [
    {
      "stage": "01-brainstorm",
      "timestamp": "2026-01-28T14:30:00Z",
      "targetTokens": 4000,
      "actualTokens": 3850,
      "compressionRatio": 0.38,
      "template": "default"
    }
  ]
}
```

## Templates

### default (Standard Transition)
**Use when**: Regular stage completion
**Sections**: Summary, Tasks, Decisions, Outputs, Issues, Next Steps
**Token budget**: Full (4000)

### compact (Minimal)
**Use when**: Low context remaining (<30%)
**Sections**: Status, Outputs, Blockers, Next
**Token budget**: Minimal (1000)

### recovery (Detailed State Dump)
**Use when**: Emergency context save, session crash recovery
**Sections**: Full State, Decision History, File Manifest, Recovery Instructions
**Token budget**: Extended (6000)

### epic_transition (Epic Completion)
**Use when**: End of multi-stage epic cycle
**Sections**: Epic Summary, Cross-Stage Decisions, Implementation Order, Retrospective
**Token budget**: Full (4000)

## Compression Strategy

### Priority Levels

1. **Priority 1 (Always Include)**:
   - Blocking issues
   - Critical errors
   - Essential next steps

2. **Priority 2 (Include if space)**:
   - Key decisions with rationale
   - Important trade-offs
   - Critical file references

3. **Priority 3 (Summarize)**:
   - Completed tasks (summarize if >10)
   - Non-blocking issues (reference only)
   - AI call history (top 5 only)

4. **Priority 4 (Abbreviate/Omit)**:
   - File lists (common prefixes abbreviated)
   - Routine operations (batch as "standard setup")
   - Verbose explanations (link to output files)

### Compression Techniques

1. **Summarization**: "Completed 25 tasks across 3 categories" instead of listing all 25
2. **Tables**: Use markdown tables instead of prose
3. **Abbreviation**: `/path/to/project/stages/01/outputs/` → `stages/01/outputs/`
4. **References**: "See requirements_analysis.md for details" instead of reproducing content
5. **Grouping**: Batch similar items ("Created 8 test files" vs listing each)

## Quality Guarantees

### Critical Content Preservation
- **100% of blocking issues** included (never compressed)
- **All key decisions** with rationale preserved
- **Critical file references** maintained
- **Next steps** clearly stated

### Token Budget Compliance
- **Target**: 4000 tokens (default)
- **Tolerance**: ±10% (3600-4400 tokens)
- **Fallback**: If impossible to compress, generate recovery HANDOFF with warning

## Error Handling

### Graceful Degradation

If extraction fails at any step:

1. **Log error** to `state/handoffs/errors.log`
2. **Generate minimal HANDOFF**:
   - Stage name and completion status
   - List of output files (existence check only)
   - Warning about incomplete extraction
   - Instruction to manually review stage outputs
3. **Do not block transition** (fallback HANDOFF is better than none)

### Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| Conversation history unavailable | Transcript file missing | Use outputs-only extraction |
| Token budget exceeded | Too much content | Auto-select "recovery" template |
| No outputs found | Stage incomplete | Generate warning HANDOFF |
| Write permission denied | File system issue | Log error, return JSON only |

## Integration Points

### Stage Transition Hook
**Location**: `template/.claude/hooks/stage-transition-hook.ts`

Automatically invokes agent before `/next` command:
```typescript
await spawnAgent('handoff-generator-agent', {
  projectRoot,
  stage: currentStage,
  data: { /* auto-populated */ }
});
```

### Manual Command
**Location**: `template/.claude/commands/handoff.ts`

User-invoked `/handoff` command:
```typescript
await spawnAgent('handoff-generator-agent', {
  projectRoot,
  stage: getCurrentStage(),
  data: {
    handoffTemplate: args.compact ? 'compact' : 'default',
    targetTokens: args.tokens || 4000,
  }
});
```

### Context Auto-Compact
**Location**: `template/.claude/hooks/context-check-hook.ts`

Triggered at 40% context threshold:
```typescript
if (contextRemaining < 0.4) {
  await spawnAgent('handoff-generator-agent', {
    projectRoot,
    stage: currentStage,
    data: { handoffTemplate: 'recovery' }
  });
}
```

## Testing

### Unit Tests
**Location**: `tests/agents/handoff-generator.test.ts`

Test scenarios:
- Content extraction from sample conversation
- Compression to target token budget
- Template rendering (all 4 templates)
- Priority-based inclusion logic
- Error handling (missing files, etc.)

### Integration Tests
**Location**: `tests/integration/handoff-generation.test.ts`

Test scenarios:
- End-to-end HANDOFF generation
- File creation (main + archive)
- Metadata update
- Stage transition integration

### E2E Tests
**Location**: `tests/e2e/handoff-workflow.test.ts`

Test scenarios:
1. Complete Stage 01, generate HANDOFF, verify Stage 02 can proceed
2. Generate recovery HANDOFF at 40% context, verify restoration
3. Generate compact HANDOFF at 20% context, verify minimal content
4. Epic transition HANDOFF across 3 stages

## Performance Metrics

### Baseline (Manual HANDOFF Creation)
- **Time**: 5-10 minutes per stage
- **Context usage**: 8-12% of main session
- **Quality**: Variable (depends on user diligence)
- **Consistency**: Low (format varies)

### With Agent (Automated)
- **Time**: 30 seconds per stage (95% faster)
- **Context usage**: 0% of main session (runs in separate context)
- **Quality**: Consistent (enforced structure)
- **Consistency**: High (standardized templates)

### Expected Impact
- **Per transition**: 8-12% context saved
- **10 transitions per project**: 80-120% total context saved
- **Session duration**: 2-3x longer before needing `/clear`

## Development Status

### Phase 1: Core Extraction Logic ✅
- [x] Agent directory structure created
- [x] agent.json written with schema validation
- [x] CLAUDE.md written with processing steps
- [ ] Implement content extraction logic
- [ ] Test with sample conversation history

### Phase 2: Smart Features (Week 2)
- [ ] Implement compression algorithm
- [ ] Add conditional sections
- [ ] Implement template system
- [ ] Test with real stage transitions

### Phase 3: Intelligence & Integration (Week 3)
- [ ] Enable extended thinking
- [ ] Add AI memory integration
- [ ] Integrate with `/handoff` command
- [ ] Add auto-trigger on `/next`
- [ ] E2E testing

## Future Enhancements

1. **AI Memory Integration**: Save HANDOFF summaries to claude-mem MCP for long-term recall
2. **Cross-Stage Analysis**: Identify patterns across multiple HANDOFFs
3. **Auto-Improvement**: Learn from user edits to generated HANDOFFs
4. **Multi-Language**: Support internationalization for non-English projects
5. **Custom Templates**: Allow users to define project-specific HANDOFF formats

## References

- **Schema**: `/schemas/agent.schema.json`
- **Validation Agent**: `template/.claude/agents/validation-agent/` (reference pattern)
- **Task Spawner**: `src/core/agents/task-spawner.ts`
- **HANDOFF Intelligence Config**: `template/config/handoff_intelligence.yaml`

## Support

For issues or questions:
- GitHub Issues: https://github.com/znehraks/claude-symphony/issues
- Tag: `agent:handoff-generator`

---

**Last Updated**: 2026-01-28
**Version**: 0.1.0 (Phase 1 - In Development)
