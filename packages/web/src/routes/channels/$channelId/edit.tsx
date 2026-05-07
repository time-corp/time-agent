import { createFileRoute } from "@tanstack/react-router"
import { ChannelsEditPage } from "@/pages/channels/channels-edit-page"

export const Route = createFileRoute("/channels/$channelId/edit")({
  component: ChannelsEditPage,
})
