import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, UsersRoundIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs"
import { useGetAgentTeamQuery, useUpdateAgentTeamMutation } from "@/hooks/useAgentTeams"
import { AgentTeamForm } from "@/pages/agent-teams/components/agent-team-form"
import { updateAgentTeamFormSchema, type AgentTeamFormValues } from "@/pages/agent-teams/schemas/agent-team-schema"

export function AgentTeamsEditPage({ agentTeamId }: { agentTeamId: string }) {
  const navigate = useNavigate()
  const { data: team, isLoading, isError } = useGetAgentTeamQuery(agentTeamId)
  const { data: agents = [] } = useAgentConfigsQuery()
  const updateMutation = useUpdateAgentTeamMutation()

  const handleSubmit = async (values: AgentTeamFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: agentTeamId,
        payload: {
          name: values.name.trim(),
          description: values.description?.trim() || null,
          leadAgentId: values.leadAgentId,
          autoOrchestration: values.autoOrchestration,
          isActive: values.isActive,
          members: (values.members ?? []).map((m) => ({
            agentId: m.agentId,
            parentAgentId: m.parentAgentId ?? null,
            position: m.position ?? null,
          })),
        },
      })
      void navigate({ to: "/agent-teams" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update team")
    }
  }

  return (
    <>
      <PageHeaderCard
        icon={<UsersRoundIcon />}
        title="Edit Agent Team"
        description="Update team members and orchestration settings"
        headerRight={
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/agent-teams" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to teams
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
      ) : isError || !team ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load agent team.
        </div>
      ) : (
        <SectionCard>
          <AgentTeamForm
            mode="update"
            schema={updateAgentTeamFormSchema}
            agents={agents}
            initialValues={{
              name: team.name,
              description: team.description ?? "",
              leadAgentId: team.leadAgentId,
              autoOrchestration: team.autoOrchestration,
              isActive: team.isActive,
              members: (team.members ?? []).map((m) => ({
                agentId: m.agentId,
                parentAgentId: m.parentAgentId ?? null,
                position: m.position ?? null,
              })),
            }}
            pending={updateMutation.isPending}
            onSubmit={handleSubmit}
          />
        </SectionCard>
      )}
    </>
  )
}
