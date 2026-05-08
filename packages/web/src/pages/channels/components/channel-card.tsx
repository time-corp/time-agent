import { Link } from "@tanstack/react-router";
import { CalendarIcon, Pen, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Channel } from "@/hooks/useChannels";
import { channelTypeMeta } from "@/pages/channels/schemas/channel-schema";

type Props = {
  channel: Channel;
  onDelete: (id: string) => void;
};

export function ChannelCard({ channel, onDelete }: Props) {
  const meta = channelTypeMeta[channel.type as keyof typeof channelTypeMeta];
  const date =
    channel.updatedAt !== channel.createdAt ? channel.updatedAt : channel.createdAt;

  return (
    <Card className="flex flex-col overflow-hidden border-none bg-card shadow-panel">
      <CardContent className="flex items-start gap-3 p-4 pb-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl overflow-hidden">
          {meta ? (
            <img src={meta.icon} alt={meta.label} className="size-full object-contain" />
          ) : (
            <span className="text-sm font-bold text-white bg-slate-500 size-full flex items-center justify-center">
              {channel.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-semibold leading-tight">{channel.name}</span>
            {channel.isActive ? (
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
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {meta && (
              <Badge variant="outline" className="text-xs">
                {meta.label}
              </Badge>
            )}
            {channel.agentId && (
              <Badge variant="secondary" className="text-xs">
                Agent
              </Badge>
            )}
            {channel.teamId && (
              <Badge variant="secondary" className="text-xs">
                Team
              </Badge>
            )}
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
            onClick={() => onDelete(channel.id)}
          >
            <Trash2Icon className="size-4" />
          </Button>
          <Button asChild size="icon" variant="ghost" className="size-8">
            <Link to="/channels/$channelId/edit" params={{ channelId: channel.id }}>
              <Pen className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
