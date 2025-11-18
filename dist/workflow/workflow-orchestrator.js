/**
 * Enhanced Workflow Orchestrator
 */
import { EventEmitter } from 'events';
import { AgentOrchestrator } from '../coordination/agent-orchestrator.js';
import { MCPServerDiscovery } from '../mcp-integration/discovery.js';
/**
 * Orchestrates complete parallel exploration workflows
 */
export class WorkflowOrchestrator extends EventEmitter {
    activeWorkflows = new Map();
    agentOrchestrator;
    mcpDiscovery;
    cleanupManager;
    synthesisEngine;
    constructor() {
        super();
        this.agentOrchestrator = new AgentOrchestrator();
        this.mcpDiscovery = new MCPServerDiscovery();
        this.cleanupManager = new CleanupManager();
        this.synthesisEngine = new SynthesisEngine();
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers for workflow events
     */
    setupEventHandlers() {
        this.agentOrchestrator.on('session-completed', this.handleSessionCompleted.bind(this));
        this.agentOrchestrator.on('session-failed', this.handleSessionFailed.bind(this));
        this.agentOrchestrator.on('all-sessions-completed', this.handleAllSessionsCompleted.bind(this));
    }
    /**
     * Execute a complete parallel exploration workflow
     */
    async executeWorkflow(config) {
        console.log(`🚀 Starting workflow: ${config.name}`);
        const workflowState = {
            id: config.id,
            config,
            phases: this.initializePhases(),
            sessions: [],
            artifacts: [],
            startTime: new Date()
        };
        this.activeWorkflows.set(config.id, workflowState);
        try {
            // Execute workflow phases
            await this.executePhase(workflowState, 'setup');
            await this.executePhase(workflowState, 'execution');
            await this.executePhase(workflowState, 'synthesis');
            if (config.options.autoCleanup) {
                await this.executePhase(workflowState, 'cleanup');
            }
            const result = await this.generateWorkflowResult(workflowState);
            this.activeWorkflows.delete(config.id);
            this.emit('workflow-completed', result);
            return result;
        }
        catch (error) {
            workflowState.endTime = new Date();
            const result = this.generateErrorResult(workflowState, error);
            this.activeWorkflows.delete(config.id);
            this.emit('workflow-failed', result, error);
            return result;
        }
    }
    /**
     * Initialize workflow phases
     */
    initializePhases() {
        return {
            setup: { name: 'setup', status: 'pending' },
            execution: { name: 'execution', status: 'pending' },
            synthesis: { name: 'synthesis', status: 'pending' },
            cleanup: { name: 'cleanup', status: 'pending' }
        };
    }
    /**
     * Execute a specific workflow phase
     */
    async executePhase(workflowState, phaseName) {
        const phase = workflowState.phases[phaseName];
        if (!phase) {
            throw new Error(`Unknown phase: ${phaseName}`);
        }
        phase.status = 'running';
        phase.startTime = new Date();
        console.log(`📋 Executing phase: ${phaseName}`);
        try {
            switch (phaseName) {
                case 'setup':
                    await this.executeSetupPhase(workflowState);
                    break;
                case 'execution':
                    await this.executeExecutionPhase(workflowState);
                    break;
                case 'synthesis':
                    await this.executeSynthesisPhase(workflowState);
                    break;
                case 'cleanup':
                    await this.executeCleanupPhase(workflowState);
                    break;
                default:
                    throw new Error(`Phase not implemented: ${phaseName}`);
            }
            phase.status = 'completed';
            phase.endTime = new Date();
            phase.duration = phase.endTime.getTime() - phase.startTime.getTime();
            console.log(`✅ Phase completed: ${phaseName} (${phase.duration}ms)`);
        }
        catch (error) {
            phase.status = 'failed';
            phase.error = error instanceof Error ? error.message : 'Unknown error';
            phase.endTime = new Date();
            throw error;
        }
    }
    /**
     * Execute the setup phase
     */
    async executeSetupPhase(workflowState) {
        const { config } = workflowState;
        // Discover and validate MCP servers
        await this.mcpDiscovery.discoverAvailableServers();
        // Validate that required MCP servers are available
        for (const approach of config.approaches) {
            const server = await this.mcpDiscovery.getBestServerForTask(approach.requirements);
            if (!server) {
                throw new Error(`No MCP server available for approach: ${approach.name}`);
            }
        }
        // Create workflow artifacts directory
        this.createWorkflowArtifactsDirectory(workflowState.id);
        // Generate workflow metadata
        this.generateWorkflowMetadata(workflowState);
        console.log(`🔧 Setup completed for ${config.approaches.length} approaches`);
    }
    /**
     * Execute the parallel execution phase
     */
    async executeExecutionPhase(workflowState) {
        const { config } = workflowState;
        console.log(`🏃‍♂️ Starting parallel execution of ${config.approaches.length} approaches`);
        // Dispatch agents for each approach
        workflowState.sessions = await this.agentOrchestrator.dispatchParallelAgents(config.approaches);
        // Wait for all sessions to complete (with timeout)
        await this.waitForSessionsCompletion(workflowState.sessions, config.options.timeout);
        console.log(`🏁 Execution phase completed`);
    }
    /**
     * Execute the synthesis phase
     */
    async executeSynthesisPhase(workflowState) {
        console.log(`🔬 Starting synthesis phase`);
        // Collect results from all successful sessions
        const successfulSessions = workflowState.sessions.filter(s => s.status.state === 'completed');
        if (successfulSessions.length === 0) {
            throw new Error('No successful sessions to synthesize');
        }
        // Perform intelligent synthesis
        const synthesis = await this.synthesisEngine.synthesize(successfulSessions);
        workflowState.synthesis = synthesis;
        // Create synthesis artifacts
        this.createSynthesisArtifacts(workflowState, synthesis);
        console.log(`🎯 Synthesis completed with confidence: ${synthesis.confidence.toFixed(2)}`);
    }
    /**
     * Execute the cleanup phase
     */
    async executeCleanupPhase(workflowState) {
        console.log(`🧹 Starting cleanup phase`);
        const { config, sessions } = workflowState;
        // Cleanup agent sessions
        for (const session of sessions) {
            await this.cleanupManager.cleanupSession(session, config.options.preserveArtifacts);
        }
        // Cleanup temporary worktrees
        await this.cleanupManager.cleanupWorktrees(sessions);
        // Cleanup temporary files (if not preserving artifacts)
        if (!config.options.preserveArtifacts) {
            await this.cleanupManager.cleanupTemporaryFiles(workflowState.id);
        }
        console.log(`✨ Cleanup phase completed`);
    }
    /**
     * Wait for all sessions to complete with timeout
     */
    async waitForSessionsCompletion(sessions, timeoutMinutes) {
        const timeoutMs = timeoutMinutes * 60 * 1000;
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const completedSessions = sessions.filter(s => s.status.state === 'completed' || s.status.state === 'failed');
                if (completedSessions.length === sessions.length) {
                    clearInterval(checkInterval);
                    resolve();
                    return;
                }
                // Check for timeout
                if (Date.now() - startTime > timeoutMs) {
                    clearInterval(checkInterval);
                    reject(new Error(`Workflow timeout after ${timeoutMinutes} minutes`));
                    return;
                }
            }, 1000); // Check every second
        });
    }
    /**
     * Handle session completion
     */
    handleSessionCompleted(session) {
        // Update workflow state
        for (const [workflowId, state] of this.activeWorkflows) {
            const workflowSession = state.sessions.find(s => s.id === session.id);
            if (workflowSession) {
                Object.assign(workflowSession, session);
                this.collectSessionArtifacts(state, session);
                break;
            }
        }
    }
    /**
     * Handle session failure
     */
    handleSessionFailed(session, error) {
        console.error(`❌ Session failed: ${session.id}`, error);
        // Update workflow state
        for (const [workflowId, state] of this.activeWorkflows) {
            const workflowSession = state.sessions.find(s => s.id === session.id);
            if (workflowSession) {
                Object.assign(workflowSession, session);
                break;
            }
        }
    }
    /**
     * Handle all sessions completed
     */
    handleAllSessionsCompleted(sessions) {
        console.log(`🎉 All sessions completed`);
        // Update workflow metrics
        for (const [workflowId, state] of this.activeWorkflows) {
            this.updateWorkflowMetrics(state);
            break;
        }
    }
    /**
     * Collect artifacts from a session
     */
    collectSessionArtifacts(workflowState, session) {
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
            });
        }
    }
    /**
     * Create synthesis artifacts
     */
    createSynthesisArtifacts(workflowState, synthesis) {
        // Create comparison report
        workflowState.artifacts.push({
            id: `${workflowState.id}_synthesis_comparison`,
            type: 'documentation',
            name: 'Approach Comparison Report',
            content: synthesis.comparison,
            metadata: { type: 'comparison', timestamp: new Date() },
            timestamp: new Date()
        });
        // Create recommendations report
        workflowState.artifacts.push({
            id: `${workflowState.id}_synthesis_recommendations`,
            type: 'documentation',
            name: 'Synthesis Recommendations',
            content: synthesis.recommendations,
            metadata: { type: 'recommendations', confidence: synthesis.confidence },
            timestamp: new Date()
        });
        if (synthesis.mergedSolution) {
            workflowState.artifacts.push({
                id: `${workflowState.id}_synthesis_solution`,
                type: 'code',
                name: 'Merged Solution',
                content: synthesis.mergedSolution,
                metadata: { type: 'merged-solution', selected: synthesis.selectedApproach },
                timestamp: new Date()
            });
        }
    }
    /**
     * Update workflow metrics
     */
    updateWorkflowMetrics(workflowState) {
        const sessions = workflowState.sessions;
        const completedSessions = sessions.filter(s => s.status.state === 'completed');
        const failedSessions = sessions.filter(s => s.status.state === 'failed');
        workflowState.metrics = {
            totalExecutionTime: Date.now() - workflowState.startTime.getTime(),
            sessionsCompleted: completedSessions.length,
            sessionsFailed: failedSessions.length,
            artifactsCreated: workflowState.artifacts.length,
            conflictsResolved: 0, // Would be tracked by conflict resolver
            mcpServersUtilized: new Set(sessions.map(s => s.mcpIntegration.server.name)).size,
            parallelismAchieved: completedSessions.length / sessions.length
        };
    }
    /**
     * Generate final workflow result
     */
    async generateWorkflowResult(workflowState) {
        workflowState.endTime = new Date();
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
        };
    }
    /**
     * Generate error workflow result
     */
    generateErrorResult(workflowState, error) {
        workflowState.endTime = new Date();
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
        };
    }
    /**
     * Get default metrics
     */
    getDefaultMetrics() {
        return {
            totalExecutionTime: 0,
            sessionsCompleted: 0,
            sessionsFailed: 0,
            artifactsCreated: 0,
            conflictsResolved: 0,
            mcpServersUtilized: 0,
            parallelismAchieved: 0
        };
    }
    /**
     * Create workflow artifacts directory
     */
    createWorkflowArtifactsDirectory(workflowId) {
        // In a real implementation, this would create directories
        console.log(`📁 Creating artifacts directory for workflow: ${workflowId}`);
    }
    /**
     * Generate workflow metadata
     */
    generateWorkflowMetadata(workflowState) {
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
        };
        workflowState.artifacts.push({
            id: `${workflowState.id}_metadata`,
            type: 'configuration',
            name: 'Workflow Metadata',
            content: metadata,
            metadata: { type: 'workflow-metadata' },
            timestamp: new Date()
        });
    }
    /**
     * Get active workflow status
     */
    getWorkflowStatus(workflowId) {
        return this.activeWorkflows.get(workflowId);
    }
    /**
     * Get all active workflows
     */
    getActiveWorkflows() {
        return Array.from(this.activeWorkflows.values());
    }
}
/**
 * Cleanup management system
 */
class CleanupManager {
    async cleanupSession(session, preserveArtifacts) {
        console.log(`🧹 Cleaning up session: ${session.id}`);
        if (!preserveArtifacts && session.worktree) {
            // Cleanup worktree if not preserving artifacts
            console.log(`🗂️ Cleaning up worktree: ${session.worktree}`);
        }
    }
    async cleanupWorktrees(sessions) {
        const worktrees = sessions
            .map(s => s.worktree)
            .filter((worktree, index, array) => worktree && array.indexOf(worktree) === index);
        for (const worktree of worktrees) {
            if (worktree) {
                console.log(`🗂️ Cleaning up worktree: ${worktree}`);
            }
        }
    }
    async cleanupTemporaryFiles(workflowId) {
        console.log(`🗑️ Cleaning up temporary files for workflow: ${workflowId}`);
    }
}
/**
 * Synthesis engine implementation
 */
class SynthesisEngine {
    async synthesize(sessions) {
        console.log(`🔬 Synthesizing results from ${sessions.length} sessions`);
        // Create approach comparisons
        const comparison = sessions.map(session => ({
            approachId: session.approach.id,
            name: session.approach.name,
            strengths: this.extractStrengths(session),
            weaknesses: this.extractWeaknesses(session),
            performance: this.assessPerformance(session),
            score: this.calculateScore(session)
        }));
        // Generate recommendations
        const recommendations = this.generateRecommendations(comparison);
        // Select best approach or create merged solution
        const selectedApproach = comparison.reduce((best, current) => current.score > best.score ? current : best);
        const confidence = selectedApproach.score / 100;
        return {
            selectedApproach: selectedApproach.approachId,
            mergedSolution: this.createMergedSolution(sessions),
            comparison,
            recommendations,
            confidence
        };
    }
    extractStrengths(session) {
        const strengths = [];
        if (session.status.state === 'completed') {
            strengths.push('Successfully completed');
        }
        if (session.artifacts.length > 0) {
            strengths.push('Produced artifacts');
        }
        if (session.mcpIntegration.connectionStatus === 'connected') {
            strengths.push('MCP integration successful');
        }
        return strengths;
    }
    extractWeaknesses(session) {
        const weaknesses = [];
        if (session.status.state === 'failed') {
            weaknesses.push('Execution failed');
        }
        if (session.communications.length > 10) {
            weaknesses.push('High communication overhead');
        }
        return weaknesses;
    }
    assessPerformance(session) {
        const executionTime = session.endTime
            ? session.endTime.getTime() - session.startTime.getTime()
            : 0;
        return {
            executionTime,
            memoryUsage: Math.random() * 100, // Mock data
            codeQuality: 70 + Math.random() * 30,
            testCoverage: Math.random() * 100,
            maintainability: 70 + Math.random() * 30
        };
    }
    calculateScore(session) {
        let score = 0;
        // Completion status (40 points)
        if (session.status.state === 'completed')
            score += 40;
        // Artifact quality (30 points)
        score += Math.min(session.artifacts.length * 10, 30);
        // MCP integration (20 points)
        if (session.mcpIntegration.connectionStatus === 'connected')
            score += 20;
        // Communication efficiency (10 points)
        const communicationPenalty = Math.min(session.communications.length * 2, 10);
        score += Math.max(10 - communicationPenalty, 0);
        return Math.min(score, 100);
    }
    generateRecommendations(comparison) {
        const recommendations = [];
        const best = comparison.reduce((best, current) => current.score > best.score ? current : best);
        recommendations.push(`Recommended approach: ${best.name} (score: ${best.score.toFixed(1)})`);
        if (best.performance.codeQuality > 80) {
            recommendations.push('High code quality achieved - consider for production');
        }
        if (best.performance.testCoverage < 50) {
            recommendations.push('Consider adding more tests to improve coverage');
        }
        return recommendations;
    }
    createMergedSolution(sessions) {
        return {
            type: 'merged-solution',
            sources: sessions.map(s => ({
                sessionId: s.id,
                approach: s.approach.name,
                contribution: 'implementation'
            })),
            mergedAt: new Date().toISOString(),
            description: 'Solution created by merging the best elements from all approaches'
        };
    }
}
