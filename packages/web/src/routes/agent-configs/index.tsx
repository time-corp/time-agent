import { createFileRoute } from "@tanstack/react-router"
import { AgentConfigsPage } from "@/pages/agent-configs-page"

export const Route = createFileRoute("/agent-configs/")({
  component: AgentConfigsPage,
})
