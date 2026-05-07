import { useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeftIcon, RadioTowerIcon } from "lucide-react"
import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useGetChannelQuery, useUpdateChannelMutation } from "@/hooks/useChannels"
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs"
import { useAgentTeamsQuery } from "@/hooks/useAgentTeams"
import { ChannelForm } from "@/pages/channels/components/channel-form"
import { TelegramBotControl } from "@/pages/channels/components/telegram-bot-control"
import { DiscordBotControl } from "@/pages/channels/components/discord-bot-control"
import type { ChannelFormValues, ChannelTypeValue } from "@/pages/channels/schemas/channel-schema"

export function ChannelsEditPage() {
  const { channelId } = useParams({ from: "/channels/$channelId/edit" })
  const navigate = useNavigate()
  const { data: channel, isLoading } = useGetChannelQuery(channelId)
  const updateMutation = useUpdateChannelMutation()
  const { data: agents = [] } = useAgentConfigsQuery()
  const { data: teams = [] } = useAgentTeamsQuery()

  const initialValues: Partial<ChannelFormValues> | undefined = channel
    ? {
        name: channel.name,
        type: channel.type as ChannelTypeValue,
        targetType: channel.agentId ? "agent" : channel.teamId ? "team" : "none",
        agentId: channel.agentId,
        teamId: channel.teamId,
        credentials: {},
        options: (channel.options as ChannelFormValues["options"]) ?? {},
        isActive: channel.isActive,
      }
    : undefined

  const handleSubmit = async (values: ChannelFormValues, _action: "save" | "saveAndContinue") => {
    try {
      const hasNewCredentials = Object.values(values.credentials).some((v) => Boolean(v))
      await updateMutation.mutateAsync({
        id: channelId,
        payload: {
          name: values.name.trim(),
          agentId: values.targetType === "agent" ? (values.agentId ?? null) : null,
          teamId: values.targetType === "team" ? (values.teamId ?? null) : null,
          ...(hasNewCredentials ? { credentials: values.credentials } : {}),
          options: values.options,
          isActive: values.isActive,
        },
      })
      void navigate({ to: "/channels" })
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-destructive">
        Channel not found.
      </div>
    )
  }

  return (
    <>
      <PageHeaderCard
        icon={<RadioTowerIcon />}
        title={`Edit: ${channel.name}`}
        description="Update channel settings. Leave credentials blank to keep existing ones."
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

      {channel.type === "telegram" && (
        <SectionCard title="Bot Control">
          <TelegramBotControl channelId={channelId} />
        </SectionCard>
      )}

      {channel.type === "discord" && (
        <SectionCard title="Bot Control">
          <DiscordBotControl channelId={channelId} />
        </SectionCard>
      )}

      <SectionCard contentClassName="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          {channel.hasCredentials
            ? "Credentials are already set. Fill in the fields to replace them."
            : "No credentials stored yet."}
        </p>
        <ChannelForm
          mode="update"
          agents={agents}
          teams={teams}
          initialValues={initialValues}
          pending={updateMutation.isPending}
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
