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
import { useUsersQuery } from "@/hooks/useUsers"
import { getUserColumns } from "@/pages/users/columns"

const pageSizeOptions = [10, 20, 50] as const

export function useUsersTable(query: string) {
  const deferredQuery = useDeferredValue(query.trim())
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "username", desc: false },
  ])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data: users = [], isLoading, isError, isFetching, refetch } = useUsersQuery()

  const filteredUsers = useMemo(() => {
    if (!deferredQuery) return users
    const q = deferredQuery.toLowerCase()
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.fullname.toLowerCase().includes(q)
    )
  }, [users, deferredQuery])

  const columns = useMemo(() => getUserColumns({ sorting }), [sorting])

  const table = useDataTable({
    data: filteredUsers,
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
    state: {
      pagination,
      sorting,
      rowSelection,
      columnVisibility,
    },
  })

  const selectedUserIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const totalItems = filteredUsers.length

  return {
    table,
    totalItems,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedUserIds,
    pageSizeOptions,
    sorting,
    setPagination,
    setSorting,
  }
}
