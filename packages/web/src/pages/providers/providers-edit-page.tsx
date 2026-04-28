import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, PlugZapIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetProviderQuery, useUpdateProviderMutation } from "@/hooks/useProviders"
import { ProviderForm } from "@/pages/providers/components/provider-form"
import { updateProviderFormSchema, type ProviderFormValues } from "@/pages/providers/schemas/provider-schema"

export function ProvidersEditPage({ providerId }: { providerId: string }) {
  const navigate = useNavigate()
  const { data: provider, isLoading, isError } = useGetProviderQuery(providerId)
  const updateMutation = useUpdateProviderMutation()

  const handleSubmit = async (values: ProviderFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: providerId,
        payload: {
          name: values.name.trim(),
          type: values.type,
          apiKey: values.apiKey?.trim() ? values.apiKey.trim() : undefined,
          baseUrl: values.baseUrl?.trim() ? values.baseUrl.trim() : null,
          isActive: values.isActive,
        },
      })
      void navigate({ to: "/providers" })
    } catch {}
  }

  return (
    <>
      <PageHeaderCard
        icon={<PlugZapIcon />}
        title="Edit Provider"
        description="Update provider connection settings"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/providers" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to providers
          </Button>
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : isError || !provider ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load provider.
        </div>
      ) : (
        <SectionCard>
          <ProviderForm
            mode="update"
            initialValues={{
              name: provider.name,
              type: provider.type,
              apiKey: "",
              baseUrl: provider.baseUrl ?? "",
              isActive: provider.isActive,
            }}
            pending={updateMutation.isPending}
            schema={updateProviderFormSchema}
            onSubmit={handleSubmit}
          />
        </SectionCard>
      )}
    </>
  )
}
