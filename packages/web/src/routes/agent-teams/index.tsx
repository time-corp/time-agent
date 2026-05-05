import { createFileRoute } from "@tanstack/react-router"
import { AgentTeamsPage } from "@/pages/agent-teams-page"

export const Route = createFileRoute("/agent-teams/")({
  component: AgentTeamsPage,
})
