import { createFileRoute } from "@tanstack/react-router"
import { ChannelsCreatePage } from "@/pages/channels/channels-create-page"

export const Route = createFileRoute("/channels/create")({
  component: ChannelsCreatePage,
})
