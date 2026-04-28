import { createFileRoute } from "@tanstack/react-router"
import { ProvidersCreatePage } from "@/pages/providers/providers-create-page"

export const Route = createFileRoute("/providers/create")({
  component: ProvidersCreatePage,
})
