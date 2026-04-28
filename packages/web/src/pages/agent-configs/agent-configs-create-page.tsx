import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, BotMessageSquareIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useCreateAgentConfigMutation } from "@/hooks/useAgentConfigs"
import { useModelsQuery } from "@/hooks/useModels"
import { AgentConfigForm } from "@/pages/agent-configs/components/agent-config-form"
import { createAgentConfigFormSchema, type AgentConfigFormValues } from "@/pages/agent-configs/schemas/agent-config-schema"

const parseJsonObject = (value: string) => JSON.parse(value) as Record<string, unknown>

export function AgentConfigsCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateAgentConfigMutation()
  const { data: models = [] } = useModelsQuery()

  const handleSubmit = async (values: AgentConfigFormValues, action: "save" | "saveAndContinue") => {
    try {
      const agentConfig = await createMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
        modelId: values.modelId,
        systemPrompt: values.systemPrompt.trim(),
        toolsConfig: parseJsonObject(values.toolsConfig),
        memoryConfig: parseJsonObject(values.memoryConfig),
        isActive: values.isActive ?? true,
      })
      if (action === "saveAndContinue") {
        void navigate({
          to: "/agent-configs/$agentConfigId/edit",
          params: { agentConfigId: agentConfig.id },
        })
        return
      }
      void navigate({ to: "/agent-configs" })
    } catch {}
  }

  return (
    <>
      <PageHeaderCard
        icon={<BotMessageSquareIcon />}
        title="New Agent Config"
        description="Create a runtime-selectable agent configuration"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/agent-configs" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to agent configs
          </Button>
        }
      />

      <SectionCard contentClassName="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Agent configs point at a model and hold the prompt plus JSON blocks for tool and memory configuration.
        </p>
        <AgentConfigForm
          mode="create"
          models={models}
          pending={createMutation.isPending}
          schema={createAgentConfigFormSchema}
          showSaveAndContinue
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
