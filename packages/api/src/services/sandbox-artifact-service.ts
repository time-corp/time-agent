import { mkdir, writeFile } from "node:fs/promises"
import { basename, dirname, resolve } from "node:path"
import tar from "tar-stream"
import { getSandboxContainer } from "./sandbox-exec-service"

export type StoredArtifact = {
  runId: string
  fileName: string
  mimeType: string
  sandboxPath: string
  storagePath: string
}

export const ARTIFACT_STORAGE_DIR = process.env["ARTIFACT_STORAGE_DIR"] ?? resolve(process.cwd(), ".artifacts")

function inferMimeType(fileName: string) {
  if (fileName.endsWith(".png")) return "image/png"
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg"
  if (fileName.endsWith(".webp")) return "image/webp"
  if (fileName.endsWith(".json")) return "application/json"
  if (fileName.endsWith(".txt")) return "text/plain"
  return "application/octet-stream"
}

async function extractSingleFile(stream: NodeJS.ReadableStream): Promise<{ name: string; content: Buffer }> {
  const extract = tar.extract()

  return new Promise((resolvePromise, reject) => {
    let resolved = false

    extract.on("entry", (header, entryStream, next) => {
      if (header.type !== "file") {
        entryStream.resume()
        next()
        return
      }

      const chunks: Buffer[] = []
      entryStream.on("data", (chunk: Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })

      entryStream.on("end", () => {
        if (!resolved) {
          resolved = true
          resolvePromise({
            name: basename(header.name),
            content: Buffer.concat(chunks),
          })
        }
        next()
      })
    })

    extract.on("finish", () => {
      if (!resolved) {
        reject(new Error("No file found in sandbox archive"))
      }
    })

    extract.on("error", reject)
    stream.on("error", reject)
    stream.pipe(extract)
  })
}

export async function copyArtifactFromSandbox(runId: string, sandboxPath: string, containerName?: string): Promise<StoredArtifact> {
  console.info("[skill-trace]", JSON.stringify({
    runId,
    step: "artifact.copy.start",
    sandboxPath,
    containerName,
  }))
  const { container } = await getSandboxContainer(containerName)
  const archiveStream = await container.getArchive({ path: sandboxPath })
  const extracted = await extractSingleFile(archiveStream)
  const storageDir = resolve(ARTIFACT_STORAGE_DIR, runId)
  const storagePath = resolve(storageDir, extracted.name)

  await mkdir(dirname(storagePath), { recursive: true })
  await writeFile(storagePath, extracted.content)
  console.info("[skill-trace]", JSON.stringify({
    runId,
    step: "artifact.copy.finish",
    sandboxPath,
    storagePath,
    fileName: extracted.name,
    bytes: extracted.content.byteLength,
  }))

  return {
    runId,
    fileName: extracted.name,
    mimeType: inferMimeType(extracted.name),
    sandboxPath,
    storagePath,
  }
}
