/**
 * Enhanced Workflow Orchestrator
 *
 * Provides end-to-end automation of parallel exploration workflows
 * with intelligent MCP server integration and automatic cleanup.
 */
import { EventEmitter } from 'events';
import { AgentSession, Approach } from '../coordination/agent-orchestrator';
export interface WorkflowConfig {
    id: string;
    name: string;
    description: string;
    approaches: Approach[];
    mcpServers?: string[];
    options: WorkflowOptions;
}
export interface WorkflowOptions {
    autoCleanup: boolean;
    preserveArtifacts: boolean;
    timeout: number;
    parallelism: number;
    notifyOnCompletion: boolean;
}
export interface WorkflowPhase {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    result?: any;
    error?: string;
}
export interface WorkflowResult {
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'timeout';
    phases: Record<string, WorkflowPhase>;
    sessions: AgentSession[];
    synthesis?: SynthesisResult;
    artifacts: WorkflowArtifact[];
    metrics: WorkflowMetrics;
    startTime: Date;
    endTime?: Date;
    totalDuration?: number;
}
export interface SynthesisResult {
    selectedApproach?: string;
    mergedSolution?: any;
    comparison: ApproachComparison[];
    recommendations: string[];
    confidence: number;
}
export interface ApproachComparison {
    approachId: string;
    name: string;
    strengths: string[];
    weaknesses: string[];
    performance: PerformanceMetrics;
    score: number;
}
export interface PerformanceMetrics {
    executionTime: number;
    memoryUsage: number;
    codeQuality: number;
    testCoverage: number;
    maintainability: number;
}
export interface WorkflowArtifact {
    id: string;
    type: 'code' | 'test' | 'documentation' | 'result' | 'configuration';
    name: string;
    path?: string;
    content?: any;
    metadata: Record<string, any>;
    sessionId?: string;
    timestamp: Date;
}
export interface WorkflowMetrics {
    totalExecutionTime: number;
    sessionsCompleted: number;
    sessionsFailed: number;
    artifactsCreated: number;
    conflictsResolved: number;
    mcpServersUtilized: number;
    parallelismAchieved: number;
}
/**
 * Orchestrates complete parallel exploration workflows
 */
export declare class WorkflowOrchestrator extends EventEmitter {
    private activeWorkflows;
    private agentOrchestrator;
    private mcpDiscovery;
    private cleanupManager;
    private synthesisEngine;
    constructor();
    /**
     * Setup event handlers for workflow events
     */
    private setupEventHandlers;
    /**
     * Execute a complete parallel exploration workflow
     */
    executeWorkflow(config: WorkflowConfig): Promise<WorkflowResult>;
    /**
     * Initialize workflow phases
     */
    private initializePhases;
    /**
     * Execute a specific workflow phase
     */
    private executePhase;
    /**
     * Execute the setup phase
     */
    private executeSetupPhase;
    /**
     * Execute the parallel execution phase
     */
    private executeExecutionPhase;
    /**
     * Execute the synthesis phase
     */
    private executeSynthesisPhase;
    /**
     * Execute the cleanup phase
     */
    private executeCleanupPhase;
    /**
     * Wait for all sessions to complete with timeout
     */
    private waitForSessionsCompletion;
    /**
     * Handle session completion
     */
    private handleSessionCompleted;
    /**
     * Handle session failure
     */
    private handleSessionFailed;
    /**
     * Handle all sessions completed
     */
    private handleAllSessionsCompleted;
    /**
     * Collect artifacts from a session
     */
    private collectSessionArtifacts;
    /**
     * Create synthesis artifacts
     */
    private createSynthesisArtifacts;
    /**
     * Update workflow metrics
     */
    private updateWorkflowMetrics;
    /**
     * Generate final workflow result
     */
    private generateWorkflowResult;
    /**
     * Generate error workflow result
     */
    private generateErrorResult;
    /**
     * Get default metrics
     */
    private getDefaultMetrics;
    /**
     * Create workflow artifacts directory
     */
    private createWorkflowArtifactsDirectory;
    /**
     * Generate workflow metadata
     */
    private generateWorkflowMetadata;
    /**
     * Get active workflow status
     */
    getWorkflowStatus(workflowId: string): WorkflowState | undefined;
    /**
     * Get all active workflows
     */
    getActiveWorkflows(): WorkflowState[];
}
/**
 * Workflow state interface
 */
interface WorkflowState {
    id: string;
    config: WorkflowConfig;
    phases: Record<string, WorkflowPhase>;
    sessions: AgentSession[];
    artifacts: WorkflowArtifact[];
    startTime: Date;
    endTime?: Date;
    synthesis?: SynthesisResult;
    metrics?: WorkflowMetrics;
}
export {};
