import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, PlugZapIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useCreateProviderMutation } from "@/hooks/useProviders"
import { ProviderForm } from "@/pages/providers/components/provider-form"
import { createProviderFormSchema, type ProviderFormValues } from "@/pages/providers/schemas/provider-schema"

export function ProvidersCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateProviderMutation()

  const handleSubmit = async (values: ProviderFormValues, action: "save" | "saveAndContinue") => {
    try {
      const provider = await createMutation.mutateAsync({
        name: values.name.trim(),
        type: values.type,
        apiKey: values.apiKey?.trim() ? values.apiKey.trim() : null,
        baseUrl: values.baseUrl?.trim() ? values.baseUrl.trim() : null,
        isActive: values.isActive ?? true,
      })
      if (action === "saveAndContinue") {
        void navigate({ to: "/providers/$providerId/edit", params: { providerId: provider.id } })
        return
      }
      void navigate({ to: "/providers" })
    } catch {}
  }

  return (
    <>
      <PageHeaderCard
        icon={<PlugZapIcon />}
        title="New Provider"
        description="Create a provider entry for external model access"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/providers" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to providers
          </Button>
        }
      />

      <SectionCard contentClassName="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Providers store connectivity details such as provider type, endpoint, and API key presence.
        </p>
        <ProviderForm
          mode="create"
          pending={createMutation.isPending}
          schema={createProviderFormSchema}
          showSaveAndContinue
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
