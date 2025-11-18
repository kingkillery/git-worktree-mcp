# Parallel Exploration Commands

## Quick Start Commands

### Basic Parallel Exploration
```bash
# Quick exploration with automatic approach generation
/parallel-explore "your task description"

# Example: Optimize sorting algorithm
/parallel-explore "optimize sorting algorithm for large datasets"

# Example: Design authentication system
/parallel-explore "create secure user authentication system"
```

### Custom Approaches
```bash
# Define specific approaches
/parallel-explore "task name" 3 "approach 1 description" "approach 2 description" "approach 3 description"

# Example: API design with specific strategies
/parallel-explore "user management API" 3 \
  "REST with JWT tokens and refresh mechanism" \
  "GraphQL with role-based access control" \
  "gRPC with Protocol Buffers and mTLS"
```

### Advanced Usage
```bash
# With custom options
/parallel-explore "complex task" 4 \
  "performance approach" \
  "security approach" \
  "scalability approach" \
  "maintainability approach" \
  --timeout 90 \
  --preserve-artifacts \
  --no-auto-cleanup
```

## Integration Commands

### Claude Code Integration
```bash
# Automatic discovery and usage
claude "Use parallel exploration to optimize the database queries"

# The system will automatically:
# 1. Detect available MCP servers
# 2. Generate appropriate approaches
# 3. Execute parallel exploration
# 4. Synthesize results
```

### Programmatic Usage
```bash
# Using Node.js API
node -e "
const { EnhancedParallelExplorer } = require('./src/enhanced-parallel-explorer');
const explorer = new EnhancedParallelExplorer();
explorer.quickExplore('optimize API performance').then(console.log);
"
```

## MCP Server Commands

### Server Discovery
```bash
# List available MCP servers
mcp list

# Check server connectivity
mcp ping git-worktree-mcp

# Get server capabilities
mcp tools git-worktree-mcp
```

### Environment Setup
```bash
# Set MCP servers for discovery
export MCP_SERVERS="git-worktree-mcp,security-mcp,performance-mcp"

# Configure parallel exploration
export PARALLEL_EXPLORATION_TIMEOUT=60
export PARALLEL_EXPLORATION_MAX_AGENTS=5
export PARALLEL_EXPLORATION_AUTO_CLEANUP=true
```

## Workflow Management Commands

### Status Monitoring
```bash
# List active workflows
node -e "
const { WorkflowOrchestrator } = require('./src/workflow/workflow-orchestrator');
const orchestrator = new WorkflowOrchestrator();
console.log(orchestrator.getActiveWorkflows());
"

# Check workflow status
node -e "
const orchestrator = new WorkflowOrchestrator();
const status = orchestrator.getWorkflowStatus('workflow-id');
console.log(status);
"
```

### Artifact Management
```bash
# Generate exploration report
node scripts/generate-report.js --workflow-id workflow-id

# Clean up artifacts
node scripts/cleanup-artifacts.js --older-than 7d

# Export results
node scripts/export-results.js --format json --output results.json
```

## Development Commands

### Building and Testing
```bash
# Build the project
npm run build

# Run integration tests
npm run test:integration

# Test MCP server functionality
npm run test:mcp

# Test plugin integration
npm run test:plugin
```

### Development Server
```bash
# Start MCP server for testing
npm run dev:server

# Start with debug logging
DEBUG=parallel-exploration:* npm run dev

# Test specific functionality
npm run test -- --grep "parallel exploration"
```

## Troubleshooting Commands

### Debug Information
```bash
# Check system status
node scripts/status-check.js

# Verify MCP integration
node scripts/test-mcp-integration.js

# Diagnose workflow issues
node scripts/diagnose-workflow.js --workflow-id workflow-id
```

### Cleanup Commands
```bash
# Clean up orphaned worktrees
git worktree prune

# Remove temporary files
rm -rf .worktree/tmp/

# Reset workflow state
rm -rf .worktree/workflows/
```

### Recovery Commands
```bash
# Recover interrupted workflow
node scripts/recover-workflow.js --workflow-id workflow-id

# Restore from backup
node scripts/restore-backup.js --backup-id backup-id

# Validate installation
node scripts/validate-installation.js
```

## Configuration Commands

### Configuration Files
```bash
# Create default configuration
node scripts/create-config.js

# Validate configuration
node scripts/validate-config.js

# Update configuration
node scripts/update-config.js --key timeout --value 120
```

### Environment Setup
```bash
# Initialize development environment
npm run setup:dev

# Configure MCP servers
npm run config:mcp-servers

# Set up logging
npm run config:logging
```

## Performance Commands

### Benchmarking
```bash
# Run performance benchmarks
npm run benchmark

# Test MCP server performance
npm run benchmark:mcp

# Analyze workflow performance
npm run benchmark:workflow
```

### Optimization
```bash
# Optimize for your system
npm run optimize:system

# Profile memory usage
npm run profile:memory

# Analyze performance bottlenecks
npm run analyze:performance
```

## Deployment Commands

### Production Deployment
```bash
# Build for production
npm run build:prod

# Deploy to production
npm run deploy:prod

# Verify deployment
npm run verify:deployment
```

### Monitoring
```bash
# Check production status
npm run status:prod

# Monitor performance
npm run monitor:performance

# Generate health report
npm run health:report
```

## Usage Examples by Scenario

### Algorithm Development
```bash
# Optimize sorting algorithm
/parallel-explore "optimize sorting algorithm for mixed data types"

# Compare data structures
/parallel-explore "implement efficient graph traversal" 3 \
  "DFS with stack optimization" \
  "BFS with queue optimization" \
  "Hybrid approach with heuristics"
```

### API Development
```bash
# Design REST API
/parallel-explore "design user management REST API"

# Compare API styles
/parallel-explore "design file upload API" 3 \
  "REST with multipart/form-data" \
  "GraphQL with file uploads" \
  "gRPC with streaming uploads"
```

### Database Optimization
```bash
# Query optimization
/parallel-explore "optimize slow reporting queries"

# Schema design
/parallel-explore "design scalable user database schema" 3 \
  "Normalized relational design" \
  "Denormalized for performance" \
  "Hybrid with caching layer"
```

### Security Implementation
```bash
# Authentication system
/parallel-explore "implement secure authentication system"

# Data protection
/parallel-explore "implement data encryption strategy" 3 \
  "Client-side encryption" \
  "Server-side encryption" \
  "Hybrid encryption approach"
```

### Performance Optimization
```bash
# Web app performance
/parallel-explore "optimize web application loading time"

# Memory optimization
/parallel-explore "reduce memory usage in data processing pipeline"
```

## Quick Reference

### Most Common Commands
```bash
# Quick start (90% of use cases)
/parallel-explore "your task description"

# Custom approaches (specific requirements)
/parallel-explore "task" 3 "approach 1" "approach 2" "approach 3"

# Check status
mcp list
git worktree list

# Clean up
git worktree prune
npm run cleanup
```

### Command Options
| Option | Description | Default |
|--------|-------------|---------|
| `--timeout N` | Timeout in minutes | 60 |
| `--preserve-artifacts` | Keep approach artifacts | false |
| `--no-auto-cleanup` | Disable automatic cleanup | false |
| `--parallelism N` | Max parallel agents | auto |
| `--mcp-servers list` | Preferred MCP servers | auto-discover |
| `--notify` | Notify on completion | false |

These commands provide comprehensive control over the parallel exploration workflow, from quick usage to advanced configuration and troubleshooting.