import { LogOutIcon, PlayIcon, RefreshCwIcon, SquareIcon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useWhatsappStatusQuery,
  useWhatsappQRQuery,
  useWhatsappStartMutation,
  useWhatsappStopMutation,
  useWhatsappRestartMutation,
  useWhatsappLogoutMutation,
} from "@/hooks/useWhatsappBot"

type Props = { channelId: string }

export function WhatsAppBotControl({ channelId }: Props) {
  const { data: statuses = [], isLoading } = useWhatsappStatusQuery()
  const startMutation = useWhatsappStartMutation()
  const stopMutation = useWhatsappStopMutation()
  const restartMutation = useWhatsappRestartMutation()
  const logoutMutation = useWhatsappLogoutMutation()

  const status = statuses.find((s) => s.channelId === channelId)
  const isRunning = status?.running ?? false
  const isPending =
    startMutation.isPending ||
    stopMutation.isPending ||
    restartMutation.isPending ||
    logoutMutation.isPending

  // Poll QR only when bot is running but not yet authenticated
  const { data: qrData } = useWhatsappQRQuery(channelId, isRunning)
  const qr = status?.qr ?? qrData?.qr ?? null

  const lastResult =
    startMutation.data ?? stopMutation.data ?? restartMutation.data ?? logoutMutation.data
  const hasError = lastResult && !lastResult.ok

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Bot status</span>
        {isLoading ? (
          <Badge variant="secondary">Checking...</Badge>
        ) : isRunning ? (
          qr ? (
            <Badge variant="secondary">Waiting for QR scan...</Badge>
          ) : (
            <Badge variant="success">Connected</Badge>
          )
        ) : (
          <Badge variant="secondary">Stopped</Badge>
        )}
      </div>

      {qr && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with WhatsApp on your phone
          </p>
          <div className="w-fit rounded-lg border bg-white p-3">
            <QRCodeSVG value={qr} size={200} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
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

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || !isRunning}
          onClick={() => logoutMutation.mutate(channelId)}
        >
          <LogOutIcon data-icon="inline-start" />
          Logout
        </Button>
      </div>

      {hasError && (
        <p className="text-sm text-destructive">{lastResult?.error}</p>
      )}
    </div>
  )
}
