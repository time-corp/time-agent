import { useRef, useState, useCallback } from "react";
import { ChatSquareCode } from "@solar-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeaderCard } from "@/components/share/cards/page-header-card";
import { XTerminal, type XTerminalHandle } from "@/components/XTerminal";

export function TerminalPage() {
  const terminalRef = useRef<XTerminalHandle>(null);
  const [connected, setConnected] = useState(false);

  const handleConnect = useCallback(() => {
    terminalRef.current?.connect();
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 h-[calc(100vh-4rem)]">
      <PageHeaderCard
        icon={<ChatSquareCode weight="Bold" />}
        title="Terminal"
        description={connected ? "Connected" : "Not connected"}
        headerRight={
          <div className="flex items-center gap-3">
            {connected && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-green-500" />
                Connected
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleConnect}>
              {connected ? "Reconnect" : "Connect"}
            </Button>
          </div>
        }
      />
      <div className="flex-1 rounded-3xl border border-border bg-[#0d1117] overflow-hidden shadow-panel">
        <XTerminal ref={terminalRef} onConnectionChange={setConnected} />
      </div>
    </div>
  );
}
