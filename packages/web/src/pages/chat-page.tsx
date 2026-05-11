import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SendHorizonal,
  Bot,
  User,
  Loader2,
  GitBranch,
  AlertCircle,
  Square,
  Copy,
  Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import type { Components } from "streamdown";
import type { ChatArtifact, ChatAttachment, ChatResponse } from "@time/shared";
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs";
import { useAgentTeamsQuery } from "@/hooks/useAgentTeams";
import {
  useChatMessagesQuery,
  useChatTraceQuery,
  useChatThreadsQuery,
  useTeamChatMessagesQuery,
  useTeamChatThreadsQuery,
} from "@/hooks/useChatHistory";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Mode = "generate" | "stream";
type SourceType = "agent" | "team";

const EMPTY: never[] = [];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifacts?: ChatArtifact[];
  attachments?: ChatAttachment[];
  traceId?: string;
};

type ApiEnvelope<T> = {
  data: T;
};

type TraceTreeNode = {
  id: string;
  label: string;
  type: string;
  status: "success" | "running" | "error";
  durationMs: number | null;
  children: TraceTreeNode[];
};

const streamdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-2 text-base font-semibold last:mb-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 text-[15px] font-semibold last:mb-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-sm font-semibold last:mb-0">{children}</h3>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  inlineCode: ({ children }) => (
    <code className="rounded bg-background/70 px-1 py-0.5 text-[0.9em]">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  img: ({ alt, src }) => (
    <img
      alt={alt ?? ""}
      src={src}
      loading="lazy"
      className="my-3 w-full max-w-xl rounded-xl border object-cover shadow-sm"
    />
  ),
};

async function getErrorMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as {
        error?: { message?: string };
        message?: string;
      };
      return (
        data.error?.message ??
        data.message ??
        `Request failed: ${response.status}`
      );
    }

    const text = await response.text();
    return text || `Request failed: ${response.status}`;
  } catch {
    return `Request failed: ${response.status}`;
  }
}

function parseStreamChunk(chunk: string): string {
  if (!chunk.includes("data: ")) {
    return chunk;
  }

  let text = "";
  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const raw = line.slice(6).trim();
    if (raw === "[DONE]") break;
    try {
      const event = JSON.parse(raw);
      if (
        event.type === "text-delta" &&
        typeof event.payload?.text === "string"
      ) {
        text += event.payload.text;
      }
    } catch {
      // skip malformed lines
    }
  }
  return text;
}

function normalizeMessageContent(content: string): string {
  if (!content) return content;

  return content.replace(/\r\n/g, "\n");
}

export function ChatPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("stream");
  const [sourceType, setSourceType] = useState<SourceType>("agent");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [selectedAgentConfigId, setSelectedAgentConfigId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [threadId, setThreadId] = useState<string>(() => crypto.randomUUID());
  const [isDraftThread, setIsDraftThread] = useState(true);
  const [activeTraceId, setActiveTraceId] = useState("");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const { data: agentConfigsData, isLoading: isLoadingAgentConfigs } =
    useAgentConfigsQuery();
  const { data: agentTeamsData, isLoading: isLoadingTeams } =
    useAgentTeamsQuery();
  const agentConfigs = agentConfigsData ?? EMPTY;
  const agentTeams = agentTeamsData ?? EMPTY;
  const activeAgentConfigs = useMemo(
    () => agentConfigs.filter((a) => a.isActive),
    [agentConfigs],
  );
  const selectedAgentConfig = useMemo(
    () =>
      sourceType === "agent"
        ? activeAgentConfigs.find((agent) => agent.id === selectedAgentConfigId)
        : undefined,
    [activeAgentConfigs, selectedAgentConfigId, sourceType],
  );
  const isImageAgent = selectedAgentConfig?.agentMode === "image_generate";
  const activeTeams = useMemo(
    () => agentTeams.filter((team) => team.isActive),
    [agentTeams],
  );

  const selectedId =
    sourceType === "agent" ? selectedAgentConfigId : selectedTeamId;
  const resourceId = selectedId;

  const { data: agentThreadsData } = useChatThreadsQuery(
    sourceType === "agent" ? selectedAgentConfigId : "",
    sourceType === "agent" ? resourceId : "",
  );
  const { data: teamThreadsData } = useTeamChatThreadsQuery(
    sourceType === "team" ? selectedTeamId : "",
    sourceType === "team" ? resourceId : "",
  );
  const agentThreads = agentThreadsData ?? EMPTY;
  const teamThreads = teamThreadsData ?? EMPTY;
  const threads = useMemo(
    () => (sourceType === "agent" ? agentThreads : teamThreads),
    [sourceType, agentThreads, teamThreads],
  );

  const persistedThreadId = isDraftThread ? "" : threadId;

  const { data: agentMessagesData } = useChatMessagesQuery(
    sourceType === "agent" ? selectedAgentConfigId : "",
    sourceType === "agent" ? persistedThreadId : "",
    sourceType === "agent" ? resourceId : "",
  );
  const { data: teamMessagesData } = useTeamChatMessagesQuery(
    sourceType === "team" ? selectedTeamId : "",
    sourceType === "team" ? persistedThreadId : "",
    sourceType === "team" ? resourceId : "",
  );
  const agentMessages = agentMessagesData ?? EMPTY;
  const teamMessages = teamMessagesData ?? EMPTY;
  const threadMessages = useMemo(
    () => (sourceType === "agent" ? agentMessages : teamMessages),
    [sourceType, agentMessages, teamMessages],
  );
  const traceSourceId =
    sourceType === "agent" ? selectedAgentConfigId : selectedTeamId;
  const { data: activeTrace, isLoading: isLoadingTrace } = useChatTraceQuery(
    sourceType,
    traceSourceId,
    persistedThreadId,
    resourceId,
    activeTraceId,
  );

  function resetChat() {
    setMessages([]);
    setThreadId(crypto.randomUUID());
    setIsDraftThread(true);
    setActiveTraceId("");
  }

  function handleSourceTypeChange(next: SourceType) {
    setSourceType(next);
    resetChat();
  }

  function handleAgentChange(agentId: string) {
    setSelectedAgentConfigId(agentId);
    resetChat();
  }

  function handleTeamChange(teamId: string) {
    setSelectedTeamId(teamId);
    resetChat();
  }

  useEffect(() => {
    if (isImageAgent && mode === "stream") {
      setMode("generate");
    }
  }, [isImageAgent, mode]);

  useEffect(() => {
    if (!selectedAgentConfigId && activeAgentConfigs[0]?.id) {
      setSelectedAgentConfigId(activeAgentConfigs[0].id);
      resetChat();
    }
  }, [activeAgentConfigs, selectedAgentConfigId]);

  useEffect(() => {
    if (!selectedTeamId && activeTeams[0]?.id) {
      setSelectedTeamId(activeTeams[0].id);
      resetChat();
    }
  }, [activeTeams, selectedTeamId]);

  useEffect(() => {
    if (isDraftThread) return;

    const latestThreadId = threads[0]?.id;
    if (!latestThreadId) {
      setMessages([]);
      return;
    }
    setThreadId((current) =>
      threads.some((thread) => thread.id === current)
        ? current
        : latestThreadId,
    );
  }, [threads]);

  useEffect(() => {
    setMessages(
      threadMessages.map((message) => ({
        id: message.id,
        role: message.role === "system" ? "assistant" : message.role,
        content: message.content,
        ...(message.attachments?.length
          ? { attachments: message.attachments }
          : {}),
        ...(message.artifacts?.length
          ? { artifacts: message.artifacts }
          : {}),
        ...(message.traceId ? { traceId: message.traceId } : {}),
      })),
    );
  }, [threadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading || !selectedId) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);
    setIsStopping(false);

    const requestMessages = [{ role: userMsg.role, content: userMsg.content }];
    const currentThreadId = threadId;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const isTeam = sourceType === "team";
      const apiBase = isTeam
        ? `/api/v1/chat-team/${selectedTeamId}`
        : `/api/v1/chat/${selectedAgentConfigId}`;

      const threadMetadata = isTeam
        ? { teamId: selectedTeamId }
        : { agentConfigId: selectedAgentConfigId };

      if (mode === "generate") {
        const res = await fetch(`${apiBase}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            messages: requestMessages,
            threadId,
            resourceId,
            threadTitle:
              messages.length === 0 ? userMsg.content.slice(0, 80) : undefined,
            threadMetadata,
          }),
        });

        if (!res.ok) throw new Error(await getErrorMessage(res));

        const payload = (await res.json()) as
          | ApiEnvelope<ChatResponse>
          | ChatResponse;
        const data = isGenerateResponseEnvelope(payload)
          ? payload.data
          : payload;
        const text: string = data.text ?? JSON.stringify(data);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
                ? {
                    ...m,
                    content: text,
                    ...(data.artifacts?.length
                      ? { artifacts: data.artifacts }
                      : {}),
                    ...(data.attachments?.length
                      ? { attachments: data.attachments }
                      : {}),
                    ...(data.traceId ? { traceId: data.traceId } : {}),
                  }
              : m,
          ),
        );
      } else {
        const res = await fetch(`${apiBase}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            messages: requestMessages,
            threadId,
            resourceId,
            threadTitle:
              messages.length === 0 ? userMsg.content.slice(0, 80) : undefined,
            threadMetadata,
          }),
        });

        if (!res.ok) throw new Error(await getErrorMessage(res));
        if (!res.body) throw new Error("Stream response body is missing");
        const responseTraceId =
          res.headers.get("X-Mastra-Trace-Id") ?? undefined;

        if (responseTraceId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, traceId: responseTraceId } : m,
            ),
          );
        }

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
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + delta }
                  : m,
              ),
            );
          }
        }
      }

      setIsDraftThread(false);
      const historyKey = isTeam ? "team-chat-history" : "chat-history";
      await queryClient.invalidateQueries({
        queryKey: [historyKey, selectedId, resourceId, "threads"],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          historyKey,
          selectedId,
          resourceId,
          "threads",
          currentThreadId,
          "messages",
        ],
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id && m.content === ""
              ? { ...m, content: "[Stopped]" }
              : m,
          ),
        );
        return;
      }

      const errText = err instanceof Error ? err.message : "Error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `⚠️ ${errText}` } : m,
        ),
      );
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setIsStopping(false);
    }
  }

  function stopMessage() {
    if (!abortControllerRef.current || isStopping) return;

    setIsStopping(true);
    abortControllerRef.current.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isLoadingSource =
    sourceType === "agent" ? isLoadingAgentConfigs : isLoadingTeams;
  const hasNoSource =
    sourceType === "agent"
      ? activeAgentConfigs.length === 0
      : activeTeams.length === 0;
  const traceTree = useMemo<TraceTreeNode[]>(() => {
    if (!activeTrace) return [];

    const nodeMap = new Map<string, TraceTreeNode>();
    for (const span of activeTrace.spans) {
      nodeMap.set(span.spanId, {
        id: span.spanId,
        label: span.entityName || span.name,
        type: span.spanType,
        status: span.status,
        durationMs: span.durationMs,
        children: [],
      });
    }

    const roots: TraceTreeNode[] = [];
    for (const span of activeTrace.spans) {
      const node = nodeMap.get(span.spanId);
      if (!node) continue;

      if (span.parentSpanId) {
        const parent = nodeMap.get(span.parentSpanId);
        if (parent) {
          parent.children.push(node);
          continue;
        }
      }

      roots.push(node);
    }

    return roots;
  }, [activeTrace]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-3 p-3 border-b bg-muted/30 md:flex-row md:items-center md:justify-between">
        {/* Mode toggle */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">
            {t("chatMode")}:
          </span>
          {(["generate", "stream"] as Mode[]).map((m) => (
            <button
              key={m}
            onClick={() => setMode(m)}
            disabled={m === "stream" && isImageAgent}
            className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted",
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
                    : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {s === "agent" ? "Agent" : "Team"}
              </button>
            ))}
          </div>

          {sourceType === "agent" ? (
            <NativeSelect
              value={selectedAgentConfigId}
              disabled={
                loading ||
                isLoadingAgentConfigs ||
                activeAgentConfigs.length === 0
              }
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
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
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
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>

        {/* Thread history */}
        <div className="flex items-center gap-2 md:min-w-72">
          <span className="text-xs text-muted-foreground shrink-0">
            History:
          </span>
          <NativeSelect
            value={threadId}
            disabled={loading}
            onChange={(e) => {
              setThreadId(e.target.value);
              setIsDraftThread(false);
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
            className={cn(
              "flex items-start gap-3",
              msg.role === "user" && "flex-row-reverse",
            )}
          >
            <div
              className={cn(
                "shrink-0 size-8 rounded-full flex items-center justify-center",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {msg.role === "user" ? (
                <User className="size-4" />
              ) : (
                <Bot className="size-4" />
              )}
            </div>

            <div
              className={cn(
                "max-w-[75%]",
                msg.role === "user" && "flex flex-col items-end",
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm break-words",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
                    : "bg-muted text-foreground rounded-tl-sm",
                )}
              >
                {msg.content === "" && msg.role === "assistant" ? (
                  <Loader2 className="size-4 animate-spin opacity-50" />
                ) : msg.role === "assistant" ? (
                  <div className="space-y-3">
                    {msg.content ? (
                      <Streamdown
                        className="text-sm"
                        mode={
                          loading && msg.id === messages[messages.length - 1]?.id
                            ? "streaming"
                            : "static"
                        }
                        isAnimating={
                          loading &&
                          msg.role === "assistant" &&
                          msg.id === messages[messages.length - 1]?.id
                        }
                        caret="block"
                        plugins={{ code }}
                        controls={{ code: { copy: true, download: true } }}
                        components={streamdownComponents}
                      >
                        {normalizeMessageContent(msg.content)}
                      </Streamdown>
                    ) : null}
                    {(msg.artifacts ?? msg.attachments)?.map((artifact, index) =>
                      artifact.type === "image" ? (
                        <img
                          key={`${msg.id}-${artifact.url}-${index}`}
                          src={artifact.url}
                          alt={`Generated image ${index + 1}`}
                          loading="lazy"
                          className="w-full max-w-xl rounded-xl border object-cover shadow-sm"
                        />
                      ) : artifact.type === "file" ? (
                        <a
                          key={`${msg.id}-${artifact.url}-${index}`}
                          href={artifact.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg border bg-background px-3 py-2 text-sm underline underline-offset-2"
                        >
                          {artifact.name}
                        </a>
                      ) : artifact.type === "link" ? (
                        <a
                          key={`${msg.id}-${artifact.url}-${index}`}
                          href={artifact.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg border bg-background px-3 py-2 text-sm underline underline-offset-2"
                        >
                          {artifact.title ?? artifact.url}
                        </a>
                      ) : null,
                    )}
                  </div>
                ) : (
                  normalizeMessageContent(msg.content)
                )}
              </div>

              {msg.role === "assistant" && (
                <div className="mt-1 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        normalizeMessageContent(msg.content),
                      );
                      setCopiedMsgId(msg.id);
                      setTimeout(() => setCopiedMsgId(null), 2000);
                    }}
                  >
                    {copiedMsgId === msg.id ? (
                      <Check className="mr-1 size-3" />
                    ) : (
                      <Copy className="mr-1 size-3" />
                    )}
                    {copiedMsgId === msg.id ? "Copied" : "Copy"}
                  </Button>

                  {msg.traceId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveTraceId(msg.traceId ?? "")}
                    >
                      <GitBranch className="mr-1 size-3" />
                      Trace
                    </Button>
                  ) : null}
                </div>
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
            onClick={loading ? stopMessage : sendMessage}
            disabled={loading ? isStopping : !input.trim() || !selectedId}
            size="icon"
            className="shrink-0"
            variant={loading ? "outline" : "default"}
          >
            {loading ? (
              isStopping ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Square className="size-4 fill-current" />
              )
            ) : (
              <SendHorizonal className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 pl-1">
          {t("chatHint")}
        </p>
      </div>

      <Sheet
        open={Boolean(activeTraceId)}
        onOpenChange={(open) => !open && setActiveTraceId("")}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Trace graph</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              {activeTraceId || "No trace selected"}
            </div>

            {isLoadingTrace ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading trace...
              </div>
            ) : traceTree.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <AlertCircle className="size-4" />
                No trace spans found for this message.
              </div>
            ) : (
              <div className="space-y-3">
                {traceTree.map((root) => (
                  <TraceNodeView key={root.id} node={root} depth={0} />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function isGenerateResponseEnvelope(
  value: ApiEnvelope<ChatResponse> | ChatResponse,
): value is ApiEnvelope<ChatResponse> {
  return typeof value === "object" && value !== null && "data" in value;
}

function TraceNodeView({
  node,
  depth,
}: {
  node: TraceTreeNode;
  depth: number;
}) {
  return (
    <div className="space-y-2">
      <div
        className="rounded-xl border bg-background p-3"
        style={{ marginLeft: `${depth * 18}px` }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{node.label}</span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {node.type}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
              node.status === "error" && "bg-destructive/10 text-destructive",
              node.status === "running" && "bg-amber-500/10 text-amber-700",
              node.status === "success" && "bg-emerald-500/10 text-emerald-700",
            )}
          >
            {node.status}
          </span>
          {typeof node.durationMs === "number" ? (
            <span className="text-[11px] text-muted-foreground">
              {node.durationMs} ms
            </span>
          ) : null}
        </div>
      </div>

      {node.children.map((child) => (
        <TraceNodeView key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
