import type { CreateSkillInput } from "@time/shared"
import { access, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { and, eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"

const currentDir = dirname(fileURLToPath(import.meta.url))
const defaultSkillsRoot = resolve(currentDir, "../../../.skills")

function sanitizeSkillsRoot(input: string | undefined) {
  if (!input) {
    return defaultSkillsRoot
  }

  const trimmed = input.trim()
  const commandMarkers = [" pnpm ", " bun ", " npm ", " yarn "]
  const marker = commandMarkers.find((item) => trimmed.includes(item))
  if (marker) {
    return trimmed.split(marker)[0]!.trim()
  }

  return trimmed
}

export const MANAGED_SKILLS_ROOT = sanitizeSkillsRoot(process.env["MASTRA_SKILLS_DIR"])

const parseFrontmatter = (content: string) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Skill file is missing frontmatter", 422)
  }

  const frontmatter = match[1]
  if (frontmatter === undefined) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Skill frontmatter could not be parsed", 422)
  }

  const lines = frontmatter.split("\n")
  const data: Record<string, string | string[]> = {}
  let currentListKey: string | null = null

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line.trim()) {
      continue
    }

    const listItemMatch = line.match(/^\s*-\s+(.*)$/)
    if (listItemMatch && currentListKey) {
      const current = data[currentListKey]
      const nextValue = (listItemMatch[1] ?? "").trim()
      data[currentListKey] = Array.isArray(current) ? [...current, nextValue] : [nextValue]
      continue
    }

    currentListKey = null
    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!keyValueMatch) {
      continue
    }

    const key = keyValueMatch[1]
    if (!key) {
      continue
    }

    const value = keyValueMatch[2] ?? ""
    if (value === "") {
      currentListKey = key
      data[key] = []
      continue
    }

    data[key] = value
  }

  return data
}

const slugify = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const runCommand = async (cmd: string[], errorMessage: string) => {
  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
  })

  const [exitCode, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stderr).text(),
  ])

  if (exitCode !== 0) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, `${errorMessage}: ${stderr.trim() || "command failed"}`, 500)
  }

  return new Response(proc.stdout).text()
}

const ensureWithinRoot = (baseRoot: string, candidatePath: string) => {
  const normalizedRoot = `${baseRoot}/`
  if (candidatePath !== baseRoot && !candidatePath.startsWith(normalizedRoot)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Archive entry escapes the managed skills root", 422)
  }
}

const ensureManagedRoot = async () => {
  await mkdir(MANAGED_SKILLS_ROOT, { recursive: true })
}

const findExtractedSkillRoot = async (extractRoot: string) => {
  const entries = await readdir(extractRoot, { withFileTypes: true })
  const directSkillRoot = resolve(extractRoot, "SKILL.md")

  try {
    await access(directSkillRoot)
    return extractRoot
  } catch {
    // continue
  }

  const directories = entries.filter((entry) => entry.isDirectory())
  if (directories.length !== 1) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Uploaded archive must contain exactly one skill folder or a root-level SKILL.md",
      422,
    )
  }

  const nestedRoot = resolve(extractRoot, directories[0]!.name)
  await access(resolve(nestedRoot, "SKILL.md"))
  return nestedRoot
}

const readSkillManifest = async (skillRoot: string) => {
  const content = await readFile(resolve(skillRoot, "SKILL.md"), "utf8")
  const metadata = parseFrontmatter(content)
  const rawName = typeof metadata["name"] === "string" ? metadata["name"] : ""
  const key = slugify(rawName)
  const description = typeof metadata["description"] === "string" ? metadata["description"] : null
  const version = typeof metadata["version"] === "string" ? metadata["version"] : "1.0.0"

  if (!key) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Skill frontmatter must include a name", 422)
  }

  return {
    key,
    name: rawName,
    description,
    version,
  }
}

export const listSkills = async (tenantId = DEFAULT_TENANT_ID) => {
  return db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.tenantId, tenantId))
    .orderBy(schema.skills.name)
}

export const createSkill = async (
  input: CreateSkillInput,
  tenantId = DEFAULT_TENANT_ID,
) => {
  await assertSkillPathReadable(input.relativePath)

  const [created] = await db
    .insert(schema.skills)
    .values({
      id: crypto.randomUUID(),
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      version: input.version,
      relativePath: input.relativePath,
      isActive: input.isActive ?? true,
      tenantId,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .returning()

  return created
}

export const uploadSkillArchive = async (
  file: File,
  tenantId = DEFAULT_TENANT_ID,
) => {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Only .zip skill archives are supported", 422)
  }

  await ensureManagedRoot()

  const tempId = crypto.randomUUID()
  const tempZipPath = resolve(MANAGED_SKILLS_ROOT, `.upload-${tempId}.zip`)
  const tempExtractRoot = resolve(MANAGED_SKILLS_ROOT, `.extract-${tempId}`)

  await writeFile(tempZipPath, Buffer.from(await file.arrayBuffer()))
  await mkdir(tempExtractRoot, { recursive: true })

  try {
    const listing = await runCommand(["unzip", "-Z1", tempZipPath], "Failed to inspect skill archive")
    const entries = listing
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    if (entries.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Uploaded archive is empty", 422)
    }

    for (const entry of entries) {
      if (entry.includes("..") || entry.startsWith("/") || entry.startsWith("\\")) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Archive contains an unsafe path", 422)
      }

      ensureWithinRoot(tempExtractRoot, resolve(tempExtractRoot, entry))
    }

    await runCommand(["unzip", "-qq", tempZipPath, "-d", tempExtractRoot], "Failed to extract skill archive")

    const extractedSkillRoot = await findExtractedSkillRoot(tempExtractRoot)
    const manifest = await readSkillManifest(extractedSkillRoot)
    const finalRelativePath = `${tenantId}/${manifest.key}`
    const finalSkillRoot = resolveManagedSkillPath(finalRelativePath)

    try {
      await access(finalSkillRoot)
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Skill "${manifest.key}" already exists`, 409)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
    }

    await mkdir(resolve(MANAGED_SKILLS_ROOT, tenantId), { recursive: true })
    await rename(extractedSkillRoot, finalSkillRoot)

    return createSkill(
      {
        key: manifest.key,
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        relativePath: finalRelativePath,
        isActive: true,
      },
      tenantId,
    )
  } finally {
    await rm(tempZipPath, { force: true })
    await rm(tempExtractRoot, { recursive: true, force: true })
  }
}

export const getSkillById = async (id: string, tenantId = DEFAULT_TENANT_ID) => {
  const [skill] = await db
    .select()
    .from(schema.skills)
    .where(and(eq(schema.skills.id, id), eq(schema.skills.tenantId, tenantId)))
    .limit(1)

  if (!skill) {
    throw new AppError(ErrorCode.NOT_FOUND, "Skill not found", 404)
  }

  return skill
}

export const resolveManagedSkillPath = (relativePath: string) => {
  const absolutePath = resolve(MANAGED_SKILLS_ROOT, relativePath)
  const normalizedRoot = `${MANAGED_SKILLS_ROOT}/`

  if (absolutePath !== MANAGED_SKILLS_ROOT && !absolutePath.startsWith(normalizedRoot)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Skill path escapes the managed skills root", 422)
  }

  return absolutePath
}

export const assertSkillPathReadable = async (relativePath: string) => {
  const absolutePath = resolveManagedSkillPath(relativePath)

  await access(absolutePath)
  await access(resolve(absolutePath, "SKILL.md"))

  return absolutePath
}
