import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { request } from "./api-client"

const TELEGRAM_API_BASE = "/api/v1/telegram"
const telegramStatusQueryKey = ["telegram-status"] as const

export type TelegramBotStatus = {
  channelId: string
  channelName: string
  running: boolean
}

type BotActionResult = { ok: boolean; error?: string }

export const useTelegramStatusQuery = () =>
  useQuery({
    queryKey: telegramStatusQueryKey,
    queryFn: () => request<TelegramBotStatus[]>(`${TELEGRAM_API_BASE}/status`),
    refetchInterval: 10_000,
  })

export const useTelegramStartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${TELEGRAM_API_BASE}/start/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramStatusQueryKey }),
  })
}

export const useTelegramStopMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${TELEGRAM_API_BASE}/stop/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramStatusQueryKey }),
  })
}

export const useTelegramRestartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${TELEGRAM_API_BASE}/restart/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramStatusQueryKey }),
  })
}
