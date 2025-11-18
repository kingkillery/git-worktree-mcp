import { execSync } from "child_process";
import { existsSync, statSync, readdirSync, copyFileSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";

export interface WorktreeResult {
  success: boolean;
  message: string;
  path?: string;
  branch?: string;
  configFilesCopied?: string[];
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  status: string;
}

export interface CleanupResult {
  success: boolean;
  message: string;
  removedPath?: string;
  warnings?: string[];
}

export interface WorktreeStatus {
  exists: boolean;
  path?: string;
  branch?: string;
  commit?: string;
  hasUncommittedChanges?: boolean;
  modifiedFiles?: string[];
  untrackedFiles?: string[];
}

export interface WorkflowIterationSummary extends WorktreeResult {
  featureName: string;
  label: string;
  instructions?: string;
}

export interface ParallelWorkflowSetupResult {
  success: boolean;
  workflowName: string;
  message: string;
  iterations: WorkflowIterationSummary[];
  metadataPath: string;
  summary: {
    successes: number;
    failures: number;
  };
}

export interface WorkflowIterationStatus extends WorktreeStatus {
  featureName: string;
  label: string;
  instructions?: string;
}

export interface ParallelWorkflowStatusResult {
  success: boolean;
  workflowName: string;
  metadataPath?: string;
  iterations: WorkflowIterationStatus[];
  readyCount: number;
  dirtyCount: number;
  missingCount: number;
  recommendations?: string[];
}

export interface ParallelWorkflowOptions {
  iterationCount?: number;
  agentLabels?: string[];
}

interface WorkflowIterationMetadata {
  featureName: string;
  label: string;
  branch?: string;
  path?: string;
  success?: boolean;
}

interface WorkflowMetadata {
  workflowName: string;
  createdAt: string;
  iterations: WorkflowIterationMetadata[];
}

export class GitWorktreeManager {
  private readonly CONFIG_FILES = [
    ".env",
    ".env.local", 
    ".env.development",
    ".env.production",
    ".mcp.json",
  ];
  
  private readonly CONFIG_DIRS = [
    ".claude",
    ".vscode",
  ];

  private readonly WORKFLOW_STATE_DIR = ".worktree/workflows";

  private isInGitRepo(): boolean {
    try {
      execSync("git rev-parse --git-dir", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  private getRepoRoot(): string {
    try {
      return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
    } catch (error) {
      throw new Error("Not in a git repository");
    }
  }

  private getWorkflowMetadataDirectory(repoRoot: string): string {
    return join(repoRoot, this.WORKFLOW_STATE_DIR);
  }

  private ensureWorkflowMetadataDirectory(repoRoot: string): string {
    const workflowDir = this.getWorkflowMetadataDirectory(repoRoot);
    if (!existsSync(workflowDir)) {
      mkdirSync(workflowDir, { recursive: true });
    }
    return workflowDir;
  }

  private getWorkflowMetadataPath(repoRoot: string, workflowName: string): string {
    return join(this.getWorkflowMetadataDirectory(repoRoot), `${workflowName}.json`);
  }

  private readWorkflowMetadata(repoRoot: string, workflowName: string): WorkflowMetadata | null {
    const metadataPath = this.getWorkflowMetadataPath(repoRoot, workflowName);
    if (!existsSync(metadataPath)) {
      return null;
    }

    try {
      const contents = readFileSync(metadataPath, { encoding: "utf-8" });
      return JSON.parse(contents) as WorkflowMetadata;
    } catch (error) {
      console.error(`Failed to read workflow metadata for ${workflowName}: ${error}`);
      return null;
    }
  }

  private writeWorkflowMetadata(repoRoot: string, workflowName: string, metadata: WorkflowMetadata): string {
    const workflowDir = this.ensureWorkflowMetadataDirectory(repoRoot);
    const metadataPath = join(workflowDir, `${workflowName}.json`);
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), { encoding: "utf-8" });
    return metadataPath;
  }

  private formatWorktreeHint(worktreePath: string): string {
    return `cd ${worktreePath} && export $(cat .env | xargs) && claude`;
  }

  private deriveFilesystemWorkflow(repoRoot: string, workflowName: string): WorkflowIterationMetadata[] {
    const worktreeRoot = join(repoRoot, ".worktree");
    if (!existsSync(worktreeRoot)) {
      return [];
    }

    const entries = readdirSync(worktreeRoot, { withFileTypes: true });
    const prefix = `${workflowName}-`;

    return entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
      .map((entry) => {
        const featureName = entry.name;
        return {
          featureName,
          label: featureName.substring(prefix.length) || entry.name,
          branch: `feature/${featureName}`,
          path: join(worktreeRoot, entry.name),
          success: true,
        };
      });
  }


  private copyConfigFiles(sourceDir: string, targetDir: string): string[] {
    const copiedFiles: string[] = [];

    for (const fileName of this.CONFIG_FILES) {
      const sourcePath = join(sourceDir, fileName);
      const targetPath = join(targetDir, fileName);
      
      if (existsSync(sourcePath)) {
        try {
          copyFileSync(sourcePath, targetPath);
          copiedFiles.push(fileName);
        } catch (error) {
          console.error(`Warning: Could not copy ${fileName}: ${error}`);
        }
      }
    }

    for (const dirName of this.CONFIG_DIRS) {
      const sourcePath = join(sourceDir, dirName);
      const targetPath = join(targetDir, dirName);
      
      if (existsSync(sourcePath) && statSync(sourcePath).isDirectory()) {
        try {
          this.copyDirectory(sourcePath, targetPath);
          copiedFiles.push(dirName + "/");
        } catch (error) {
          console.error(`Warning: Could not copy directory ${dirName}: ${error}`);
        }
      }
    }

    return copiedFiles;
  }

  private copyDirectory(source: string, target: string): void {
    if (!existsSync(target)) {
      mkdirSync(target, { recursive: true });
    }

    const files = readdirSync(source);
    for (const file of files) {
      const sourcePath = join(source, file);
      const targetPath = join(target, file);
      
      if (statSync(sourcePath).isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        copyFileSync(sourcePath, targetPath);
      }
    }
  }

  async setupParallelWorkflow(workflowName: string, options: ParallelWorkflowOptions): Promise<ParallelWorkflowSetupResult> {
    try {
      if (!this.isInGitRepo()) {
        return {
          success: false,
          workflowName,
          message: "Not in a git repository",
          iterations: [],
          metadataPath: "",
          summary: { successes: 0, failures: 0 },
        };
      }

      const repoRoot = this.getRepoRoot();
      this.ensureWorkflowMetadataDirectory(repoRoot);

      const metadataPath = this.getWorkflowMetadataPath(repoRoot, workflowName);
      if (existsSync(metadataPath)) {
        return {
          success: false,
          workflowName,
          message: `Workflow '${workflowName}' already exists. Clean it up or choose a new name.`,
          iterations: [],
          metadataPath,
          summary: { successes: 0, failures: 0 },
        };
      }

      const iterationTotal = options.agentLabels?.length
        ? options.agentLabels.length
        : options.iterationCount ?? 2;

      const labels = options.agentLabels?.length
        ? options.agentLabels
        : Array.from({ length: iterationTotal }, (_, idx) => `iteration-${idx + 1}`);

      if (labels.length === 0) {
        return {
          success: false,
          workflowName,
          message: "No iterations requested. Provide an iteration count or agent labels.",
          iterations: [],
          metadataPath,
          summary: { successes: 0, failures: 0 },
        };
      }

      const iterations: WorkflowIterationSummary[] = [];

      for (const label of labels) {
        const featureName = `${workflowName}-${label}`;
        const result = await this.createFeatureWorktree(featureName);
        iterations.push({
          ...result,
          featureName,
          label,
          instructions: result.success && result.path
            ? this.formatWorktreeHint(result.path)
            : undefined,
        });
      }

      const metadata: WorkflowMetadata = {
        workflowName,
        createdAt: new Date().toISOString(),
        iterations: iterations.map((iteration) => ({
          featureName: iteration.featureName,
          label: iteration.label,
          branch: iteration.branch,
          path: iteration.path,
          success: iteration.success,
        })),
      };

      const savedMetadataPath = this.writeWorkflowMetadata(repoRoot, workflowName, metadata);

      const successes = iterations.filter((iteration) => iteration.success).length;
      const failures = iterations.length - successes;

      return {
        success: failures === 0,
        workflowName,
        message: `Prepared ${iterations.length} parallel iteration(s) for workflow '${workflowName}'`,
        iterations,
        metadataPath: savedMetadataPath,
        summary: {
          successes,
          failures,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        workflowName,
        message: `Failed to set up workflow '${workflowName}': ${errorMessage}`,
        iterations: [],
        metadataPath: "",
        summary: { successes: 0, failures: 0 },
      };
    }
  }

  async createFeatureWorktree(featureName: string): Promise<WorktreeResult> {
    try {
      if (!this.isInGitRepo()) {
        return {
          success: false,
          message: "Not in a git repository",
        };
      }


      const repoRoot = this.getRepoRoot();
      const branchName = `feature/${featureName}`;
      const worktreePath = join(repoRoot, ".worktree", featureName);

      if (existsSync(worktreePath)) {
        return {
          success: false,
          message: `Worktree already exists at ${worktreePath}`,
        };
      }

      try {
        execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: "ignore" });
        return {
          success: false,
          message: `Branch ${branchName} already exists`,
        };
      } catch {
      }

      const worktreeDir = dirname(worktreePath);
      if (!existsSync(worktreeDir)) {
        mkdirSync(worktreeDir, { recursive: true });
      }

      execSync(`git worktree add "${worktreePath}" -b "${branchName}"`, { 
        stdio: "pipe",
        cwd: repoRoot 
      });

      const copiedFiles = this.copyConfigFiles(repoRoot, worktreePath);

      return {
        success: true,
        message: `Created worktree for feature '${featureName}'`,
        path: worktreePath,
        branch: branchName,
        configFilesCopied: copiedFiles,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to create worktree: ${errorMessage}`,
      };
    }
  }

  async listWorktrees(): Promise<WorktreeInfo[]> {
    try {
      if (!this.isInGitRepo()) {
        throw new Error("Not in a git repository");
      }

      const output = execSync("git worktree list --porcelain", { 
        encoding: "utf-8",
        stdio: "pipe"
      });

      const worktrees: WorktreeInfo[] = [];
      const lines = output.trim().split("\n");
      
      let currentWorktree: Partial<WorktreeInfo> = {};
      
      for (const line of lines) {
        if (line.startsWith("worktree ")) {
          if (currentWorktree.path) {
            worktrees.push(currentWorktree as WorktreeInfo);
          }
          currentWorktree = { path: line.substring(9) };
        } else if (line.startsWith("HEAD ")) {
          currentWorktree.commit = line.substring(5);
        } else if (line.startsWith("branch ")) {
          currentWorktree.branch = line.substring(7);
        } else if (line === "bare") {
          currentWorktree.status = "bare";
        } else if (line === "detached") {
          currentWorktree.status = "detached";
        } else if (line === "") {
          if (currentWorktree.path) {
            if (!currentWorktree.status) {
              currentWorktree.status = "normal";
            }
            worktrees.push(currentWorktree as WorktreeInfo);
            currentWorktree = {};
          }
        }
      }

      if (currentWorktree.path) {
        if (!currentWorktree.status) {
          currentWorktree.status = "normal";
        }
        worktrees.push(currentWorktree as WorktreeInfo);
      }

      return worktrees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list worktrees: ${errorMessage}`);
    }
  }

  async cleanupWorktree(featureName: string): Promise<CleanupResult> {
    try {
      if (!this.isInGitRepo()) {
        return {
          success: false,
          message: "Not in a git repository",
        };
      }


      const repoRoot = this.getRepoRoot();
      const worktreePath = join(repoRoot, ".worktree", featureName);
      const branchName = `feature/${featureName}`;

      if (!existsSync(worktreePath)) {
        return {
          success: false,
          message: `Worktree does not exist at ${worktreePath}`,
        };
      }

      const warnings: string[] = [];

      try {
        const statusOutput = execSync("git status --porcelain", {
          encoding: "utf-8",
          cwd: worktreePath,
          stdio: "pipe"
        });

        if (statusOutput.trim()) {
          return {
            success: false,
            message: `Worktree has uncommitted changes. Please commit or stash changes first.`,
            warnings: statusOutput.trim().split("\n"),
          };
        }
      } catch (error) {
        warnings.push(`Could not check git status: ${error}`);
      }

      execSync(`git worktree remove "${worktreePath}"`, {
        stdio: "pipe",
        cwd: repoRoot
      });

      try {
        execSync(`git branch -D "${branchName}"`, {
          stdio: "pipe", 
          cwd: repoRoot
        });
      } catch (error) {
        warnings.push(`Could not delete branch ${branchName}: ${error}`);
      }

      return {
        success: true,
        message: `Successfully removed worktree '${featureName}'`,
        removedPath: worktreePath,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to cleanup worktree: ${errorMessage}`,
      };
    }
  }

  async getWorktreeStatus(featureName: string): Promise<WorktreeStatus> {
    try {
      if (!this.isInGitRepo()) {
        return {
          exists: false,
        };
      }


      const repoRoot = this.getRepoRoot();
      const worktreePath = join(repoRoot, ".worktree", featureName);

      if (!existsSync(worktreePath)) {
        return {
          exists: false,
        };
      }

      const branchName = `feature/${featureName}`;
      let commit: string | undefined;
      let hasUncommittedChanges = false;
      let modifiedFiles: string[] = [];
      let untrackedFiles: string[] = [];

      try {
        commit = execSync("git rev-parse HEAD", {
          encoding: "utf-8",
          cwd: worktreePath,
          stdio: "pipe"
        }).trim();
      } catch (error) {
        console.error(`Could not get commit: ${error}`);
      }

      try {
        const statusOutput = execSync("git status --porcelain", {
          encoding: "utf-8", 
          cwd: worktreePath,
          stdio: "pipe"
        });

        if (statusOutput.trim()) {
          hasUncommittedChanges = true;
          const lines = statusOutput.trim().split("\n");
          
          for (const line of lines) {
            const status = line.substring(0, 2);
            const filename = line.substring(3);
            
            if (status.includes("?")) {
              untrackedFiles.push(filename);
            } else {
              modifiedFiles.push(filename);
            }
          }
        }
      } catch (error) {
        console.error(`Could not get status: ${error}`);
      }

      return {
        exists: true,
        path: worktreePath,
        branch: branchName,
        commit,
        hasUncommittedChanges,
        modifiedFiles: modifiedFiles.length > 0 ? modifiedFiles : undefined,
        untrackedFiles: untrackedFiles.length > 0 ? untrackedFiles : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get worktree status: ${errorMessage}`);
    }
  }

  async getParallelWorkflowStatus(workflowName: string): Promise<ParallelWorkflowStatusResult> {
    try {
      if (!this.isInGitRepo()) {
        return {
          success: false,
          workflowName,
          iterations: [],
          readyCount: 0,
          dirtyCount: 0,
          missingCount: 0,
          recommendations: ["Not in a git repository"],
        };
      }

      const repoRoot = this.getRepoRoot();
      const metadata = this.readWorkflowMetadata(repoRoot, workflowName);
      const metadataPath = metadata ? this.getWorkflowMetadataPath(repoRoot, workflowName) : undefined;

      const iterationDefinitions = metadata?.iterations?.length
        ? metadata.iterations
        : this.deriveFilesystemWorkflow(repoRoot, workflowName);

      if (iterationDefinitions.length === 0) {
        return {
          success: false,
          workflowName,
          metadataPath,
          iterations: [],
          readyCount: 0,
          dirtyCount: 0,
          missingCount: 0,
          recommendations: [`No worktrees found for workflow '${workflowName}'. Run setup_parallel_workflow first.`],
        };
      }

      const iterations: WorkflowIterationStatus[] = [];
      let readyCount = 0;
      let dirtyCount = 0;
      let missingCount = 0;

      for (const iteration of iterationDefinitions) {
        const featureName = iteration.featureName;
        const label = iteration.label ?? featureName;
        const status = await this.getWorktreeStatus(featureName);

        const iterationStatus: WorkflowIterationStatus = {
          ...status,
          featureName,
          label,
          branch: status.branch ?? iteration.branch ?? `feature/${featureName}`,
          path: status.path ?? iteration.path,
          instructions: status.exists && (status.path ?? iteration.path)
            ? this.formatWorktreeHint(status.path ?? iteration.path!)
            : undefined,
        };

        if (!status.exists) {
          missingCount++;
        } else if (status.hasUncommittedChanges) {
          dirtyCount++;
        } else {
          readyCount++;
        }

        iterations.push(iterationStatus);
      }

      const recommendations: string[] = [];
      if (missingCount > 0) {
        recommendations.push(`Detected ${missingCount} missing iteration(s). Re-run setup_parallel_workflow or recreate the missing branches.`);
      }
      if (dirtyCount > 0) {
        recommendations.push(`There are ${dirtyCount} iteration(s) with pending changes. Review git status before compiling or voting.`);
      }

      if (recommendations.length === 0) {
        recommendations.push("All iterations look ready. Review commits and decide on the winning branch.");
      }

      return {
        success: true,
        workflowName,
        metadataPath,
        iterations,
        readyCount,
        dirtyCount,
        missingCount,
        recommendations,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        workflowName,
        iterations: [],
        readyCount: 0,
        dirtyCount: 0,
        missingCount: 0,
        recommendations: [`Failed to gather workflow status: ${errorMessage}`],
      };
    }
  }
}
