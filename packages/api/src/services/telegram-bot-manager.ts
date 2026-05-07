import { Bot } from "grammy"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { decryptJson } from "../lib/encryption"
import { createLogger } from "../lib/logger"
import { createRuntimeAgent } from "../mastra/runtime-agent"
import { createRuntimeTeam } from "../mastra/runtime-team"

const log = createLogger("telegram-manager")

type BotEntry = {
  bot: Bot
  channelId: string
  channelName: string
}

type BotStatus = {
  channelId: string
  channelName: string
  running: boolean
}

const THREAD_PREFIX = "tg"

const buildThreadId = (chatId: number) => `${THREAD_PREFIX}_${chatId}`
const buildResourceId = (chatId: number) => `${THREAD_PREFIX}_${chatId}`

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

const buildThreadTitle = (chatType: string, chatTitle?: string, fromFirstName?: string) => {
  if (chatType === "private") return fromFirstName ?? "DM"
  return chatTitle ?? "Group"
}

class TelegramBotManager {
  private bots = new Map<string, BotEntry>()

  async init() {
    const channels = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.type, "telegram"))

    const active = channels.filter((ch) => ch.isActive)

    log.info({ count: active.length }, "init active channels")

    await Promise.allSettled(active.map((ch) => this.startBot(ch.id)))
  }

  async startBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    if (this.bots.has(channelId)) {
      return { ok: false, error: "Bot already running" }
    }

    const [channel] = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.id, channelId))
      .limit(1)

    if (!channel) return { ok: false, error: "Channel not found" }
    if (!channel.isActive) return { ok: false, error: "Channel is inactive" }
    if (channel.type !== "telegram") return { ok: false, error: "Not a telegram channel" }

    const credentials = await decryptJson(channel.credentials as string)
    const botToken = credentials["botToken"] as string | undefined

    if (!botToken) return { ok: false, error: "botToken not configured" }

    const bot = new Bot(botToken)

    bot.on("message", async (ctx) => {
      const text = ctx.message.text
      if (!text) return  // ignore non-text messages (photos, stickers, etc.)

      await ctx.replyWithChatAction("typing")

      const chatId = ctx.chat.id
      const threadId = buildThreadId(chatId)
      const resourceId = buildResourceId(chatId)
      const chatTitle = "title" in ctx.chat ? (ctx.chat.title as string | undefined) : undefined
      const threadTitle = buildThreadTitle(ctx.chat.type, chatTitle, ctx.from?.first_name)

      log.debug({ channelId, chatId, fromId: ctx.from?.id, textPreview: text.slice(0, 100) }, "message received")

      try {

        const metadata: Record<string, unknown> = {
          channelId,
          platform: "telegram",
          platformChatId: String(chatId),
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

        // Telegram max message length is 4096 chars
        const chunks = splitMessage(responseText)
        for (const chunk of chunks) {
          await ctx.reply(chunk)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        log.error({ channelId, chatId, err }, "message error")
        await ctx.reply(`[Error] ${msg}`)
      }
    })

    bot.catch((err) => {
      log.error({ channelId, errMessage: err.message }, "bot error")
    })

    // Validate token by calling getMe before committing to start
    try {
      await bot.init()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid bot token"
      log.error({ channelId, errMessage: msg }, "bot init error")
      return { ok: false, error: `Invalid bot token: ${msg}` }
    }

    // Token valid — fire-and-forget the long-polling loop
    bot
      .start({
        drop_pending_updates: true,
        onStart: (info) => {
          log.info({ username: info.username, channelId }, "bot started")
        },
      })
      .catch((err) => {
        log.error({ channelId, err }, "bot start fatal")
        this.bots.delete(channelId)
      })

    this.bots.set(channelId, { bot, channelId, channelName: channel.name })
    return { ok: true }
  }

  async stopBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    const entry = this.bots.get(channelId)
    if (!entry) return { ok: false, error: "Bot not running" }

    await entry.bot.stop()
    this.bots.delete(channelId)
    log.info({ channelId }, "bot stopped")
    return { ok: true }
  }

  async restartBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    await this.stopBot(channelId)
    return this.startBot(channelId)
  }

  getStatus(): BotStatus[] {
    const running = new Set(this.bots.keys())

    return Array.from(this.bots.values()).map((entry) => ({
      channelId: entry.channelId,
      channelName: entry.channelName,
      running: running.has(entry.channelId),
    }))
  }

  isRunning(channelId: string): boolean {
    return this.bots.has(channelId)
  }
}

const splitMessage = (text: string, maxLen = 4096): string[] => {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen))
  }
  return chunks
}

export const telegramBotManager = new TelegramBotManager()
