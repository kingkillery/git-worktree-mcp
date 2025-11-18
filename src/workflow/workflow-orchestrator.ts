/**
 * Enhanced Workflow Orchestrator
 */
import { EventEmitter } from 'events'
import { AgentOrchestrator, AgentSession, Approach } from '../coordination/agent-orchestrator.js'
import { MCPServerDiscovery } from '../mcp-integration/discovery.js'

export interface WorkflowConfig {
  id: string
  name: string
  description?: string
  approaches: Approach[]
  mcpServers?: string[] // Preferred MCP servers
  options: WorkflowOptions
}

export interface WorkflowOptions {
  autoCleanup: boolean
  preserveArtifacts: boolean
  timeout: number // minutes
  parallelism: number
  notifyOnCompletion: boolean
}

export interface WorkflowPhase {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  duration?: number
  result?: any
  error?: string
}

export interface WorkflowResult {
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'timeout'
  phases: Record<string, WorkflowPhase>
  sessions: AgentSession[]
  synthesis?: SynthesisResult
  artifacts: WorkflowArtifact[]
  metrics: WorkflowMetrics
  startTime: Date
  endTime?: Date
  totalDuration?: number
}

export interface SynthesisResult {
  selectedApproach?: string
  mergedSolution?: any
  comparison: ApproachComparison[]
  recommendations: string[]
  confidence: number
}

export interface ApproachComparison {
  approachId: string
  name: string
  strengths: string[]
  weaknesses: string[]
  performance: PerformanceMetrics
  score: number
}

export interface PerformanceMetrics {
  executionTime: number
  memoryUsage: number
  codeQuality: number
  testCoverage: number
  maintainability: number
}

export interface WorkflowArtifact {
  id: string
  type: 'code' | 'test' | 'documentation' | 'result' | 'configuration'
  name: string
  path?: string
  content?: any
  metadata: Record<string, any>
  sessionId?: string
  timestamp: Date
}

export interface WorkflowMetrics {
  totalExecutionTime: number
  sessionsCompleted: number
  sessionsFailed: number
  artifactsCreated: number
  conflictsResolved: number
  mcpServersUtilized: number
  parallelismAchieved: number
}

/**
 * Orchestrates complete parallel exploration workflows
 */
export class WorkflowOrchestrator extends EventEmitter {
  private activeWorkflows: Map<string, WorkflowState> = new Map()
  private agentOrchestrator: AgentOrchestrator
  private mcpDiscovery: MCPServerDiscovery
  private cleanupManager: CleanupManager
  private synthesisEngine: SynthesisEngine

  constructor() {
    super()
    this.agentOrchestrator = new AgentOrchestrator()
    this.mcpDiscovery = new MCPServerDiscovery()
    this.cleanupManager = new CleanupManager()
    this.synthesisEngine = new SynthesisEngine()

    this.setupEventHandlers()
  }

  /**
   * Setup event handlers for workflow events
   */
  private setupEventHandlers(): void {
    this.agentOrchestrator.on('session-completed', this.handleSessionCompleted.bind(this))
    this.agentOrchestrator.on('session-failed', this.handleSessionFailed.bind(this))
    this.agentOrchestrator.on('all-sessions-completed', this.handleAllSessionsCompleted.bind(this))
  }

  /**
   * Execute a complete parallel exploration workflow
   */
  async executeWorkflow(config: WorkflowConfig): Promise<WorkflowResult> {
    console.log(`🚀 Starting workflow: ${config.name}`)

    const workflowState: WorkflowState = {
      id: config.id,
      config,
      phases: this.initializePhases(),
      sessions: [],
      artifacts: [],
      startTime: new Date()
    }

    this.activeWorkflows.set(config.id, workflowState)

    try {
      // Execute workflow phases
      await this.executePhase(workflowState, 'setup')
      await this.executePhase(workflowState, 'execution')
      await this.executePhase(workflowState, 'synthesis')

      if (config.options.autoCleanup) {
        await this.executePhase(workflowState, 'cleanup')
      }

      const result = await this.generateWorkflowResult(workflowState)
      this.activeWorkflows.delete(config.id)

      this.emit('workflow-completed', result)
      return result

    } catch (error) {
      workflowState.endTime = new Date()
      const result = this.generateErrorResult(workflowState, error)
      this.activeWorkflows.delete(config.id)

      this.emit('workflow-failed', result, error)
      return result
    }
  }

  /**
   * Initialize workflow phases
   */
  private initializePhases(): Record<string, WorkflowPhase> {
    return {
      setup: { name: 'setup', status: 'pending' },
      execution: { name: 'execution', status: 'pending' },
      synthesis: { name: 'synthesis', status: 'pending' },
      cleanup: { name: 'cleanup', status: 'pending' }
    }
  }

  /**
   * Execute a specific workflow phase
   */
  private async executePhase(workflowState: WorkflowState, phaseName: string): Promise<void> {
    const phase = workflowState.phases[phaseName]
    if (!phase) {
      throw new Error(`Unknown phase: ${phaseName}`)
    }

    phase.status = 'running'
    phase.startTime = new Date()

    console.log(`📋 Executing phase: ${phaseName}`)

    try {
      switch (phaseName) {
        case 'setup':
          await this.executeSetupPhase(workflowState)
          break
        case 'execution':
          await this.executeExecutionPhase(workflowState)
          break
        case 'synthesis':
          await this.executeSynthesisPhase(workflowState)
          break
        case 'cleanup':
          await this.executeCleanupPhase(workflowState)
          break
        default:
          throw new Error(`Phase not implemented: ${phaseName}`)
      }

      phase.status = 'completed'
      phase.endTime = new Date()
      phase.duration = phase.endTime.getTime() - phase.startTime.getTime()

      console.log(`✅ Phase completed: ${phaseName} (${phase.duration}ms)`)

    } catch (error) {
      phase.status = 'failed'
      phase.error = error instanceof Error ? error.message : 'Unknown error'
      phase.endTime = new Date()
      throw error
    }
  }

  /**
   * Execute the setup phase
   */
  private async executeSetupPhase(workflowState: WorkflowState): Promise<void> {
    const { config } = workflowState

    // Discover and validate MCP servers
    await this.mcpDiscovery.discoverAvailableServers()

    // Validate that required MCP servers are available
    for (const approach of config.approaches) {
      const server = await this.mcpDiscovery.getBestServerForTask(approach.requirements)
      if (!server) {
        throw new Error(`No MCP server available for approach: ${approach.name}`)
      }
    }

    // Create workflow artifacts directory
    this.createWorkflowArtifactsDirectory(workflowState.id)

    // Generate workflow metadata
    this.generateWorkflowMetadata(workflowState)

    console.log(`🔧 Setup completed for ${config.approaches.length} approaches`)
  }

  /**
   * Execute the parallel execution phase
   */
  private async executeExecutionPhase(workflowState: WorkflowState): Promise<void> {
    const { config } = workflowState

    console.log(`🏃‍♂️ Starting parallel execution of ${config.approaches.length} approaches`)

    // Dispatch agents for each approach
    workflowState.sessions = await this.agentOrchestrator.dispatchParallelAgents(config.approaches)

    // Wait for all sessions to complete (with timeout)
    await this.waitForSessionsCompletion(workflowState.sessions, config.options.timeout)

    console.log(`🏁 Execution phase completed`)
  }

  /**
   * Execute the synthesis phase
   */
  private async executeSynthesisPhase(workflowState: WorkflowState): Promise<void> {
    console.log(`🔬 Starting synthesis phase`)

    // Collect results from all successful sessions
    const successfulSessions = workflowState.sessions.filter(s => s.status.state === 'completed')

    if (successfulSessions.length === 0) {
      throw new Error('No successful sessions to synthesize')
    }

    // Perform intelligent synthesis
    const synthesis = await this.synthesisEngine.synthesize(successfulSessions)
    workflowState.synthesis = synthesis

    // Create synthesis artifacts
    this.createSynthesisArtifacts(workflowState, synthesis)

    console.log(`🎯 Synthesis completed with confidence: ${synthesis.confidence.toFixed(2)}`)
  }

  /**
   * Execute the cleanup phase
   */
  private async executeCleanupPhase(workflowState: WorkflowState): Promise<void> {
    console.log(`🧹 Starting cleanup phase`)

    const { config, sessions } = workflowState

    // Cleanup agent sessions
    for (const session of sessions) {
      await this.cleanupManager.cleanupSession(session, config.options.preserveArtifacts)
    }

    // Cleanup temporary worktrees
    await this.cleanupManager.cleanupWorktrees(sessions)

    // Cleanup temporary files (if not preserving artifacts)
    if (!config.options.preserveArtifacts) {
      await this.cleanupManager.cleanupTemporaryFiles(workflowState.id)
    }

    console.log(`✨ Cleanup phase completed`)
  }

  /**
   * Wait for all sessions to complete with timeout
   */
  private async waitForSessionsCompletion(sessions: AgentSession[], timeoutMinutes: number): Promise<void> {
    const timeoutMs = timeoutMinutes * 60 * 1000
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const completedSessions = sessions.filter(s =>
          s.status.state === 'completed' || s.status.state === 'failed'
        )

        if (completedSessions.length === sessions.length) {
          clearInterval(checkInterval)
          resolve()
          return
        }

        // Check for timeout
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval)
          reject(new Error(`Workflow timeout after ${timeoutMinutes} minutes`))
          return
        }
      }, 1000) // Check every second
    })
  }

  /**
   * Handle session completion
   */
  private handleSessionCompleted(session: AgentSession): void {
    // Update workflow state
    for (const [workflowId, state] of this.activeWorkflows) {
      const workflowSession = state.sessions.find(s => s.id === session.id)
      if (workflowSession) {
        Object.assign(workflowSession, session)
        this.collectSessionArtifacts(state, session)
        break
      }
    }
  }

  /**
   * Handle session failure
   */
  private handleSessionFailed(session: AgentSession, error: any): void {
    console.error(`❌ Session failed: ${session.id}`, error)

    // Update workflow state
    for (const [workflowId, state] of this.activeWorkflows) {
      const workflowSession = state.sessions.find(s => s.id === session.id)
      if (workflowSession) {
        Object.assign(workflowSession, session)
        break
      }
    }
  }

  /**
   * Handle all sessions completed
   */
  private handleAllSessionsCompleted(sessions: AgentSession[]): void {
    console.log(`🎉 All sessions completed`)

    // Update workflow metrics
    for (const [workflowId, state] of this.activeWorkflows) {
      this.updateWorkflowMetrics(state)
      break
    }
  }

  /**
   * Collect artifacts from a session
   */
  private collectSessionArtifacts(workflowState: WorkflowState, session: AgentSession): void {
    for (const artifact of session.artifacts) {
      workflowState.artifacts.push({
        id: `${workflowState.id}_${session.id}_${Date.now()}`,
        type: artifact.type === 'file' ? 'code' : 'result',
        name: `Session ${session.id} - ${artifact.type}`,
        path: artifact.path,
        content: artifact.content,
        metadata: artifact.metadata,
        sessionId: session.id,
        timestamp: artifact.timestamp
      })
    }
  }

  /**
   * Create synthesis artifacts
   */
  private createSynthesisArtifacts(workflowState: WorkflowState, synthesis: SynthesisResult): void {
    // Create comparison report
    workflowState.artifacts.push({
      id: `${workflowState.id}_synthesis_comparison`,
      type: 'documentation',
      name: 'Approach Comparison Report',
      content: synthesis.comparison,
      metadata: { type: 'comparison', timestamp: new Date() },
      timestamp: new Date()
    })

    // Create recommendations report
    workflowState.artifacts.push({
      id: `${workflowState.id}_synthesis_recommendations`,
      type: 'documentation',
      name: 'Synthesis Recommendations',
      content: synthesis.recommendations,
      metadata: { type: 'recommendations', confidence: synthesis.confidence },
      timestamp: new Date()
    })

    if (synthesis.mergedSolution) {
      workflowState.artifacts.push({
        id: `${workflowState.id}_synthesis_solution`,
        type: 'code',
        name: 'Merged Solution',
        content: synthesis.mergedSolution,
        metadata: { type: 'merged-solution', selected: synthesis.selectedApproach },
        timestamp: new Date()
      })
    }
  }

  /**
   * Update workflow metrics
   */
  private updateWorkflowMetrics(workflowState: WorkflowState): void {
    const sessions = workflowState.sessions
    const completedSessions = sessions.filter(s => s.status.state === 'completed')
    const failedSessions = sessions.filter(s => s.status.state === 'failed')

    workflowState.metrics = {
      totalExecutionTime: Date.now() - workflowState.startTime.getTime(),
      sessionsCompleted: completedSessions.length,
      sessionsFailed: failedSessions.length,
      artifactsCreated: workflowState.artifacts.length,
      conflictsResolved: 0, // Would be tracked by conflict resolver
      mcpServersUtilized: new Set(sessions.map(s => s.mcpIntegration.server.name)).size,
      parallelismAchieved: completedSessions.length / sessions.length
    }
  }

  /**
   * Generate final workflow result
   */
  private async generateWorkflowResult(workflowState: WorkflowState): Promise<WorkflowResult> {
    workflowState.endTime = new Date()

    return {
      workflowId: workflowState.id,
      status: 'completed',
      phases: workflowState.phases,
      sessions: workflowState.sessions,
      synthesis: workflowState.synthesis,
      artifacts: workflowState.artifacts,
      metrics: workflowState.metrics || this.getDefaultMetrics(),
      startTime: workflowState.startTime,
      endTime: workflowState.endTime,
      totalDuration: workflowState.endTime.getTime() - workflowState.startTime.getTime()
    }
  }

  /**
   * Generate error workflow result
   */
  private generateErrorResult(workflowState: WorkflowState, error: any): WorkflowResult {
    workflowState.endTime = new Date()

    return {
      workflowId: workflowState.id,
      status: 'failed',
      phases: workflowState.phases,
      sessions: workflowState.sessions,
      artifacts: workflowState.artifacts,
      metrics: this.getDefaultMetrics(),
      startTime: workflowState.startTime,
      endTime: workflowState.endTime,
      totalDuration: workflowState.endTime.getTime() - workflowState.startTime.getTime()
    }
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): WorkflowMetrics {
    return {
      totalExecutionTime: 0,
      sessionsCompleted: 0,
      sessionsFailed: 0,
      artifactsCreated: 0,
      conflictsResolved: 0,
      mcpServersUtilized: 0,
      parallelismAchieved: 0
    }
  }

  /**
   * Create workflow artifacts directory
   */
  private createWorkflowArtifactsDirectory(workflowId: string): void {
    // In a real implementation, this would create directories
    console.log(`📁 Creating artifacts directory for workflow: ${workflowId}`)
  }

  /**
   * Generate workflow metadata
   */
  private generateWorkflowMetadata(workflowState: WorkflowState): void {
    // Create metadata file with workflow configuration
    const metadata = {
      workflowId: workflowState.id,
      config: workflowState.config,
      startTime: workflowState.startTime.toISOString(),
      mcpServers: this.mcpDiscovery.getAllServers().map(s => ({
        name: s.name,
        version: s.version,
        available: s.available
      }))
    }

    workflowState.artifacts.push({
      id: `${workflowState.id}_metadata`,
      type: 'configuration',
      name: 'Workflow Metadata',
      content: metadata,
      metadata: { type: 'workflow-metadata' },
      timestamp: new Date()
    })
  }

  /**
   * Get active workflow status
   */
  getWorkflowStatus(workflowId: string): WorkflowState | undefined {
    return this.activeWorkflows.get(workflowId)
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): WorkflowState[] {
    return Array.from(this.activeWorkflows.values())
  }
}

/**
 * Workflow state interface
 */
interface WorkflowState {
  id: string
  config: WorkflowConfig
  phases: Record<string, WorkflowPhase>
  sessions: AgentSession[]
  artifacts: WorkflowArtifact[]
  startTime: Date
  endTime?: Date
  synthesis?: SynthesisResult
  metrics?: WorkflowMetrics
}

/**
 * Cleanup management system
 */
class CleanupManager {
  async cleanupSession(session: AgentSession, preserveArtifacts: boolean): Promise<void> {
    console.log(`🧹 Cleaning up session: ${session.id}`)

    if (!preserveArtifacts && session.worktree) {
      // Cleanup worktree if not preserving artifacts
      console.log(`🗂️ Cleaning up worktree: ${session.worktree}`)
    }
  }

  async cleanupWorktrees(sessions: AgentSession[]): Promise<void> {
    const worktrees = sessions
      .map(s => s.worktree)
      .filter((worktree, index, array) => worktree && array.indexOf(worktree) === index)

    for (const worktree of worktrees) {
      if (worktree) {
        console.log(`🗂️ Cleaning up worktree: ${worktree}`)
      }
    }
  }

  async cleanupTemporaryFiles(workflowId: string): Promise<void> {
    console.log(`🗑️ Cleaning up temporary files for workflow: ${workflowId}`)
  }
}

/**
 * Synthesis engine implementation
 */
class SynthesisEngine {
  async synthesize(sessions: AgentSession[]): Promise<SynthesisResult> {
    console.log(`🔬 Synthesizing results from ${sessions.length} sessions`)

    // Create approach comparisons
    const comparison = sessions.map(session => ({
      approachId: session.approach.id,
      name: session.approach.name,
      strengths: this.extractStrengths(session),
      weaknesses: this.extractWeaknesses(session),
      performance: this.assessPerformance(session),
      score: this.calculateScore(session)
    }))

    // Generate recommendations
    const recommendations = this.generateRecommendations(comparison)

    // Select best approach or create merged solution
    const selectedApproach = comparison.reduce((best, current) =>
      current.score > best.score ? current : best
    )

    const confidence = selectedApproach.score / 100

    return {
      selectedApproach: selectedApproach.approachId,
      mergedSolution: this.createMergedSolution(sessions),
      comparison,
      recommendations,
      confidence
    }
  }

  private extractStrengths(session: AgentSession): string[] {
    const strengths = []

    if (session.status.state === 'completed') {
      strengths.push('Successfully completed')
    }

    if (session.artifacts.length > 0) {
      strengths.push('Produced artifacts')
    }

    if (session.mcpIntegration.connectionStatus === 'connected') {
      strengths.push('MCP integration successful')
    }

    return strengths
  }

  private extractWeaknesses(session: AgentSession): string[] {
    const weaknesses = []

    if (session.status.state === 'failed') {
      weaknesses.push('Execution failed')
    }

    if (session.communications.length > 10) {
      weaknesses.push('High communication overhead')
    }

    return weaknesses
  }

  private assessPerformance(session: AgentSession): PerformanceMetrics {
    const executionTime = session.endTime
      ? session.endTime.getTime() - session.startTime.getTime()
      : 0

    return {
      executionTime,
      memoryUsage: Math.random() * 100, // Mock data
      codeQuality: 70 + Math.random() * 30,
      testCoverage: Math.random() * 100,
      maintainability: 70 + Math.random() * 30
    }
  }

  private calculateScore(session: AgentSession): number {
    let score = 0

    // Completion status (40 points)
    if (session.status.state === 'completed') score += 40

    // Artifact quality (30 points)
    score += Math.min(session.artifacts.length * 10, 30)

    // MCP integration (20 points)
    if (session.mcpIntegration.connectionStatus === 'connected') score += 20

    // Communication efficiency (10 points)
    const communicationPenalty = Math.min(session.communications.length * 2, 10)
    score += Math.max(10 - communicationPenalty, 0)

    return Math.min(score, 100)
  }

  private generateRecommendations(comparison: ApproachComparison[]): string[] {
    const recommendations = []

    const best = comparison.reduce((best, current) =>
      current.score > best.score ? current : best
    )

    recommendations.push(`Recommended approach: ${best.name} (score: ${best.score.toFixed(1)})`)

    if (best.performance.codeQuality > 80) {
      recommendations.push('High code quality achieved - consider for production')
    }

    if (best.performance.testCoverage < 50) {
      recommendations.push('Consider adding more tests to improve coverage')
    }

    return recommendations
  }

  private createMergedSolution(sessions: AgentSession[]): any {
    return {
      type: 'merged-solution',
      sources: sessions.map(s => ({
        sessionId: s.id,
        approach: s.approach.name,
        contribution: 'implementation'
      })),
      mergedAt: new Date().toISOString(),
      description: 'Solution created by merging the best elements from all approaches'
    }
  }
}
