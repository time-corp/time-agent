import { MastraSandbox } from "@mastra/core/workspace"
import type { CommandResult, ExecuteCommandOptions } from "@mastra/core/workspace"
import type { ProviderStatus } from "@mastra/core/workspace"
import { executeShellInSandbox } from "./sandbox-exec-service"

const SANDBOX_CONTAINER_NAME = process.env["SANDBOX_CONTAINER_NAME"] ?? "netclaw-sandbox"

export class DockerContainerSandbox extends MastraSandbox {
  readonly id = `docker-${SANDBOX_CONTAINER_NAME}`
  readonly name = "DockerContainerSandbox"
  readonly provider = "docker"
  status: ProviderStatus = "running"

  constructor() {
    super({ name: "DockerContainerSandbox" })
  }

  async executeCommand(command: string, args?: string[], _options?: ExecuteCommandOptions): Promise<CommandResult> {
    const fullCommand = args?.length ? `${command} ${args.join(" ")}` : command
    const start = Date.now()

    const result = await executeShellInSandbox(fullCommand)

    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.output,
      stderr: "",
      executionTimeMs: Date.now() - start,
    }
  }

  getInstructions(): string {
    return `Commands run inside Docker container "${SANDBOX_CONTAINER_NAME}". Use standard shell syntax.`
  }
}
