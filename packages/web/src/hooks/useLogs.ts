import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { request } from "./api-client"

const LOGS_API = "/api/v1/logs"

export type LogEntry = {
  time: number
  level: number
  levelName: string
  name?: string
  msg: string
  pid?: number
  hostname?: string
  [key: string]: unknown
}

export type LogsResponse = {
  entries: LogEntry[]
  total: number
}

export type LogsFilter = {
  limit?: number
  offset?: number
  level?: string
  search?: string
}

export const useLogsQuery = (filter: LogsFilter, refetchInterval?: number): UseQueryResult<LogsResponse> => {
  const params = new URLSearchParams()
  if (filter.limit) params.set("limit", String(filter.limit))
  if (filter.offset) params.set("offset", String(filter.offset))
  if (filter.level && filter.level !== "all") params.set("level", filter.level)
  if (filter.search) params.set("search", filter.search)

  return useQuery<LogsResponse>({
    queryKey: ["logs", filter],
    queryFn: () => request<LogsResponse>(`${LOGS_API}?${params}`),
    refetchInterval,
  })
}
