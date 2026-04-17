import { once } from "node:events"
import type Dockerode from "dockerode"
import { AppError, ErrorCode } from "../lib/errors"

type DockerClient = Dockerode

export type SandboxExecOptions = {
  containerName?: string
  env?: Record<string, string>
  onStep?: (step: string, detail?: Record<string, unknown>) => void
  tty?: boolean
  user?: string
  workingDir?: string
}

export type SandboxExecResult = {
  containerId: string
  containerName: string
  command: string[]
  exitCode: number
  output: string
}

const DOCKER_SOCKET_PATH = process.env["DOCKER_SOCKET_PATH"] ?? "/var/run/docker.sock"
const SANDBOX_CONTAINER_NAME = process.env["SANDBOX_CONTAINER_NAME"] ?? "netclaw-sandbox"

let dockerClientPromise: Promise<DockerClient> | undefined

async function getDockerClient(): Promise<DockerClient> {
  if (!dockerClientPromise) {
    dockerClientPromise = import("dockerode").then(({ default: Docker }) => {
      return new Docker({ socketPath: DOCKER_SOCKET_PATH })
    })
  }

  return dockerClientPromise
}

function toEnvList(env?: Record<string, string>) {
  if (!env) {
    return undefined
  }

  return Object.entries(env).map(([key, value]) => `${key}=${value}`)
}

function trimContainerName(name: string) {
  return name.startsWith("/") ? name.slice(1) : name
}

async function readExecStream(stream: NodeJS.ReadableStream) {
  let output = ""

  stream.setEncoding("utf8")
  stream.on("data", (chunk: string | Buffer) => {
    output += chunk.toString()
  })

  await Promise.race([
    once(stream, "end"),
    once(stream, "error").then(([error]) => Promise.reject(error)),
  ])
  return output
}

export async function getSandboxContainer(containerName = SANDBOX_CONTAINER_NAME) {
  const docker = await getDockerClient()
  const container = docker.getContainer(containerName)

  try {
    const info = await container.inspect()
    return {
      container,
      info,
      name: trimContainerName(info.Name || containerName),
    }
  } catch (error) {
    throw new AppError(
      ErrorCode.SANDBOX_NOT_FOUND,
      `Sandbox container "${containerName}" not found`,
      404
    )
  }
}

export async function executeInSandbox(command: string[], options: SandboxExecOptions = {}): Promise<SandboxExecResult> {
  if (command.length === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Sandbox command is required", 400)
  }

  const tty = options.tty ?? true
  options.onStep?.("sandbox.exec.prepare", {
    command,
    tty,
    workingDir: options.workingDir,
  })
  const { container, info, name } = await getSandboxContainer(options.containerName)
  const execOptions: Dockerode.ExecCreateOptions = {
    AttachStdout: true,
    AttachStderr: true,
    Cmd: command,
    Tty: tty,
  }

  const env = toEnvList(options.env)
  if (env) {
    execOptions.Env = env
  }

  if (options.user) {
    execOptions.User = options.user
  }

  if (options.workingDir) {
    execOptions.WorkingDir = options.workingDir
  }

  const exec = await container.exec(execOptions)
  options.onStep?.("sandbox.exec.start", {
    containerId: info.Id,
    containerName: name,
  })

  let output: string
  try {
    const stream = await exec.start({
      hijack: true,
      stdin: false,
      Tty: tty,
    })
    output = await readExecStream(stream)
  } catch (error: unknown) {
    // dockerode throws "(HTTP code 101) unexpected - <output>" for hijacked TTY exec
    // even when the command succeeds — extract the output from the error message
    const PREFIX = "(HTTP code 101) unexpected - "
    if (error instanceof Error && error.message.startsWith(PREFIX)) {
      output = error.message.slice(PREFIX.length)
    } else {
      throw error
    }
  }

  const execInfo = await exec.inspect()
  const exitCode = execInfo.ExitCode ?? 1
  options.onStep?.("sandbox.exec.finish", {
    containerId: info.Id,
    containerName: name,
    exitCode,
    outputPreview: output.slice(0, 2000),
  })

  if (exitCode !== 0) {
    throw new AppError(
      ErrorCode.SANDBOX_EXEC_FAILED,
      `Sandbox command failed with exit code ${exitCode}: ${output.trim() || command.join(" ")}`,
      502
    )
  }

  return {
    containerId: info.Id,
    containerName: name,
    command,
    exitCode,
    output,
  }
}

export async function executeShellInSandbox(command: string, options: SandboxExecOptions = {}) {
  return executeInSandbox(["sh", "-lc", command], options)
}
