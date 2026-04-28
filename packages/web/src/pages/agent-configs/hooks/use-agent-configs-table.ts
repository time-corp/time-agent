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
import { useModelsQuery } from "@/hooks/useModels"
import { getAgentConfigColumns } from "@/pages/agent-configs/components/columns"

const pageSizeOptions = [10, 20, 50] as const

export function useAgentConfigsTable(query: string) {
  const deferredQuery = useDeferredValue(query.trim())
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { data: agentConfigs = [], isLoading, isError, isFetching, refetch } = useAgentConfigsQuery()
  const { data: models = [] } = useModelsQuery()

  const modelMap = new Map(models.map((model) => [model.id, model]))
  const filteredAgentConfigs = useMemo(() => {
    if (!deferredQuery) return agentConfigs
    const q = deferredQuery.toLowerCase()
    return agentConfigs.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        (agent.description ?? "").toLowerCase().includes(q) ||
        modelMap.get(agent.modelId)?.modelName.toLowerCase().includes(q)
    )
  }, [agentConfigs, deferredQuery, modelMap])

  const columns = useMemo(() => getAgentConfigColumns({ sorting, models }), [sorting, models])
  const table = useDataTable({
    data: filteredAgentConfigs,
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
    totalItems: filteredAgentConfigs.length,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedAgentConfigIds: Object.keys(rowSelection).filter((id) => rowSelection[id]),
    pageSizeOptions,
    sorting,
    setPagination,
    setSorting,
    models,
  }
}
