import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Tool, ToolWithEffectiveState, UpsertToolAssignmentInput } from "@time/shared"
import { request } from "./api-client"

const TOOLS_API_BASE = "/api/v1/builtin-tools"

export const useToolsQuery = () =>
  useQuery({
    queryKey: ["tools"],
    queryFn: () => request<Tool[]>(TOOLS_API_BASE),
  })

export const useToolAssignmentsQuery = (targetId: string, targetKind: string) =>
  useQuery({
    queryKey: ["tool-assignments", targetKind, targetId],
    queryFn: () =>
      request<ToolWithEffectiveState[]>(
        `${TOOLS_API_BASE}/assignments?targetId=${encodeURIComponent(targetId)}&targetKind=${encodeURIComponent(targetKind)}`,
      ),
    enabled: Boolean(targetId) && Boolean(targetKind),
  })

export const useUpsertToolAssignmentMutation = (targetKind: string, targetId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpsertToolAssignmentInput) =>
      request<unknown>(`${TOOLS_API_BASE}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tool-assignments", targetKind, targetId] })
    },
  })
}
