import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  CreateSkillAssignmentInput,
  Skill,
  SkillAssignment,
  SkillWithAssignmentState,
  Tool,
  ToolWithEffectiveState,
  UpsertToolAssignmentInput,
} from "@time/shared"
import { request } from "./api-client"

const TOOLS_API_BASE = "/api/v1/builtin-tools"
const skillsQueryKey = ["skills"] as const

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

export const useSkillsQuery = () =>
  useQuery({
    queryKey: skillsQueryKey,
    queryFn: () => request<Skill[]>(`${TOOLS_API_BASE}/skills`),
  })

export const useSkillAssignmentsQuery = (targetId: string, targetKind: string) =>
  useQuery({
    queryKey: ["skill-assignments", targetKind, targetId],
    queryFn: () =>
      request<SkillWithAssignmentState[]>(
        `${TOOLS_API_BASE}/skill-assignments?targetId=${encodeURIComponent(targetId)}&targetKind=${encodeURIComponent(targetKind)}`,
      ),
    enabled: Boolean(targetId) && Boolean(targetKind),
  })

export const useCreateSkillAssignmentMutation = (targetKind: string, targetId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSkillAssignmentInput) =>
      request<SkillAssignment>(`${TOOLS_API_BASE}/skill-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["skill-assignments", targetKind, targetId] }),
        queryClient.invalidateQueries({ queryKey: skillsQueryKey }),
      ])
    },
  })
}

export const useDeleteSkillAssignmentMutation = (targetKind: string, targetId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: string) =>
      request<void>(`${TOOLS_API_BASE}/skill-assignments/${assignmentId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["skill-assignments", targetKind, targetId] })
    },
  })
}

export const useUploadSkillArchiveMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.set("file", file)
      return request<Skill>(`${TOOLS_API_BASE}/skills/upload`, {
        method: "POST",
        body: formData,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: skillsQueryKey })
    },
  })
}
