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
import { useChannelsQuery } from "@/hooks/useChannels"
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs"
import { useAgentTeamsQuery } from "@/hooks/useAgentTeams"
import { useTelegramStatusQuery } from "@/hooks/useTelegramBot"
import { getChannelColumns } from "@/pages/channels/components/columns"

const pageSizeOptions = [10, 20, 50] as const

export function useChannelsTable(query: string) {
  const deferredQuery = useDeferredValue(query.trim())
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: channels = [], isLoading, isError, isFetching, refetch } = useChannelsQuery()
  const { data: agents = [] } = useAgentConfigsQuery()
  const { data: teams = [] } = useAgentTeamsQuery()
  const { data: telegramStatuses = [] } = useTelegramStatusQuery()

  const filtered = useMemo(() => {
    if (!deferredQuery) return channels
    const q = deferredQuery.toLowerCase()
    return channels.filter(
      (ch) =>
        ch.name.toLowerCase().includes(q) ||
        ch.type.toLowerCase().includes(q),
    )
  }, [channels, deferredQuery])

  const columns = useMemo(
    () => getChannelColumns({ sorting, agents, teams, telegramStatuses }),
    [sorting, agents, teams, telegramStatuses],
  )

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
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination, sorting, rowSelection, columnVisibility },
  })

  const selectedChannelIds = Object.keys(rowSelection).filter((id) => rowSelection[id])

  return {
    table,
    totalItems: filtered.length,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedChannelIds,
    pageSizeOptions,
    sorting,
    setPagination,
    setSorting,
  }
}
