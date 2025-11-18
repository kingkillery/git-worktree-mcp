/**
 * MCP Server Discovery and Integration System
 *
 * This module provides automatic discovery and intelligent integration
 * with available MCP servers in the environment.
 */
export interface MCPServerInfo {
    name: string;
    version: string;
    capabilities: MCPServerCapabilities;
    available: boolean;
    lastChecked: Date;
}
export interface MCPServerCapabilities {
    tools: string[];
    resources: string[];
    categories: ServerCategory[];
    performance: PerformanceProfile;
}
export interface ServerCategory {
    name: string;
    tools: string[];
    description: string;
}
export interface PerformanceProfile {
    responseTime: number;
    reliability: number;
    throughput: number;
}
export interface TaskRequirement {
    category: string;
    tools: string[];
    priority: 'high' | 'medium' | 'low';
}
/**
 * Auto-discovers available MCP servers and analyzes their capabilities
 */
export declare class MCPServerDiscovery {
    private servers;
    private readonly DISCOVERY_TIMEOUT;
    constructor();
    /**
     * Initialize the discovery system
     */
    private initializeDiscovery;
    /**
     * Discover all available MCP servers in the environment
     */
    discoverAvailableServers(): Promise<MCPServerInfo[]>;
    /**
     * Discover servers via MCP list command
     */
    private discoverViaMCPList;
    /**
     * Discover servers via environment variables
     */
    private discoverViaEnvironmentVariables;
    /**
     * Discover servers via configuration files
     */
    private discoverViaConfigFiles;
    /**
     * Include default well-known servers
     */
    private discoverViaDefaultServers;
    /**
     * Parse server information from command line output
     */
    private parseServerLine;
    /**
     * Remove duplicate server entries
     */
    private deduplicateServers;
    /**
     * Analyze server capabilities by querying the server
     */
    private analyzeServerCapabilities;
    /**
     * Parse tools from MCP tools command output
     */
    private parseToolsOutput;
    /**
     * Categorize tools based on their names and patterns
     */
    private categorizeTools;
    /**
     * Get description for a category
     */
    private getCategoryDescription;
    /**
     * Test if a server is available and responsive
     */
    private testServerAvailability;
    /**
     * Refresh the status of all known servers
     */
    private refreshServerStatus;
    /**
     * Get the best server for a specific task
     */
    getBestServerForTask(requirements: TaskRequirement): Promise<MCPServerInfo | null>;
    /**
     * Score a server based on how well it matches task requirements
     */
    private scoreServerForTask;
    /**
     * Get all available servers
     */
    getAllServers(): MCPServerInfo[];
    /**
     * Get servers by category
     */
    getServersByCategory(category: string): MCPServerInfo[];
}
