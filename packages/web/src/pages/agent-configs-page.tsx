import { useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  BotMessageSquareIcon,
  FilterIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react"
import { DataTable } from "@/components/data-table/data-table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { useDeleteAgentConfigsMutation } from "@/hooks/useAgentConfigs"
import { useAgentConfigsTable } from "@/pages/agent-configs/hooks/use-agent-configs-table"

export function AgentConfigsPage() {
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const deleteAgentConfigsMutation = useDeleteAgentConfigsMutation()
  const {
    table,
    totalItems,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedAgentConfigIds,
    pageSizeOptions,
    sorting,
    setPagination,
    setSorting,
  } = useAgentConfigsTable(query)

  const handleDeleteSelected = async () => {
    await deleteAgentConfigsMutation.mutateAsync(selectedAgentConfigIds)
    table.resetRowSelection()
    setIsDeleteOpen(false)
  }

  return (
    <>
      <PageHeaderCard
        icon={<BotMessageSquareIcon />}
        title="Agent Configs"
        description="Manage prompts, model bindings, and runtime JSON settings"
        titleMeta={totalItems}
        headerRight={
          <Button asChild size="lg">
            <Link to="/agent-configs/create">
              <PlusIcon data-icon="inline-start" />
              New Agent Config
            </Link>
          </Button>
        }
      />

      <SectionCard
        headerRight={
          selectedAgentConfigIds.length > 0 ? (
            <DeleteConfirmDialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              title="Delete agent configs"
              description={`Are you sure you want to delete ${selectedAgentConfigIds.length} agent config${selectedAgentConfigIds.length > 1 ? "s" : ""}? This action cannot be undone.`}
              confirmLabel="Delete"
              onConfirm={handleDeleteSelected}
              trigger={
                <Button type="button" size="sm" variant="destructive" disabled={deleteAgentConfigsMutation.isPending}>
                  <Trash2Icon data-icon="inline-start" />
                  Delete {selectedAgentConfigIds.length} selected
                </Button>
              }
            />
          ) : undefined
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full max-w-xl">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <SearchIcon />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  value={query}
                  placeholder="Search agent configs..."
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPagination((current) => ({ ...current, pageIndex: 0 }))
                  }}
                />
              </InputGroup>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
                <RefreshCwIcon data-icon="inline-start" />
                Refresh
              </Button>
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <FilterIcon data-icon="inline-start" />
                    Filters
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Settings2Icon data-icon="inline-start" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent>
              <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Sort by</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant={sorting[0]?.id === "name" ? "secondary" : "outline"} onClick={() => setSorting([{ id: "name", desc: false }])}>
                      Name
                    </Button>
                    <Button type="button" size="sm" variant={sorting[0]?.id === "updatedAt" ? "secondary" : "outline"} onClick={() => setSorting([{ id: "updatedAt", desc: true }])}>
                      Updated
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Direction</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant={sorting[0]?.desc ? "outline" : "secondary"} onClick={() => setSorting((current) => [{ id: current[0]?.id ?? "name", desc: false }])}>
                      Ascending
                    </Button>
                    <Button type="button" size="sm" variant={sorting[0]?.desc ? "secondary" : "outline"} onClick={() => setSorting((current) => [{ id: current[0]?.id ?? "name", desc: true }])}>
                      Descending
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Failed to load agent configs.
            </div>
          ) : (
            <>
              <DataTable table={table} loading={isLoading} emptyMessage="No agent configs found." />
              <DataTablePagination table={table} rowCount={totalItems} pageSizeOptions={pageSizeOptions} />
            </>
          )}
        </div>
      </SectionCard>
    </>
  )
}
