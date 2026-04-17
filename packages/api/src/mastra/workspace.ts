import { LocalFilesystem, Workspace } from "@mastra/core/workspace";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(currentDir, "../../../");

export const timeAgentWorkspace = new Workspace({
  id: "time-agent-workspace",
  name: "Time Agent Workspace",
  filesystem: new LocalFilesystem({
    basePath: apiRoot,
    readOnly: true,
  }),
  skills: [".skills"],
  bm25: true,
  autoIndexPaths: [".skills"],
});
