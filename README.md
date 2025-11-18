# Git Worktree MCP Server

Manage git worktrees through AI assistants. Create isolated feature environments with automatic config copying.

## Features

- **create_feature_worktree** - Create isolated worktree with feature branch
- **list_worktrees** - Show all active worktrees
- **cleanup_worktree** - Safe removal with uncommitted change checks
- **get_worktree_status** - Check branch status and changes
- **setup_parallel_workflow** - Spawn multiple worktrees so manager agents can hand tasks to builders
- **get_parallel_workflow_status** - Aggregate iteration status so reviewer agents can compile/vote

## Setup

1. Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "git-worktree": {
      "command": "npx",
      "args": ["github:Mandalorian007/git-worktree-mcp"]
    }
  }
}
```

2. Ask Claude to:
- "Create a worktree for user-auth feature"
- "List my worktrees" 
- "Clean up the user-auth worktree"
- "Check worktree status"

## Claude Code Workflow

Perfect for switching between features while using Claude Code CLI:

```bash
# Create worktree via MCP
# Navigate to new worktree directory
cd .worktree/user-auth

# Start Claude Code in the worktree directory
export $(cat .env | xargs) && claude
```

Each worktree gets its own `.env`, `.claude/`, and config files automatically. Launch Claude Code from within the worktree directory to work on that specific feature in isolation.

## What it does

- Creates `.worktree/feature-name` with `feature/feature-name` branch
- Copies `.env*`, `.mcp.json`, `.claude/`, `.vscode/` files automatically
- Safe cleanup with uncommitted change detection
- Parallel workflows persist metadata in `.worktree/workflows/<name>.json` for later auditing

## Requirements

- Node.js 18+
- Git repository

## Parallel-agent workflow

Use the new parallel helpers to orchestrate swarm-style iterations:

1. **Manager agent** calls `setup_parallel_workflow` with either an `iterationCount` (defaults to 2) or explicit `agentLabels`. Example:
   ```json
   {
     "workflowName": "next-release",
     "iterationCount": 3
   }
   ```
   This creates `feature/next-release-iteration-1..3`, copies configs for each worktree, and drops metadata at `.worktree/workflows/next-release.json`.
2. **Builder agents** follow the returned `instructions` field (e.g., `cd .worktree/next-release-iteration-1 && export $(cat .env | xargs) && claude`) to jump straight into their sandboxed tree.
3. **Reviewer agent** runs `get_parallel_workflow_status` with the same workflow name to gather git status, missing iterations, and recommended follow-ups before compiling outputs or voting on the winner.

Mixing `agentLabels` (e.g., `["manager-a","builder-b","tester-c"]`) keeps paths descriptive while still benefiting from shared metadata for cleanup and review.
