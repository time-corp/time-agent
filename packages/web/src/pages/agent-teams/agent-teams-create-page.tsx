import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, UsersRoundIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs"
import { useCreateAgentTeamMutation } from "@/hooks/useAgentTeams"
import { AgentTeamForm } from "@/pages/agent-teams/components/agent-team-form"
import { createAgentTeamFormSchema, type AgentTeamFormValues } from "@/pages/agent-teams/schemas/agent-team-schema"

export function AgentTeamsCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateAgentTeamMutation()
  const { data: agents = [] } = useAgentConfigsQuery()

  const handleSubmit = async (values: AgentTeamFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || null,
        leadAgentId: values.leadAgentId,
        autoOrchestration: values.autoOrchestration,
        isActive: values.isActive ?? true,
        members: (values.members ?? []).map((m) => ({
          agentId: m.agentId,
          parentAgentId: m.parentAgentId ?? null,
          position: m.position ?? null,
        })),
      })
      void navigate({ to: "/agent-teams" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team")
    }
  }

  return (
    <>
      <PageHeaderCard
        icon={<UsersRoundIcon />}
        title="New Agent Team"
        description="Group agents under a lead with auto or manual orchestration"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/agent-teams" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to teams
          </Button>
        }
      />
      <SectionCard>
        <AgentTeamForm
          mode="create"
          schema={createAgentTeamFormSchema}
          agents={agents}
          pending={createMutation.isPending}
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
