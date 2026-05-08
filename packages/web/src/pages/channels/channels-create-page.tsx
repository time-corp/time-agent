import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { Route } from "@solar-icons/react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useCreateChannelMutation } from "@/hooks/useChannels"
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs"
import { useAgentTeamsQuery } from "@/hooks/useAgentTeams"
import { ChannelForm } from "@/pages/channels/components/channel-form"
import type { ChannelFormValues } from "@/pages/channels/schemas/channel-schema"

export function ChannelsCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateChannelMutation()
  const { data: agents = [] } = useAgentConfigsQuery()
  const { data: teams = [] } = useAgentTeamsQuery()

  const handleSubmit = async (values: ChannelFormValues, action: "save" | "saveAndContinue") => {
    try {
      const channel = await createMutation.mutateAsync({
        name: values.name.trim(),
        type: values.type,
        agentId: values.targetType === "agent" ? (values.agentId ?? null) : null,
        teamId: values.targetType === "team" ? (values.teamId ?? null) : null,
        credentials: values.credentials,
        options: values.options,
        isActive: values.isActive,
      })

      if (action === "saveAndContinue") {
        void navigate({ to: "/channels/$channelId/edit", params: { channelId: channel.id } })
        return
      }
      void navigate({ to: "/channels" })
    } catch {}
  }

  return (
    <>
      <PageHeaderCard
        icon={<Route weight="Bold" />}
        title="New Channel"
        description="Connect an agent or team to an external chat platform"
        headerRight={
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/channels" })}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to channels
          </Button>
        }
      />

      <SectionCard contentClassName="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Credentials are encrypted before storage and never returned to the client.
        </p>
        <ChannelForm
          mode="create"
          agents={agents}
          teams={teams}
          pending={createMutation.isPending}
          showSaveAndContinue
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
