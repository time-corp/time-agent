export const channelTypeValues = ["telegram", "discord", "slack", "whatsapp", "web", "api"] as const
export type ChannelTypeValue = (typeof channelTypeValues)[number]

export const channelTypeMeta: Record<ChannelTypeValue, { label: string }> = {
  telegram: { label: "Telegram" },
  discord: { label: "Discord" },
  slack: { label: "Slack" },
  whatsapp: { label: "WhatsApp" },
  web: { label: "Web" },
  api: { label: "API" },
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
  web: [{ key: "webhookSecret", label: "Webhook Secret (optional)", placeholder: "secret..." }],
  api: [{ key: "webhookSecret", label: "Webhook Secret (optional)", placeholder: "secret..." }],
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
