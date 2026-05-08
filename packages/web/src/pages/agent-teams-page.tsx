import { UsersGroupTwoRounded } from "@solar-icons/react";
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
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs";
import { useAgentTeamsQuery, useDeleteAgentTeamsMutation } from "@/hooks/useAgentTeams";
import { AgentTeamCard } from "@/pages/agent-teams/components/agent-team-card";

export function AgentTeamsPage() {
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: teams = [], isLoading, isError, isFetching, refetch } =
    useAgentTeamsQuery();
  const { data: agentConfigs = [] } = useAgentConfigsQuery();
  const deleteTeamsMutation = useDeleteAgentTeamsMutation();

  const agentMap = useMemo(
    () => new Map(agentConfigs.map((a) => [a.id, a])),
    [agentConfigs],
  );

  const deferredQuery = useDeferredValue(query.trim());

  const filtered = useMemo(() => {
    let result = teams;
    if (deferredQuery) {
      const q = deferredQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          (agentMap.get(t.leadAgentId)?.name ?? "").toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, deferredQuery, agentMap]);

  const teamToDelete = teams.find((t) => t.id === deleteId);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteTeamsMutation.mutateAsync([deleteId]);
    setDeleteId(null);
  };

  return (
    <>
      <PageHeaderCard
        icon={<UsersGroupTwoRounded weight="Bold" />}
        title="Agent Teams"
        description="Organize agents into coordinated teams with a lead agent"
        titleMeta={teams.length}
        mobileAction={
          <Button asChild size="icon" className="size-10 rounded-lg">
            <Link to="/agent-teams/create">
              <PlusIcon />
            </Link>
          </Button>
        }
        headerRight={
          <Button asChild size="lg">
            <Link to="/agent-teams/create">
              <PlusIcon data-icon="inline-start" />
              New Team
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
                placeholder="Search teams..."
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
            Failed to load agent teams.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No agent teams found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {filtered.map((team) => (
              <AgentTeamCard
                key={team.id}
                team={team}
                leadAgentName={agentMap.get(team.leadAgentId)?.name}
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
        title="Delete team"
        description={`Are you sure you want to delete "${teamToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
