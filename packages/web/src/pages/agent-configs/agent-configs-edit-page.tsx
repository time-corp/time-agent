import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, BotMessageSquareIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetAgentConfigQuery, useUpdateAgentConfigMutation } from "@/hooks/useAgentConfigs"
import { useProvidersQuery } from "@/hooks/useProviders"
import { useCreateSkillAssignmentMutation, useDeleteSkillAssignmentMutation, useSkillAssignmentsQuery } from "@/hooks/useTools"
import { AgentConfigForm } from "@/pages/agent-configs/components/agent-config-form"
import { updateAgentConfigFormSchema, type AgentConfigFormValues } from "@/pages/agent-configs/schemas/agent-config-schema"
import { Switch } from "@/components/ui/switch"

const stringifyJson = (value: Record<string, unknown>) => JSON.stringify(value, null, 2)
const parseJsonObject = (value: string) => JSON.parse(value) as Record<string, unknown>

export function AgentConfigsEditPage({ agentConfigId }: { agentConfigId: string }) {
  const navigate = useNavigate()
  const { data: agentConfig, isLoading, isError } = useGetAgentConfigQuery(agentConfigId)
  const { data: providers = [] } = useProvidersQuery()
  const { data: skillAssignments = [], isLoading: skillsLoading } = useSkillAssignmentsQuery(agentConfigId, "agent")
  const updateMutation = useUpdateAgentConfigMutation()
  const createSkillAssignmentMutation = useCreateSkillAssignmentMutation("agent", agentConfigId)
  const deleteSkillAssignmentMutation = useDeleteSkillAssignmentMutation("agent", agentConfigId)

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update agent config")
    }
  }

  const handleSkillToggle = async (skillId: string, assignmentId: string | null, checked: boolean) => {
    try {
      if (checked) {
        await createSkillAssignmentMutation.mutateAsync({
          targetId: agentConfigId,
          targetKind: "agent",
          skillId,
        })
      } else if (assignmentId) {
        await deleteSkillAssignmentMutation.mutateAsync(assignmentId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update skill assignment")
    }
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
        <>
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

          <SectionCard>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Assigned Skills</h2>
                <Badge variant="secondary" className="rounded px-1.5 py-0 text-xs">
                  {skillAssignments.filter((skill) => skill.isAssigned).length}/{skillAssignments.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable the managed skills this agent can load at runtime. Each assigned skill is exposed to Mastra by its extracted folder path.
              </p>

              {skillsLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  {skillAssignments.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      No managed skills available yet. Upload skills from the Built-in Tools page first.
                    </div>
                  ) : (
                    skillAssignments.map((skill) => (
                      <div key={skill.id} className="flex items-start justify-between gap-4 border-b last:border-b-0 px-4 py-3.5">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{skill.name}</span>
                            <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {skill.key}
                            </code>
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              v{skill.version}
                            </Badge>
                          </div>
                          {skill.description ? (
                            <p className="text-xs text-muted-foreground">{skill.description}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">{skill.relativePath}</p>
                        </div>
                        <Switch
                          checked={skill.isAssigned}
                          disabled={createSkillAssignmentMutation.isPending || deleteSkillAssignmentMutation.isPending}
                          onCheckedChange={(checked) => {
                            void handleSkillToggle(skill.id, skill.assignmentId, checked)
                          }}
                          className="shrink-0 mt-0.5"
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </>
  )
}
