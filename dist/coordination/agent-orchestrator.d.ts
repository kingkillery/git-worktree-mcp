/**
 * Enhanced Agent Orchestration System
 *
 * Provides intelligent coordination of multiple Claude agents
 * with MCP server integration and real-time progress tracking.
 */
import { EventEmitter } from 'events';
import { MCPServerInfo, TaskRequirement } from '../mcp-integration/discovery.js';
export interface Approach {
    id: string;
    name: string;
    description: string;
    strategy: string;
    requirements: TaskRequirement;
    agentProfile: AgentProfile;
}
export interface AgentProfile {
    id: string;
    role: AgentRole;
    preferredMCPServers: string[];
    tools: string[];
    constraints: AgentConstraints;
    expertise: string[];
}
export interface AgentRole {
    name: string;
    description: string;
    priorities: string[];
    collaborationStyle: 'independent' | 'cooperative' | 'competitive';
}
export interface AgentConstraints {
    maxExecutionTime: number;
    memoryLimit: number;
    allowedTools: string[];
    forbiddenTools: string[];
}
export interface AgentSession {
    id: string;
    agent: AgentProfile;
    approach: Approach;
    worktree?: string;
    status: SessionStatus;
    startTime: Date;
    endTime?: Date;
    progress: ProgressInfo;
    artifacts: Artifact[];
    communications: AgentMessage[];
    mcpIntegration: MCPServerIntegration;
}
export interface MCPServerIntegration {
    server: MCPServerInfo;
    assignedTools: string[];
    connectionStatus: 'connected' | 'disconnected' | 'error';
    lastActivity: Date;
}
export interface SessionStatus {
    state: 'initializing' | 'running' | 'waiting' | 'completed' | 'failed' | 'paused';
    currentPhase: string;
    completionPercentage: number;
    error?: string;
}
export interface ProgressInfo {
    phase: string;
    subPhase?: string;
    completionPercentage: number;
    estimatedTimeRemaining?: number;
    recentActivities: string[];
    bottlenecks: string[];
}
export interface Artifact {
    type: 'file' | 'directory' | 'result' | 'error';
    path?: string;
    content?: any;
    metadata: Record<string, any>;
    timestamp: Date;
}
export interface AgentMessage {
    from: string;
    to: string;
    timestamp: Date;
    type: 'request' | 'response' | 'notification' | 'conflict';
    content: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}
/**
 * Orchestrates multiple agents working on parallel approaches
 */
export declare class AgentOrchestrator extends EventEmitter {
    private sessions;
    private mcpDiscovery;
    private messageBus;
    private conflictResolver;
    private progressTracker;
    constructor();
    /**
     * Setup event handlers for orchestration events
     */
    private setupEventHandlers;
    /**
     * Dispatch multiple agents to work on different approaches
     */
    dispatchParallelAgents(approaches: Approach[]): Promise<AgentSession[]>;
    /**
     * Create a new agent session
     */
    private createAgentSession;
    /**
     * Create a worktree for an approach using git-worktree-mcp
     */
    private createWorktreeForApproach;
    /**
     * Execute an agent session
     */
    private executeAgentSession;
    /**
     * Execute an approach using MCP server tools
     */
    private executeApproachWithMCP;
    /**
     * Start coordination between multiple sessions
     */
    private startCoordination;
    /**
     * Check for conflicts between sessions
     */
    private checkForConflicts;
    /**
     * Check for collaboration opportunities
     */
    private checkForCollaborationOpportunities;
    /**
     * Determine if two sessions should collaborate
     */
    private shouldCollaborate;
    /**
     * Facilitate collaboration between two sessions
     */
    private facilitateCollaboration;
    /**
     * Update overall progress across all sessions
     */
    private updateOverallProgress;
    /**
     * Handle agent messages
     */
    private handleAgentMessage;
    /**
     * Handle progress updates
     */
    private handleProgressUpdate;
    /**
     * Handle conflict detection
     */
    private handleConflictDetected;
    /**
     * Apply conflict resolution
     */
    private applyConflictResolution;
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Get all active sessions
     */
    getActiveSessions(): AgentSession[];
    /**
     * Get session by ID
     */
    getSession(sessionId: string): AgentSession | undefined;
    /**
     * Get all sessions
     */
    getAllSessions(): AgentSession[];
}
