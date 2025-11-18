#!/usr/bin/env node

/**
 * Parallel Exploration Skill Integration Script
 *
 * This script integrates the Parallel Exploration skill with the enhanced plugin,
 * providing easy access to all skill functionality.
 */

const { EnhancedParallelExplorer } = require('../../src/enhanced-parallel-explorer')
const path = require('path')

class ParallelExplorationSkill {
  constructor() {
    this.explorer = new EnhancedParallelExplorer()
    this.setupEventHandlers()
  }

  /**
   * Setup event handlers for progress tracking
   */
  setupEventHandlers() {
    this.explorer.on('exploration-completed', (result) => {
      console.log('\n🎉 Parallel exploration completed successfully!')
      this.printSummary(result)
    })

    this.explorer.on('exploration-failed', (result, error) => {
      console.error('\n❌ Parallel exploration failed:', error.message)
      this.printSummary(result)
    })
  }

  /**
   * Execute parallel exploration with task description
   */
  async explore(taskDescription, options = {}) {
    console.log(`🚀 Starting parallel exploration: ${taskDescription}`)
    console.log(`📊 Options:`, options)
    console.log('')

    try {
      const result = await this.explorer.quickExplore(taskDescription, options)
      return result
    } catch (error) {
      console.error('Exploration failed:', error)
      throw error
    }
  }

  /**
   * Execute with custom approaches
   */
  async exploreWithApproaches(taskName, taskDescription, approaches, options = {}) {
    console.log(`🎯 Starting parallel exploration with ${approaches.length} custom approaches`)
    console.log(`📝 Task: ${taskDescription}`)
    console.log('')

    try {
      const result = await this.explorer.executeWithPredefinedApproaches(
        taskName,
        taskDescription,
        approaches,
        options
      )
      return result
    } catch (error) {
      console.error('Custom exploration failed:', error)
      throw error
    }
  }

  /**
   * Print exploration summary
   */
  printSummary(result) {
    console.log('\n📊 ===== EXPLORATION SUMMARY =====')
    console.log(`🆔 Workflow ID: ${result.workflowId}`)
    console.log(`⏱️ Duration: ${(result.totalDuration! / 1000 / 60).toFixed(1)} minutes`)
    console.log(`✅ Completed: ${result.metrics.sessionsCompleted}`)
    console.log(`❌ Failed: ${result.metrics.sessionsFailed}`)
    console.log(`🎯 Success Rate: ${(result.metrics.sessionsCompleted / (result.metrics.sessionsCompleted + result.metrics.sessionsFailed) * 100).toFixed(1)}%`)

    if (result.synthesis) {
      console.log(`\n🏆 Best Approach: ${result.synthesis.selectedApproach}`)
      console.log(`📈 Confidence: ${(result.synthesis.confidence * 100).toFixed(1)}%`)

      if (result.synthesis.recommendations.length > 0) {
        console.log('\n💡 Recommendations:')
        result.synthesis.recommendations.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec}`)
        })
      }
    }

    console.log(`\n📁 Artifacts Created: ${result.artifacts.length}`)
    result.artifacts.forEach((artifact, i) => {
      console.log(`   ${i + 1}. ${artifact.name} (${artifact.type})`)
    })

    console.log('\n🔧 MCP Servers Utilized:')
    const servers = new Set(result.sessions.map(s => s.mcpIntegration.server.name))
    servers.forEach(server => {
      console.log(`   • ${server}`)
    })

    console.log('=====================================\n')
  }

  /**
   * Get available MCP servers
   */
  async getMCPServers() {
    return await this.explorer.getAvailableMCPServers()
  }

  /**
   * Quick demo of the skill
   */
  async demo() {
    console.log('🎭 Parallel Exploration Skill Demo')
    console.log('===================================\n')

    // Show available MCP servers
    console.log('🔍 Discovering MCP servers...')
    const servers = await this.getMCPServers()
    console.log(`Found ${servers.length} MCP servers:`)
    servers.forEach(server => {
      console.log(`   • ${server.name} v${server.version} (${server.available ? '✅' : '❌'})`)
    })

    if (servers.length === 0) {
      console.log('\n⚠️ No MCP servers found. Some features may be limited.')
    }

    console.log('\n💡 Usage Examples:')
    console.log('   await skill.explore("optimize sorting algorithm")')
    console.log('   await skill.explore("design user authentication API")')
    console.log('   await skill.explore("improve web application performance")')

    console.log('\n📚 For more examples, see: skills/parallel-exploration/examples.md')
    console.log('🔧 For command reference, see: skills/parallel-exploration/commands.md')
  }
}

// CLI interface
if (require.main === module) {
  const skill = new ParallelExplorationSkill()

  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Run demo
    skill.demo()
  } else if (args[0] === 'demo') {
    skill.demo()
  } else if (args[0] === 'servers') {
    skill.getMCPServers().then(servers => {
      console.log('Available MCP Servers:')
      servers.forEach(server => {
        console.log(`   • ${server.name} v${server.version} (${server.available ? 'available' : 'unavailable'})`)
      })
    })
  } else {
    // Treat first argument as task description
    const taskDescription = args.join(' ')
    skill.explore(taskDescription, {
      timeout: 30, // 30 minutes for demo
      preserveArtifacts: true
    }).catch(error => {
      console.error('Demo failed:', error)
      process.exit(1)
    })
  }
}

module.exports = { ParallelExplorationSkill }

// Export for easy importing
global.ParallelExplorationSkill = ParallelExplorationSkill