# Memory Relay - Claude Session Orchestrator

Automatically manages Claude session handoffs when context reaches 50%, ensuring seamless continuity of work.

Part of the **claude-symphony** package.

## Quick Start

### 1. Install

```bash
# From claude-symphony root directory
./scripts/memory-relay/install.sh
```

### 2. Run

```bash
# Start orchestrated Claude session
claude-symphony-play

# Or run directly
~/.claude/memory-relay/orchestrator/claude-symphony-play
```

## How It Works

```
+------------------------------------------------------------+
|                tmux session: symphony-session               |
+----------------------------+-------------------------------+
|     Orchestrator (50%)     |      Claude Session (50%)     |
|     -----------------      |      ------------------       |
|                            |                               |
|   Listening on FIFO...     |   1. Work normally            |
|                            |   2. Context reaches 50%      |
|                            |   3. Generate HANDOFF.md      |
|   Receives signal -->      |   4. signal_relay_ready       |
|   Creates new pane         |                               |
|   Starts new Claude        |   <-- ACK received            |
|                            |   5. Safe to exit             |
|   [New Claude Session]     |                               |
|   Reads HANDOFF.md         |                               |
|   Continues work...        |                               |
+----------------------------+-------------------------------+

Tip: Type `exit` in either pane to close it. Use `tmux kill-session -t symphony-session` to terminate the entire session.
```

### Signal Flow

```
Claude (old)              Orchestrator              Claude (new)
    |                          |                          |
    |  RELAY_READY:path:pane > |                          |
    |                          | -- tmux split-window --> |
    |                          |                          | (starts)
    |                          | <-- (pane confirmed) --- |
    |  < ACK:new_pane -------- |                          |
    |                          |                          |
    | (exit)                   |                          | (continues)
```

## Commands

| Command | Description |
|---------|-------------|
| `claude-symphony-play` | Start Claude with relay orchestration |
| `claude-symphony-play status` | Show orchestrator status |
| `claude-symphony-play logs` | View relay logs |
| `claude-symphony-play logs -f` | Follow logs in real-time |
| `claude-symphony-play stop` | Stop the orchestrator |
| `claude-symphony-play cleanup` | Clean up stale files |
| `claude-symphony-play help` | Show help message |

## Options

| Option | Description |
|--------|-------------|
| `-d, --directory DIR` | Start in specified directory |
| `--version` | Show version |

## During a Session

When Claude detects low context (50%), it will:

1. Save current work state to `HANDOFF.md`
2. Call `signal_relay_ready $(pwd)/HANDOFF.md`
3. Wait for ACK from orchestrator
4. Exit safely after new session starts

### Manual Trigger

You can also manually trigger a relay:

```bash
# Inside Claude session, run:
signal_relay_ready $(pwd)/HANDOFF.md
```

## Configuration

Configuration file: `~/.claude/memory-relay/config.json`

```json
{
  "threshold": {
    "trigger_percentage": 50,
    "warning_percentage": 60
  },
  "orchestrator": {
    "enabled": true,
    "tmux_session_name": "symphony-session",
    "ack_timeout_seconds": 30
  }
}
```

## File Structure

After installation:

```
~/.claude/memory-relay/
├── config.json              # Configuration
├── README.md                # Documentation
├── orchestrator/
│   ├── claude-symphony-play # Main CLI entry point
│   ├── orchestrator.sh      # FIFO listener daemon
│   ├── claude-wrapper.sh    # Claude launcher with relay support
│   ├── tmux-startup.sh      # tmux session initializer
│   └── signals/
│       └── relay.fifo       # Named pipe for communication
├── handoffs/                # Archived handoff files
├── logs/
│   ├── orchestrator.log     # Orchestrator logs
│   └── relay.log            # Relay event logs
└── queue/                   # Pending handoffs
```

## Requirements

- **tmux**: Required for session management
  ```bash
  brew install tmux  # macOS
  apt install tmux   # Ubuntu/Debian
  ```
- **Claude CLI**: Must be installed and accessible as `claude`

## Troubleshooting

### Orchestrator not starting

```bash
# Check status
claude-symphony-play status

# View logs
claude-symphony-play logs

# Clean up and retry
claude-symphony-play cleanup
claude-symphony-play
```

### FIFO stuck

```bash
# Remove and recreate FIFO
rm ~/.claude/memory-relay/orchestrator/signals/relay.fifo
claude-symphony-play
```

### tmux session issues

```bash
# Kill existing session
tmux kill-session -t symphony-session

# Start fresh
claude-symphony-play
```

## Manual Operation (Fallback)

If orchestration fails, you can still use manual relay:

1. Create `HANDOFF.md` manually
2. Exit Claude session
3. Start new session: `claude`
4. Read handoff: "Please read HANDOFF.md and continue"

## HANDOFF.md Template

When Claude triggers a relay, it should create a HANDOFF.md with:

```markdown
# Session Handoff

## Context
- Previous session context percentage: XX%
- Handoff timestamp: YYYY-MM-DD HH:MM:SS

## Original Request
[What the user originally asked for]

## Completed Work
- [x] Task 1
- [x] Task 2

## Remaining Tasks
- [ ] Task 3
- [ ] Task 4

## Key Decisions Made
1. Decision 1 - rationale
2. Decision 2 - rationale

## Must NOT Do (Already Tried)
- Don't do X because...

## Critical Files Modified
- `path/to/file1.ts` - description
- `path/to/file2.ts` - description

## Immediate Next Steps
1. Read this file
2. Continue from Task 3
```

## Version History

- **1.0.0**: Initial release with FIFO-based orchestration
