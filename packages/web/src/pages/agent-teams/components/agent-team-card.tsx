import { Link } from "@tanstack/react-router";
import { CalendarIcon, Pen, Trash2Icon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentTeam } from "@/hooks/useAgentTeams";
import { cn } from "@/lib/utils";

const colorPalette = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
];

function avatarColor(name: string): string {
  return colorPalette[name.charCodeAt(0) % colorPalette.length] ?? "bg-slate-500";
}

type AgentTeamCardProps = {
  team: AgentTeam;
  leadAgentName?: string;
  onDelete: (id: string) => void;
};

export function AgentTeamCard({
  team,
  leadAgentName,
  onDelete,
}: AgentTeamCardProps) {
  const initials = team.name.slice(0, 2).toUpperCase();
  const date =
    team.updatedAt !== team.createdAt ? team.updatedAt : team.createdAt;
  const memberCount = team.members?.length ?? 0;

  return (
    <Card className="flex flex-col overflow-hidden border-none bg-card shadow-panel">
      <CardContent className="flex items-start gap-3 p-4 pb-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white",
            avatarColor(team.name),
          )}
        >
          {initials}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-semibold leading-tight">
              {team.name}
            </span>
            {team.isActive ? (
              <Badge variant="success" className="shrink-0 text-xs">
                <span className="mr-1 inline-block size-1.5 rounded-full bg-success-foreground" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0 text-xs">
                <span className="mr-1 inline-block size-1.5 rounded-full bg-muted-foreground/60" />
                Inactive
              </Badge>
            )}
          </div>
          {team.description ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {team.description}
            </p>
          ) : null}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {leadAgentName ? (
              <Badge variant="outline" className="text-xs">
                {leadAgentName}
              </Badge>
            ) : null}
            <Badge variant="secondary" className="text-xs">
              <UsersIcon className="mr-1 size-3" />
              {memberCount} {memberCount === 1 ? "agent" : "agents"}
            </Badge>
            <Badge
              variant={team.autoOrchestration ? "secondary" : "outline"}
              className="text-xs"
            >
              {team.autoOrchestration ? "auto" : "manual"}
            </Badge>
          </div>
        </div>
      </CardContent>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarIcon className="size-3.5" />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(team.id)}
          >
            <Trash2Icon className="size-4" />
          </Button>
          <Button asChild size="icon" variant="ghost" className="size-8">
            <Link
              to="/agent-teams/$agentTeamId/edit"
              params={{ agentTeamId: team.id }}
            >
              <Pen className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
