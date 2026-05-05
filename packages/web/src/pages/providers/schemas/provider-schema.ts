import { z } from "zod"
import { createProviderSchema, updateProviderSchema } from "@time/shared"

const providerTypeValues = [
  "openai",
  "anthropic",
  "deepseek",
  "gemini",
  "mistral",
  "xai",
  "groq",
  "openrouter",
  "ollama",
  "azure",
  "openai_compatible",
] as const

type ProviderTypeValue = (typeof providerTypeValues)[number]

type ProviderTypeOption = {
  value: ProviderTypeValue
  label: string
  image?: string
}

const providerTypeMeta: Record<ProviderTypeValue, Omit<ProviderTypeOption, "value">> = {
  openai: {
    label: "ChatGPT / OpenAI",
    image: "/images/providers/openai.png",
  },
  anthropic: {
    label: "Anthropic",
    image: "/images/providers/anthropic.png",
  },
  deepseek: {
    label: "DeepSeek",
    image: "/images/providers/deepseek.png",
  },
  gemini: {
    label: "Gemini",
    image: "/images/providers/gemini.png",
  },
  mistral: {
    label: "Mistral",
    image: "/images/providers/mistral.png",
  },
  xai: {
    label: "xAI",
    image: "/images/providers/xai.png",
  },
  groq: {
    label: "Groq",
    image: "/images/providers/groq.png",
  },
  openrouter: {
    label: "OpenRouter",
    image: "/images/providers/openrouter.png",
  },
  ollama: {
    label: "Ollama",
    image: "/images/providers/ollama.png",
  },
  azure: {
    label: "Azure",
  },
  openai_compatible: {
    label: "OpenAI compatible",
  },
}

export const providerTypeOptions: ProviderTypeOption[] = providerTypeValues.map((value) => ({
  value,
  ...providerTypeMeta[value],
}))

export const createProviderFormSchema = createProviderSchema.extend({
  apiKey: z.string().optional().nullable(),
  baseUrl: z.string().optional().nullable(),
})

export const updateProviderFormSchema = updateProviderSchema.extend({
  apiKey: z.string().optional().nullable(),
  baseUrl: z.string().optional().nullable(),
})

export type ProviderFormValues = z.infer<typeof createProviderFormSchema>
