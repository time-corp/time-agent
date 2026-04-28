import { createFileRoute } from "@tanstack/react-router"
import { ProvidersPage } from "@/pages/providers-page"

export const Route = createFileRoute("/providers/")({
  component: ProvidersPage,
})
