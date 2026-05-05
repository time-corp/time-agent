import { useQuery } from "@tanstack/react-query"
import type { ChatHistoryMessage, ChatHistoryThread } from "@time/shared"
import { request } from "./api-client"

const chatHistoryQueryKey = ["chat-history"] as const
const teamChatHistoryQueryKey = ["team-chat-history"] as const

export const useChatThreadsQuery = (agentConfigId: string, resourceId: string) =>
  useQuery({
    queryKey: [...chatHistoryQueryKey, agentConfigId, resourceId, "threads"],
    queryFn: () =>
      request<ChatHistoryThread[]>(
        `/api/v1/chat/${agentConfigId}/threads?resourceId=${encodeURIComponent(resourceId)}`
      ),
    enabled: Boolean(agentConfigId && resourceId),
  })

export const useChatMessagesQuery = (
  agentConfigId: string,
  threadId: string,
  resourceId: string,
) =>
  useQuery({
    queryKey: [...chatHistoryQueryKey, agentConfigId, resourceId, "threads", threadId, "messages"],
    queryFn: () =>
      request<ChatHistoryMessage[]>(
        `/api/v1/chat/${agentConfigId}/threads/${threadId}/messages?resourceId=${encodeURIComponent(resourceId)}`
      ),
    enabled: Boolean(agentConfigId && threadId && resourceId),
  })

export const useTeamChatThreadsQuery = (teamId: string, resourceId: string) =>
  useQuery({
    queryKey: [...teamChatHistoryQueryKey, teamId, resourceId, "threads"],
    queryFn: () =>
      request<ChatHistoryThread[]>(
        `/api/v1/chat-team/${teamId}/threads?resourceId=${encodeURIComponent(resourceId)}`
      ),
    enabled: Boolean(teamId && resourceId),
  })

export const useTeamChatMessagesQuery = (
  teamId: string,
  threadId: string,
  resourceId: string,
) =>
  useQuery({
    queryKey: [...teamChatHistoryQueryKey, teamId, resourceId, "threads", threadId, "messages"],
    queryFn: () =>
      request<ChatHistoryMessage[]>(
        `/api/v1/chat-team/${teamId}/threads/${threadId}/messages?resourceId=${encodeURIComponent(resourceId)}`
      ),
    enabled: Boolean(teamId && threadId && resourceId),
  })
