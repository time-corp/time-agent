import { useMemo, useState } from "react"
import { RefreshCwIcon, UploadIcon, WrenchIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  useSkillAssignmentsQuery,
  useSkillsQuery,
  useToolsQuery,
  useToolAssignmentsQuery,
  useUpsertToolAssignmentMutation,
  useUploadSkillArchiveMutation,
} from "@/hooks/useTools"
import type { ToolWithEffectiveState } from "@time/shared"
import { toast } from "sonner"

const DEFAULT_TARGET_ID = "system"
const DEFAULT_TARGET_KIND = "tenant"

const CATEGORY_LABELS: Record<string, string> = {
  filesystem: "Filesystem",
  runtime: "Runtime",
  web: "Web",
  memory: "Memory",
  media: "Media",
}

function ToolRow({
  tool,
  onToggle,
  isPending,
}: {
  tool: ToolWithEffectiveState
  onToggle: (tool: ToolWithEffectiveState, enabled: boolean) => void
  isPending: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b last:border-b-0 py-3.5 px-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{tool.name}</span>
          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tool.key}
          </code>
          {tool.requiresApproval && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              requires approval
            </Badge>
          )}
        </div>
        {tool.description && (
          <p className="text-xs text-muted-foreground">{tool.description}</p>
        )}
      </div>
      <Switch
        checked={tool.isEnabled}
        disabled={isPending}
        onCheckedChange={(checked) => onToggle(tool, checked)}
        className="shrink-0 mt-0.5"
      />
    </div>
  )
}

function CategorySection({
  category,
  tools,
  onToggle,
  isPending,
}: {
  category: string
  tools: ToolWithEffectiveState[]
  onToggle: (tool: ToolWithEffectiveState, enabled: boolean) => void
  isPending: boolean
}) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
        <span className="text-sm font-semibold">{CATEGORY_LABELS[category] ?? category}</span>
        <Badge variant="secondary" className="rounded px-1.5 py-0 text-xs">
          {tools.length}
        </Badge>
      </div>
      <div>
        {tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} onToggle={onToggle} isPending={isPending} />
        ))}
      </div>
    </div>
  )
}

export function ToolsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { data: tools = [], isLoading, isError, refetch, isFetching } = useToolAssignmentsQuery(
    DEFAULT_TARGET_ID,
    DEFAULT_TARGET_KIND,
  )
  const { data: skillCatalog = [], isLoading: skillsLoading, isError: skillsError, refetch: refetchSkills } = useSkillsQuery()
  const { data: tenantSkills = [] } = useSkillAssignmentsQuery(DEFAULT_TARGET_ID, DEFAULT_TARGET_KIND)

  const upsert = useUpsertToolAssignmentMutation(DEFAULT_TARGET_KIND, DEFAULT_TARGET_ID)
  const uploadSkill = useUploadSkillArchiveMutation()

  const grouped = useMemo(() => {
    const map = new Map<string, ToolWithEffectiveState[]>()
    for (const tool of tools) {
      const list = map.get(tool.category) ?? []
      list.push(tool)
      map.set(tool.category, list)
    }
    return map
  }, [tools])

  const categoryOrder = ["filesystem", "runtime", "web", "memory", "media"]
  const sortedCategories = [
    ...categoryOrder.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !categoryOrder.includes(c)).sort(),
  ]

  const handleToggle = (tool: ToolWithEffectiveState, isEnabled: boolean) => {
    upsert.mutate({
      targetId: DEFAULT_TARGET_ID,
      targetKind: "tenant",
      toolId: tool.id,
      isEnabled,
    })
  }

  const handleUploadSkill = async () => {
    if (!selectedFile) {
      toast.error("Select a .zip file first")
      return
    }

    try {
      await uploadSkill.mutateAsync(selectedFile)
      setSelectedFile(null)
      const input = document.getElementById("skill-archive-input") as HTMLInputElement | null
      if (input) input.value = ""
      await refetchSkills()
      toast.success("Skill uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload skill")
    }
  }

  return (
    <>
      <PageHeaderCard
        icon={<WrenchIcon />}
        title="Built-in Tools"
        description="Manage system built-in tools. Enable/disable or configure settings globally."
        titleMeta={tools.length > 0 ? `${tools.length} tools · ${grouped.size} categories` : undefined}
        headerRight={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      <SectionCard>
        {isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Failed to load tools.
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex flex-col gap-4">
            {sortedCategories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                tools={grouped.get(category) ?? []}
                onToggle={handleToggle}
                isPending={upsert.isPending}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Managed Skills</h2>
              <Badge variant="secondary" className="rounded px-1.5 py-0 text-xs">
                {skillCatalog.length}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a skill archive that contains `SKILL.md` and optional `references`, `scripts`, or `assets`.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <label htmlFor="skill-archive-input" className="text-sm font-medium">
                Skill archive
              </label>
              <Input
                id="skill-archive-input"
                type="file"
                accept=".zip,application/zip"
                disabled={uploadSkill.isPending}
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                One zip per skill package. The archive should contain a root skill folder or a root-level `SKILL.md`.
              </p>
            </div>
            <Button type="button" disabled={!selectedFile || uploadSkill.isPending} onClick={() => void handleUploadSkill()}>
              <UploadIcon data-icon="inline-start" />
              Upload skill
            </Button>
          </div>

          {skillsError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Failed to load skills.
            </div>
          )}

          {skillsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              {skillCatalog.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  No managed skills registered yet.
                </div>
              ) : (
                skillCatalog.map((skill) => {
                  const tenantAssignment = tenantSkills.find((item) => item.id === skill.id)

                  return (
                    <div key={skill.id} className="flex items-start justify-between gap-4 border-b last:border-b-0 px-4 py-3.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {skill.key}
                          </code>
                          <Badge variant={skill.isActive ? "secondary" : "outline"} className="text-xs px-1.5 py-0">
                            {skill.isActive ? "active" : "inactive"}
                          </Badge>
                          {tenantAssignment?.isAssigned ? (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              assigned to tenant
                            </Badge>
                          ) : null}
                        </div>
                        {skill.description ? (
                          <p className="text-xs text-muted-foreground">{skill.description}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          v{skill.version} · {skill.relativePath}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </>
  )
}
