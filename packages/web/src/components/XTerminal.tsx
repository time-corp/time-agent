import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const getWsUrl = () => {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/api/v1/terminal`;
};

export type XTerminalHandle = {
  connect: () => void;
};

type Props = {
  onConnectionChange?: (connected: boolean) => void;
};

export const XTerminal = forwardRef<XTerminalHandle, Props>(function XTerminal({ onConnectionChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      theme: {
        background: "#0d1117",
        foreground: "#e6edf3",
        cursor: "#58a6ff",
        selectionBackground: "#264f78",
        black: "#484f58",
        red: "#ff7b72",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    term.write("\x1b[90mPress Connect to start a terminal session.\x1b[0m\r\n");

    const handleClick = () => term.focus();
    containerRef.current.addEventListener("click", handleClick);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    return () => {
      containerRef.current?.removeEventListener("click", handleClick);
      roRef.current?.disconnect();
      wsRef.current?.close();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      wsRef.current = null;
    };
  }, []);

  const connect = useCallback(() => {
    const term = termRef.current;
    const fitAddon = fitAddonRef.current;
    if (!term || !fitAddon) return;

    wsRef.current?.close();
    roRef.current?.disconnect();

    term.write("\x1b[90mConnecting...\x1b[0m\r\n");

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      onConnectionChange?.(true);
      term.write("\x1b[90m[connected]\x1b[0m\r\n");
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      term.focus();
    };

    ws.onerror = () => {
      term.write("\x1b[31m[websocket error — check API server]\x1b[0m\r\n");
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { type: string; data?: string; code?: number };
        if (msg.type === "output" && msg.data) {
          term.write(msg.data);
        } else if (msg.type === "exit") {
          term.write(`\r\n\x1b[90m[process exited with code ${msg.code}]\x1b[0m\r\n`);
          onConnectionChange?.(false);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = (e) => {
      onConnectionChange?.(false);
      term.write(`\r\n\x1b[90m[connection closed — code ${e.code}]\x1b[0m\r\n`);
    };

    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "input", data }));
      }
    });

    const ro = new ResizeObserver(() => {
      fitAddon.fit();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    });

    if (containerRef.current) ro.observe(containerRef.current);
    roRef.current = ro;
  }, [onConnectionChange]);

  useImperativeHandle(ref, () => ({ connect }), [connect]);

  return <div ref={containerRef} className="h-full w-full" />;
});
