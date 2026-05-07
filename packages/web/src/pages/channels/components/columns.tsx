import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { ArrowDownAZIcon, ArrowUpAZIcon, ChevronsUpDownIcon, SquarePenIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Channel } from "@/hooks/useChannels"
import type { AgentConfig } from "@/hooks/useAgentConfigs"
import type { AgentTeam } from "@/hooks/useAgentTeams"
import type { TelegramBotStatus } from "@/hooks/useTelegramBot"
import { channelTypeMeta } from "@/pages/channels/schemas/channel-schema"

export function getChannelColumns({
  sorting,
  agents,
  teams,
  telegramStatuses = [],
}: {
  sorting: SortingState
  agents: AgentConfig[]
  teams: AgentTeam[]
  telegramStatuses?: TelegramBotStatus[]
}): ColumnDef<Channel>[] {
  const nameSorted = sorting[0]?.id === "name" ? sorting[0] : null
  const agentMap = new Map(agents.map((a) => [a.id, a]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const telegramStatusMap = new Map(telegramStatuses.map((s) => [s.channelId, s]))

  return [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => column.toggleSorting(nameSorted?.desc === false)}
        >
          Channel
          {nameSorted
            ? nameSorted.desc
              ? <ArrowDownAZIcon data-icon="inline-end" />
              : <ArrowUpAZIcon data-icon="inline-end" />
            : <ChevronsUpDownIcon data-icon="inline-end" />}
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {channelTypeMeta[row.original.type as keyof typeof channelTypeMeta]?.label ?? row.original.type}
        </Badge>
      ),
    },
    {
      id: "target",
      header: "Target",
      cell: ({ row }) => {
        if (row.original.agentId) {
          const agent = agentMap.get(row.original.agentId)
          return (
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">Agent</Badge>
              {agent?.name ?? row.original.agentId}
            </span>
          )
        }
        if (row.original.teamId) {
          const team = teamMap.get(row.original.teamId)
          return (
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">Team</Badge>
              {team?.name ?? row.original.teamId}
            </span>
          )
        }
        return "-"
      },
    },
    {
      id: "bot",
      header: "Bot",
      cell: ({ row }) => {
        if (row.original.type !== "telegram") return <span className="text-muted-foreground">—</span>
        const s = telegramStatusMap.get(row.original.id)
        if (!s) return <Badge variant="secondary">Stopped</Badge>
        return <Badge variant={s.running ? "success" : "secondary"}>{s.running ? "Running" : "Stopped"}</Badge>
      },
    },
    {
      id: "credentials",
      header: "Credentials",
      cell: ({ row }) => (
        <Badge variant={row.original.hasCredentials ? "success" : "secondary"}>
          {row.original.hasCredentials ? "Configured" : "None"}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/channels/$channelId/edit" params={{ channelId: row.original.id }}>
            <SquarePenIcon />
          </Link>
        </Button>
      ),
    },
  ]
}
