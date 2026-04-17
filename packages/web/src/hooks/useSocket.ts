import { useCallback, useEffect, useRef, useState } from "react";

export type WSMessage = {
  type: string;
  message: string;
  ts?: number;
};

export function useSocket(url: string) {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [status, setStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus("open");
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("closed");
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as WSMessage;
        setMessages((prev) => [...prev.slice(-49), msg]);
      } catch {
        // ignore malformed
      }
    };

    return () => ws.close();
  }, [url]);

  const send = useCallback((msg: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    }
  }, []);

  const clear = () => setMessages([]);

  return { messages, status, send, clear };
}
