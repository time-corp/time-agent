const ALGORITHM = "AES-GCM"
const IV_LENGTH = 12
const TAG_LENGTH = 16

type EncryptedPayload = { iv: string; tag: string; ciphertext: string }

const EMPTY_PAYLOAD = "{}"

const getKey = async (): Promise<CryptoKey> => {
  const raw = process.env["CHANNEL_CREDENTIALS_KEY"]
  if (!raw) {
    // dev fallback — 32 zero bytes; not secure, used only when key is not configured
    return crypto.subtle.importKey(
      "raw",
      new Uint8Array(32),
      { name: ALGORITHM, length: 256 },
      false,
      ["encrypt", "decrypt"],
    )
  }
  const keyBytes = Buffer.from(raw, "hex")
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

export const encryptJson = async (plain: Record<string, unknown>): Promise<string> => {
  if (Object.keys(plain).length === 0) return EMPTY_PAYLOAD

  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(JSON.stringify(plain))
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv, tagLength: TAG_LENGTH * 8 }, key, encoded)

  // AES-GCM output = ciphertext || tag (tag appended at end)
  const ciphertext = encrypted.slice(0, encrypted.byteLength - TAG_LENGTH)
  const tag = encrypted.slice(encrypted.byteLength - TAG_LENGTH)

  return JSON.stringify({
    iv: Buffer.from(iv).toString("base64"),
    tag: Buffer.from(tag).toString("base64"),
    ciphertext: Buffer.from(ciphertext).toString("base64"),
  } satisfies EncryptedPayload)
}

export const decryptJson = async (encrypted: string): Promise<Record<string, unknown>> => {
  if (!encrypted || encrypted === EMPTY_PAYLOAD) return {}

  const key = await getKey()
  const { iv, tag, ciphertext } = JSON.parse(encrypted) as EncryptedPayload

  const ivBytes = Buffer.from(iv, "base64")
  const tagBytes = Buffer.from(tag, "base64")
  const ciphertextBytes = Buffer.from(ciphertext, "base64")

  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length)
  combined.set(new Uint8Array(ciphertextBytes), 0)
  combined.set(new Uint8Array(tagBytes), ciphertextBytes.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes, tagLength: TAG_LENGTH * 8 },
    key,
    combined,
  )

  return JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, unknown>
}
