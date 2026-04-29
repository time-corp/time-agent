import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateProviderInput, Provider, UpdateProviderInput } from "@time/shared"
import { request } from "./api-client"

export type { Provider } from "@time/shared"
export type ProviderModelOption = { name: string; label: string }

const PROVIDERS_API_BASE = "/api/v1/providers"
const providersQueryKey = ["providers"] as const

export const useProvidersQuery = () =>
  useQuery({
    queryKey: providersQueryKey,
    queryFn: () => request<Provider[]>(PROVIDERS_API_BASE),
  })

export const useGetProviderQuery = (id: string) =>
  useQuery({
    queryKey: [...providersQueryKey, id],
    queryFn: () => request<Provider>(`${PROVIDERS_API_BASE}/${id}`),
    enabled: Boolean(id),
  })

export const useProviderModelsQuery = (id: string) =>
  useQuery({
    queryKey: [...providersQueryKey, id, "models"],
    queryFn: () => request<ProviderModelOption[]>(`${PROVIDERS_API_BASE}/${id}/models`),
    enabled: Boolean(id),
  })

export const useCreateProviderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProviderInput) =>
      request<Provider>(PROVIDERS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: providersQueryKey })
    },
  })
}

export const useUpdateProviderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProviderInput }) =>
      request<Provider>(`${PROVIDERS_API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: providersQueryKey })
    },
  })
}

export const useDeleteProviderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${PROVIDERS_API_BASE}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: providersQueryKey })
    },
  })
}

export const useDeleteProvidersMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => request<void>(`${PROVIDERS_API_BASE}/${id}`, { method: "DELETE" })))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: providersQueryKey })
    },
  })
}
