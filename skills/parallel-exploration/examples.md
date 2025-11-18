# Parallel Exploration Examples

## Quick Start Examples

### 1. Algorithm Optimization
```bash
/parallel-explore "optimize sorting algorithm for large datasets"
```

**Expected Approaches**:
- Performance-optimized QuickSort with median-of-three pivot
- Parallel MergeSort with memory efficiency
- Hybrid adaptive sort (Introsort-style)

### 2. API Design
```bash
/parallel-explore "design user authentication API"
```

**Expected Approaches**:
- REST with JWT tokens and refresh mechanism
- GraphQL with role-based access control
- gRPC with Protocol Buffers and mTLS

### 3. Database Optimization
```bash
/parallel-explore "optimize slow database queries reporting system"
```

**Expected Approaches**:
- Indexing strategy and query rewriting
- Caching layer with Redis implementation
- Database sharding and connection pooling

## Custom Approach Examples

### Performance vs Security Trade-off
```bash
/parallel-explore "user login system" 3 \
  "High-performance JWT with minimal validation" \
  "Security-first approach with comprehensive checks" \
  "Balanced approach with adaptive security"
```

### Architecture Patterns
```bash
/parallel-explore "microservice communication" 4 \
  "Event-driven architecture with message queues" \
  "Direct API calls with circuit breakers" \
  "Service mesh with Istio" \
  "Hybrid approach combining multiple patterns"
```

## Code Integration Examples

### Basic Usage
```typescript
import { EnhancedParallelExplorer } from './src/enhanced-parallel-explorer.js'

const explorer = new EnhancedParallelExplorer()

// Quick exploration with automatic approach generation
const result = await explorer.quickExplore('implement fast cache system')
console.log(`Completed in ${result.totalDuration}ms`)
console.log(`Selected approach: ${result.synthesis.selectedApproach}`)
```

### Custom Approaches
```typescript
const customApproaches = [
  {
    name: 'Redis Implementation',
    description: 'Use Redis for distributed caching',
    strategy: 'Focus on performance and scalability',
    category: 'cache',
    tools: ['redis-connect', 'benchmark'],
    agentRole: 'performance-optimizer'
  },
  {
    name: 'In-Memory Cache',
    description: 'Lightweight in-process caching',
    strategy: 'Minimize external dependencies',
    category: 'cache',
    tools: ['memory-management', 'lru-cache'],
    agentRole: 'generalist'
  },
  {
    name: 'Hybrid Approach',
    description: 'Combine Redis with local cache layers',
    strategy: 'Balance performance and complexity',
    category: 'cache',
    tools: ['redis', 'memory', 'synchronization'],
    agentRole: 'architecture-designer'
  }
]

const result = await explorer.executeWithPredefinedApproaches(
  'cache-implementation',
  'Create efficient caching solution',
  customApproaches,
  {
    timeout: 45, // 45 minutes
    preserveArtifacts: true,
    autoCleanup: false
  }
)
```

### Advanced Configuration
```typescript
const result = await explorer.executeParallelExploration(
  'api-rate-limiter',
  'Implement API rate limiting with different strategies',
  4, // 4 approaches
  {
    timeout: 60, // 1 hour
    parallelism: 4, // Run all 4 in parallel
    preserveArtifacts: true,
    autoCleanup: true,
    preferredMCPServers: ['redis-mcp', 'security-mcp', 'performance-mcp'],
    notifyOnCompletion: true
  }
)

// Monitor progress
explorer.on('workflow-completed', (result) => {
  console.log('Parallel exploration completed!')
  console.log(`Best approach: ${result.synthesis.selectedApproach}`)
  console.log(`Confidence: ${result.synthesis.confidence}`)
})
```

## Real-World Scenarios

### E-commerce Product Search
```bash
/parallel-explore "implement fast product search for e-commerce catalog"
```

**Generated Approaches**:
1. **Elasticsearch Implementation** - Full-text search with faceting
2. **Database Index Optimization** - Advanced SQL indexing strategies
3. **Hybrid Search** - Combine database with search engine
4. **In-Memory Search** - Redis-based search for popular products

### Mobile App Performance
```bash
/parallel-explore "optimize mobile app startup time and responsiveness"
```

**Generated Approaches**:
1. **Code Splitting** - Lazy loading and bundle optimization
2. **Native Modules** - Performance-critical code in native
3. **Caching Strategy** - Aggressive local caching
4. **Asset Optimization** - Image and resource optimization

### Security Implementation
```bash
/parallel-explore "implement secure file upload system"
```

**Generated Approaches**:
1. **Security-First** - Comprehensive validation and scanning
2. **Performance-Optimized** - Fast uploads with essential security
3. **Cloud-Native** - Use cloud provider security services
4. **Hybrid Approach** - Balance security and user experience

## Error Handling Examples

### Timeout Handling
```typescript
try {
  const result = await explorer.quickExplore('complex task', {
    timeout: 120 // 2 hours for complex tasks
  })
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('Task took longer than expected, consider breaking into smaller parts')
  }
}
```

### MCP Server Unavailable
```typescript
// Check MCP servers before starting
const servers = await explorer.getAvailableMCPServers()
if (servers.length === 0) {
  console.log('No MCP servers available, proceeding with basic implementation')
  // Fallback to simple implementation
}
```

### Worktree Conflicts
```typescript
const result = await explorer.quickExplore('task', {
  autoCleanup: false // Disable auto cleanup to investigate
})
// Manually inspect worktrees if needed
// Then clean up with:
// git worktree prune
// rm -rf .worktree/
```

## Monitoring Examples

### Progress Tracking
```typescript
explorer.on('overall-progress', (progress) => {
  console.log(`Progress: ${progress.overallProgress}%`)
  console.log(`Active sessions: ${progress.activeSessions}`)
  console.log(`Completed: ${progress.completedSessions}`)
})

explorer.on('session-completed', (session) => {
  console.log(`Session ${session.id} completed: ${session.approach.name}`)
})

explorer.on('conflict-detected', (conflict) => {
  console.log(`Conflict: ${conflict.description}`)
})
```

### Result Analysis
```typescript
function analyzeResult(result) {
  console.log('\n=== ANALYSIS ===')
  console.log(`Total time: ${(result.totalDuration / 1000 / 60).toFixed(1)} minutes`)
  console.log(`Success rate: ${(result.metrics.sessionsCompleted / result.sessions.length * 100).toFixed(1)}%`)

  if (result.synthesis) {
    console.log(`\nSelected approach: ${result.synthesis.selectedApproach}`)
    console.log(`Confidence: ${(result.synthesis.confidence * 100).toFixed(1)}%`)

    console.log('\nRecommendations:')
    result.synthesis.recommendations.forEach(rec => {
      console.log(`• ${rec}`)
    })
  }

  console.log('\nArtifacts created:')
  result.artifacts.forEach(artifact => {
    console.log(`• ${artifact.name} (${artifact.type})`)
  })
}
```

## Integration with Claude Desktop

### MCP Configuration
```json
{
  "mcpServers": {
    "git-worktree-mcp": {
      "command": "node",
      "args": ["./path/to/git-worktree-mcp/dist/index.js"],
      "env": {
        "PARALLEL_EXPLORATION_ENABLED": "true",
        "MCP_SERVERS": "git-worktree-mcp,security-mcp,performance-mcp"
      }
    }
  }
}
```

### Usage in Claude Desktop
```
User: I need to optimize our slow API endpoints
Claude: I'll use parallel exploration to find the best optimization approach.

[Uses parallel exploration skill]

Claude: I've dispatched 3 agents to explore different API optimization strategies:
1. Performance-optimized approach (caching, query optimization)
2. Architecture approach (microservices, load balancing)
3. Security-balanced approach (with rate limiting and monitoring)

All approaches are running in parallel with MCP server integration. I'll analyze the results and recommend the best solution.
```

## Performance Benchmarks

### Typical Execution Times
| Task Complexity | Approaches | Setup Time | Execution Time | Synthesis Time | Total Time |
|----------------|------------|------------|----------------|----------------|------------|
| Simple | 2-3 | 30s | 10-15 min | 2-3 min | 15-20 min |
| Medium | 3-4 | 30s | 20-40 min | 5-8 min | 30-50 min |
| Complex | 4-5 | 45s | 45-90 min | 10-15 min | 60-120 min |

### Resource Usage
- **Memory**: ~200MB per agent + MCP server overhead
- **CPU**: Moderate during synthesis, light during execution
- **Disk**: ~50MB per approach for artifacts and worktrees
- **Network**: Minimal, only for MCP server communication

## Best Practices Summary

1. **Start with quick exploration** for most tasks
2. **Use custom approaches** for specific requirements
3. **Monitor progress** for long-running explorations
4. **Preserve artifacts** for learning and reference
5. **Review synthesis recommendations** thoroughly
6. **Test the final solution** before deployment

These examples demonstrate the versatility and power of parallel exploration with MCP integration.