import { PlayIcon, RefreshCwIcon, SquareIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useDiscordStatusQuery,
  useDiscordStartMutation,
  useDiscordStopMutation,
  useDiscordRestartMutation,
} from "@/hooks/useDiscordBot"

type Props = { channelId: string }

export function DiscordBotControl({ channelId }: Props) {
  const { data: statuses = [], isLoading } = useDiscordStatusQuery()
  const startMutation = useDiscordStartMutation()
  const stopMutation = useDiscordStopMutation()
  const restartMutation = useDiscordRestartMutation()

  const status = statuses.find((s) => s.channelId === channelId)
  const isRunning = status?.running ?? false
  const isPending =
    startMutation.isPending || stopMutation.isPending || restartMutation.isPending

  const lastResult =
    startMutation.data ?? stopMutation.data ?? restartMutation.data
  const hasError = lastResult && !lastResult.ok

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Bot status</span>
        {isLoading ? (
          <Badge variant="secondary">Checking...</Badge>
        ) : isRunning ? (
          <Badge variant="success">Running</Badge>
        ) : (
          <Badge variant="secondary">Stopped</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || isRunning}
          onClick={() => startMutation.mutate(channelId)}
        >
          <PlayIcon data-icon="inline-start" />
          Start
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || !isRunning}
          onClick={() => stopMutation.mutate(channelId)}
        >
          <SquareIcon data-icon="inline-start" />
          Stop
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => restartMutation.mutate(channelId)}
        >
          <RefreshCwIcon data-icon="inline-start" />
          Restart
        </Button>
      </div>

      {hasError && (
        <p className="text-sm text-destructive">{lastResult?.error}</p>
      )}
    </div>
  )
}
