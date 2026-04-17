import { useEffect, useRef, useState } from "react";

export type SSEMessage = {
  event: string;
  data: string;
  id?: string;
};

export function useSSE(url: string) {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [status, setStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setStatus("open");
    es.onerror = () => setStatus("closed");

    const events = ["agent.thinking", "agent.tool_call", "agent.response", "agent.done"];
    events.forEach((event) => {
      es.addEventListener(event, (e: MessageEvent) => {
        setMessages((prev) => [...prev.slice(-49), { event, data: e.data, id: e.lastEventId }]);
      });
    });

    return () => {
      es.close();
      setStatus("closed");
    };
  }, [url]);

  const clear = () => setMessages([]);

  return { messages, status, clear };
}
