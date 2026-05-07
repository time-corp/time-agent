import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { request } from "./api-client"

const WA_API_BASE = "/api/v1/whatsapp"
const whatsappStatusQueryKey = ["whatsapp-status"] as const
const whatsappQRQueryKey = (channelId: string) => ["whatsapp-qr", channelId] as const

export type WhatsAppBotStatus = {
  channelId: string
  channelName: string
  running: boolean
  qr: string | null
}

type BotActionResult = { ok: boolean; error?: string }

export const useWhatsappStatusQuery = () =>
  useQuery({
    queryKey: whatsappStatusQueryKey,
    queryFn: () => request<WhatsAppBotStatus[]>(`${WA_API_BASE}/status`),
    refetchInterval: 5_000,
  })

export const useWhatsappQRQuery = (channelId: string, enabled: boolean) =>
  useQuery({
    queryKey: whatsappQRQueryKey(channelId),
    queryFn: () => request<{ qr: string | null }>(`${WA_API_BASE}/qr/${channelId}`),
    refetchInterval: 10_000,
    enabled,
  })

export const useWhatsappStartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${WA_API_BASE}/start/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappStatusQueryKey }),
  })
}

export const useWhatsappStopMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${WA_API_BASE}/stop/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappStatusQueryKey }),
  })
}

export const useWhatsappRestartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${WA_API_BASE}/restart/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappStatusQueryKey }),
  })
}

export const useWhatsappLogoutMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      request<BotActionResult>(`${WA_API_BASE}/logout/${channelId}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappStatusQueryKey }),
  })
}
