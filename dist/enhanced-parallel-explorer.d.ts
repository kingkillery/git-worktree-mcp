/**
 * Enhanced Parallel Explorer - Main Entry Point
 *
 * Integrates all the enhanced components to provide a seamless
 * parallel exploration experience with MCP server integration.
 */
import { EventEmitter } from 'events';
import { WorkflowResult } from './workflow/workflow-orchestrator.js';
export interface ParallelExplorationOptions {
    autoCleanup?: boolean;
    preserveArtifacts?: boolean;
    timeout?: number;
    parallelism?: number;
    notifyOnCompletion?: boolean;
    preferredMCPServers?: string[];
}
export interface ApproachTemplate {
    name: string;
    description: string;
    strategy: string;
    category: string;
    tools: string[];
    agentRole: 'performance-optimizer' | 'architecture-designer' | 'security-specialist' | 'generalist';
}
/**
 * Main class for enhanced parallel exploration
 */
export declare class EnhancedParallelExplorer extends EventEmitter {
    private workflowOrchestrator;
    private mcpDiscovery;
    constructor();
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Execute a parallel exploration task with automatic strategy generation
     */
    executeParallelExploration(taskName: string, taskDescription: string, numApproaches?: number, options?: ParallelExplorationOptions): Promise<WorkflowResult>;
    /**
     * Execute parallel exploration with predefined approaches
     */
    executeWithPredefinedApproaches(taskName: string, taskDescription: string, approachTemplates: ApproachTemplate[], options?: ParallelExplorationOptions): Promise<WorkflowResult>;
    /**
     * Generate intelligent approaches based on task description
     */
    private generateApproaches;
    /**
     * Analyze task to determine optimal approach types
     */
    private analyzeTask;
    /**
     * Select the best approach types based on analysis
     */
    private selectApproachTypes;
    /**
     * Generate a performance-optimized approach
     */
    private generatePerformanceApproach;
    /**
     * Generate an architecture-focused approach
     */
    private generateArchitectureApproach;
    /**
     * Generate a security-focused approach
     */
    private generateSecurityApproach;
    /**
     * Generate a simplicity-focused approach
     */
    private generateSimplicityApproach;
    /**
     * Generate a scalability-focused approach
     */
    private generateScalabilityApproach;
    /**
     * Generate a maintainability-focused approach
     */
    private generateMaintainabilityApproach;
    /**
     * Generate a general approach (fallback)
     */
    private generateGeneralApproach;
    /**
     * Convert approach templates to approaches
     */
    private convertTemplatesToApproaches;
    /**
     * Create agent profile from template
     */
    private createAgentProfileFromTemplate;
    /**
     * Create workflow configuration
     */
    private createWorkflowConfig;
    /**
     * Generate comprehensive report
     */
    private generateReport;
    /**
     * Save detailed report to file
     */
    private saveDetailedReport;
    /**
     * Handle workflow completion
     */
    private handleWorkflowCompleted;
    /**
     * Handle workflow failure
     */
    private handleWorkflowFailed;
    /**
     * Get available MCP servers
     */
    getAvailableMCPServers(): Promise<import("./mcp-integration/discovery.js").MCPServerInfo[]>;
    /**
     * Quick method for simple parallel exploration
     */
    quickExplore(taskDescription: string, options?: ParallelExplorationOptions): Promise<WorkflowResult>;
}
