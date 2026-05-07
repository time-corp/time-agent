import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { request } from "./api-client"

const SLACK_API_BASE = "/api/v1/slack"
const slackStatusQueryKey = ["slack-status"] as const

export type SlackBotStatus = {
  channelId: string
  channelName: string
  running: boolean
}

type BotActionResult = { ok: boolean; error?: string }

export const useSlackStatusQuery = () =>
  useQuery({
    queryKey: slackStatusQueryKey,
    queryFn: () => request<SlackBotStatus[]>(`${SLACK_API_BASE}/status`),
    refetchInterval: 10_000,
  })

export const useSlackStartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${SLACK_API_BASE}/start/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: slackStatusQueryKey }),
  })
}

export const useSlackStopMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${SLACK_API_BASE}/stop/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: slackStatusQueryKey }),
  })
}

export const useSlackRestartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${SLACK_API_BASE}/restart/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: slackStatusQueryKey }),
  })
}
