import { DocumentText } from "@solar-icons/react"
import { useDeferredValue, useState } from "react"
import {
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLogsQuery, type LogEntry } from "@/hooks/useLogs"

const LEVELS = ["all", "trace", "debug", "info", "warn", "error", "fatal"] as const

const LEVEL_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "warning" }> = {
  trace: { label: "TRACE", variant: "outline" },
  debug: { label: "DEBUG", variant: "secondary" },
  info:  { label: "INFO",  variant: "default" },
  warn:  { label: "WARN",  variant: "warning" },
  error: { label: "ERROR", variant: "destructive" },
  fatal: { label: "FATAL", variant: "destructive" },
}

const PAGE_SIZE = 50

function getExtraFields(entry: LogEntry) {
  const skip = new Set(["time", "level", "levelName", "name", "msg", "pid", "hostname", "v"])
  return Object.entries(entry).filter(([k]) => !skip.has(k))
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(false)
  const badge = LEVEL_BADGE[entry.levelName] ?? { label: entry.levelName.toUpperCase(), variant: "outline" as const }
  const extras = getExtraFields(entry)

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => extras.length > 0 && setOpen((v) => !v)}
      >
        <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
          {new Date(entry.time).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}
        </TableCell>
        <TableCell>
          <Badge variant={badge.variant as "default" | "secondary" | "destructive" | "outline"} className="text-[10px] px-1.5 py-0 font-mono">
            {badge.label}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {entry.name ?? "—"}
        </TableCell>
        <TableCell className="text-sm font-mono">{entry.msg}</TableCell>
        <TableCell className="text-xs text-muted-foreground text-right">
          {extras.length > 0 && (
            <span className="text-xs opacity-50">{open ? "▲" : "▼"} {extras.length}</span>
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30 p-0">
            <pre className="px-4 py-2 text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
              {JSON.stringify(Object.fromEntries(extras), null, 2)}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function LogsPage() {
  const [level, setLevel] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const { data, isLoading, isFetching, refetch } = useLogsQuery(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE, level, ...(deferredSearch ? { search: deferredSearch } : {}) },
    autoRefresh ? 5000 : undefined,
  )

  const entries = data?.entries ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeaderCard
        icon={<DocumentText weight="Bold" />}
        title="Logs"
        description={`${total} entries`}
        headerRight={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCwIcon className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      <SectionCard>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Select value={level} onValueChange={(v) => { setLevel(v); setPage(0) }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "all" ? "All levels" : l.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <InputGroup className="flex-1 min-w-48">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search message or module..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            />
          </InputGroup>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Time</TableHead>
              <TableHead className="w-20">Level</TableHead>
              <TableHead className="w-40">Module</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No log entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, i) => <LogRow key={i} entry={entry} />)
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
