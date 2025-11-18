# Repository Structure: Server, Plugin & Skill Locations

## 🗂️ Complete File Organization

```
git-worktree-mcp/
│
├── 🚀 MCP SERVER (Core Implementation)
│   ├── src/
│   │   ├── index.ts                 # Main MCP server entry point
│   │   ├── tools.ts                 # MCP tool definitions
│   │   ├── worktree-manager.ts       # Git worktree management
│   │   ├── par-manager.ts            # Par CLI integration
│   │   │
│   │   ├── mcp-integration/          # 🆕 MCP Discovery System
│   │   │   └── discovery.ts          # Auto-discovery of MCP servers
│   │   │
│   │   ├── coordination/             # 🆕 Agent Orchestration
│   │   │   └── agent-orchestrator.ts # Multi-agent coordination
│   │   │
│   │   └── workflow/                 # 🆕 Workflow Automation
│   │       └── workflow-orchestrator.ts # End-to-end automation
│   │
│   ├── dist/                         # Compiled JavaScript for production
│   │   ├── index.js                  # Main server (compiled)
│   │   ├── tools.js                  # Tools (compiled)
│   │   ├── worktree-manager.js       # Worktree management (compiled)
│   │   └── par-manager.js            # Par CLI (compiled)
│   │
│   └── test/                         # Tests
│       ├── integration.test.ts       # Original integration tests
│       └── integration/
│           └── enhanced-plugin-test.ts # 🆕 Enhanced plugin tests
│
├── 🔌 ENHANCED PARALLEL EXPLORATION PLUGIN
│   ├── src/
│   │   └── enhanced-parallel-explorer.ts # 🆕 Main plugin orchestration
│   │
│   └── 📚 Plugin Documentation & Planning
│       ├── PARALLEL_EXPLORATION_PLUGIN_IMPROVEMENTS.md # Analysis & recommendations
│       ├── PLUGIN_IMPLEMENTATION_PLAN.md                # Detailed roadmap
│       └── DEPLOYMENT_GUIDE.md                          # Complete deployment guide
│
├── 🎭 PARALLEL EXPLORATION SKILL (Superpowers Integration)
│   └── skills/
│       └── parallel-exploration/
│           ├── SKILL.md              # 🆕 Complete skill workflow (2,500+ words)
│           ├── README.md             # Quick start guide & benefits
│           ├── examples.md           # Real-world usage examples
│           ├── commands.md           # Complete command reference
│           └── integrate.js          # Node.js integration & CLI
│
├── 📊 Generated Results & Examples
│   ├── sorting-algorithms.ts         # Generated from our test run
│   ├── sorting-algorithms.js         # JavaScript version
│   ├── demo-adaptive-sorting.ts      # Demo implementation
│   ├── run-benchmarks.js             # Performance benchmarking
│   └── test-mergesort.js             # Test script
│
├── ⚙️ Configuration & Documentation
│   ├── CLAUDE.md                     # Project-specific instructions
│   ├── README.md                     # Main project documentation
│   ├── vitest.config.ts              # Test configuration
│   └── .claude/                      # Claude agents & commands
│       ├── agents/                   # 60+ specialized agents
│       └── commands/                 # Claude commands
│
└── 📋 Planning & Status
    ├── PARALLEL_EXPLORATION_PLUGIN_IMPROVEMENTS.md # Plugin improvement analysis
    ├── PLUGIN_IMPLEMENTATION_PLAN.md                # Implementation roadmap
    ├── DEPLOYMENT_GUIDE.md                          # Deployment instructions
    └── GITBUTLER_SETUP_COMPLETE.md                  # GitButler integration status
```

## 🎯 Key Components Explained

### 1. **MCP Server** (`src/`)
**Purpose**: Core MCP server providing git worktree and Par CLI integration
- **Entry Point**: `src/index.ts` - Creates and starts the MCP server
- **Tools**: `src/tools.ts` - Defines all MCP tools (create_worktree, list_worktrees, etc.)
- **Management**: `src/worktree-manager.ts` & `src/par-manager.ts` - Core functionality

### 2. **Enhanced Plugin Components** (`src/mcp-integration/`, `src/coordination/`, `src/workflow/`)
**Purpose**: Advanced capabilities for parallel exploration
- **Discovery**: `src/mcp-integration/discovery.ts` - Auto-discovers MCP servers
- **Coordination**: `src/coordination/agent-orchestrator.ts` - Manages multiple AI agents
- **Automation**: `src/workflow/workflow-orchestrator.ts` - End-to-end workflow execution
- **Main Entry**: `src/enhanced-parallel-explorer.ts` - Primary plugin interface

### 3. **Parallel Exploration Skill** (`skills/parallel-exploration/`)
**Purpose**: Superpowers framework skill for easy usage
- **Complete Workflow**: `SKILL.md` - 2,500+ word comprehensive guide
- **Quick Start**: `README.md` - Fast start with key benefits
- **Examples**: `examples.md` - Real-world usage scenarios
- **Commands**: `commands.md` - Complete CLI reference
- **Integration**: `integrate.js` - Node.js API and CLI interface

### 4. **Compiled Distribution** (`dist/`)
**Purpose**: Production-ready JavaScript files
- Auto-generated from TypeScript source
- Used by MCP server runtime
- Contains all core functionality

## 🚀 How They Work Together

### Data Flow:
```
User Request
    ↓
Parallel Exploration Skill (skills/parallel-exploration/)
    ↓
Enhanced Plugin (src/enhanced-parallel-explorer.ts)
    ↓
MCP Discovery (src/mcp-integration/discovery.ts)
    ↓
Agent Orchestration (src/coordination/agent-orchestrator.ts)
    ↓
Workflow Automation (src/workflow/workflow-orchestrator.ts)
    ↓
MCP Server (src/index.ts + tools.ts)
    ↓
Git Operations & Par CLI
```

### Integration Points:
1. **Skill → Plugin**: `integrate.js` imports and uses `EnhancedParallelExplorer`
2. **Plugin → MCP Discovery**: Uses `MCPServerDiscovery` to find available servers
3. **Plugin → Agent Orchestration**: Coordinates multiple specialized agents
4. **Plugin → Workflow Automation**: Manages end-to-end execution
5. **All → MCP Server**: Core tools and git operations

## 📁 File Purposes

### Core MCP Server Files:
- `src/index.ts`: **Main server entry point** - Creates MCP server instance
- `src/tools.ts`: **Tool definitions** - All MCP tools (git worktree, Par CLI)
- `src/worktree-manager.ts`: **Git operations** - Worktree creation/management
- `src/par-manager.ts`: **Par CLI integration** - Session and workspace management

### Enhanced Plugin Files:
- `src/enhanced-parallel-explorer.ts`: **Main plugin interface** - Orchestrates everything
- `src/mcp-integration/discovery.ts`: **Server discovery** - Finds and analyzes MCP servers
- `src/coordination/agent-orchestrator.ts`: **Multi-agent coordination** - Manages AI agents
- `src/workflow/workflow-orchestrator.ts`: **Workflow automation** - End-to-end execution

### Skill Files:
- `skills/parallel-exploration/SKILL.md`: **Complete workflow documentation**
- `skills/parallel-exploration/integrate.js`: **Integration layer** - Node.js API and CLI
- `skills/parallel-exploration/README.md`: **Quick start guide**
- `skills/parallel-exploration/examples.md`: **Usage examples**
- `skills/parallel-exploration/commands.md`: **Command reference**

## 🔍 Quick Navigation

### For Users:
- **Start here**: `skills/parallel-exploration/README.md`
- **Complete guide**: `skills/parallel-exploration/SKILL.md`
- **Examples**: `skills/parallel-exploration/examples.md`

### For Developers:
- **Core implementation**: `src/index.ts`
- **Plugin interface**: `src/enhanced-parallel-explorer.ts`
- **MCP integration**: `src/mcp-integration/discovery.ts`
- **Agent coordination**: `src/coordination/agent-orchestrator.ts`

### For Deployment:
- **Deployment guide**: `DEPLOYMENT_GUIDE.md`
- **Implementation plan**: `PLUGIN_IMPLEMENTATION_PLAN.md`
- **Production builds**: `dist/` directory

## 🎯 Key Relationships

1. **Skill** uses **Plugin** (via `integrate.js`)
2. **Plugin** uses **MCP Discovery** to find servers
3. **Plugin** uses **Agent Orchestration** for coordination
4. **Plugin** uses **Workflow Automation** for execution
5. **All components** use **MCP Server** for git operations
6. **MCP Server** provides the foundational tools

## 📦 Deployment Units

### MCP Server Package:
```
dist/
├── index.js              # Main server
├── tools.js              # MCP tools
├── worktree-manager.js   # Git operations
└── par-manager.js        # Par CLI integration
```

### Plugin Package:
```
src/
├── enhanced-parallel-explorer.ts    # Main plugin
├── mcp-integration/discovery.ts     # Server discovery
├── coordination/agent-orchestrator.ts # Agent coordination
└── workflow/workflow-orchestrator.ts # Workflow automation
```

### Skill Package:
```
skills/parallel-exploration/
├── SKILL.md              # Complete workflow
├── integrate.js           # Integration layer
├── README.md             # Quick start
├── examples.md           # Usage examples
└── commands.md           # Command reference
```

This structure provides clear separation of concerns while maintaining tight integration between all components.