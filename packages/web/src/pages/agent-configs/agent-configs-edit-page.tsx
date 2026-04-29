import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, BotMessageSquareIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetAgentConfigQuery, useUpdateAgentConfigMutation } from "@/hooks/useAgentConfigs"
import { useProvidersQuery } from "@/hooks/useProviders"
import { AgentConfigForm } from "@/pages/agent-configs/components/agent-config-form"
import { updateAgentConfigFormSchema, type AgentConfigFormValues } from "@/pages/agent-configs/schemas/agent-config-schema"

const stringifyJson = (value: Record<string, unknown>) => JSON.stringify(value, null, 2)
const parseJsonObject = (value: string) => JSON.parse(value) as Record<string, unknown>

export function AgentConfigsEditPage({ agentConfigId }: { agentConfigId: string }) {
  const navigate = useNavigate()
  const { data: agentConfig, isLoading, isError } = useGetAgentConfigQuery(agentConfigId)
  const { data: providers = [] } = useProvidersQuery()
  const updateMutation = useUpdateAgentConfigMutation()

  const handleSubmit = async (values: AgentConfigFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: agentConfigId,
        payload: {
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
          isActive: values.isActive,
        },
      })
      void navigate({ to: "/agent-configs" })
    } catch {}
  }

  return (
    <>
      <PageHeaderCard
        icon={<BotMessageSquareIcon />}
        title="Edit Agent Config"
        description="Update prompt, model binding, and JSON runtime settings"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/agent-configs" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to agent configs
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
      ) : isError || !agentConfig ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load agent config.
        </div>
      ) : (
        <SectionCard>
          <AgentConfigForm
            mode="update"
            providers={providers}
            initialValues={{
              name: agentConfig.name,
              description: agentConfig.description ?? "",
              providerId: agentConfig.providerId,
              modelName: agentConfig.modelName,
              modelSource: agentConfig.modelSource,
              systemPrompt: agentConfig.systemPrompt,
              temperature: agentConfig.temperature,
              maxTokens: agentConfig.maxTokens,
              toolsConfig: stringifyJson(agentConfig.toolsConfig),
              memoryConfig: stringifyJson(agentConfig.memoryConfig),
              isActive: agentConfig.isActive,
            }}
            pending={updateMutation.isPending}
            schema={updateAgentConfigFormSchema}
            onSubmit={handleSubmit}
          />
        </SectionCard>
      )}
    </>
  )
}
