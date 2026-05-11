import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";

type WS = ServerWebSocket<unknown>;

export const { upgradeWebSocket, websocket } = createBunWebSocket<WS>();
