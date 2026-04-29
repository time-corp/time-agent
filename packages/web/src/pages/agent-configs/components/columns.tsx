import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { ArrowDownAZIcon, ArrowUpAZIcon, ChevronsUpDownIcon, SquarePenIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { AgentConfig } from "@/hooks/useAgentConfigs"
import type { Provider } from "@/hooks/useProviders"

export function getAgentConfigColumns({
  sorting,
  providers,
}: {
  sorting: SortingState
  providers: Provider[]
}): ColumnDef<AgentConfig>[] {
  const nameSorted = sorting[0]?.id === "name" ? sorting[0] : null
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]))

  return [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => column.toggleSorting(nameSorted?.desc === false)}
        >
          Agent
          {nameSorted ? nameSorted.desc ? <ArrowDownAZIcon data-icon="inline-end" /> : <ArrowUpAZIcon data-icon="inline-end" /> : <ChevronsUpDownIcon data-icon="inline-end" />}
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "model",
      header: "Model",
      cell: ({ row }) => row.original.modelName,
    },
    {
      id: "provider",
      header: "Provider",
      cell: ({ row }) => providerMap.get(row.original.providerId)?.name ?? row.original.providerId,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "-",
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "active" : "inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button asChild size="sm" variant="outline">
            <Link to="/agent-configs/$agentConfigId/edit" params={{ agentConfigId: row.original.id }}>
              <SquarePenIcon data-icon="inline-start" />
              Edit
            </Link>
          </Button>
        </div>
      ),
    },
  ]
}
