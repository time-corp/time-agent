import { createFileRoute } from "@tanstack/react-router"
import { AgentTeamsCreatePage } from "@/pages/agent-teams/agent-teams-create-page"

export const Route = createFileRoute("/agent-teams/create")({
  component: AgentTeamsCreatePage,
})
