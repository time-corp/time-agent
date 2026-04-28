import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, BotIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useCreateModelMutation } from "@/hooks/useModels"
import { useProvidersQuery } from "@/hooks/useProviders"
import { ModelForm } from "@/pages/models/components/model-form"
import { createModelSchema, type ModelFormValues } from "@/pages/models/schemas/model-schema"

export function ModelsCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateModelMutation()
  const { data: providers = [] } = useProvidersQuery()

  const handleSubmit = async (values: ModelFormValues, action: "save" | "saveAndContinue") => {
    try {
      const model = await createMutation.mutateAsync({
        providerId: values.providerId,
        modelName: values.modelName.trim(),
        temperature: Number(values.temperature),
        maxTokens: Number(values.maxTokens),
        isActive: values.isActive ?? true,
      })
      if (action === "saveAndContinue") {
        void navigate({ to: "/models/$modelId/edit", params: { modelId: model.id } })
        return
      }
      void navigate({ to: "/models" })
    } catch {}
  }

  return (
    <>
      <PageHeaderCard
        icon={<BotIcon />}
        title="New Model"
        description="Register a model option under a provider"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/models" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to models
          </Button>
        }
      />

      <SectionCard contentClassName="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Models depend on providers. Create at least one provider first, then assign the model here.
        </p>
        <ModelForm
          mode="create"
          providers={providers}
          pending={createMutation.isPending}
          schema={createModelSchema}
          showSaveAndContinue
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
