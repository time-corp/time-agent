import { channelTypeMeta } from "@/pages/channels/schemas/channel-schema"

type Props = {
  type: string
  size?: number
}

export function ChannelTypeLabel({ type, size = 16 }: Props) {
  const meta = channelTypeMeta[type as keyof typeof channelTypeMeta]

  if (!meta) {
    return <span className="text-muted-foreground">{type}</span>
  }

  return (
    <span className="flex items-center gap-2">
      <img src={meta.icon} alt={meta.label} width={size} height={size} className="shrink-0" />
      {meta.label}
    </span>
  )
}

export function ChannelTypeIcon({ type, size = 16 }: Props) {
  const meta = channelTypeMeta[type as keyof typeof channelTypeMeta]
  if (!meta) return null
  return <img src={meta.icon} alt={meta.label} width={size} height={size} className="shrink-0" />
}
