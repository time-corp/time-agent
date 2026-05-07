import { App } from "@slack/bolt"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { decryptJson } from "../lib/encryption"
import { createLogger } from "../lib/logger"
import { createRuntimeAgent } from "../mastra/runtime-agent"
import { createRuntimeTeam } from "../mastra/runtime-team"

const log = createLogger("slack-manager")

type AppEntry = {
  app: App
  channelId: string
  channelName: string
}

type BotStatus = {
  channelId: string
  channelName: string
  running: boolean
}

const THREAD_PREFIX = "sl"

const buildThreadId = (slackChannelId: string) => `${THREAD_PREFIX}_${slackChannelId}`
const buildResourceId = (slackChannelId: string) => `${THREAD_PREFIX}_${slackChannelId}`

const ensureThread = async (
  memory: {
    getThreadById(args: { threadId: string }): Promise<unknown>
    createThread(args: Record<string, unknown>): Promise<unknown>
  } | null,
  threadId: string,
  resourceId: string,
  title: string,
  metadata: Record<string, unknown>,
) => {
  if (!memory) return
  const existing = await memory.getThreadById({ threadId })
  if (existing) return
  await memory.createThread({ threadId, resourceId, title, metadata })
}

const splitMessage = (text: string, maxLen = 3000): string[] => {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen))
  }
  return chunks
}

class SlackBotManager {
  private apps = new Map<string, AppEntry>()

  async init() {
    const channels = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.type, "slack"))

    const active = channels.filter((ch) => ch.isActive)

    log.info({ count: active.length }, 'init active channels')

    await Promise.allSettled(active.map((ch) => this.startBot(ch.id)))
  }

  async startBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    if (this.apps.has(channelId)) {
      return { ok: false, error: "Bot already running" }
    }

    const [channel] = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.id, channelId))
      .limit(1)

    if (!channel) return { ok: false, error: "Channel not found" }
    if (!channel.isActive) return { ok: false, error: "Channel is inactive" }
    if (channel.type !== "slack") return { ok: false, error: "Not a slack channel" }

    const credentials = await decryptJson(channel.credentials as string)
    const botToken = credentials["botToken"] as string | undefined
    const appToken = credentials["appToken"] as string | undefined

    if (!botToken) return { ok: false, error: "botToken not configured" }
    if (!appToken) return { ok: false, error: "appToken not configured" }

    const app = new App({
      token: botToken,
      appToken,
      socketMode: true,
    })

    app.message(async ({ message, say }) => {
      // ignore subtypes: message_changed, message_deleted, bot_message, etc.
      if (message.subtype) return

      const text = "text" in message ? (message.text ?? "").trim() : ""
      if (!text) return

      const slackChannelId = message.channel
      const threadId = buildThreadId(slackChannelId)
      const resourceId = buildResourceId(slackChannelId)
      const threadTitle = `Slack / ${slackChannelId}`

      log.debug({ channelId, slackChannelId, userId: "user" in message ? message.user : undefined, textPreview: text.slice(0, 100) }, "message received")

      try {
        const metadata: Record<string, unknown> = {
          channelId,
          platform: "slack",
          platformChannelId: slackChannelId,
        }

        let responseText: string

        if (channel.agentId) {
          const { agent, modelSettings } = await createRuntimeAgent(channel.agentId)
          const memory = (await agent.getMemory()) ?? null

          await ensureThread(
            memory as Parameters<typeof ensureThread>[0],
            threadId,
            resourceId,
            threadTitle,
            { ...metadata, agentConfigId: channel.agentId },
          )

          const result = await agent.generate(
            [{ role: "user", content: text }],
            {
              modelSettings,
              memory: { thread: threadId, resource: resourceId },
              maxSteps: 20,
            },
          )
          responseText = result.text
        } else if (channel.teamId) {
          const { supervisorAgent, modelSettings } = await createRuntimeTeam(channel.teamId)
          const memory = (await supervisorAgent.getMemory()) ?? null

          await ensureThread(
            memory as Parameters<typeof ensureThread>[0],
            threadId,
            resourceId,
            threadTitle,
            { ...metadata, teamId: channel.teamId },
          )

          const result = await supervisorAgent.generate(
            [{ role: "user", content: text }],
            {
              modelSettings,
              memory: { thread: threadId, resource: resourceId },
              maxSteps: 20,
            },
          )
          responseText = result.text
        } else {
          responseText = "⚠️ This channel is not connected to an agent or team. Please configure it in the channel settings."
        }

        const chunks = splitMessage(responseText)
        for (const chunk of chunks) {
          await say(chunk)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        log.error({ channelId, slackChannelId, err }, 'message error')
        await say(`[Error] ${msg}`)
      }
    })

    // Validate credentials by starting the app
    try {
      await app.start()
      log.info({ channelId }, 'bot started')
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start"
      log.error({ channelId, errMessage: msg }, 'app start error')
      return { ok: false, error: `Failed to start: ${msg}` }
    }

    this.apps.set(channelId, { app, channelId, channelName: channel.name })
    return { ok: true }
  }

  async stopBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    const entry = this.apps.get(channelId)
    if (!entry) return { ok: false, error: "Bot not running" }

    await entry.app.stop()
    this.apps.delete(channelId)
    log.info({ channelId }, 'bot stopped')
    return { ok: true }
  }

  async restartBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    await this.stopBot(channelId)
    return this.startBot(channelId)
  }

  getStatus(): BotStatus[] {
    return Array.from(this.apps.values()).map((entry) => ({
      channelId: entry.channelId,
      channelName: entry.channelName,
      running: true,
    }))
  }

  isRunning(channelId: string): boolean {
    return this.apps.has(channelId)
  }
}

export const slackBotManager = new SlackBotManager()
