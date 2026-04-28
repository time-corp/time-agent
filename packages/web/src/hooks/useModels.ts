import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateModelInput, Model, UpdateModelInput } from "@time/shared"
import { request } from "./api-client"

export type { Model } from "@time/shared"

const MODELS_API_BASE = "/api/v1/models"
const modelsQueryKey = ["models"] as const

export const useModelsQuery = () =>
  useQuery({
    queryKey: modelsQueryKey,
    queryFn: () => request<Model[]>(MODELS_API_BASE),
  })

export const useGetModelQuery = (id: string) =>
  useQuery({
    queryKey: [...modelsQueryKey, id],
    queryFn: () => request<Model>(`${MODELS_API_BASE}/${id}`),
    enabled: Boolean(id),
  })

export const useCreateModelMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateModelInput) =>
      request<Model>(MODELS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: modelsQueryKey })
    },
  })
}

export const useUpdateModelMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModelInput }) =>
      request<Model>(`${MODELS_API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: modelsQueryKey })
    },
  })
}

export const useDeleteModelMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => request<void>(`${MODELS_API_BASE}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: modelsQueryKey })
    },
  })
}

export const useDeleteModelsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => request<void>(`${MODELS_API_BASE}/${id}`, { method: "DELETE" })))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: modelsQueryKey })
    },
  })
}
