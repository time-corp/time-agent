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
import { useProvidersQuery } from "@/hooks/useProviders"
import { getProviderColumns } from "@/pages/providers/components/columns"

const pageSizeOptions = [10, 20, 50] as const

export function useProvidersTable(query: string) {
  const deferredQuery = useDeferredValue(query.trim())
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { data: providers = [], isLoading, isError, isFetching, refetch } = useProvidersQuery()

  const filteredProviders = useMemo(() => {
    if (!deferredQuery) return providers
    const q = deferredQuery.toLowerCase()
    return providers.filter(
      (provider) =>
        provider.name.toLowerCase().includes(q) ||
        provider.type.toLowerCase().includes(q) ||
        (provider.baseUrl ?? "").toLowerCase().includes(q)
    )
  }, [providers, deferredQuery])

  const columns = useMemo(() => getProviderColumns({ sorting }), [sorting])
  const table = useDataTable({
    data: filteredProviders,
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
    totalItems: filteredProviders.length,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedProviderIds: Object.keys(rowSelection).filter((id) => rowSelection[id]),
    pageSizeOptions,
    sorting,
    setPagination,
    setSorting,
  }
}
