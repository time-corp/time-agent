export const channelTypeValues = ["telegram", "discord", "slack", "whatsapp"] as const
export type ChannelTypeValue = (typeof channelTypeValues)[number]

export const channelTypeMeta: Record<ChannelTypeValue, { label: string; icon: string }> = {
  telegram: { label: "Telegram", icon: "/images/channels/telegram.png" },
  discord: { label: "Discord", icon: "/images/channels/discord.png" },
  slack: { label: "Slack", icon: "/images/channels/slack.png" },
  whatsapp: { label: "WhatsApp", icon: "/images/channels/whatsapp.png" },
}

export const credentialFields: Record<ChannelTypeValue, Array<{ key: string; label: string; placeholder?: string }>> = {
  telegram: [{ key: "botToken", label: "Bot Token", placeholder: "1234567890:ABCdef..." }],
  discord: [
    { key: "botToken", label: "Bot Token", placeholder: "MTk4NjIyN..." },
    { key: "applicationId", label: "Application ID", placeholder: "1234567890" },
  ],
  slack: [
    { key: "botToken", label: "Bot Token", placeholder: "xoxb-..." },
    { key: "appToken", label: "App-Level Token", placeholder: "xapp-..." },
  ],
  whatsapp: [],
}

export type ChannelFormValues = {
  name: string
  type: ChannelTypeValue
  targetType: "none" | "agent" | "team"
  agentId: string | null
  teamId: string | null
  credentials: Record<string, string>
  options: {
    welcomeMessage?: string
    maxHistoryMessages?: number
  }
  isActive: boolean
}
