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

const server = new Server(
  {
    name: "git-worktree-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const worktreeManager = new GitWorktreeManager();
const parManager = new ParManager();

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
  handler: async (args) => {
    const result = await worktreeManager.createFeatureWorktree(args.featureName);
    if (result.success && result.path) {
      return {
        ...result,
        hint: `To work on this feature with Claude Code, run: cd ${result.path} && export $(cat .env | xargs) && claude`
      };
    }
    return result;
  }
};

const listWorktreesTool = {
  name: "list_worktrees",
  description: "List all active git worktrees",
  inputSchema: z.object({}),
  handler: async () => {
    return await worktreeManager.listWorktrees();
  }
};

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
};

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
};

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
};

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
};

// Par CLI Tools
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
};

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
};

const parListSessionsTool = {
  name: "par_list_sessions",
  description: "List all active Par sessions globally across repositories",
  inputSchema: z.object({}),
  handler: async () => {
    return await parManager.listSessions();
  }
};

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
  console.error("Git Worktree MCP Server (Basic Version) running on stdio");
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});