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
export declare class GitWorktreeManager {
    private readonly CONFIG_FILES;
    private readonly CONFIG_DIRS;
    private readonly WORKFLOW_STATE_DIR;
    private isInGitRepo;
    private getRepoRoot;
    private getWorkflowMetadataDirectory;
    private ensureWorkflowMetadataDirectory;
    private getWorkflowMetadataPath;
    private readWorkflowMetadata;
    private writeWorkflowMetadata;
    private formatWorktreeHint;
    private deriveFilesystemWorkflow;
    private copyConfigFiles;
    private copyDirectory;
    setupParallelWorkflow(workflowName: string, options: ParallelWorkflowOptions): Promise<ParallelWorkflowSetupResult>;
    createFeatureWorktree(featureName: string): Promise<WorktreeResult>;
    listWorktrees(): Promise<WorktreeInfo[]>;
    cleanupWorktree(featureName: string): Promise<CleanupResult>;
    getWorktreeStatus(featureName: string): Promise<WorktreeStatus>;
    getParallelWorkflowStatus(workflowName: string): Promise<ParallelWorkflowStatusResult>;
}
