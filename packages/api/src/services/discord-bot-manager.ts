import { Client, GatewayIntentBits, Partials } from "discord.js"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { decryptJson } from "../lib/encryption"
import { createLogger } from "../lib/logger"
import { createRuntimeAgent } from "../mastra/runtime-agent"
import { createRuntimeTeam } from "../mastra/runtime-team"

const log = createLogger("discord-manager")

type ClientEntry = {
  client: Client
  channelId: string
  channelName: string
}

type BotStatus = {
  channelId: string
  channelName: string
  running: boolean
}

const THREAD_PREFIX = "dc"

const buildThreadId = (discordChannelId: string) => `${THREAD_PREFIX}_${discordChannelId}`
const buildResourceId = (discordChannelId: string) => `${THREAD_PREFIX}_${discordChannelId}`

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

const splitMessage = (text: string, maxLen = 2000): string[] => {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen))
  }
  return chunks
}

class DiscordBotManager {
  private clients = new Map<string, ClientEntry>()

  async init() {
    const channels = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.type, "discord"))

    const active = channels.filter((ch) => ch.isActive)

    log.info({ count: active.length }, "init active channels")

    await Promise.allSettled(active.map((ch) => this.startBot(ch.id)))
  }

  async startBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    if (this.clients.has(channelId)) {
      return { ok: false, error: "Bot already running" }
    }

    const [channel] = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.id, channelId))
      .limit(1)

    if (!channel) return { ok: false, error: "Channel not found" }
    if (!channel.isActive) return { ok: false, error: "Channel is inactive" }
    if (channel.type !== "discord") return { ok: false, error: "Not a discord channel" }

    const credentials = await decryptJson(channel.credentials as string)
    const botToken = credentials["botToken"] as string | undefined

    if (!botToken) return { ok: false, error: "botToken not configured" }

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel, Partials.Message],
    })

    client.on("messageCreate", async (message) => {
      if (message.author.bot) return

      const text = message.content.trim()
      if (!text) return

      const discordChannelId = message.channelId
      const threadId = buildThreadId(discordChannelId)
      const resourceId = buildResourceId(discordChannelId)
      const threadTitle = message.guild
        ? `${message.guild.name} / #${(message.channel as { name?: string }).name ?? discordChannelId}`
        : `DM / ${message.author.username}`

      log.debug({ channelId, discordChannelId, authorId: message.author.id, textPreview: text.slice(0, 100) }, "message received")

      try {
        await message.channel.sendTyping()

        const metadata: Record<string, unknown> = {
          channelId,
          platform: "discord",
          platformChannelId: discordChannelId,
          guildId: message.guild?.id ?? null,
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
          await message.reply(chunk)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        log.error({ channelId, discordChannelId, err }, "message error")
        await message.reply(`[Error] ${msg}`)
      }
    })

    client.on("error", (err) => {
      log.error({ channelId, errMessage: err.message }, "client error")
    })

    // Validate token before committing
    try {
      await client.login(botToken)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid bot token"
      log.error({ channelId, errMessage: msg }, "client login error")
      return { ok: false, error: `Invalid bot token: ${msg}` }
    }

    client.once("clientReady", (readyClient) => {
      log.info({ tag: readyClient.user.tag, channelId }, "bot ready")
    })

    this.clients.set(channelId, { client, channelId, channelName: channel.name })
    return { ok: true }
  }

  async stopBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    const entry = this.clients.get(channelId)
    if (!entry) return { ok: false, error: "Bot not running" }

    entry.client.destroy()
    this.clients.delete(channelId)
    log.info({ channelId }, "bot stopped")
    return { ok: true }
  }

  async restartBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    await this.stopBot(channelId)
    return this.startBot(channelId)
  }

  getStatus(): BotStatus[] {
    return Array.from(this.clients.values()).map((entry) => ({
      channelId: entry.channelId,
      channelName: entry.channelName,
      running: true,
    }))
  }

  isRunning(channelId: string): boolean {
    return this.clients.has(channelId)
  }
}

export const discordBotManager = new DiscordBotManager()
