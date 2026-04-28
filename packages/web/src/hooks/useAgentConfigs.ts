import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AgentConfig, CreateAgentConfigInput, UpdateAgentConfigInput } from "@time/shared"
import { request } from "./api-client"

export type { AgentConfig } from "@time/shared"

const AGENT_CONFIGS_API_BASE = "/api/v1/agent-configs"
const agentConfigsQueryKey = ["agent-configs"] as const

export const useAgentConfigsQuery = () =>
  useQuery({
    queryKey: agentConfigsQueryKey,
    queryFn: () => request<AgentConfig[]>(AGENT_CONFIGS_API_BASE),
  })

export const useGetAgentConfigQuery = (id: string) =>
  useQuery({
    queryKey: [...agentConfigsQueryKey, id],
    queryFn: () => request<AgentConfig>(`${AGENT_CONFIGS_API_BASE}/${id}`),
    enabled: Boolean(id),
  })

export const useCreateAgentConfigMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAgentConfigInput) =>
      request<AgentConfig>(AGENT_CONFIGS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentConfigsQueryKey })
    },
  })
}

export const useUpdateAgentConfigMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAgentConfigInput }) =>
      request<AgentConfig>(`${AGENT_CONFIGS_API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentConfigsQueryKey })
    },
  })
}

export const useDeleteAgentConfigMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${AGENT_CONFIGS_API_BASE}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentConfigsQueryKey })
    },
  })
}

export const useDeleteAgentConfigsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => request<void>(`${AGENT_CONFIGS_API_BASE}/${id}`, { method: "DELETE" }))
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentConfigsQueryKey })
    },
  })
}
