import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { KeyRoundIcon, ShieldCheckIcon } from "lucide-react";
import { gatewayLoginSchema, type GatewayLoginInput } from "@time/shared";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGatewayLoginMutation } from "@/hooks/useAuth";

type LoginValues = z.infer<typeof gatewayLoginSchema>;

const defaultValues: LoginValues = {
  userId: "system",
  gatewayToken: "",
};

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useGatewayLoginMutation();
  const form = useForm<LoginValues>({
    resolver: zodResolver(gatewayLoginSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit(async (values: GatewayLoginInput) => {
    await loginMutation.mutateAsync(values);
    await navigate({ to: "/" });
  });

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--color-primary)_24%,transparent)_0%,transparent_34%),radial-gradient(circle_at_bottom_right,_color-mix(in_oklab,var(--color-chart-2)_16%,transparent)_0%,transparent_28%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-secondary)_30%,var(--color-background))_100%)] px-5 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md items-center">
        <Card className="w-full overflow-hidden border-border/70 bg-card/92 shadow-[0_34px_90px_-30px_rgba(79,70,229,0.28)] backdrop-blur">
          <div className="h-1.5 bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-chart-2)_46%,var(--color-chart-3)_100%)]" />
          <CardContent className="space-y-7 p-7 md:p-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                <ShieldCheckIcon className="size-3.5" />
                Gateway Access
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Connect to the workspace
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use your assigned user ID and gateway token to open a working session.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-foreground">
                  User ID
                </Label>
                <Input
                  id="userId"
                  autoComplete="username"
                  placeholder="system"
                  className="h-12 rounded-2xl border-border bg-background/80 px-4"
                  {...form.register("userId")}
                />
                <p className="text-xs text-muted-foreground">
                  Use &quot;system&quot; for full system access.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gatewayToken" className="text-foreground">
                  Gateway Token
                </Label>
                <div className="relative">
                  <KeyRoundIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary/75" />
                  <Input
                    id="gatewayToken"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Bearer token"
                    className="h-12 rounded-2xl border-border bg-background/80 px-12"
                    {...form.register("gatewayToken")}
                  />
                </div>
              </div>

              {(form.formState.errors.userId || form.formState.errors.gatewayToken || loginMutation.error) && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {form.formState.errors.userId?.message ??
                    form.formState.errors.gatewayToken?.message ??
                    loginMutation.error?.message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loginMutation.isPending}
                className="h-12 w-full rounded-2xl bg-[linear-gradient(180deg,var(--color-primary)_0%,color-mix(in_oklab,var(--color-primary)_74%,black)_100%)] text-base font-semibold text-primary-foreground shadow-[0_16px_44px_-22px_rgba(79,70,229,0.58)] hover:brightness-105"
              >
                {loginMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
