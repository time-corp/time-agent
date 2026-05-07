import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Channel, CreateChannelInput, UpdateChannelInput } from "@time/shared"
import { request } from "./api-client"

export type { Channel } from "@time/shared"

const CHANNELS_API_BASE = "/api/v1/channels"
const channelsQueryKey = ["channels"] as const

export const useChannelsQuery = () =>
  useQuery({
    queryKey: channelsQueryKey,
    queryFn: () => request<Channel[]>(CHANNELS_API_BASE),
  })

export const useGetChannelQuery = (id: string) =>
  useQuery({
    queryKey: [...channelsQueryKey, id],
    queryFn: () => request<Channel>(`${CHANNELS_API_BASE}/${id}`),
    enabled: Boolean(id),
  })

export const useCreateChannelMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateChannelInput) =>
      request<Channel>(CHANNELS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelsQueryKey })
    },
  })
}

export const useUpdateChannelMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChannelInput }) =>
      request<Channel>(`${CHANNELS_API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelsQueryKey })
    },
  })
}

export const useDeleteChannelMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${CHANNELS_API_BASE}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelsQueryKey })
    },
  })
}

export const useDeleteChannelsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => request<void>(`${CHANNELS_API_BASE}/${id}`, { method: "DELETE" })),
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelsQueryKey })
    },
  })
}
