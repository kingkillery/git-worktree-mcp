#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { GitWorktreeManager } from "./worktree-manager.js";
import { ParManager } from "./par-manager.js";
import { ToolDefinition } from "./tools.js";
import { EnhancedParallelExplorer } from "./enhanced-parallel-explorer.js";

const server = new Server(
  {
    name: "git-worktree-mcp",
    version: "2.0.0-enhanced",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const worktreeManager = new GitWorktreeManager();
const parManager = new ParManager();
const parallelExplorer = new EnhancedParallelExplorer();

const featureNameSchema = () => z.string()
  .min(1, "Feature name cannot be empty")
  .regex(/^[a-zA-Z0-9_-]+$/, "Feature name can only contain letters, numbers, hyphens, and underscores")
  .refine(name => !name.startsWith("-") && !name.endsWith("-"), "Feature name cannot start or end with a hyphen");

const createFeatureWorktreeTool = {
  name: "create_feature_worktree",
  description: "Create a new git worktree for feature development with automatic config file copying",
  inputSchema: z.object({
    featureName: featureNameSchema()
      .describe("Name of the feature branch and worktree"),
  }),
  handler: async (args: { featureName: string }) => {
    const result = await worktreeManager.createFeatureWorktree(args.featureName);
    if (result.success && result.path) {
      return {
        ...result,
        hint: `To work on this feature with Claude Code, run: cd ${result.path} && export $(cat .env | xargs) && claude`
      };
    }
    return result;
  }
} satisfies ToolDefinition & { handler: Function };

const listWorktreesTool = {
  name: "list_worktrees", 
  description: "List all active git worktrees",
  inputSchema: z.object({}),
  handler: async () => {
    return await worktreeManager.listWorktrees();
  }
} satisfies ToolDefinition & { handler: Function };

const cleanupWorktreeTool = {
  name: "cleanup_worktree",
  description: "Safely remove a git worktree after checking for uncommitted changes",
  inputSchema: z.object({
    featureName: featureNameSchema()
      .describe("Name of the feature worktree to cleanup"),
  }),
  handler: async (args: { featureName: string }) => {
    return await worktreeManager.cleanupWorktree(args.featureName);
  }
} satisfies ToolDefinition & { handler: Function };

const getWorktreeStatusTool = {
  name: "get_worktree_status",
  description: "Get the status of a specific git worktree including branch info and changes", 
  inputSchema: z.object({
    featureName: featureNameSchema()
      .describe("Name of the feature worktree to check status"),
  }),
  handler: async (args: { featureName: string }) => {
    return await worktreeManager.getWorktreeStatus(args.featureName);
  }
} satisfies ToolDefinition & { handler: Function };

const setupParallelWorkflowTool = {
  name: "setup_parallel_workflow",
  description: "Create multiple git worktrees so manager and worker agents can explore iterations in parallel",
  inputSchema: z.object({
    workflowName: featureNameSchema()
      .describe("Logical workflow name. Each iteration will be suffixed with this name."),
    iterationCount: z.number()
      .int()
      .min(2, "Use at least two iterations for a parallel workflow")
      .max(10, "Limit iterations to 10 to avoid git overload")
      .optional()
      .describe("Number of parallel worktrees to create when agent labels are not specified"),
    agentLabels: z.array(
      featureNameSchema()
        .describe("A label for each agent/iteration (letters, numbers, hyphen/underscore only)")
    )
      .min(2, "Provide at least two agent labels for a parallel workflow")
      .max(10, "Limit agent labels to 10 to avoid git overload")
      .optional()
      .describe("Optional explicit labels for each agent iteration"),
  }),
  handler: async (args: { workflowName: string; iterationCount?: number; agentLabels?: string[] }) => {
    return await worktreeManager.setupParallelWorkflow(args.workflowName, {
      iterationCount: args.iterationCount,
      agentLabels: args.agentLabels,
    });
  }
} satisfies ToolDefinition & { handler: Function };

const getParallelWorkflowStatusTool = {
  name: "get_parallel_workflow_status",
  description: "Gather status for every worktree tied to a workflow so reviewer agents can compile results and vote",
  inputSchema: z.object({
    workflowName: featureNameSchema()
      .describe("Workflow name captured when the iterations were created"),
  }),
  handler: async (args: { workflowName: string }) => {
    return await worktreeManager.getParallelWorkflowStatus(args.workflowName);
  }
} satisfies ToolDefinition & { handler: Function };

// Par CLI Tools
const parStartSessionTool = {
  name: "par_start_session",
  description: "Start a new Par session with a git worktree and tmux session. Requires tmux (works via WSL on Windows).",
  inputSchema: z.object({
    label: z.string()
      .min(1, "Label cannot be empty")
      .regex(/^[a-zA-Z0-9_-]+$/, "Label can only contain letters, numbers, hyphens, and underscores")
      .describe("Globally unique label for the session"),
    branch: z.string().optional().describe("Optional branch name to checkout instead of creating new branch"),
    checkout: z.boolean().optional().describe("Use checkout mode for existing branches/PRs instead of creating new branch"),
  }),
  handler: async (args: { label: string; branch?: string; checkout?: boolean }) => {
    if (args.checkout && args.branch) {
      return await parManager.checkoutSession(args.label, args.branch);
    } else {
      return await parManager.startSession(args.label, {
        branch: args.branch,
        checkout: args.checkout
      });
    }
  }
} satisfies ToolDefinition & { handler: Function };

const parListSessionsTool = {
  name: "par_list_sessions",
  description: "List all active Par sessions globally across repositories",
  inputSchema: z.object({}),
  handler: async () => {
    return await parManager.listSessions();
  }
} satisfies ToolDefinition & { handler: Function };

const parSendCommandTool = {
  name: "par_send_command",
  description: "Send a command to a specific Par session or all sessions. Command will be executed in the tmux session.",
  inputSchema: z.object({
    target: z.string()
      .describe("Target session label or 'all' to send to all sessions"),
    command: z.string()
      .min(1, "Command cannot be empty")
      .describe("Command to send to the session(s)"),
  }),
  handler: async (args: { target: string; command: string }) => {
    if (args.target.toLowerCase() === "all") {
      return await parManager.sendToAllSessions(args.command);
    } else {
      return await parManager.sendCommand(args.target, args.command);
    }
  }
} satisfies ToolDefinition & { handler: Function };

const parOpenSessionTool = {
  name: "par_open_session",
  description: "Open/attach to a specific Par tmux session",
  inputSchema: z.object({
    label: z.string()
      .min(1, "Label cannot be empty")
      .describe("Label of the session to open"),
  }),
  handler: async (args: { label: string }) => {
    return await parManager.openSession(args.label);
  }
} satisfies ToolDefinition & { handler: Function };

const parRemoveSessionTool = {
  name: "par_remove_session",
  description: "Remove a Par session (kills tmux session, removes worktree, deletes branch)",
  inputSchema: z.object({
    label: z.string()
      .min(1, "Label cannot be empty")
      .describe("Label of the session to remove"),
    removeAll: z.boolean().optional().describe("Set to true to remove all sessions instead of specific label"),
  }),
  handler: async (args: { label: string; removeAll?: boolean }) => {
    if (args.removeAll) {
      return await parManager.removeAllSessions();
    } else {
      return await parManager.removeSession(args.label);
    }
  }
} satisfies ToolDefinition & { handler: Function };

const parGetSessionStatusTool = {
  name: "par_get_session_status",
  description: "Get the status of a specific Par session including worktree and tmux information",
  inputSchema: z.object({
    label: z.string()
      .min(1, "Label cannot be empty")
      .describe("Label of the session to check"),
  }),
  handler: async (args: { label: string }) => {
    return await parManager.getSessionStatus(args.label);
  }
} satisfies ToolDefinition & { handler: Function };

const parCreateControlCenterTool = {
  name: "par_create_control_center",
  description: "Create a control center tmux session with separate windows for each Par session",
  inputSchema: z.object({}),
  handler: async () => {
    return await parManager.createControlCenter();
  }
} satisfies ToolDefinition & { handler: Function };

const parStartWorkspaceTool = {
  name: "par_start_workspace",
  description: "Start a multi-repository Par workspace with multiple repos managed together",
  inputSchema: z.object({
    name: z.string()
      .min(1, "Workspace name cannot be empty")
      .regex(/^[a-zA-Z0-9_-]+$/, "Workspace name can only contain letters, numbers, hyphens, and underscores")
      .describe("Name for the workspace"),
    repos: z.array(z.string())
      .min(1, "At least one repository is required")
      .describe("Array of repository names/paths to include in the workspace"),
  }),
  handler: async (args: { name: string; repos: string[] }) => {
    return await parManager.startWorkspace(args.name, args.repos);
  }
} satisfies ToolDefinition & { handler: Function };

const parListWorkspacesTool = {
  name: "par_list_workspaces",
  description: "List all active Par workspaces",
  inputSchema: z.object({}),
  handler: async () => {
    return await parManager.listWorkspaces();
  }
} satisfies ToolDefinition & { handler: Function };

const parRemoveWorkspaceTool = {
  name: "par_remove_workspace",
  description: "Remove a Par workspace and all its associated sessions",
  inputSchema: z.object({
    name: z.string()
      .min(1, "Workspace name cannot be empty")
      .describe("Name of the workspace to remove"),
  }),
  handler: async (args: { name: string }) => {
    return await parManager.removeWorkspace(args.name);
  }
} satisfies ToolDefinition & { handler: Function };

const parTestConnectionTool = {
  name: "par_test_connection",
  description: "Test the connection to Par CLI and verify installation",
  inputSchema: z.object({}),
  handler: async () => {
    const result = await parManager.testConnection();
    return {
      ...result,
      wslEnabled: parManager.isWSLEnabled(),
      platform: process.platform
    };
  }
} satisfies ToolDefinition & { handler: Function };

// Enhanced Parallel Exploration Tools
const parallelExplorationTool = {
  name: "parallel_exploration",
  description: "Execute parallel exploration of multiple solution approaches with AI agents and MCP integration",
  inputSchema: z.object({
    taskName: z.string()
      .min(1, "Task name cannot be empty")
      .describe("Identifier for the exploration task"),
    taskDescription: z.string()
      .min(10, "Task description must be at least 10 characters")
      .describe("Detailed description of the task to explore"),
    numApproaches: z.number()
      .int()
      .min(2, "At least 2 approaches required")
      .max(5, "Maximum 5 approaches to avoid complexity")
      .optional()
      .default(3)
      .describe("Number of approaches to explore (default: 3)"),
    timeout: z.number()
      .int()
      .min(5, "Minimum 5 minutes timeout")
      .max(120, "Maximum 120 minutes timeout")
      .optional()
      .default(60)
      .describe("Timeout in minutes (default: 60)"),
    preserveArtifacts: z.boolean()
      .optional()
      .default(false)
      .describe("Preserve all artifacts after completion (default: false)"),
    autoCleanup: z.boolean()
      .optional()
      .default(true)
      .describe("Automatically clean up worktrees after completion (default: true)")
  }),
  handler: async (args: {
    taskName: string;
    taskDescription: string;
    numApproaches?: number;
    timeout?: number;
    preserveArtifacts?: boolean;
    autoCleanup?: boolean;
  }) => {
    try {
      const result = await parallelExplorer.executeParallelExploration(
        args.taskName,
        args.taskDescription,
        args.numApproaches || 3,
        {
          timeout: args.timeout,
          preserveArtifacts: args.preserveArtifacts,
          autoCleanup: args.autoCleanup
        }
      );

      return {
        success: true,
        workflowId: result.workflowId,
        status: result.status,
        totalDuration: result.totalDuration,
        sessionsCompleted: result.metrics.sessionsCompleted,
        sessionsFailed: result.metrics.sessionsFailed,
        artifactsCreated: result.artifacts.length,
        synthesis: result.synthesis ? {
          selectedApproach: result.synthesis.selectedApproach,
          confidence: result.synthesis.confidence,
          recommendations: result.synthesis.recommendations.slice(0, 3) // Top 3 recommendations
        } : null,
        message: `Parallel exploration completed with ${result.metrics.sessionsCompleted} successful approaches`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Parallel exploration failed'
      };
    }
  }
} satisfies ToolDefinition & { handler: Function };

const mcpDiscoveryTool = {
  name: "mcp_discovery",
  description: "Discover available MCP servers and their capabilities in the current environment",
  inputSchema: z.object({}),
  handler: async () => {
    try {
      const servers = await parallelExplorer.getAvailableMCPServers();
      return {
        success: true,
        serversFound: servers.length,
        servers: servers.map(server => ({
          name: server.name,
          version: server.version,
          available: server.available,
          categories: server.capabilities.categories.map(cat => ({
            name: cat.name,
            toolsCount: cat.tools.length
          })),
          performance: {
            responseTime: server.capabilities.performance.responseTime,
            reliability: server.capabilities.performance.reliability
          }
        })),
        message: `Discovered ${servers.length} MCP servers`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Discovery failed',
        message: 'Failed to discover MCP servers'
      };
    }
  }
} satisfies ToolDefinition & { handler: Function };

const tools = [
  // Original Git Worktree Tools
  createFeatureWorktreeTool,
  listWorktreesTool,
  cleanupWorktreeTool,
  getWorktreeStatusTool,
  setupParallelWorkflowTool,
  getParallelWorkflowStatusTool,
  // Par CLI Tools
  parTestConnectionTool,
  parStartSessionTool,
  parListSessionsTool,
  parSendCommandTool,
  parOpenSessionTool,
  parRemoveSessionTool,
  parGetSessionStatusTool,
  parCreateControlCenterTool,
  parStartWorkspaceTool,
  parListWorkspacesTool,
  parRemoveWorkspaceTool,
  // Enhanced Parallel Exploration Tools
  parallelExplorationTool,
  mcpDiscoveryTool,
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema: zodToJsonSchema(inputSchema),
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const validatedArgs = tool.inputSchema.parse(args);
    const result = await (tool as any).handler(validatedArgs);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: errorMessage,
            tool: name,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Git Worktree MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
