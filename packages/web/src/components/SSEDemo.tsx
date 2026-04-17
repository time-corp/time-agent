import { useSSE } from "../hooks/useSSE";

export function SSEDemo() {
  const { messages, status, clear } = useSSE("/api/v1/sse");

  return (
    <div>
      <div>
        <strong>SSE</strong>{" "}
        <span style={{ color: status === "open" ? "green" : "red" }}>● {status}</span>
        <button onClick={clear} style={{ marginLeft: 8 }}>clear</button>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12, marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
        {messages.length === 0 && <div style={{ color: "#888" }}>waiting for events...</div>}
        {messages.map((m, i) => (
          <div key={i}>
            <span style={{ color: "#888" }}>[{m.event}]</span>{" "}
            {JSON.parse(m.data).message}
          </div>
        ))}
      </div>
    </div>
  );
}
