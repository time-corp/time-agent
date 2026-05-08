import { Route } from "@solar-icons/react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PlusIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { PageHeaderCard } from "@/components/share/cards/page-header-card";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useChannelsQuery, useDeleteChannelsMutation } from "@/hooks/useChannels";
import { ChannelCard } from "@/pages/channels/components/channel-card";

export function ChannelsPage() {
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: channels = [], isLoading, isError, isFetching, refetch } =
    useChannelsQuery();
  const deleteChannelsMutation = useDeleteChannelsMutation();

  const deferredQuery = useDeferredValue(query.trim());

  const filtered = useMemo(() => {
    let result = channels;
    if (deferredQuery) {
      const q = deferredQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [channels, deferredQuery]);

  const channelToDelete = channels.find((c) => c.id === deleteId);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteChannelsMutation.mutateAsync([deleteId]);
    setDeleteId(null);
  };

  return (
    <>
      <PageHeaderCard
        icon={<Route weight="Bold" />}
        title="Channels"
        description="Connect agents and teams to external chat platforms"
        titleMeta={channels.length}
        mobileAction={
          <Button asChild size="icon" className="size-10 rounded-lg">
            <Link to="/channels/create">
              <PlusIcon />
            </Link>
          </Button>
        }
        headerRight={
          <Button asChild size="lg">
            <Link to="/channels/create">
              <PlusIcon data-icon="inline-start" />
              New Channel
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <InputGroup className="h-9">
              <InputGroupAddon>
                <InputGroupText>
                  <SearchIcon />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                placeholder="Search channels..."
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCwIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Failed to load channels.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No channels found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {filtered.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete channel"
        description={`Are you sure you want to delete "${channelToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
