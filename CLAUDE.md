# Git Worktree MCP Server

This project provides an MCP (Model Context Protocol) server for managing git worktrees and Par CLI sessions through AI assistants.

## Development Workflow

- Never use the git commit command after a task is finished.

## Features

### Git Worktree Management
- Create isolated feature environments with automatic config copying
- List and manage active worktrees
- Safe cleanup with uncommitted change detection
- Parallel workflow support for multi-agent development

### Par CLI Integration
- Start and manage Par sessions with tmux integration
- Multi-repository workspace support
- Control center for managing multiple sessions

## Usage

Ask Claude to:
- "Create a worktree for feature-name"
- "List my worktrees"
- "Clean up the feature-name worktree"
- "Check worktree status"
- "Start a Par session with label session-name"

## MCP Tools

### Git Worktree Tools
- `create_feature_worktree` - Create new worktree with feature branch
- `list_worktrees` - Show all active worktrees
- `cleanup_worktree` - Safe removal with change checks
- `get_worktree_status` - Check branch status and changes
- `setup_parallel_workflow` - Create multiple parallel worktrees
- `get_parallel_workflow_status` - Aggregate workflow status

### Par CLI Tools
- `par_test_connection` - Test Par CLI installation
- `par_start_session` - Start new Par session with worktree
- `par_list_sessions` - List all active sessions
- `par_send_command` - Send commands to sessions
- `par_open_session` - Attach to session
- `par_remove_session` - Remove session safely
- `par_get_session_status` - Check session status
- `par_create_control_center` - Create control center tmux session
- `par_start_workspace` - Start multi-repo workspace
- `par_list_workspaces` - List active workspaces
- `par_remove_workspace` - Remove workspace

## Requirements

- Node.js 18+
- Git repository
- Par CLI (for Par features)
- tmux (for Par features, works via WSL on Windows)

## GitButler Integration

This project is configured with GitButler hooks for automatic commit management:
- Pre/post tool hooks trigger GitButler commands
- Automatic branch management for multiple sessions
- Sophisticated commit message generation