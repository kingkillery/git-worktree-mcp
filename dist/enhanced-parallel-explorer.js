/**
 * Enhanced Parallel Explorer - Main Entry Point
 *
 * Integrates all the enhanced components to provide a seamless
 * parallel exploration experience with MCP server integration.
 */
import { EventEmitter } from 'events';
import { WorkflowOrchestrator } from './workflow/workflow-orchestrator';
import { MCPServerDiscovery } from './mcp-integration/discovery';
/**
 * Main class for enhanced parallel exploration
 */
export class EnhancedParallelExplorer extends EventEmitter {
    workflowOrchestrator;
    mcpDiscovery;
    constructor() {
        super();
        this.workflowOrchestrator = new WorkflowOrchestrator();
        this.mcpDiscovery = new MCPServerDiscovery();
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        this.workflowOrchestrator.on('workflow-completed', this.handleWorkflowCompleted.bind(this));
        this.workflowOrchestrator.on('workflow-failed', this.handleWorkflowFailed.bind(this));
    }
    /**
     * Execute a parallel exploration task with automatic strategy generation
     */
    async executeParallelExploration(taskName, taskDescription, numApproaches = 3, options = {}) {
        console.log(`🚀 Starting enhanced parallel exploration: ${taskName}`);
        console.log(`📝 Task: ${taskDescription}`);
        console.log(`🔢 Approaches: ${numApproaches}`);
        try {
            // Step 1: Discover and validate MCP servers
            console.log(`🔍 Discovering MCP servers...`);
            await this.mcpDiscovery.discoverAvailableServers();
            const availableServers = this.mcpDiscovery.getAllServers();
            console.log(`✅ Found ${availableServers.length} MCP servers`);
            // Step 2: Generate intelligent approaches based on task
            console.log(`🧠 Generating approaches for task...`);
            const approaches = await this.generateApproaches(taskDescription, numApproaches);
            // Step 3: Create workflow configuration
            const workflowConfig = this.createWorkflowConfig(taskName, taskDescription, approaches, options);
            // Step 4: Execute the workflow
            console.log(`⚡ Starting workflow execution...`);
            const result = await this.workflowOrchestrator.executeWorkflow(workflowConfig);
            // Step 5: Generate comprehensive report
            await this.generateReport(result);
            return result;
        }
        catch (error) {
            console.error(`❌ Parallel exploration failed:`, error);
            throw error;
        }
    }
    /**
     * Execute parallel exploration with predefined approaches
     */
    async executeWithPredefinedApproaches(taskName, taskDescription, approachTemplates, options = {}) {
        console.log(`🚀 Starting parallel exploration with ${approachTemplates.length} predefined approaches`);
        try {
            // Discover MCP servers
            await this.mcpDiscovery.discoverAvailableServers();
            // Convert templates to approaches
            const approaches = await this.convertTemplatesToApproaches(approachTemplates, taskDescription);
            // Create and execute workflow
            const workflowConfig = this.createWorkflowConfig(taskName, taskDescription, approaches, options);
            const result = await this.workflowOrchestrator.executeWorkflow(workflowConfig);
            await this.generateReport(result);
            return result;
        }
        catch (error) {
            console.error(`❌ Parallel exploration failed:`, error);
            throw error;
        }
    }
    /**
     * Generate intelligent approaches based on task description
     */
    async generateApproaches(taskDescription, numApproaches) {
        // Analyze task to determine optimal approach types
        const taskAnalysis = await this.analyzeTask(taskDescription);
        const approachGenerators = {
            'performance': () => this.generatePerformanceApproach(taskDescription),
            'architecture': () => this.generateArchitectureApproach(taskDescription),
            'security': () => this.generateSecurityApproach(taskDescription),
            'simplicity': () => this.generateSimplicityApproach(taskDescription),
            'scalability': () => this.generateScalabilityApproach(taskDescription),
            'maintainability': () => this.generateMaintainabilityApproach(taskDescription)
        };
        // Select best approach types based on task analysis
        const selectedTypes = this.selectApproachTypes(taskAnalysis, numApproaches, Object.keys(approachGenerators));
        const approaches = [];
        for (let i = 0; i < Math.min(numApproaches, selectedTypes.length); i++) {
            const type = selectedTypes[i];
            const generator = approachGenerators[type];
            if (generator) {
                const approach = await generator();
                approaches.push(approach);
            }
        }
        // Fill remaining slots with general approaches if needed
        while (approaches.length < numApproaches) {
            const generalApproach = await this.generateGeneralApproach(taskDescription, approaches.length + 1);
            approaches.push(generalApproach);
        }
        return approaches;
    }
    /**
     * Analyze task to determine optimal approach types
     */
    async analyzeTask(taskDescription) {
        const analysis = {
            performance: 0.2,
            architecture: 0.2,
            security: 0.1,
            simplicity: 0.2,
            scalability: 0.2,
            maintainability: 0.1
        };
        const description = taskDescription.toLowerCase();
        // Look for keywords indicating approach priorities
        const keywords = {
            performance: ['fast', 'quick', 'optimize', 'performance', 'speed', 'efficient'],
            architecture: ['design', 'architecture', 'structure', 'pattern', 'modular'],
            security: ['secure', 'auth', 'encrypt', 'protect', 'security', 'safe'],
            simplicity: ['simple', 'easy', 'clean', 'basic', 'straightforward'],
            scalability: ['scale', 'large', 'big', 'grow', 'many', 'distributed'],
            maintainability: ['maintain', 'extend', 'modify', 'flexible', 'adaptable']
        };
        for (const [category, words] of Object.entries(keywords)) {
            const matches = words.filter(word => description.includes(word)).length;
            if (matches > 0) {
                analysis[category] = Math.min(0.8, analysis[category] + matches * 0.1);
            }
        }
        return analysis;
    }
    /**
     * Select the best approach types based on analysis
     */
    selectApproachTypes(analysis, numApproaches, availableTypes) {
        const sorted = Object.entries(analysis)
            .sort(([, a], [, b]) => b - a)
            .map(([type]) => type)
            .filter(type => availableTypes.includes(type));
        return sorted.slice(0, numApproaches);
    }
    /**
     * Generate a performance-optimized approach
     */
    async generatePerformanceApproach(taskDescription) {
        return {
            id: `approach-perf-${Date.now()}`,
            name: 'Performance-Optimized Approach',
            description: `Maximum performance optimization for: ${taskDescription}`,
            strategy: 'Focus on raw speed, memory efficiency, and algorithmic optimization',
            requirements: {
                category: 'performance',
                tools: ['benchmark', 'profile', 'optimize'],
                priority: 'high'
            },
            agentProfile: {
                id: 'perf-agent',
                role: {
                    name: 'Performance Optimizer',
                    description: 'Specializes in performance optimization and efficiency',
                    priorities: ['speed', 'memory', 'throughput'],
                    collaborationStyle: 'competitive'
                },
                preferredMCPServers: ['performance-analyzer-mcp', 'profiler-mcp'],
                tools: ['benchmark', 'profile', 'optimize', 'memory-analysis'],
                constraints: {
                    maxExecutionTime: 30,
                    memoryLimit: 2048,
                    allowedTools: ['all'],
                    forbiddenTools: []
                },
                expertise: ['performance optimization', 'algorithm design', 'memory management']
            }
        };
    }
    /**
     * Generate an architecture-focused approach
     */
    async generateArchitectureApproach(taskDescription) {
        return {
            id: `approach-arch-${Date.now()}`,
            name: 'Clean Architecture Approach',
            description: `Well-structured, maintainable architecture for: ${taskDescription}`,
            strategy: 'Focus on SOLID principles, clean code, and modular design',
            requirements: {
                category: 'architecture',
                tools: ['design', 'structure', 'document'],
                priority: 'high'
            },
            agentProfile: {
                id: 'arch-agent',
                role: {
                    name: 'Architecture Designer',
                    description: 'Specializes in clean architecture and design patterns',
                    priorities: ['maintainability', 'scalability', 'testability'],
                    collaborationStyle: 'cooperative'
                },
                preferredMCPServers: ['architecture-mcp', 'design-patterns-mcp'],
                tools: ['design', 'structure', 'document', 'pattern-detection'],
                constraints: {
                    maxExecutionTime: 45,
                    memoryLimit: 1024,
                    allowedTools: ['all'],
                    forbiddenTools: ['quick-fixes']
                },
                expertise: ['software architecture', 'design patterns', 'SOLID principles']
            }
        };
    }
    /**
     * Generate a security-focused approach
     */
    async generateSecurityApproach(taskDescription) {
        return {
            id: `approach-sec-${Date.now()}`,
            name: 'Security-First Approach',
            description: `Secure implementation with comprehensive protection for: ${taskDescription}`,
            strategy: 'Prioritize security, validation, and protection against vulnerabilities',
            requirements: {
                category: 'security',
                tools: ['validate', 'encrypt', 'audit'],
                priority: 'high'
            },
            agentProfile: {
                id: 'sec-agent',
                role: {
                    name: 'Security Specialist',
                    description: 'Specializes in security best practices and vulnerability prevention',
                    priorities: ['security', 'validation', 'compliance'],
                    collaborationStyle: 'independent'
                },
                preferredMCPServers: ['security-scanner-mcp', 'crypto-mcp'],
                tools: ['validate', 'encrypt', 'audit', 'penetration-test'],
                constraints: {
                    maxExecutionTime: 60,
                    memoryLimit: 1536,
                    allowedTools: ['security-tools'],
                    forbiddenTools: ['insecure-libraries']
                },
                expertise: ['security best practices', 'cryptography', 'vulnerability assessment']
            }
        };
    }
    /**
     * Generate a simplicity-focused approach
     */
    async generateSimplicityApproach(taskDescription) {
        return {
            id: `approach-simple-${Date.now()}`,
            name: 'Simple & Direct Approach',
            description: `Straightforward, easy-to-understand solution for: ${taskDescription}`,
            strategy: 'Focus on clarity, simplicity, and direct implementation',
            requirements: {
                category: 'simplicity',
                tools: ['implement', 'test', 'document'],
                priority: 'medium'
            },
            agentProfile: {
                id: 'simple-agent',
                role: {
                    name: 'Generalist',
                    description: 'Focuses on simple, clean, direct solutions',
                    priorities: ['simplicity', 'clarity', 'maintainability'],
                    collaborationStyle: 'cooperative'
                },
                preferredMCPServers: ['git-worktree-mcp', 'file-organizer-mcp'],
                tools: ['implement', 'test', 'document'],
                constraints: {
                    maxExecutionTime: 20,
                    memoryLimit: 512,
                    allowedTools: ['basic-tools'],
                    forbiddenTools: ['complex-patterns']
                },
                expertise: ['clean code', 'simple design', 'documentation']
            }
        };
    }
    /**
     * Generate a scalability-focused approach
     */
    async generateScalabilityApproach(taskDescription) {
        return {
            id: `approach-scale-${Date.now()}`,
            name: 'Scalable Architecture Approach',
            description: `Solution designed for growth and scale: ${taskDescription}`,
            strategy: 'Design for horizontal scaling, load distribution, and future growth',
            requirements: {
                category: 'scalability',
                tools: ['scale', 'distribute', 'optimize'],
                priority: 'high'
            },
            agentProfile: {
                id: 'scale-agent',
                role: {
                    name: 'Scalability Expert',
                    description: 'Specializes in distributed systems and scalable architectures',
                    priorities: ['scalability', 'performance', 'reliability'],
                    collaborationStyle: 'cooperative'
                },
                preferredMCPServers: ['distributed-systems-mcp', 'kubernetes-mcp'],
                tools: ['scale', 'distribute', 'load-balance', 'monitor'],
                constraints: {
                    maxExecutionTime: 50,
                    memoryLimit: 4096,
                    allowedTools: ['scaling-tools'],
                    forbiddenTools: ['single-node-only']
                },
                expertise: ['distributed systems', 'load balancing', 'horizontal scaling']
            }
        };
    }
    /**
     * Generate a maintainability-focused approach
     */
    async generateMaintainabilityApproach(taskDescription) {
        return {
            id: `approach-maintain-${Date.now()}`,
            name: 'Maintainable Code Approach',
            description: `Highly maintainable and extensible solution: ${taskDescription}`,
            strategy: 'Prioritize code quality, documentation, and ease of future modifications',
            requirements: {
                category: 'maintainability',
                tools: ['refactor', 'document', 'test'],
                priority: 'medium'
            },
            agentProfile: {
                id: 'maintain-agent',
                role: {
                    name: 'Code Quality Specialist',
                    description: 'Focuses on maintainable, clean, and well-documented code',
                    priorities: ['maintainability', 'documentation', 'testing'],
                    collaborationStyle: 'cooperative'
                },
                preferredMCPServers: ['code-quality-mcp', 'documentation-mcp'],
                tools: ['refactor', 'document', 'test', 'code-analysis'],
                constraints: {
                    maxExecutionTime: 35,
                    memoryLimit: 1024,
                    allowedTools: ['quality-tools'],
                    forbiddenTools: ['code-golf']
                },
                expertise: ['code refactoring', 'documentation', 'testing best practices']
            }
        };
    }
    /**
     * Generate a general approach (fallback)
     */
    async generateGeneralApproach(taskDescription, index) {
        return {
            id: `approach-general-${Date.now()}-${index}`,
            name: `Alternative Approach ${index}`,
            description: `Alternative solution for: ${taskDescription}`,
            strategy: `Alternative implementation strategy focusing on different aspects`,
            requirements: {
                category: 'general',
                tools: ['implement', 'test', 'optimize'],
                priority: 'medium'
            },
            agentProfile: {
                id: `general-agent-${index}`,
                role: {
                    name: 'Generalist',
                    description: 'Versatile agent capable of handling various types of tasks',
                    priorities: ['functionality', 'quality', 'efficiency'],
                    collaborationStyle: 'cooperative'
                },
                preferredMCPServers: ['git-worktree-mcp'],
                tools: ['implement', 'test', 'optimize'],
                constraints: {
                    maxExecutionTime: 30,
                    memoryLimit: 1024,
                    allowedTools: ['all'],
                    forbiddenTools: []
                },
                expertise: ['full-stack development', 'problem solving', 'adaptability']
            }
        };
    }
    /**
     * Convert approach templates to approaches
     */
    async convertTemplatesToApproaches(templates, taskDescription) {
        return templates.map((template, index) => ({
            id: `approach-template-${index}-${Date.now()}`,
            name: template.name,
            description: `${template.description} for: ${taskDescription}`,
            strategy: template.strategy,
            requirements: {
                category: template.category,
                tools: template.tools,
                priority: 'medium'
            },
            agentProfile: this.createAgentProfileFromTemplate(template)
        }));
    }
    /**
     * Create agent profile from template
     */
    createAgentProfileFromTemplate(template) {
        const roleMap = {
            'performance-optimizer': {
                name: 'Performance Optimizer',
                description: 'Specializes in performance optimization',
                priorities: ['speed', 'efficiency'],
                collaborationStyle: 'competitive'
            },
            'architecture-designer': {
                name: 'Architecture Designer',
                description: 'Specializes in software architecture',
                priorities: ['structure', 'patterns'],
                collaborationStyle: 'cooperative'
            },
            'security-specialist': {
                name: 'Security Specialist',
                description: 'Specializes in security implementation',
                priorities: ['security', 'validation'],
                collaborationStyle: 'independent'
            },
            'generalist': {
                name: 'Generalist',
                description: 'Versatile problem solver',
                priorities: ['functionality', 'quality'],
                collaborationStyle: 'cooperative'
            }
        };
        return {
            id: `agent-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
            role: roleMap[template.agentRole] || roleMap['generalist'],
            preferredMCPServers: ['git-worktree-mcp'],
            tools: template.tools,
            constraints: {
                maxExecutionTime: 30,
                memoryLimit: 1024,
                allowedTools: ['all'],
                forbiddenTools: []
            },
            expertise: [template.category, 'problem solving']
        };
    }
    /**
     * Create workflow configuration
     */
    createWorkflowConfig(taskName, taskDescription, approaches, options) {
        return {
            id: `workflow-${taskName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: taskName,
            description: taskDescription,
            approaches,
            mcpServers: options.preferredMCPServers,
            options: {
                autoCleanup: options.autoCleanup ?? true,
                preserveArtifacts: options.preserveArtifacts ?? false,
                timeout: options.timeout ?? 60, // 60 minutes default
                parallelism: options.parallelism ?? approaches.length,
                notifyOnCompletion: options.notifyOnCompletion ?? false
            }
        };
    }
    /**
     * Generate comprehensive report
     */
    async generateReport(result) {
        console.log(`\n📊 ===== PARALLEL EXPLORATION REPORT =====`);
        console.log(`🆔 Workflow ID: ${result.workflowId}`);
        console.log(`⏱️ Total Duration: ${(result.totalDuration / 1000).toFixed(2)} seconds`);
        console.log(`✅ Sessions Completed: ${result.metrics.sessionsCompleted}`);
        console.log(`❌ Sessions Failed: ${result.metrics.sessionsFailed}`);
        console.log(`🎯 Parallelism Achieved: ${(result.metrics.parallelismAchieved * 100).toFixed(1)}%`);
        if (result.synthesis) {
            console.log(`\n🎯 ===== SYNTHESIS RESULTS =====`);
            console.log(`🏆 Selected Approach: ${result.synthesis.selectedApproach}`);
            console.log(`📈 Confidence: ${(result.synthesis.confidence * 100).toFixed(1)}%`);
            console.log(`\n💡 Recommendations:`);
            result.synthesis.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }
        console.log(`\n📁 ===== ARTIFACTS CREATED =====`);
        result.artifacts.forEach(artifact => {
            console.log(`   • ${artifact.name} (${artifact.type})`);
        });
        console.log(`\n🔧 ===== MCP SERVERS UTILIZED =====`);
        const uniqueServers = new Set(result.sessions.map(s => s.mcpIntegration.server.name));
        uniqueServers.forEach(server => {
            console.log(`   • ${server}`);
        });
        console.log(`=======================================\n`);
        // Save detailed report to file
        await this.saveDetailedReport(result);
    }
    /**
     * Save detailed report to file
     */
    async saveDetailedReport(result) {
        const report = {
            summary: {
                workflowId: result.workflowId,
                status: result.status,
                totalDuration: result.totalDuration,
                metrics: result.metrics
            },
            synthesis: result.synthesis,
            sessions: result.sessions.map(session => ({
                id: session.id,
                approach: session.approach.name,
                status: session.status,
                artifacts: session.artifacts.length,
                mcpServer: session.mcpIntegration.server.name
            })),
            artifacts: result.artifacts.map(artifact => ({
                id: artifact.id,
                name: artifact.name,
                type: artifact.type,
                sessionId: artifact.sessionId
            })),
            generatedAt: new Date().toISOString()
        };
        // In a real implementation, this would save to a file
        console.log(`📄 Detailed report saved: parallel-exploration-report-${result.workflowId}.json`);
    }
    /**
     * Handle workflow completion
     */
    handleWorkflowCompleted(result) {
        this.emit('exploration-completed', result);
    }
    /**
     * Handle workflow failure
     */
    handleWorkflowFailed(result, error) {
        this.emit('exploration-failed', result, error);
    }
    /**
     * Get available MCP servers
     */
    async getAvailableMCPServers() {
        await this.mcpDiscovery.discoverAvailableServers();
        return this.mcpDiscovery.getAllServers();
    }
    /**
     * Quick method for simple parallel exploration
     */
    async quickExplore(taskDescription, options = {}) {
        const taskName = taskDescription.split(' ').slice(0, 3).join('-').toLowerCase();
        return this.executeParallelExploration(taskName, taskDescription, 3, options);
    }
}
