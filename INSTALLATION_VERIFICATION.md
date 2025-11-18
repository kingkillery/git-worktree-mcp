# Installation Verification for Claude Code

## ✅ Quick Verification Steps

### 1. Test NPX Installation (No Install Required)

Test that the package can be loaded via NPX:

```bash
npx github:kingkillery/git-worktree-mcp --version
```

Expected output: Package version information

### 2. Verify MCP Server Configuration

Create a test `.claude/settings.json` file:

```json
{
  "mcpServers": {
    "git-worktree-mcp": {
      "command": "npx",
      "args": ["github:kingkillery/git-worktree-mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Test in Claude Code

Start Claude Code and run:

```
User: List the available MCP servers

Claude: I'll check what MCP servers are available and list my git worktrees.

[Claude should discover and use git-worktree-mcp automatically]
```

### 4. Test Basic Functionality

```
User: Create a worktree for feature-test
User: List all my active worktrees
User: Clean up the feature-test worktree
```

## 🔍 Troubleshooting

### If MCP Server Not Found:

1. **Check Node.js version**:
```bash
node --version  # Should be 18+
```

2. **Check NPX access**:
```bash
npx --version
```

3. **Test GitHub access**:
```bash
npx github:kingkillery/git-worktree-mcp --help
```

4. **Verify configuration path**:
```bash
ls -la .claude/settings.json
```

### If Worktree Operations Fail:

1. **Check git status**:
```bash
git status  # Should be clean
```

2. **Check git worktree support**:
```bash
git worktree list
```

3. **Check permissions**:
```bash
mkdir -p .worktree/test
ls -la .worktree/
```

## 🚀 Advanced Verification

### Test Parallel Exploration

```
User: Use parallel exploration to create a simple sorting algorithm implementation
```

This should:
1. Discover available MCP servers
2. Generate multiple approaches
3. Execute agents in parallel
4. Synthesize results

### Test Multi-Agent Workflow

```
User: Set up a parallel workflow for 2 agents to work on task-optimization
```

This should create multiple worktrees and coordinate agents.

## 📊 Success Indicators

✅ **Installation Successful When:**
- NPX command executes without errors
- Claude Code discovers the MCP server
- Basic worktree operations work
- No error messages in Claude Code startup

✅ **Enhanced Features Working When:**
- Parallel exploration commands work
- Multiple agents can be coordinated
- MCP server discovery functions
- Workflow automation executes

## 🎯 Final Verification

Run this complete test in Claude Code:

```
User: I want to verify the git-worktree-mcp installation. Please:
1. List available MCP servers
2. Create a test worktree called "verification-test"
3. List all worktrees
4. Show the status of the verification-test worktree
5. Clean up the verification-test worktree

Expected: All commands should work smoothly with proper git worktree operations.
```