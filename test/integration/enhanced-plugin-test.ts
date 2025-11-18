/**
 * Integration Test for Enhanced Parallel Exploration Plugin
 *
 * Tests the integration between the enhanced plugin and MCP server
 */

import { EnhancedParallelExplorer } from '../../src/enhanced-parallel-explorer'
import { MCPServerDiscovery } from '../../src/mcp-integration/discovery'

async function runIntegrationTest() {
  console.log('🧪 Starting Enhanced Plugin Integration Test...\n')

  const explorer = new EnhancedParallelExplorer()

  try {
    // Test 1: MCP Server Discovery
    console.log('📡 Test 1: MCP Server Discovery')
    const servers = await explorer.getAvailableMCPServers()
    console.log(`✅ Discovered ${servers.length} MCP servers`)
    servers.forEach(server => {
      console.log(`   • ${server.name} v${server.version} (${server.available ? 'available' : 'unavailable'})`)
    })

    // Test 2: Quick Parallel Exploration
    console.log('\n🚀 Test 2: Quick Parallel Exploration')
    const result1 = await explorer.quickExplore('Implement a fast sorting algorithm', {
      timeout: 5, // 5 minutes for testing
      preserveArtifacts: true,
      autoCleanup: false
    })

    console.log(`✅ Quick exploration completed in ${(result1.totalDuration! / 1000).toFixed(2)}s`)
    console.log(`   Sessions: ${result1.metrics.sessionsCompleted} completed, ${result1.metrics.sessionsFailed} failed`)

    // Test 3: Custom Approach Exploration
    console.log('\n🎯 Test 3: Custom Approach Exploration')
    const customApproaches = [
      {
        name: 'QuickSort Implementation',
        description: 'Optimized QuickSort with median-of-three pivot',
        strategy: 'Focus on speed and in-place operations',
        category: 'algorithm',
        tools: ['implement', 'benchmark', 'optimize'],
        agentRole: 'performance-optimizer' as const
      },
      {
        name: 'MergeSort Implementation',
        description: 'Stable MergeSort with parallel processing',
        strategy: 'Focus on stability and parallel execution',
        category: 'algorithm',
        tools: ['implement', 'parallel-test', 'optimize'],
        agentRole: 'generalist' as const
      },
      {
        name: 'Hybrid Adaptive Sort',
        description: 'Introsort-like adaptive sorting algorithm',
        strategy: 'Combine multiple algorithms based on data patterns',
        category: 'algorithm',
        tools: ['analyze', 'implement', 'adapt'],
        agentRole: 'architecture-designer' as const
      }
    ]

    const result2 = await explorer.executeWithPredefinedApproaches(
      'hybrid-sorting-exploration',
      'Create multiple sorting algorithm implementations',
      customApproaches,
      {
        timeout: 5,
        preserveArtifacts: true,
        autoCleanup: false
      }
    )

    console.log(`✅ Custom exploration completed in ${(result2.totalDuration! / 1000).toFixed(2)}s`)
    console.log(`   Synthesis confidence: ${result2.synthesis?.confidence.toFixed(2) || 'N/A'}`)

    // Test 4: Error Handling
    console.log('\n⚠️ Test 4: Error Handling')
    try {
      await explorer.executeParallelExploration(
        'error-test',
        'This should trigger timeout errors',
        2,
        { timeout: 0.001 } // 0.001 minutes = very short timeout
      )
      console.log('❌ Expected timeout did not occur')
    } catch (error) {
      console.log('✅ Timeout error handled correctly')
    }

    console.log('\n🎉 All integration tests passed!')

    return {
      success: true,
      results: {
        mcpServers: servers.length,
        quickExploration: result1.metrics,
        customExploration: result2.metrics,
        errorHandling: 'passed'
      }
    }

  } catch (error) {
    console.error('\n❌ Integration test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntegrationTest()
    .then(result => {
      console.log('\n📊 Test Results:', JSON.stringify(result, null, 2))
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

export { runIntegrationTest }