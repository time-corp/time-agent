import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { ArrowDownAZIcon, ArrowUpAZIcon, ChevronsUpDownIcon, KeyRoundIcon, SquarePenIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Provider } from "@/hooks/useProviders"

type ProvidersColumnsOptions = {
  sorting: SortingState
}

export function getProviderColumns({ sorting }: ProvidersColumnsOptions): ColumnDef<Provider>[] {
  const nameSorted = sorting[0]?.id === "name" ? sorting[0] : null

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
          Name
          {nameSorted ? nameSorted.desc ? <ArrowDownAZIcon data-icon="inline-end" /> : <ArrowUpAZIcon data-icon="inline-end" /> : <ChevronsUpDownIcon data-icon="inline-end" />}
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => row.original.type,
    },
    {
      accessorKey: "baseUrl",
      header: "Base URL",
      cell: ({ row }) => row.original.baseUrl || "-",
    },
    {
      id: "apiKey",
      header: "Key",
      cell: ({ row }) =>
        row.original.hasApiKey ? (
          <Badge variant="secondary">
            <KeyRoundIcon data-icon="inline-start" />
            configured
          </Badge>
        ) : (
          <Badge variant="outline">missing</Badge>
        ),
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
            <Link to="/providers/$providerId/edit" params={{ providerId: row.original.id }}>
              <SquarePenIcon data-icon="inline-start" />
              Edit
            </Link>
          </Button>
        </div>
      ),
    },
  ]
}
