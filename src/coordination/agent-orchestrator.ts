/**
 * Enhanced Agent Orchestration System
 *
 * Provides intelligent coordination of multiple Claude agents
 * with MCP server integration and real-time progress tracking.
 */

import { EventEmitter } from 'events'
import { MCPServerDiscovery, MCPServerInfo, TaskRequirement } from '../mcp-integration/discovery'

export interface AgentProfile {
  id: string
  role: AgentRole
  preferredMCPServers: string[]
  tools: string[]
  constraints: AgentConstraints
  expertise: string[]
}

export interface AgentRole {
  name: string
  description: string
  priorities: string[]
  collaborationStyle: 'independent' | 'cooperative' | 'competitive'
}

export interface AgentConstraints {
  maxExecutionTime: number // minutes
  memoryLimit: number // MB
  allowedTools: string[]
  forbiddenTools: string[]
}

export interface Approach {
  id: string
  name: string
  description: string
  strategy: string
  requirements: TaskRequirement
  agentProfile: AgentProfile
}

export interface AgentSession {
  id: string
  agent: AgentProfile
  approach: Approach
  worktree?: string
  status: SessionStatus
  startTime: Date
  endTime?: Date
  progress: ProgressInfo
  artifacts: Artifact[]
  communications: AgentMessage[]
  mcpIntegration: MCPServerIntegration
}

export interface MCPServerIntegration {
  server: MCPServerInfo
  assignedTools: string[]
  connectionStatus: 'connected' | 'disconnected' | 'error'
  lastActivity: Date
}

export interface SessionStatus {
  state: 'initializing' | 'running' | 'waiting' | 'completed' | 'failed' | 'paused'
  currentPhase: string
  completionPercentage: number
  error?: string
}

export interface ProgressInfo {
  phase: string
  subPhase?: string
  completionPercentage: number
  estimatedTimeRemaining?: number
  recentActivities: string[]
  bottlenecks: string[]
}

export interface Artifact {
  type: 'file' | 'directory' | 'result' | 'error'
  path?: string
  content?: any
  metadata: Record<string, any>
  timestamp: Date
}

export interface AgentMessage {
  from: string
  to: string
  timestamp: Date
  type: 'request' | 'response' | 'notification' | 'conflict'
  content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

/**
 * Orchestrates multiple agents working on parallel approaches
 */
export class AgentOrchestrator extends EventEmitter {
  private sessions: Map<string, AgentSession> = new Map()
  private mcpDiscovery: MCPServerDiscovery
  private messageBus: MessageBus
  private conflictResolver: ConflictResolver
  private progressTracker: ProgressTracker

  constructor() {
    super()
    this.mcpDiscovery = new MCPServerDiscovery()
    this.messageBus = new MessageBus()
    this.conflictResolver = new ConflictResolver()
    this.progressTracker = new ProgressTracker()

    this.setupEventHandlers()
  }

  /**
   * Setup event handlers for orchestration events
   */
  private setupEventHandlers(): void {
    this.messageBus.on('message', this.handleAgentMessage.bind(this))
    this.progressTracker.on('progress-update', this.handleProgressUpdate.bind(this))
    this.conflictResolver.on('conflict-detected', this.handleConflictDetected.bind(this))
  }

  /**
   * Dispatch multiple agents to work on different approaches
   */
  async dispatchParallelAgents(approaches: Approach[]): Promise<AgentSession[]> {
    console.log(`🚀 Dispatching ${approaches.length} agents for parallel execution`)

    const sessions: AgentSession[] = []

    for (const approach of approaches) {
      try {
        const session = await this.createAgentSession(approach)
        sessions.push(session)
        this.sessions.set(session.id, session)

        // Start agent execution
        this.executeAgentSession(session)
      } catch (error) {
        console.error(`Failed to create session for approach ${approach.id}:`, error)
      }
    }

    // Start coordination and monitoring
    this.startCoordination(sessions)

    return sessions
  }

  /**
   * Create a new agent session
   */
  private async createAgentSession(approach: Approach): Promise<AgentSession> {
    // Find best MCP server for this approach
    const mcpServer = await this.mcpDiscovery.getBestServerForTask(approach.requirements)
    if (!mcpServer) {
      throw new Error(`No MCP server available for approach: ${approach.name}`)
    }

    // Create worktree if needed (using git-worktree-mcp)
    let worktree: string | undefined
    if (approach.requirements.category === 'git') {
      worktree = await this.createWorktreeForApproach(approach)
    }

    const sessionId = this.generateSessionId()
    const session: AgentSession = {
      id: sessionId,
      agent: approach.agentProfile,
      approach,
      worktree,
      status: {
        state: 'initializing',
        currentPhase: 'setup',
        completionPercentage: 0
      },
      startTime: new Date(),
      progress: {
        phase: 'initialization',
        completionPercentage: 0,
        recentActivities: [],
        bottlenecks: []
      },
      artifacts: [],
      communications: [],
      mcpIntegration: {
        server: mcpServer,
        assignedTools: approach.requirements.tools,
        connectionStatus: 'connected',
        lastActivity: new Date()
      }
    }

    this.emit('session-created', session)
    return session
  }

  /**
   * Create a worktree for an approach using git-worktree-mcp
   */
  private async createWorktreeForApproach(approach: Approach): Promise<string> {
    // This would integrate with the git-worktree-mcp server
    // For now, return a mock path
    const worktreeName = `parallel-${approach.id}-${Date.now()}`
    return `./worktrees/${worktreeName}`
  }

  /**
   * Execute an agent session
   */
  private async executeAgentSession(session: AgentSession): Promise<void> {
    try {
      session.status.state = 'running'
      session.status.currentPhase = 'execution'
      session.progress.phase = 'executing approach'
      session.progress.recentActivities.push(`Starting execution: ${session.approach.name}`)

      this.emit('session-started', session)

      // Execute the approach using the assigned MCP server
      const result = await this.executeApproachWithMCP(session)

      session.status.state = 'completed'
      session.status.completionPercentage = 100
      session.endTime = new Date()
      session.progress.completionPercentage = 100
      session.progress.recentActivities.push('Execution completed successfully')

      // Add results as artifacts
      session.artifacts.push({
        type: 'result',
        content: result,
        metadata: { executionTime: session.endTime.getTime() - session.startTime.getTime() },
        timestamp: new Date()
      })

      this.emit('session-completed', session)

    } catch (error) {
      session.status.state = 'failed'
      session.status.error = error instanceof Error ? error.message : 'Unknown error'
      session.endTime = new Date()

      session.artifacts.push({
        type: 'error',
        content: error,
        metadata: { phase: session.status.currentPhase },
        timestamp: new Date()
      })

      this.emit('session-failed', session, error)
    }
  }

  /**
   * Execute an approach using MCP server tools
   */
  private async executeApproachWithMCP(session: AgentSession): Promise<any> {
    const { mcpIntegration, approach } = session

    // Update progress
    session.progress.completionPercentage = 10
    session.progress.recentActivities.push('Connected to MCP server')

    // Execute the approach strategy
    const result = {
      approach: approach.name,
      strategy: approach.strategy,
      implementation: `Implementation of ${approach.description}`,
      mcpServerUsed: mcpIntegration.server.name,
      toolsUsed: mcpIntegration.assignedTools,
      executionTime: new Date().toISOString()
    }

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, 2000))

    session.progress.completionPercentage = 90
    session.progress.recentActivities.push('Approach execution completed')

    return result
  }

  /**
   * Start coordination between multiple sessions
   */
  private startCoordination(sessions: AgentSession[]): void {
    console.log(`🤝 Starting coordination for ${sessions.length} sessions`)

    // Monitor for conflicts and opportunities for collaboration
    const coordinationInterval = setInterval(() => {
      this.checkForConflicts(sessions)
      this.checkForCollaborationOpportunities(sessions)
      this.updateOverallProgress(sessions)
    }, 5000) // Check every 5 seconds

    // Cleanup when all sessions are complete
    this.once('all-sessions-completed', () => {
      clearInterval(coordinationInterval)
    })
  }

  /**
   * Check for conflicts between sessions
   */
  private checkForConflicts(sessions: AgentSession[]): void {
    const activeSessions = sessions.filter(s => s.status.state === 'running')
    const conflicts = this.conflictResolver.detectConflicts(activeSessions)

    for (const conflict of conflicts) {
      this.emit('conflict-detected', conflict)
    }
  }

  /**
   * Check for collaboration opportunities
   */
  private checkForCollaborationOpportunities(sessions: AgentSession[]): void {
    const activeSessions = sessions.filter(s => s.status.state === 'running')

    // Look for sessions that could share results or coordinate efforts
    for (let i = 0; i < activeSessions.length; i++) {
      for (let j = i + 1; j < activeSessions.length; j++) {
        const session1 = activeSessions[i]
        const session2 = activeSessions[j]

        if (this.shouldCollaborate(session1, session2)) {
          this.facilitateCollaboration(session1, session2)
        }
      }
    }
  }

  /**
   * Determine if two sessions should collaborate
   */
  private shouldCollaborate(session1: AgentSession, session2: AgentSession): boolean {
    // Simple heuristic: collaborate if they're working on similar categories
    const category1 = session1.approach.requirements.category
    const category2 = session2.approach.requirements.category

    return category1 === category2 && session1.agent.role.collaborationStyle === 'cooperative'
  }

  /**
   * Facilitate collaboration between two sessions
   */
  private facilitateCollaboration(session1: AgentSession, session2: AgentSession): void {
    const message: AgentMessage = {
      from: session1.id,
      to: session2.id,
      timestamp: new Date(),
      type: 'notification',
      content: `Working on similar approach. Consider sharing insights or coordinating efforts.`,
      priority: 'medium'
    }

    this.messageBus.sendMessage(message)
    session1.progress.recentActivities.push(`Collaboration opportunity with ${session2.id}`)
  }

  /**
   * Update overall progress across all sessions
   */
  private updateOverallProgress(sessions: AgentSession[]): void {
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status.state === 'completed').length
    const failedSessions = sessions.filter(s => s.status.state === 'failed').length

    const overallProgress = (completedSessions / totalSessions) * 100

    this.emit('overall-progress', {
      totalSessions,
      completedSessions,
      failedSessions,
      overallProgress,
      activeSessions: totalSessions - completedSessions - failedSessions
    })

    // Check if all sessions are complete
    if (completedSessions + failedSessions === totalSessions) {
      this.emit('all-sessions-completed', sessions)
    }
  }

  /**
   * Handle agent messages
   */
  private handleAgentMessage(message: AgentMessage): void {
    const session = this.sessions.get(message.from)
    if (session) {
      session.communications.push(message)
      session.progress.recentActivities.push(`Message: ${message.content.substring(0, 50)}...`)
      session.mcpIntegration.lastActivity = message.timestamp
    }
  }

  /**
   * Handle progress updates
   */
  private handleProgressUpdate(sessionId: string, progress: ProgressInfo): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.progress = { ...session.progress, ...progress }
      session.status.completionPercentage = progress.completionPercentage
      this.emit('session-progress', session)
    }
  }

  /**
   * Handle conflict detection
   */
  private handleConflictDetected(conflict: Conflict): void {
    console.warn(`⚠️ Conflict detected: ${conflict.description}`)
    const resolution = this.conflictResolver.resolveConflict(conflict)

    if (resolution) {
      this.applyConflictResolution(resolution)
    }
  }

  /**
   * Apply conflict resolution
   */
  private applyConflictResolution(resolution: ConflictResolution): void {
    // Update affected sessions
    for (const sessionId of resolution.affectedSessions) {
      const session = this.sessions.get(sessionId)
      if (session) {
        session.progress.recentActivities.push(`Conflict resolved: ${resolution.description}`)
        session.mcpIntegration.lastActivity = new Date()
      }
    }

    this.emit('conflict-resolved', resolution)
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): AgentSession[] {
    return Array.from(this.sessions.values()).filter(s =>
      s.status.state === 'running' || s.status.state === 'waiting'
    )
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get all sessions
   */
  getAllSessions(): AgentSession[] {
    return Array.from(this.sessions.values())
  }
}

/**
 * Simple message bus for agent communication
 */
class MessageBus extends EventEmitter {
  sendMessage(message: AgentMessage): void {
    this.emit('message', message)
  }
}

/**
 * Conflict detection and resolution
 */
interface Conflict {
  id: string
  type: 'resource' | 'approach' | 'dependency'
  description: string
  involvedSessions: string[]
  severity: 'low' | 'medium' | 'high'
}

interface ConflictResolution {
  conflictId: string
  description: string
  strategy: string
  affectedSessions: string[]
}

class ConflictResolver extends EventEmitter {
  detectConflicts(sessions: AgentSession[]): Conflict[] {
    const conflicts: Conflict[] = []

    // Check for worktree conflicts
    const worktreeSessions = sessions.filter(s => s.worktree)
    const worktreeNames = worktreeSessions.map(s => s.worktree).filter(Boolean) as string[]
    const duplicateWorktrees = worktreeNames.filter((worktree, index) =>
      worktreeNames.indexOf(worktree) !== index
    )

    for (const duplicate of duplicateWorktrees) {
      conflicts.push({
        id: `worktree-conflict-${duplicate}`,
        type: 'resource',
        description: `Multiple sessions using the same worktree: ${duplicate}`,
        involvedSessions: worktreeSessions
          .filter(s => s.worktree === duplicate)
          .map(s => s.id),
        severity: 'medium'
      })
    }

    return conflicts
  }

  resolveConflict(conflict: Conflict): ConflictResolution | null {
    switch (conflict.type) {
      case 'resource':
        return this.resolveResourceConflict(conflict)
      case 'approach':
        return this.resolveApproachConflict(conflict)
      case 'dependency':
        return this.resolveDependencyConflict(conflict)
      default:
        return null
    }
  }

  private resolveResourceConflict(conflict: Conflict): ConflictResolution {
    return {
      conflictId: conflict.id,
      description: `Resource conflict resolved by isolation`,
      strategy: 'isolate-sessions',
      affectedSessions: conflict.involvedSessions
    }
  }

  private resolveApproachConflict(conflict: Conflict): ConflictResolution {
    return {
      conflictId: conflict.id,
      description: `Approach conflict resolved by prioritization`,
      strategy: 'prioritize-by-performance',
      affectedSessions: conflict.involvedSessions
    }
  }

  private resolveDependencyConflict(conflict: Conflict): ConflictResolution {
    return {
      conflictId: conflict.id,
      description: `Dependency conflict resolved by reordering`,
      strategy: 'reorder-execution',
      affectedSessions: conflict.involvedSessions
    }
  }
}

/**
 * Progress tracking system
 */
class ProgressTracker extends EventEmitter {
  updateProgress(sessionId: string, progress: ProgressInfo): void {
    this.emit('progress-update', sessionId, progress)
  }
}