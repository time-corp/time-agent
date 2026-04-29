import { useMemo } from "react"
import { RefreshCwIcon, WrenchIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToolAssignmentsQuery, useUpsertToolAssignmentMutation } from "@/hooks/useTools"
import type { ToolWithEffectiveState } from "@time/shared"

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
  const { data: tools = [], isLoading, isError, refetch, isFetching } = useToolAssignmentsQuery(
    DEFAULT_TARGET_ID,
    DEFAULT_TARGET_KIND,
  )

  const upsert = useUpsertToolAssignmentMutation(DEFAULT_TARGET_KIND, DEFAULT_TARGET_ID)

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
    </>
  )
}
