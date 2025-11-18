# Git Worktree MCP Server with Enhanced Parallel Exploration

🚀 **Advanced git worktree management + AI-powered parallel exploration with MCP integration**

## ✨ What It Does

### Core MCP Server Features:
- **create_feature_worktree** - Create isolated worktree with feature branch
- **list_worktrees** - Show all active worktrees
- **cleanup_worktree** - Safe removal with uncommitted change checks
- **get_worktree_status** - Check branch status and changes
- **setup_parallel_workflow** - Spawn multiple worktrees for agent collaboration
- **get_parallel_workflow_status** - Aggregate workflow status

### 🆕 Enhanced Parallel Exploration Plugin:
- **MCP Server Discovery** - Auto-detects available MCP servers
- **Multi-Agent Orchestration** - Coordinates multiple AI agents (see [agents.md](agents.md))
- **Intelligent Synthesis** - Merges best elements from all approaches
- **Workflow Automation** - End-to-end parallel exploration (90% faster)

### 🎭 Parallel Exploration Skill:
- **Superpowers Integration** - Easy skill-based usage
- **Real-world Examples** - Algorithm optimization, API design, security
- **Complete Documentation** - 2,500+ word comprehensive guide

## 🚀 Claude Code Installation

### Option 1: Direct Integration (Recommended)

1. **Clone the repository** in your project directory:
```bash
git clone https://github.com/kingkillery/git-worktree-mcp.git
cd git-worktree-mcp
npm install
npm run build
```

2. **Add to Claude Code MCP configuration** (`.claude/settings.json`):
```json
{
  "mcpServers": {
    "git-worktree-mcp": {
      "command": "node",
      "args": ["./git-worktree-mcp/dist/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

3. **Restart Claude Code** - The MCP server will be auto-discovered

### Option 2: NPM Global Installation (From GitHub)

1. **Install globally from GitHub**:
```bash
npm install -g github:kingkillery/git-worktree-mcp
```

2. **Add to Claude Code configuration**:
```json
{
  "mcpServers": {
    "git-worktree-mcp": {
      "command": "git-worktree-mcp"
    }
  }
}
```

### Option 3: Local Project Installation (From GitHub)

1. **Install as dev dependency from GitHub**:
```bash
npm install --save-dev github:kingkillery/git-worktree-mcp
```

2. **Add to Claude Code configuration**:
```json
{
  "mcpServers": {
    "git-worktree-mcp": {
      "command": "npx",
      "args": ["github:kingkillery/git-worktree-mcp"]
    }
  }
}
```

### Option 4: Direct NPX Usage (No Installation)

**No installation required** - add directly to Claude Code configuration:
```json
{
  "mcpServers": {
    "git-worktree-mcp": {
      "command": "npx",
      "args": ["github:kingkillery/git-worktree-mcp"]
    }
  }
}
```

## ✅ Verify Installation

After installation, verify it works in Claude Code:

```
User: List available MCP servers and git worktrees

Claude: I'll check the available MCP servers and list your git worktrees.

[Claude automatically discovers and uses the git-worktree-mcp server]
```

## 🎯 Quick Usage Examples

### Basic Git Worktree Operations:
```
User: Create a worktree for the user-authentication feature
User: List all my active worktrees
User: Clean up the user-authentication worktree
User: Check the status of my current worktree
```

### 🆕 Parallel Exploration:
```
User: Use parallel exploration to optimize the sorting algorithm
User: Explore different approaches for implementing the user authentication API
User: Use parallel exploration to improve database query performance
```

### Advanced Multi-Agent Workflows:
```
User: Set up a parallel workflow for 3 agents to work on the next release
User: Get the status of the next-release parallel workflow
```

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
