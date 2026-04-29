import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/models/create")({
  component: () => <Navigate to="/agent-configs/create" />,
})
