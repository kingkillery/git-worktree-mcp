import { execSync } from "child_process";
export class ParManager {
    useWSL;
    constructor() {
        // Only use WSL if par is not available natively on Windows
        // First check if par is available natively
        this.useWSL = false;
        if (process.platform === "win32") {
            try {
                // Test if par is available natively on Windows
                execSync("par --version", { stdio: "ignore", timeout: 5000 });
                this.useWSL = false;
            }
            catch (error) {
                // par not available natively, try WSL
                try {
                    execSync("wsl -- which par", { stdio: "ignore", timeout: 5000 });
                    this.useWSL = true;
                }
                catch (wslError) {
                    this.useWSL = false;
                }
            }
        }
    }
    executeParCommand(args, options = {}) {
        try {
            const command = this.useWSL
                ? `wsl -- par ${args.join(" ")}`
                : `par ${args.join(" ")}`;
            return execSync(command, {
                encoding: "utf-8",
                stdio: "pipe",
                cwd: options.cwd,
                timeout: 30000 // 30 second timeout
            }).trim();
        }
        catch (error) {
            const errorMessage = error.stderr || error.stdout || error.message;
            throw new Error(`Par command failed: ${errorMessage}`);
        }
    }
    parseSessionList(output) {
        const sessions = [];
        const lines = output.split("\n");
        for (const line of lines) {
            if (line.trim() && !line.startsWith("No active")) {
                // Parse typical par ls output format
                // Example: "feature-auth  feature-auth  /path/to/worktree  feature/feature-auth"
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    sessions.push({
                        label: parts[0],
                        tmuxSession: parts[1],
                        worktreePath: parts[2],
                        branch: parts[3] || undefined,
                        status: "active"
                    });
                }
            }
        }
        return sessions;
    }
    async startSession(label, options = {}) {
        try {
            const args = ["start", label];
            if (options.checkout) {
                args.unshift("checkout");
            }
            const output = this.executeParCommand(args);
            // Parse the output to extract session information
            const session = {
                label,
                status: "active"
            };
            // Try to extract worktree path from output
            const pathMatch = output.match(/Created worktree at\s+(.+)$/m);
            if (pathMatch) {
                session.worktreePath = pathMatch[1].trim();
            }
            // Try to extract branch from output
            const branchMatch = output.match(/branch[:\s]+([^\s\n]+)/m);
            if (branchMatch) {
                session.branch = branchMatch[1].trim();
            }
            return {
                success: true,
                message: `Started Par session '${label}' successfully`,
                session
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to start Par session '${label}': ${error.message}`
            };
        }
    }
    async listSessions() {
        try {
            const output = this.executeParCommand(["ls"]);
            const sessions = this.parseSessionList(output);
            return {
                success: true,
                sessions,
                message: sessions.length > 0
                    ? `Found ${sessions.length} active Par sessions`
                    : "No active Par sessions found"
            };
        }
        catch (error) {
            return {
                success: false,
                sessions: [],
                message: `Failed to list Par sessions: ${error.message}`
            };
        }
    }
    async sendCommand(target, command) {
        try {
            this.executeParCommand(["send", target, command]);
            return {
                success: true,
                message: `Command sent to '${target}' successfully`,
                sentTo: [target]
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to send command to '${target}': ${error.message}`,
                failed: [target]
            };
        }
    }
    async sendToAllSessions(command) {
        try {
            this.executeParCommand(["send", "all", command]);
            return {
                success: true,
                message: `Command sent to all sessions successfully`,
                sentTo: ["all"]
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to send command to all sessions: ${error.message}`,
                failed: ["all"]
            };
        }
    }
    async removeSession(label) {
        try {
            this.executeParCommand(["rm", label]);
            return {
                success: true,
                message: `Removed Par session '${label}' successfully`,
                session: { label, status: "inactive" }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to remove Par session '${label}': ${error.message}`
            };
        }
    }
    async removeAllSessions() {
        try {
            this.executeParCommand(["rm", "all"]);
            return {
                success: true,
                message: "Removed all Par sessions successfully"
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to remove all Par sessions: ${error.message}`
            };
        }
    }
    async openSession(label) {
        try {
            this.executeParCommand(["open", label]);
            return {
                success: true,
                message: `Opened Par session '${label}' successfully`,
                session: { label, status: "active" }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to open Par session '${label}': ${error.message}`
            };
        }
    }
    async checkoutSession(label, branchOrPr) {
        try {
            const output = this.executeParCommand(["checkout", label, branchOrPr]);
            const session = {
                label,
                status: "active",
                branch: branchOrPr
            };
            // Try to extract worktree path from output
            const pathMatch = output.match(/Created worktree at\s+(.+)$/m);
            if (pathMatch) {
                session.worktreePath = pathMatch[1].trim();
            }
            return {
                success: true,
                message: `Checked out '${branchOrPr}' into Par session '${label}'`,
                session
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to checkout '${branchOrPr}' into Par session '${label}': ${error.message}`
            };
        }
    }
    async createControlCenter() {
        try {
            this.executeParCommand(["control-center"]);
            return {
                success: true,
                message: "Created Par control center successfully"
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to create Par control center: ${error.message}`
            };
        }
    }
    async startWorkspace(name, repos) {
        try {
            const reposArg = repos.join(",");
            this.executeParCommand(["workspace", "start", name, "--repos", reposArg]);
            return {
                success: true,
                message: `Started workspace '${name}' with repos: ${repos.join(", ")}`,
                workspaceName: name,
                sessions: repos
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to start workspace '${name}': ${error.message}`
            };
        }
    }
    async listWorkspaces() {
        try {
            const output = this.executeParCommand(["workspace", "ls"]);
            const workspaces = output.trim().split("\n").filter(line => line.trim());
            return {
                success: true,
                workspaces,
                message: workspaces.length > 0
                    ? `Found ${workspaces.length} workspaces`
                    : "No workspaces found"
            };
        }
        catch (error) {
            return {
                success: false,
                workspaces: [],
                message: `Failed to list workspaces: ${error.message}`
            };
        }
    }
    async removeWorkspace(name) {
        try {
            this.executeParCommand(["workspace", "rm", name]);
            return {
                success: true,
                message: `Removed workspace '${name}' successfully`,
                workspaceName: name
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to remove workspace '${name}': ${error.message}`
            };
        }
    }
    async getSessionStatus(label) {
        try {
            // Get all sessions and find the one we're looking for
            const result = await this.listSessions();
            if (!result.success) {
                return {
                    success: false,
                    message: `Failed to get session status: ${result.message}`
                };
            }
            const session = result.sessions.find(s => s.label === label);
            if (session) {
                return {
                    success: true,
                    session,
                    message: `Session '${label}' is ${session.status}`
                };
            }
            else {
                return {
                    success: false,
                    message: `Session '${label}' not found`
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to get status for session '${label}': ${error.message}`
            };
        }
    }
    isWSLEnabled() {
        return this.useWSL;
    }
    async testConnection() {
        try {
            const output = this.executeParCommand(["--version"]);
            return {
                success: true,
                message: `Par connection successful. Version: ${output}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Par connection failed: ${error.message}. Make sure Par is installed and accessible.`
            };
        }
    }
}
