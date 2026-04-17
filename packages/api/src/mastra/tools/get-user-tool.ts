import { userSchema } from "@time/shared";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getUserById } from "../../services/user-service";

export const getUserTool = createTool({
  id: "get-user",
  description: "Look up a single user by id and return their public-safe profile.",
  inputSchema: z.object({
    id: z.string().min(1).describe("The user id to fetch."),
  }),
  outputSchema: userSchema,
  execute: async ({ id }) => {
    return getUserById(id);
  },
});
