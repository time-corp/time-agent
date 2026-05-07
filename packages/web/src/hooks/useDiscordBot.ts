import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { request } from "./api-client"

const DISCORD_API_BASE = "/api/v1/discord"
const discordStatusQueryKey = ["discord-status"] as const

export type DiscordBotStatus = {
  channelId: string
  channelName: string
  running: boolean
}

type BotActionResult = { ok: boolean; error?: string }

export const useDiscordStatusQuery = () =>
  useQuery({
    queryKey: discordStatusQueryKey,
    queryFn: () => request<DiscordBotStatus[]>(`${DISCORD_API_BASE}/status`),
    refetchInterval: 10_000,
  })

export const useDiscordStartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${DISCORD_API_BASE}/start/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discordStatusQueryKey }),
  })
}

export const useDiscordStopMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${DISCORD_API_BASE}/stop/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discordStatusQueryKey }),
  })
}

export const useDiscordRestartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${DISCORD_API_BASE}/restart/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discordStatusQueryKey }),
  })
}
