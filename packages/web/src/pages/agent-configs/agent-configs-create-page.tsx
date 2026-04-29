import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, BotMessageSquareIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useCreateAgentConfigMutation } from "@/hooks/useAgentConfigs"
import { useProvidersQuery } from "@/hooks/useProviders"
import { AgentConfigForm } from "@/pages/agent-configs/components/agent-config-form"
import { createAgentConfigFormSchema, type AgentConfigFormValues } from "@/pages/agent-configs/schemas/agent-config-schema"

const parseJsonObject = (value: string) => JSON.parse(value) as Record<string, unknown>

export function AgentConfigsCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateAgentConfigMutation()
  const { data: providers = [] } = useProvidersQuery()

  const handleSubmit = async (values: AgentConfigFormValues, action: "save" | "saveAndContinue") => {
    try {
      const agentConfig = await createMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
        providerId: values.providerId,
        modelName: values.modelName.trim(),
        modelSource: values.modelSource,
        systemPrompt: values.systemPrompt?.trim() || null,
        temperature: Number(values.temperature),
        maxTokens: Number(values.maxTokens),
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
          Agent configs now choose a provider first, then a catalog model or a custom model name.
        </p>
        <AgentConfigForm
          mode="create"
          providers={providers}
          pending={createMutation.isPending}
          schema={createAgentConfigFormSchema}
          showSaveAndContinue
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
