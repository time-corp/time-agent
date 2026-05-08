import { XTerminal } from "../components/XTerminal";

export function TerminalPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-3xl border border-border bg-[#0d1117] overflow-hidden shadow-panel">
      <XTerminal />
    </div>
  );
}
