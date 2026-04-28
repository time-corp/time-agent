import { createFileRoute } from "@tanstack/react-router"
import { AgentConfigsEditPage } from "@/pages/agent-configs/agent-configs-edit-page"

export const Route = createFileRoute("/agent-configs/$agentConfigId/edit")({
  component: function EditPage() {
    const { agentConfigId } = Route.useParams()
    return <AgentConfigsEditPage agentConfigId={agentConfigId} />
  },
})
