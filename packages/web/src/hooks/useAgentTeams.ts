import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AgentTeam, CreateAgentTeamInput, UpdateAgentTeamInput } from "@time/shared"
import { request } from "./api-client"

export type { AgentTeam } from "@time/shared"

const AGENT_TEAMS_API_BASE = "/api/v1/agent-teams"
const agentTeamsQueryKey = ["agent-teams"] as const

export const useAgentTeamsQuery = () =>
  useQuery({
    queryKey: agentTeamsQueryKey,
    queryFn: () => request<AgentTeam[]>(AGENT_TEAMS_API_BASE),
  })

export const useGetAgentTeamQuery = (id: string) =>
  useQuery({
    queryKey: [...agentTeamsQueryKey, id],
    queryFn: () => request<AgentTeam>(`${AGENT_TEAMS_API_BASE}/${id}`),
    enabled: Boolean(id),
  })

export const useCreateAgentTeamMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAgentTeamInput) =>
      request<AgentTeam>(AGENT_TEAMS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentTeamsQueryKey })
    },
  })
}

export const useUpdateAgentTeamMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAgentTeamInput }) =>
      request<AgentTeam>(`${AGENT_TEAMS_API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentTeamsQueryKey })
    },
  })
}

export const useDeleteAgentTeamMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${AGENT_TEAMS_API_BASE}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentTeamsQueryKey })
    },
  })
}

export const useDeleteAgentTeamsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => request<void>(`${AGENT_TEAMS_API_BASE}/${id}`, { method: "DELETE" }))
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentTeamsQueryKey })
    },
  })
}
