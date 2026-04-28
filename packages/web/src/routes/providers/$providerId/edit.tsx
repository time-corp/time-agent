import { createFileRoute } from "@tanstack/react-router"
import { ProvidersEditPage } from "@/pages/providers/providers-edit-page"

export const Route = createFileRoute("/providers/$providerId/edit")({
  component: function EditPage() {
    const { providerId } = Route.useParams()
    return <ProvidersEditPage providerId={providerId} />
  },
})
