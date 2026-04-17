import { Hono } from "hono";

const fakeEvents = [
  { type: "agent.thinking", message: "Analyzing your request..." },
  { type: "agent.tool_call", message: "Searching knowledge base..." },
  { type: "agent.response", message: "Here is what I found." },
  { type: "agent.done", message: "Task completed." },
];

export const sseRoute = new Hono().get("/", (c) => {
  const { signal } = c.req.raw;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let i = 0;
      while (!signal.aborted) {
        const event = fakeEvents[i % fakeEvents.length]!;
        const msg =
          `id: ${i}\n` +
          `event: ${event.type}\n` +
          `data: ${JSON.stringify({ message: event.message, ts: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(msg));
        i++;
        await new Promise((r) => setTimeout(r, 1500));
      }
      controller.close();
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
