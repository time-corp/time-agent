import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  KeyRoundIcon,
  Pen,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Provider } from "@/hooks/useProviders";
import { cn } from "@/lib/utils";
import { providerTypeMeta } from "@/pages/providers/schemas/provider-schema";

const fallbackBg: Record<Provider["type"], string> = {
  openai: "bg-emerald-500",
  anthropic: "bg-amber-600",
  deepseek: "bg-sky-500",
  gemini: "bg-violet-500",
  mistral: "bg-orange-500",
  xai: "bg-zinc-700",
  groq: "bg-yellow-500",
  openrouter: "bg-purple-500",
  ollama: "bg-teal-500",
  azure: "bg-blue-600",
  openai_compatible: "bg-slate-500",
};

type ProviderCardProps = {
  provider: Provider;
  onDelete: (id: string) => void;
};

export function ProviderCard({ provider, onDelete }: ProviderCardProps) {
  const meta = providerTypeMeta[provider.type as keyof typeof providerTypeMeta];
  const initials = meta.label.slice(0, 2).toUpperCase();

  return (
    <Card className="flex flex-col overflow-hidden border-none bg-card shadow-panel">
      <CardContent className="flex items-start gap-3 p-4 pb-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl",
            !meta.image &&
              cn("text-sm font-bold text-white", fallbackBg[provider.type]),
          )}
        >
          {meta.image ? (
            <img
              src={meta.image}
              alt={meta.label}
              className="size-full object-contain rounded-lg"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-semibold leading-tight">
              {provider.name}
            </span>
            {provider.isActive ? (
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
          {provider.baseUrl ? (
            <p className="truncate text-xs text-muted-foreground">
              {provider.baseUrl}
            </p>
          ) : null}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {meta.label}
            </Badge>
            {provider.hasApiKey ? (
              <Badge variant="secondary" className="text-xs">
                <KeyRoundIcon className="mr-1 size-3" />
                API Key
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-warning/30 text-xs text-warning-foreground"
              >
                No Key
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarIcon className="size-3.5" />
          <span>
            {new Date(
              provider.updatedAt !== provider.createdAt
                ? provider.updatedAt
                : provider.createdAt,
            ).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(provider.id)}
          >
            <Trash2Icon className="size-4" />
          </Button>
          <Button asChild size="icon" variant="ghost" className="size-8">
            <Link
              to="/providers/$providerId/edit"
              params={{ providerId: provider.id }}
            >
              <Pen className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
