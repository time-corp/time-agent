import { Widget } from "@solar-icons/react";
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
import { useAgentConfigsQuery, useDeleteAgentConfigsMutation } from "@/hooks/useAgentConfigs";
import { useProvidersQuery } from "@/hooks/useProviders";
import { AgentConfigCard } from "@/pages/agent-configs/components/agent-config-card";

export function AgentConfigsPage() {
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: agentConfigs = [], isLoading, isError, isFetching, refetch } =
    useAgentConfigsQuery();
  const { data: providers = [] } = useProvidersQuery();
  const deleteAgentConfigsMutation = useDeleteAgentConfigsMutation();

  const providerMap = useMemo(
    () => new Map(providers.map((p) => [p.id, p])),
    [providers],
  );

  const deferredQuery = useDeferredValue(query.trim());

  const filtered = useMemo(() => {
    let result = agentConfigs;
    if (deferredQuery) {
      const q = deferredQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q) ||
          a.modelName.toLowerCase().includes(q) ||
          (providerMap.get(a.providerId)?.name ?? "").toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [agentConfigs, deferredQuery, providerMap]);

  const configToDelete = agentConfigs.find((a) => a.id === deleteId);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteAgentConfigsMutation.mutateAsync([deleteId]);
    setDeleteId(null);
  };

  return (
    <>
      <PageHeaderCard
        icon={<Widget weight="Bold" />}
        title="Agent Configs"
        description="Manage prompts, model bindings, and runtime JSON settings"
        titleMeta={agentConfigs.length}
        mobileAction={
          <Button asChild size="icon" className="size-10 rounded-lg">
            <Link to="/agent-configs/create">
              <PlusIcon />
            </Link>
          </Button>
        }
        headerRight={
          <Button asChild size="lg">
            <Link to="/agent-configs/create">
              <PlusIcon data-icon="inline-start" />
              New Agent Config
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
                placeholder="Search agent configs..."
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
            Failed to load agent configs.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No agent configs found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {filtered.map((agentConfig) => (
              <AgentConfigCard
                key={agentConfig.id}
                agentConfig={agentConfig}
                provider={providerMap.get(agentConfig.providerId)}
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
        title="Delete agent config"
        description={`Are you sure you want to delete "${configToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
