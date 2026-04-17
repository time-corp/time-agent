import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";

type WS = ServerWebSocket<unknown>;

const connections = new Set<WS>();
const timers = new Map<WS, ReturnType<typeof setInterval>>();

function broadcast(msg: object) {
  const data = JSON.stringify(msg);
  for (const ws of connections) {
    ws.send(data);
  }
}

export const { upgradeWebSocket, websocket } = createBunWebSocket<WS>();

export const wsRoute = new Hono().get(
  "/",
  upgradeWebSocket(() => ({
    onOpen(_evt, ws) {
      connections.add(ws.raw);

      broadcast({
        type: "info",
        message: `New tab connected. Total tabs: ${connections.size}`,
      });

      // Push fake tokens to this specific tab every 2s
      const timer = setInterval(() => {
        ws.send(
          JSON.stringify({
            type: "agent.stream",
            message: `Token ${Date.now()}`,
            ts: Date.now(),
          })
        );
      }, 2000);

      timers.set(ws.raw, timer);
    },

    onMessage(evt, ws) {
      // Broadcast message from this tab to ALL tabs
      broadcast({
        type: "broadcast",
        message: String(evt.data),
        from: `tab-${Array.from(connections).indexOf(ws.raw) + 1}`,
      });
    },

    onClose(_evt, ws) {
      clearInterval(timers.get(ws.raw));
      timers.delete(ws.raw);
      connections.delete(ws.raw);
      broadcast({
        type: "info",
        message: `Tab disconnected. Total tabs: ${connections.size}`,
      });
    },
  }))
);
