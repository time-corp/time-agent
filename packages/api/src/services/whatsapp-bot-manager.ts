import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import { mkdirSync, rmSync } from "node:fs"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { createRuntimeAgent } from "../mastra/runtime-agent"
import { createRuntimeTeam } from "../mastra/runtime-team"

type SocketEntry = {
  sock: WASocket
  channelId: string
  channelName: string
}

type BotStatus = {
  channelId: string
  channelName: string
  running: boolean
  qr: string | null
}

const THREAD_PREFIX = "wa"
const AUTH_DIR = "./whatsapp-sessions"

const buildThreadId = (jid: string) => `${THREAD_PREFIX}_${jid}`
const buildResourceId = (jid: string) => `${THREAD_PREFIX}_${jid}`

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

const splitMessage = (text: string, maxLen = 4096): string[] => {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen))
  }
  return chunks
}

const extractText = (message: Record<string, unknown>): string => {
  const m = message["message"] as Record<string, unknown> | null | undefined
  if (!m) return ""
  return (
    (m["conversation"] as string | undefined) ??
    ((m["extendedTextMessage"] as Record<string, unknown> | undefined)?.["text"] as string | undefined) ??
    ((m["imageMessage"] as Record<string, unknown> | undefined)?.["caption"] as string | undefined) ??
    ""
  )
}

class WhatsAppBotManager {
  private sockets = new Map<string, SocketEntry>()
  private qrCodes = new Map<string, string>()
  private stopping = new Set<string>()

  async init() {
    const channels = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.type, "whatsapp"))

    const active = channels.filter((ch) => ch.isActive)

    console.log(`[whatsapp-manager] init — ${active.length} active whatsapp channel(s)`)

    await Promise.allSettled(active.map((ch) => this.startBot(ch.id)))
  }

  async startBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    if (this.sockets.has(channelId)) {
      return { ok: false, error: "Bot already running" }
    }

    const [channel] = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.id, channelId))
      .limit(1)

    if (!channel) return { ok: false, error: "Channel not found" }
    if (!channel.isActive) return { ok: false, error: "Channel is inactive" }
    if (channel.type !== "whatsapp") return { ok: false, error: "Not a whatsapp channel" }

    const authDir = `${AUTH_DIR}/${channelId}`
    mkdirSync(authDir, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(authDir)

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        this.qrCodes.set(channelId, qr)
        console.log(`[whatsapp-manager] QR ready — channel: ${channelId}`)
      }

      if (connection === "open") {
        this.qrCodes.delete(channelId)
        console.log(`[whatsapp-manager] connected — channel: ${channelId}`)
      }

      if (connection === "close") {
        this.qrCodes.delete(channelId)
        this.sockets.delete(channelId)

        if (this.stopping.has(channelId)) {
          this.stopping.delete(channelId)
          return
        }

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        if (shouldReconnect) {
          console.log(`[whatsapp-manager] reconnecting — channel: ${channelId}`)
          await this.startBot(channelId)
        } else {
          console.log(`[whatsapp-manager] logged out — channel: ${channelId}`)
        }
      }
    })

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return

      for (const message of messages) {
        if (message.key.fromMe) continue
        if (message.key.remoteJid === "status@broadcast") continue

        const text = extractText(message as Record<string, unknown>)
        if (!text.trim()) continue

        const jid = message.key.remoteJid!
        const threadId = buildThreadId(jid)
        const resourceId = buildResourceId(jid)
        const threadTitle = `WhatsApp / ${jid.split("@")[0]}`

        console.log("[whatsapp-manager] message", {
          channelId,
          jid,
          textPreview: text.slice(0, 100),
        })

        try {
          const metadata: Record<string, unknown> = {
            channelId,
            platform: "whatsapp",
            platformJid: jid,
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
            await sock.sendMessage(jid, { text: chunk })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Something went wrong"
          console.error("[whatsapp-manager] message.error", { channelId, jid, err })
          await sock.sendMessage(jid, { text: `[Error] ${msg}` })
        }
      }
    })

    this.sockets.set(channelId, { sock, channelId, channelName: channel.name })
    return { ok: true }
  }

  async stopBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    const entry = this.sockets.get(channelId)
    if (!entry) return { ok: false, error: "Bot not running" }

    this.stopping.add(channelId)
    entry.sock.end(undefined)
    this.sockets.delete(channelId)
    this.qrCodes.delete(channelId)
    console.log(`[whatsapp-manager] bot stopped — channel: ${channelId}`)
    return { ok: true }
  }

  async logoutBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    const entry = this.sockets.get(channelId)
    if (!entry) return { ok: false, error: "Bot not running" }

    this.stopping.add(channelId)
    await entry.sock.logout()
    this.sockets.delete(channelId)
    this.qrCodes.delete(channelId)
    console.log(`[whatsapp-manager] bot logged out — channel: ${channelId}`)
    return { ok: true }
  }

  async restartBot(channelId: string): Promise<{ ok: boolean; error?: string }> {
    await this.stopBot(channelId)
    return this.startBot(channelId)
  }

  getStatus(): BotStatus[] {
    return Array.from(this.sockets.values()).map((entry) => ({
      channelId: entry.channelId,
      channelName: entry.channelName,
      running: true,
      qr: this.qrCodes.get(entry.channelId) ?? null,
    }))
  }

  getQR(channelId: string): string | null {
    return this.qrCodes.get(channelId) ?? null
  }

  async deleteChannel(channelId: string): Promise<void> {
    // Stop bot if running
    if (this.sockets.has(channelId)) {
      await this.stopBot(channelId)
    }

    // Remove session files from disk
    const authDir = `${AUTH_DIR}/${channelId}`
    try {
      rmSync(authDir, { recursive: true, force: true })
      console.log(`[whatsapp-manager] session deleted — channel: ${channelId}`)
    } catch (err) {
      console.warn(`[whatsapp-manager] failed to delete session dir`, { channelId, err })
    }
  }

  isRunning(channelId: string): boolean {
    return this.sockets.has(channelId)
  }
}

export const whatsappBotManager = new WhatsAppBotManager()
