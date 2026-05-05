import { createFileRoute } from "@tanstack/react-router"
import { AgentTeamsEditPage } from "@/pages/agent-teams/agent-teams-edit-page"

export const Route = createFileRoute("/agent-teams/$agentTeamId/edit")({
  component: function EditPage() {
    const { agentTeamId } = Route.useParams()
    return <AgentTeamsEditPage agentTeamId={agentTeamId} />
  },
})
