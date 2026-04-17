import { readdir, readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { AppError, ErrorCode } from "../lib/errors"

export type SkillDefinition = {
  name: string
  description: string
  version: string
  tags: string[]
  filePath: string
  directory: string
}

const currentDir = dirname(fileURLToPath(import.meta.url))
const defaultSkillsRoot = resolve(currentDir, "../../../.skills")

function sanitizeSkillsRoot(input: string | undefined) {
  if (!input) {
    return defaultSkillsRoot
  }

  // Guard against accidentally pasting the whole shell command into the env value.
  const trimmed = input.trim()
  const commandMarkers = [" pnpm ", " bun ", " npm ", " yarn "]
  const marker = commandMarkers.find((item) => trimmed.includes(item))
  if (marker) {
    return trimmed.split(marker)[0]!.trim()
  }

  return trimmed
}

export const SKILLS_ROOT = sanitizeSkillsRoot(process.env["MASTRA_SKILLS_DIR"])

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Skill file is missing frontmatter", 500)
  }

  const frontmatter = match[1]
  if (frontmatter === undefined) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Skill frontmatter could not be parsed", 500)
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

function toSkillDefinition(filePath: string, content: string): SkillDefinition {
  const metadata = parseFrontmatter(content)
  const name = metadata["name"]
  const description = metadata["description"]
  const version = metadata["version"]
  const tags = metadata["tags"]

  if (typeof name !== "string" || typeof description !== "string" || typeof version !== "string") {
    throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid skill metadata in ${filePath}`, 500)
  }

  return {
    name,
    description,
    version,
    tags: Array.isArray(tags) ? tags : [],
    filePath,
    directory: resolve(filePath, ".."),
  }
}

export async function listSkills(): Promise<SkillDefinition[]> {
  console.info("[skill-trace]", JSON.stringify({
    step: "skill.registry.scan",
    skillsRoot: SKILLS_ROOT,
  }))
  const entries = await readdir(SKILLS_ROOT, { withFileTypes: true })
  const skills = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const filePath = join(SKILLS_ROOT, entry.name, "SKILL.md")
        const content = await readFile(filePath, "utf8")
        return toSkillDefinition(filePath, content)
      })
  )

  console.info("[skill-trace]", JSON.stringify({
    step: "skill.registry.scan.done",
    skillsRoot: SKILLS_ROOT,
    skillCount: skills.length,
  }))
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSkillByName(name: string): Promise<SkillDefinition> {
  const skills = await listSkills()
  const lower = name.toLowerCase()

  const skill =
    skills.find((s) => s.name === name) ??
    skills.find((s) => s.name.includes(lower) || lower.includes(s.name)) ??
    skills.find((s) => s.tags.some((t) => t.toLowerCase() === lower))

  if (!skill) {
    throw new AppError(ErrorCode.SKILL_NOT_FOUND, `Skill "${name}" not found`, 404)
  }

  return skill
}
