import { db, schema } from "."

const builtInTools = [
  {
    key: "copy_artifact",
    name: "Copy Artifact",
    description: "Copy a file from the sandbox to host storage and return a public URL",
    category: "storage",
    defaultEnabled: true,
    requiresApproval: false,
  },
  {
    key: "take_screenshot",
    name: "Screenshot",
    description: "Navigate to a URL and capture a screenshot, returns a public image URL",
    category: "media",
    defaultEnabled: true,
    requiresApproval: false,
  },
  {
    key: "browser",
    name: "Browser",
    description: "Full browser automation: navigate, snapshot, click, type, scroll and more",
    category: "browser",
    defaultEnabled: true,
    requiresApproval: false,
  },
]

const rows = builtInTools.map((tool) => ({
  id: crypto.randomUUID(),
  key: tool.key,
  name: tool.name,
  description: tool.description,
  category: tool.category,
  defaultEnabled: tool.defaultEnabled,
  requiresApproval: tool.requiresApproval,
  configSchema: null,
}))

await db.insert(schema.tools).values(rows).onConflictDoNothing()

console.log(`Seeded ${rows.length} built-in tools`)
process.exit(0)
