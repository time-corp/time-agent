import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SendHorizonal, Bot, User, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs";
import { useAgentTeamsQuery } from "@/hooks/useAgentTeams";
import {
  useChatMessagesQuery,
  useChatThreadsQuery,
  useTeamChatMessagesQuery,
  useTeamChatThreadsQuery,
} from "@/hooks/useChatHistory";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Mode = "generate" | "stream";
type SourceType = "agent" | "team";

const EMPTY: never[] = []

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

async function getErrorMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? ""

  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as {
        error?: { message?: string }
        message?: string
      }
      return data.error?.message ?? data.message ?? `Request failed: ${response.status}`
    }

    const text = await response.text()
    return text || `Request failed: ${response.status}`
  } catch {
    return `Request failed: ${response.status}`
  }
}

function parseStreamChunk(chunk: string): string {
  if (!chunk.includes("data: ")) {
    return chunk
  }

  let text = "";
  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const raw = line.slice(6).trim();
    if (raw === "[DONE]") break;
    try {
      const event = JSON.parse(raw);
      if (event.type === "text-delta" && typeof event.payload?.text === "string") {
        text += event.payload.text;
      }
    } catch {
      // skip malformed lines
    }
  }
  return text;
}

export function ChatPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("stream");
  const [sourceType, setSourceType] = useState<SourceType>("agent");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAgentConfigId, setSelectedAgentConfigId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [threadId, setThreadId] = useState<string>(() => crypto.randomUUID());
  const [isDraftThread, setIsDraftThread] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient()

  const { data: agentConfigsData, isLoading: isLoadingAgentConfigs } = useAgentConfigsQuery()
  const { data: agentTeamsData, isLoading: isLoadingTeams } = useAgentTeamsQuery()
  const agentConfigs = agentConfigsData ?? EMPTY
  const agentTeams = agentTeamsData ?? EMPTY
  const activeAgentConfigs = useMemo(() => agentConfigs.filter((a) => a.isActive), [agentConfigs])
  const activeTeams = useMemo(() => agentTeams.filter((team) => team.isActive), [agentTeams])

  const selectedId = sourceType === "agent" ? selectedAgentConfigId : selectedTeamId
  const resourceId = selectedId

  const { data: agentThreadsData } = useChatThreadsQuery(
    sourceType === "agent" ? selectedAgentConfigId : "",
    sourceType === "agent" ? resourceId : "",
  )
  const { data: teamThreadsData } = useTeamChatThreadsQuery(
    sourceType === "team" ? selectedTeamId : "",
    sourceType === "team" ? resourceId : "",
  )
  const agentThreads = agentThreadsData ?? EMPTY
  const teamThreads = teamThreadsData ?? EMPTY
  const threads = useMemo(
    () => (sourceType === "agent" ? agentThreads : teamThreads),
    [sourceType, agentThreads, teamThreads],
  )

  const persistedThreadId = isDraftThread ? "" : threadId

  const { data: agentMessagesData } = useChatMessagesQuery(
    sourceType === "agent" ? selectedAgentConfigId : "",
    sourceType === "agent" ? persistedThreadId : "",
    sourceType === "agent" ? resourceId : "",
  )
  const { data: teamMessagesData } = useTeamChatMessagesQuery(
    sourceType === "team" ? selectedTeamId : "",
    sourceType === "team" ? persistedThreadId : "",
    sourceType === "team" ? resourceId : "",
  )
  const agentMessages = agentMessagesData ?? EMPTY
  const teamMessages = teamMessagesData ?? EMPTY
  const threadMessages = useMemo(
    () => (sourceType === "agent" ? agentMessages : teamMessages),
    [sourceType, agentMessages, teamMessages],
  )

  function resetChat() {
    setMessages([])
    setThreadId(crypto.randomUUID())
    setIsDraftThread(true)
  }

  function handleSourceTypeChange(next: SourceType) {
    setSourceType(next)
    resetChat()
  }

  function handleAgentChange(agentId: string) {
    setSelectedAgentConfigId(agentId)
    resetChat()
  }

  function handleTeamChange(teamId: string) {
    setSelectedTeamId(teamId)
    resetChat()
  }

  useEffect(() => {
    if (!selectedAgentConfigId && activeAgentConfigs[0]?.id) {
      setSelectedAgentConfigId(activeAgentConfigs[0].id)
      resetChat()
    }
  }, [activeAgentConfigs, selectedAgentConfigId])

  useEffect(() => {
    if (!selectedTeamId && activeTeams[0]?.id) {
      setSelectedTeamId(activeTeams[0].id)
      resetChat()
    }
  }, [activeTeams, selectedTeamId])

  useEffect(() => {
    if (isDraftThread) return

    const latestThreadId = threads[0]?.id
    if (!latestThreadId) {
      setMessages([])
      return
    }
    setThreadId((current) => (threads.some((thread) => thread.id === current) ? current : latestThreadId))
  }, [threads]);

  useEffect(() => {
    setMessages(
      threadMessages.map((message) => ({
        id: message.id,
        role: message.role === "system" ? "assistant" : message.role,
        content: message.content,
      })),
    )
  }, [threadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading || !selectedId) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);

    const requestMessages = [{ role: userMsg.role, content: userMsg.content }];
    const currentThreadId = threadId

    try {
      const isTeam = sourceType === "team"
      const apiBase = isTeam
        ? `/api/v1/chat-team/${selectedTeamId}`
        : `/api/v1/chat/${selectedAgentConfigId}`

      const threadMetadata = isTeam
        ? { teamId: selectedTeamId }
        : { agentConfigId: selectedAgentConfigId }

      if (mode === "generate") {
        const res = await fetch(`${apiBase}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: requestMessages,
            threadId,
            resourceId,
            threadTitle: messages.length === 0 ? userMsg.content.slice(0, 80) : undefined,
            threadMetadata,
          }),
        });

        if (!res.ok) throw new Error(await getErrorMessage(res))

        const data = await res.json();
        const text: string = data.text ?? data.content ?? JSON.stringify(data);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: text } : m))
        );
      } else {
        const res = await fetch(`${apiBase}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: requestMessages,
            threadId,
            resourceId,
            threadTitle: messages.length === 0 ? userMsg.content.slice(0, 80) : undefined,
            threadMetadata,
          }),
        });

        if (!res.ok) throw new Error(await getErrorMessage(res))
        if (!res.body) throw new Error("Stream response body is missing")

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const delta = parseStreamChunk(chunk);
          if (delta) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m
              )
            );
          }
        }
      }

      setIsDraftThread(false)
      const historyKey = isTeam ? "team-chat-history" : "chat-history"
      await queryClient.invalidateQueries({
        queryKey: [historyKey, selectedId, resourceId, "threads"],
      })
      await queryClient.invalidateQueries({
        queryKey: [historyKey, selectedId, resourceId, "threads", currentThreadId, "messages"],
      })
    } catch (err) {
      const errText = err instanceof Error ? err.message : "Error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `⚠️ ${errText}` } : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isLoadingSource = sourceType === "agent" ? isLoadingAgentConfigs : isLoadingTeams
  const hasNoSource = sourceType === "agent" ? activeAgentConfigs.length === 0 : activeTeams.length === 0

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-3 p-3 border-b bg-muted/30 md:flex-row md:items-center md:justify-between">
        {/* Mode toggle */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">{t("chatMode")}:</span>
          {(["generate", "stream"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {m === "generate" ? t("chatGenerate") : t("chatStream")}
            </button>
          ))}
        </div>

        {/* Source selector: Agent | Team toggle + dropdown */}
        <div className="flex items-center gap-2 md:min-w-80">
          <div className="flex rounded-md border overflow-hidden shrink-0">
            {(["agent", "team"] as SourceType[]).map((s) => (
              <button
                key={s}
                onClick={() => handleSourceTypeChange(s)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-colors",
                  sourceType === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                {s === "agent" ? "Agent" : "Team"}
              </button>
            ))}
          </div>

          {sourceType === "agent" ? (
            <NativeSelect
              value={selectedAgentConfigId}
              disabled={loading || isLoadingAgentConfigs || activeAgentConfigs.length === 0}
              onChange={(e) => handleAgentChange(e.target.value)}
            >
              <option value="" disabled>
                {isLoadingAgentConfigs
                  ? "Loading agents..."
                  : activeAgentConfigs.length === 0
                    ? "No active agents"
                    : "Select agent"}
              </option>
              {activeAgentConfigs.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </NativeSelect>
          ) : (
            <NativeSelect
              value={selectedTeamId}
              disabled={loading || isLoadingTeams || activeTeams.length === 0}
              onChange={(e) => handleTeamChange(e.target.value)}
            >
              <option value="" disabled>
                {isLoadingTeams
                  ? "Loading teams..."
                  : activeTeams.length === 0
                    ? "No active teams"
                    : "Select team"}
              </option>
              {activeTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </NativeSelect>
          )}
        </div>

        {/* Thread history */}
        <div className="flex items-center gap-2 md:min-w-72">
          <span className="text-xs text-muted-foreground shrink-0">History:</span>
          <NativeSelect
            value={threadId}
            disabled={loading}
            onChange={(e) => {
              setThreadId(e.target.value)
              setIsDraftThread(false)
            }}
          >
            {threads.length === 0 ? (
              <option value={threadId}>New chat</option>
            ) : (
              threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.title ?? "Untitled chat"}
                </option>
              ))
            )}
          </NativeSelect>
          <Button type="button" variant="outline" size="sm" onClick={resetChat}>
            New chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Bot className="size-10 opacity-30" />
            <p className="text-sm">{t("chatEmpty")}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex items-start gap-3", msg.role === "user" && "flex-row-reverse")}
          >
            <div
              className={cn(
                "shrink-0 size-8 rounded-full flex items-center justify-center",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {msg.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>

            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap wrap-break-word",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              )}
            >
              {msg.content === "" && msg.role === "assistant" ? (
                <Loader2 className="size-4 animate-spin opacity-50" />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-background">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatPlaceholder")}
            rows={1}
            className="resize-none min-h-10 max-h-40 flex-1"
            disabled={loading || hasNoSource || isLoadingSource}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !selectedId}
            size="icon"
            className="shrink-0"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizonal className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 pl-1">
          {t("chatHint")}
        </p>
      </div>
    </div>
  );
}
