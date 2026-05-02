import { LocalFilesystem, Workspace } from "@mastra/core/workspace"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { DockerContainerSandbox } from "../services/docker-container-sandbox"

const currentDir = dirname(fileURLToPath(import.meta.url))
export const apiRoot = resolve(currentDir, "../../../")

export const createAgentWorkspace = (agentId: string, skillPaths: string[] = []) =>
  new Workspace({
    id: `time-agent-workspace-${agentId}`,
    name: "Time Agent Workspace",
    filesystem: new LocalFilesystem({
      basePath: apiRoot,
      readOnly: true,
    }),
    sandbox: new DockerContainerSandbox(),
    skills: skillPaths,
    bm25: true,
    autoIndexPaths: skillPaths,
  })

export const timeAgentWorkspace = createAgentWorkspace("default")
