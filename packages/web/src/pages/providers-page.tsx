import { Server } from "@solar-icons/react";
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
import {
  useDeleteProvidersMutation,
  useProvidersQuery,
} from "@/hooks/useProviders";
import { ProviderCard } from "@/pages/providers/components/provider-card";

export function ProvidersPage() {
  const [query, setQuery] = useState("");
  const sortId = "name" as const;
  const sortDesc = false;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: providers = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useProvidersQuery();
  const deleteProvidersMutation = useDeleteProvidersMutation();

  const deferredQuery = useDeferredValue(query.trim());

  const filteredProviders = useMemo(() => {
    let result = providers;
    if (deferredQuery) {
      const q = deferredQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          (p.baseUrl ?? "").toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      const aVal = String(a[sortId] ?? "");
      const bVal = String(b[sortId] ?? "");
      const cmp = aVal.localeCompare(bVal);
      return sortDesc ? -cmp : cmp;
    });
  }, [providers, deferredQuery, sortId, sortDesc]);

  const providerToDelete = providers.find((p) => p.id === deleteId);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteProvidersMutation.mutateAsync([deleteId]);
    setDeleteId(null);
  };

  return (
    <>
      <PageHeaderCard
        icon={<Server weight="Bold" />}
        title="Providers"
        description="Manage LLM provider endpoints and credentials"
        titleMeta={providers.length}
        mobileAction={
          <Button asChild size="icon" className="size-10 rounded-lg">
            <Link to="/providers/create">
              <PlusIcon />
            </Link>
          </Button>
        }
        headerRight={
          <Button asChild size="lg">
            <Link to="/providers/create">
              <PlusIcon data-icon="inline-start" />
              New Provider
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
                placeholder="Search providers..."
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
            Failed to load providers.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No providers found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
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
        title="Delete provider"
        description={`Are you sure you want to delete "${providerToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
