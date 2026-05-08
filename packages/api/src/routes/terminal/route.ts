import { Hono } from "hono";
import type { ServerWebSocket, FileSink } from "bun";
import path from "node:path";
import { upgradeWebSocket } from "../ws";

type WS = ServerWebSocket<unknown>;

type Session = {
  proc: ReturnType<typeof Bun.spawn>;
  stdin: FileSink;
};

const sessions = new Map<WS, Session>();
const BRIDGE = path.join(import.meta.dir, "bridge.js");
const encoder = new TextEncoder();

async function pipeOutput(proc: ReturnType<typeof Bun.spawn>, send: (data: string) => void) {
  const reader = (proc.stdout as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      send(decoder.decode(value));
    }
  } catch {
    // process exited
  } finally {
    reader.releaseLock();
  }
}

export const terminalRoute = new Hono().get(
  "/",
  upgradeWebSocket(() => ({
    onOpen(_evt, ws) {
      const proc = Bun.spawn(["node", BRIDGE], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "ignore",
        env: { ...process.env, PTY_COLS: "80", PTY_ROWS: "24" },
      });

      const stdin = proc.stdin as FileSink;
      sessions.set(ws.raw, { proc, stdin });

      void pipeOutput(proc, (data) => {
        try {
          ws.send(JSON.stringify({ type: "output", data }));
        } catch {
          // ws closed
        }
      });

      void proc.exited.then((code) => {
        try { ws.send(JSON.stringify({ type: "exit", code })); } catch { /* ignore */ }
        sessions.delete(ws.raw);
      });
    },

    onMessage(evt, ws) {
      const session = sessions.get(ws.raw);
      if (!session) return;

      try {
        const msg = JSON.parse(String(evt.data)) as { type: string; data?: string; cols?: number; rows?: number };
        const line = JSON.stringify(msg) + "\n";
        session.stdin.write(encoder.encode(line));
        void session.stdin.flush();
      } catch {
        // ignore malformed
      }
    },

    onClose(_evt, ws) {
      const session = sessions.get(ws.raw);
      if (session) {
        try { session.stdin.end(); } catch { /* ignore */ }
        try { session.proc.kill(); } catch { /* ignore */ }
        sessions.delete(ws.raw);
      }
    },
  }))
);
