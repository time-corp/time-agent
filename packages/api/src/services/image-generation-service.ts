import type { ChatAttachment } from "@time/shared";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, ErrorCode } from "../lib/errors";

const DEFAULT_XAI_BASE_URL = "https://api.x.ai/v1";
const MOCK_IMAGE_GENERATION = process.env["MOCK_IMAGE_GENERATION"] === "true";
const MOCK_IMAGE_URL =
  process.env["MOCK_IMAGE_URL"] ??
  "https://img.magnific.com/free-vector/schoolboy-pass-exam-cartoon-banner-boy-solve-test_107791-7188.jpg?t=st=1778480710~exp=1778484310~hmac=88949b922d8867d8d427b646ef30cc56437ec74b81c1a2813208c679ae09bdf5&w=2000";

type XaiImageGenerationResponse = {
  data?: Array<{
    url?: string;
    mime_type?: string;
  }>;
};

const buildImageGenerationUrl = (baseUrl?: string | null) => {
  const normalizedBaseUrl = (baseUrl ?? DEFAULT_XAI_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const hasVersionSuffix = /\/v\d+$/i.test(normalizedBaseUrl);
  return hasVersionSuffix
    ? `${normalizedBaseUrl}/images/generations`
    : `${normalizedBaseUrl}/v1/images/generations`;
};

const parseImageErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as {
        error?: { message?: string };
        message?: string;
      };
      return (
        payload.error?.message ??
        payload.message ??
        `Image generation failed: ${response.status}`
      );
    }

    const text = await response.text();
    return text || `Image generation failed: ${response.status}`;
  } catch {
    return `Image generation failed: ${response.status}`;
  }
};

export const generateImageForAgent = async ({
  agentConfigId,
  prompt,
}: {
  agentConfigId: string;
  prompt: string;
}): Promise<{ text: string; attachments: ChatAttachment[] }> => {
  if (MOCK_IMAGE_GENERATION) {
    return {
      text: `Generated 1 image for: ${prompt}`,
      attachments: [
        {
          type: "image",
          url: MOCK_IMAGE_URL,
          mimeType: "image/jpeg",
        },
      ],
    };
  }

  const [agentConfig] = await db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.id, agentConfigId))
    .limit(1);

  if (!agentConfig) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent config not found", 404);
  }

  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.id, agentConfig.providerId))
    .limit(1);

  if (!provider) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404);
  }

  if (!agentConfig.isActive) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Agent config is inactive",
      422,
    );
  }

  if (!provider.isActive) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Provider is inactive", 422);
  }

  if (provider.type !== "xai") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Image generation mode currently supports only xAI providers",
      422,
    );
  }

  if (!provider.apiKey) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Provider API key is missing",
      422,
    );
  }

  const response = await fetch(buildImageGenerationUrl(provider.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: agentConfig.modelName,
      prompt,
    }),
  });

  if (!response.ok) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      await parseImageErrorMessage(response),
      response.status,
    );
  }

  const payload = (await response.json()) as XaiImageGenerationResponse;
  const attachments = (payload.data ?? [])
    .filter(
      (item): item is { url: string; mime_type?: string } =>
        typeof item.url === "string" && item.url.length > 0,
    )
    .map((item) => ({
      type: "image" as const,
      url: item.url,
      mimeType: item.mime_type ?? "image/jpeg",
    }));

  if (attachments.length === 0) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Image generation returned no images",
      502,
    );
  }

  return {
    text: `Generated ${attachments.length} image${attachments.length > 1 ? "s" : ""} for: ${prompt}`,
    attachments,
  };
};
