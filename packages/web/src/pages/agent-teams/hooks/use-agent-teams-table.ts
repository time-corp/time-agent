import {
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { useDeferredValue, useMemo, useState } from "react"
import { useDataTable } from "@/components/data-table/use-data-table"
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs"
import { useAgentTeamsQuery } from "@/hooks/useAgentTeams"
import { getAgentTeamColumns } from "@/pages/agent-teams/components/columns"

const pageSizeOptions = [10, 20, 50] as const

export function useAgentTeamsTable(query: string) {
  const deferredQuery = useDeferredValue(query.trim())
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: teams = [], isLoading, isError, isFetching, refetch } = useAgentTeamsQuery()
  const { data: agents = [] } = useAgentConfigsQuery()

  const filtered = useMemo(() => {
    if (!deferredQuery) return teams
    const q = deferredQuery.toLowerCase()
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
    )
  }, [teams, deferredQuery])

  const columns = useMemo(() => getAgentTeamColumns({ sorting, agents }), [sorting, agents])

  const table = useDataTable({
    data: filtered,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { pagination, sorting, rowSelection, columnVisibility },
  })

  return {
    table,
    totalItems: filtered.length,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedTeamIds: Object.keys(rowSelection).filter((id) => rowSelection[id]),
    pageSizeOptions,
    sorting,
    setPagination,
    setSorting,
    agents,
  }
}
