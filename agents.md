# Agent Orchestration System

The Git Worktree MCP server includes a powerful **Agent Orchestration System** designed to coordinate multiple AI agents for parallel exploration and complex task execution.

## Core Components

### 1. Agent Orchestrator (`src/coordination/agent-orchestrator.ts`)
The central brain that manages agent lifecycles, task assignment, and progress tracking.

**Key Features:**
- **Intelligent Task Decomposition**: Breaks down complex tasks into manageable sub-tasks.
- **Dynamic Agent Profiling**: Assigns specific roles (e.g., Architect, Implementer, Reviewer) based on task requirements.
- **Real-time Progress Tracking**: Monitors agent activities and status.
- **MCP Server Integration**: Automatically connects agents with relevant MCP tools.

### 2. Workflow Orchestrator (`src/workflow/workflow-orchestrator.ts`)
Manages the end-to-end execution of parallel workflows, ensuring agents work in isolated environments (worktrees) without stepping on each other's toes.

**Key Features:**
- **Parallel Execution**: Spawns multiple worktrees for simultaneous agent work.
- **Iteration Management**: Handles multiple rounds of refinement.
- **Synthesis**: Merges the best elements from different approaches into a final solution.

## Agent Profiles

Agents are assigned profiles to specialize their behavior:

- **Roles**:
  - `Architect`: Focuses on high-level design and structure.
  - `Implementer`: Writes code and implements features.
  - `Reviewer`: Validates code quality and correctness.
  - `Optimizer`: Focuses on performance and efficiency.

- **Constraints**:
  - Max execution time
  - Memory limits
  - Allowed/Forbidden tools

## Parallel Exploration Workflow

1. **Discovery**: The system identifies available MCP servers and capabilities.
2. **Planning**: The Agent Orchestrator defines approaches and assigns agents.
3. **Execution**: The Workflow Orchestrator spawns worktrees and starts agent sessions.
4. **Monitoring**: Real-time metrics (execution time, code quality, test coverage) are tracked.
5. **Synthesis**: Results are compared, and the best solution is merged.

## Usage

The orchestration system is integrated into the MCP server and can be triggered via specific tools:

- `setup_parallel_workflow`: Initialize a multi-agent workflow.
- `get_parallel_workflow_status`: Check the status of active agents.
- `parallel_exploration`: Run a full exploration task with automatic synthesis.
