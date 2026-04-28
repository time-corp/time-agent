import { createFileRoute } from "@tanstack/react-router"
import { AgentConfigsCreatePage } from "@/pages/agent-configs/agent-configs-create-page"

export const Route = createFileRoute("/agent-configs/create")({
  component: AgentConfigsCreatePage,
})
