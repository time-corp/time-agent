import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SendHorizonal, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Mode = "generate" | "stream";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const API_BASE = "/api/v1/agents/time-agent";

function parseStreamChunk(chunk: string): string {
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      if (mode === "generate") {
        const res = await fetch(`${API_BASE}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const data = await res.json();
        const text: string = data.text ?? data.content ?? JSON.stringify(data);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: text } : m))
        );
      } else {
        const res = await fetch(`${API_BASE}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        const reader = res.body!.getReader();
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

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
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
            {/* Avatar */}
            <div
              className={cn(
                "flex-shrink-0 size-8 rounded-full flex items-center justify-center",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {msg.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
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
            className="resize-none min-h-[40px] max-h-[160px] flex-1"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            className="flex-shrink-0"
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
