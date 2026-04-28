import { createFileRoute } from "@tanstack/react-router"
import { ModelsCreatePage } from "@/pages/models/models-create-page"

export const Route = createFileRoute("/models/create")({
  component: ModelsCreatePage,
})
