import { useState } from "react";
import { useSocket } from "../hooks/useSocket";

export function WSDemo() {
  const wsUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/v1/ws`;
  const { messages, status, send, clear } = useSocket(wsUrl);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput("");
  };

  return (
    <div>
      <div>
        <strong>WebSocket</strong>{" "}
        <span style={{ color: status === "open" ? "green" : "red" }}>● {status}</span>
        <button onClick={clear} style={{ marginLeft: 8 }}>clear</button>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12, marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
        {messages.length === 0 && <div style={{ color: "#888" }}>waiting for messages...</div>}
        {messages.map((m, i) => (
          <div key={i}>
            <span style={{ color: "#888" }}>[{m.type}]</span> {m.message}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="send a message..."
          style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}
        />
        <button onClick={handleSend} disabled={status !== "open"}>send</button>
      </div>
    </div>
  );
}
