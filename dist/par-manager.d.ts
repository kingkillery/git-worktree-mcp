export interface ParSession {
    label: string;
    tmuxSession?: string;
    worktreePath?: string;
    branch?: string;
    status: "active" | "inactive" | "unknown";
}
export interface ParSessionResult {
    success: boolean;
    message: string;
    session?: ParSession;
}
export interface ParSendCommandResult {
    success: boolean;
    message: string;
    sentTo?: string[];
    failed?: string[];
}
export interface ParWorkspaceResult {
    success: boolean;
    message: string;
    workspaceName?: string;
    sessions?: string[];
}
export declare class ParManager {
    private readonly useWSL;
    constructor();
    private executeParCommand;
    private parseSessionList;
    startSession(label: string, options?: {
        branch?: string;
        checkout?: boolean;
    }): Promise<ParSessionResult>;
    listSessions(): Promise<{
        success: boolean;
        sessions: ParSession[];
        message?: string;
    }>;
    sendCommand(target: string, command: string): Promise<ParSendCommandResult>;
    sendToAllSessions(command: string): Promise<ParSendCommandResult>;
    removeSession(label: string): Promise<ParSessionResult>;
    removeAllSessions(): Promise<ParSessionResult>;
    openSession(label: string): Promise<ParSessionResult>;
    checkoutSession(label: string, branchOrPr: string): Promise<ParSessionResult>;
    createControlCenter(): Promise<ParSessionResult>;
    startWorkspace(name: string, repos: string[]): Promise<ParWorkspaceResult>;
    listWorkspaces(): Promise<{
        success: boolean;
        workspaces: string[];
        message?: string;
    }>;
    removeWorkspace(name: string): Promise<ParWorkspaceResult>;
    getSessionStatus(label: string): Promise<{
        success: boolean;
        session?: ParSession;
        message: string;
    }>;
    isWSLEnabled(): boolean;
    testConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
}
