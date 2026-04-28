import { createFileRoute } from "@tanstack/react-router"
import { ModelsEditPage } from "@/pages/models/models-edit-page"

export const Route = createFileRoute("/models/$modelId/edit")({
  component: function EditPage() {
    const { modelId } = Route.useParams()
    return <ModelsEditPage modelId={modelId} />
  },
})
