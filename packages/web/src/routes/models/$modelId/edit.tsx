import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/models/$modelId/edit")({
  component: () => <Navigate to="/agent-configs" />,
})
