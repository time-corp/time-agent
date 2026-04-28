import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { ArrowDownAZIcon, ArrowUpAZIcon, BotIcon, ChevronsUpDownIcon, SquarePenIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Model } from "@/hooks/useModels"
import type { Provider } from "@/hooks/useProviders"

export function getModelColumns({
  sorting,
  providers,
}: {
  sorting: SortingState
  providers: Provider[]
}): ColumnDef<Model>[] {
  const modelSorted = sorting[0]?.id === "modelName" ? sorting[0] : null
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
          aria-label={`Select ${row.original.modelName}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        />
      ),
    },
    {
      accessorKey: "modelName",
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => column.toggleSorting(modelSorted?.desc === false)}
        >
          Model
          {modelSorted ? modelSorted.desc ? <ArrowDownAZIcon data-icon="inline-end" /> : <ArrowUpAZIcon data-icon="inline-end" /> : <ChevronsUpDownIcon data-icon="inline-end" />}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <BotIcon className="size-4 text-muted-foreground" />
          {row.original.modelName}
        </span>
      ),
    },
    {
      id: "provider",
      header: "Provider",
      cell: ({ row }) => providerMap.get(row.original.providerId)?.name ?? row.original.providerId,
    },
    {
      accessorKey: "temperature",
      header: "Temperature",
      cell: ({ row }) => row.original.temperature.toFixed(2),
    },
    {
      accessorKey: "maxTokens",
      header: "Max Tokens",
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
            <Link to="/models/$modelId/edit" params={{ modelId: row.original.id }}>
              <SquarePenIcon data-icon="inline-start" />
              Edit
            </Link>
          </Button>
        </div>
      ),
    },
  ]
}
