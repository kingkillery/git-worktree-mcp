/**
 * MCP Server Discovery and Integration System
 *
 * This module provides automatic discovery and intelligent integration
 * with available MCP servers in the environment.
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface MCPServerInfo {
  name: string
  version: string
  capabilities: MCPServerCapabilities
  available: boolean
  lastChecked: Date
}

export interface MCPServerCapabilities {
  tools: string[]
  resources: string[]
  categories: ServerCategory[]
  performance: PerformanceProfile
}

export interface ServerCategory {
  name: string
  tools: string[]
  description: string
}

export interface PerformanceProfile {
  responseTime: number
  reliability: number
  throughput: number
}

export interface TaskRequirement {
  category: string
  tools: string[]
  priority: 'high' | 'medium' | 'low'
}

/**
 * Auto-discovers available MCP servers and analyzes their capabilities
 */
export class MCPServerDiscovery {
  private servers: Map<string, MCPServerInfo> = new Map()
  private readonly DISCOVERY_TIMEOUT = 5000 // 5 seconds

  constructor() {
    this.initializeDiscovery()
  }

  /**
   * Initialize the discovery system
   */
  private async initializeDiscovery(): Promise<void> {
    try {
      await this.discoverAvailableServers()
      setInterval(() => this.refreshServerStatus(), 30000) // Refresh every 30 seconds
    } catch (error) {
      console.warn('Failed to initialize MCP server discovery:', error)
    }
  }

  /**
   * Discover all available MCP servers in the environment
   */
  async discoverAvailableServers(): Promise<MCPServerInfo[]> {
    const discoveryMethods = [
      this.discoverViaMCPList,
      this.discoverViaEnvironmentVariables,
      this.discoverViaConfigFiles,
      this.discoverViaDefaultServers
    ]

    const discoveryPromises = discoveryMethods.map(method =>
      method().catch(error => {
        console.warn('Discovery method failed:', error)
        return []
      })
    )

    const results = await Promise.all(discoveryPromises)
    const allServers = results.flat()

    // Deduplicate and analyze servers
    const uniqueServers = this.deduplicateServers(allServers)

    // Analyze capabilities for each server
    for (const server of uniqueServers) {
      try {
        server.capabilities = await this.analyzeServerCapabilities(server.name)
        server.available = await this.testServerAvailability(server.name)
        server.lastChecked = new Date()
        this.servers.set(server.name, server)
      } catch (error) {
        console.warn(`Failed to analyze server ${server.name}:`, error)
      }
    }

    return Array.from(this.servers.values())
  }

  /**
   * Discover servers via MCP list command
   */
  private async discoverViaMCPList(): Promise<MCPServerInfo[]> {
    try {
      const { stdout } = await execAsync('mcp list', { timeout: this.DISCOVERY_TIMEOUT })
      const lines = stdout.trim().split('\n')
      return lines.map(line => this.parseServerLine(line)).filter(Boolean)
    } catch {
      return []
    }
  }

  /**
   * Discover servers via environment variables
   */
  private async discoverViaEnvironmentVariables(): Promise<MCPServerInfo[]> {
    const servers: MCPServerInfo[] = []

    // Check for MCP_SERVERS environment variable
    const envServers = process.env.MCP_SERVERS
    if (envServers) {
      const serverNames = envServers.split(',').map(s => s.trim())
      for (const name of serverNames) {
        servers.push({
          name,
          version: 'unknown',
          capabilities: { tools: [], resources: [], categories: [], performance: { responseTime: 0, reliability: 0, throughput: 0 } },
          available: false,
          lastChecked: new Date()
        })
      }
    }

    return servers
  }

  /**
   * Discover servers via configuration files
   */
  private async discoverViaConfigFiles(): Promise<MCPServerInfo[]> {
    // Implementation would check .mcp.json, claude_desktop_config.json, etc.
    // For now, return empty array
    return []
  }

  /**
   * Include default well-known servers
   */
  private async discoverViaDefaultServers(): Promise<MCPServerInfo[]> {
    return [
      {
        name: 'git-worktree-mcp',
        version: '1.0.0',
        capabilities: {
          tools: ['create_feature_worktree', 'list_worktrees', 'cleanup_worktree'],
          resources: [],
          categories: [{ name: 'git', tools: ['create_feature_worktree', 'list_worktrees', 'cleanup_worktree'], description: 'Git worktree management' }],
          performance: { responseTime: 100, reliability: 0.95, throughput: 10 }
        },
        available: false,
        lastChecked: new Date()
      },
      {
        name: 'file-organizer-mcp',
        version: '1.0.0',
        capabilities: {
          tools: ['organize_files', 'analyze_structure'],
          resources: [],
          categories: [{ name: 'file-management', tools: ['organize_files', 'analyze_structure'], description: 'File organization and analysis' }],
          performance: { responseTime: 200, reliability: 0.90, throughput: 5 }
        },
        available: false,
        lastChecked: new Date()
      }
    ]
  }

  /**
   * Parse server information from command line output
   */
  private parseServerLine(line: string): MCPServerInfo | null {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 2) return null

    return {
      name: parts[0],
      version: parts[1] || 'unknown',
      capabilities: { tools: [], resources: [], categories: [], performance: { responseTime: 0, reliability: 0, throughput: 0 } },
      available: false,
      lastChecked: new Date()
    }
  }

  /**
   * Remove duplicate server entries
   */
  private deduplicateServers(servers: MCPServerInfo[]): MCPServerInfo[] {
    const seen = new Set<string>()
    return servers.filter(server => {
      if (seen.has(server.name)) return false
      seen.add(server.name)
      return true
    })
  }

  /**
   * Analyze server capabilities by querying the server
   */
  private async analyzeServerCapabilities(serverName: string): Promise<MCPServerCapabilities> {
    try {
      // Try to get server capabilities via MCP tools
      const { stdout } = await execAsync(`mcp tools ${serverName}`, { timeout: 3000 })

      const tools = this.parseToolsOutput(stdout)
      const categories = this.categorizeTools(tools)

      return {
        tools,
        resources: [], // Would need separate query
        categories,
        performance: {
          responseTime: Math.random() * 500 + 50, // Mock performance data
          reliability: 0.9 + Math.random() * 0.1,
          throughput: Math.floor(Math.random() * 20) + 1
        }
      }
    } catch (error) {
      return {
        tools: [],
        resources: [],
        categories: [],
        performance: { responseTime: 0, reliability: 0, throughput: 0 }
      }
    }
  }

  /**
   * Parse tools from MCP tools command output
   */
  private parseToolsOutput(output: string): string[] {
    const lines = output.trim().split('\n')
    return lines
      .filter(line => line.trim() && !line.startsWith('Available tools:'))
      .map(line => line.trim().split(/\s+/)[0])
      .filter(tool => tool && tool.length > 0)
  }

  /**
   * Categorize tools based on their names and patterns
   */
  private categorizeTools(tools: string[]): ServerCategory[] {
    const categories: Map<string, string[]> = new Map()

    for (const tool of tools) {
      let category = 'general'

      if (tool.includes('git') || tool.includes('worktree')) {
        category = 'git'
      } else if (tool.includes('file') || tool.includes('organize')) {
        category = 'file-management'
      } else if (tool.includes('test') || tool.includes('benchmark')) {
        category = 'testing'
      } else if (tool.includes('deploy') || tool.includes('build')) {
        category = 'deployment'
      } else if (tool.includes('search') || tool.includes('fetch')) {
        category = 'data-retrieval'
      }

      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(tool)
    }

    return Array.from(categories.entries()).map(([name, tools]) => ({
      name,
      tools,
      description: this.getCategoryDescription(name)
    }))
  }

  /**
   * Get description for a category
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'git': 'Git repository and worktree management',
      'file-management': 'File organization and structure analysis',
      'testing': 'Test execution and benchmarking',
      'deployment': 'Build and deployment operations',
      'data-retrieval': 'Information gathering and search capabilities',
      'general': 'General purpose tools and utilities'
    }
    return descriptions[category] || 'Miscellaneous tools and capabilities'
  }

  /**
   * Test if a server is available and responsive
   */
  private async testServerAvailability(serverName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`mcp ping ${serverName}`, { timeout: 2000 })
      return stdout.includes('pong') || stdout.includes('available')
    } catch {
      return false
    }
  }

  /**
   * Refresh the status of all known servers
   */
  private async refreshServerStatus(): Promise<void> {
    for (const [name, server] of this.servers) {
      try {
        server.available = await this.testServerAvailability(name)
        server.lastChecked = new Date()
      } catch (error) {
        server.available = false
        console.warn(`Failed to refresh status for server ${name}:`, error)
      }
    }
  }

  /**
   * Get the best server for a specific task
   */
  async getBestServerForTask(requirements: TaskRequirement): Promise<MCPServerInfo | null> {
    const availableServers = Array.from(this.servers.values())
      .filter(server => server.available && server.capabilities.categories.length > 0)

    if (availableServers.length === 0) return null

    // Score servers based on task requirements
    let bestServer = availableServers[0]
    let bestScore = this.scoreServerForTask(availableServers[0], requirements)

    for (const server of availableServers.slice(1)) {
      const score = this.scoreServerForTask(server, requirements)
      if (score > bestScore) {
        bestScore = score
        bestServer = server
      }
    }

    return bestScore > 0 ? bestServer : null
  }

  /**
   * Score a server based on how well it matches task requirements
   */
  private scoreServerForTask(server: MCPServerInfo, requirements: TaskRequirement): number {
    let score = 0

    // Check if server has the required category
    const category = server.capabilities.categories.find(cat => cat.name === requirements.category)
    if (!category) return 0

    score += 50 // Base score for having the right category

    // Check for required tools
    const availableTools = new Set(server.capabilities.tools)
    const requiredTools = requirements.tools

    let toolMatches = 0
    for (const tool of requiredTools) {
      if (availableTools.has(tool)) {
        toolMatches++
      }
    }

    if (requiredTools.length > 0) {
      score += (toolMatches / requiredTools.length) * 40
    }

    // Add performance bonus
    const performance = server.capabilities.performance
    score += (1 - performance.responseTime / 1000) * 5 // Response time bonus
    score += performance.reliability * 5 // Reliability bonus

    return score
  }

  /**
   * Get all available servers
   */
  getAllServers(): MCPServerInfo[] {
    return Array.from(this.servers.values())
  }

  /**
   * Get servers by category
   */
  getServersByCategory(category: string): MCPServerInfo[] {
    return Array.from(this.servers.values()).filter(server =>
      server.capabilities.categories.some(cat => cat.name === category)
    )
  }
}