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
import { useModelsQuery } from "@/hooks/useModels"
import { useProvidersQuery } from "@/hooks/useProviders"
import { getModelColumns } from "@/pages/models/components/columns"

const pageSizeOptions = [10, 20, 50] as const

export function useModelsTable(query: string) {
  const deferredQuery = useDeferredValue(query.trim())
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([{ id: "modelName", desc: false }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { data: models = [], isLoading, isError, isFetching, refetch } = useModelsQuery()
  const { data: providers = [] } = useProvidersQuery()

  const providerMap = new Map(providers.map((provider) => [provider.id, provider]))
  const filteredModels = useMemo(() => {
    if (!deferredQuery) return models
    const q = deferredQuery.toLowerCase()
    return models.filter((model) => {
      const provider = providerMap.get(model.providerId)
      return (
        model.modelName.toLowerCase().includes(q) ||
        String(model.maxTokens).includes(q) ||
        provider?.name.toLowerCase().includes(q)
      )
    })
  }, [models, deferredQuery, providerMap])

  const columns = useMemo(() => getModelColumns({ sorting, providers }), [sorting, providers])
  const table = useDataTable({
    data: filteredModels,
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
    totalItems: filteredModels.length,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedModelIds: Object.keys(rowSelection).filter((id) => rowSelection[id]),
    pageSizeOptions,
    sorting,
    setPagination,
    setSorting,
    providers,
  }
}
