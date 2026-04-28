import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, BotIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetModelQuery, useUpdateModelMutation } from "@/hooks/useModels"
import { useProvidersQuery } from "@/hooks/useProviders"
import { ModelForm } from "@/pages/models/components/model-form"
import { updateModelSchema, type ModelFormValues } from "@/pages/models/schemas/model-schema"

export function ModelsEditPage({ modelId }: { modelId: string }) {
  const navigate = useNavigate()
  const { data: model, isLoading, isError } = useGetModelQuery(modelId)
  const { data: providers = [] } = useProvidersQuery()
  const updateMutation = useUpdateModelMutation()

  const handleSubmit = async (values: ModelFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: modelId,
        payload: {
          providerId: values.providerId,
          modelName: values.modelName.trim(),
          temperature: Number(values.temperature),
          maxTokens: Number(values.maxTokens),
          isActive: values.isActive,
        },
      })
      void navigate({ to: "/models" })
    } catch {}
  }

  return (
    <>
      <PageHeaderCard
        icon={<BotIcon />}
        title="Edit Model"
        description="Update model selection and default generation settings"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/models" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to models
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
      ) : isError || !model ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load model.
        </div>
      ) : (
        <SectionCard>
          <ModelForm
            mode="update"
            providers={providers}
            initialValues={{
              providerId: model.providerId,
              modelName: model.modelName,
              temperature: model.temperature,
              maxTokens: model.maxTokens,
              isActive: model.isActive,
            }}
            pending={updateMutation.isPending}
            schema={updateModelSchema}
            onSubmit={handleSubmit}
          />
        </SectionCard>
      )}
    </>
  )
}
