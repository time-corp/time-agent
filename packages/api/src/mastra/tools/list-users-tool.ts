import { userSchema } from "@time/shared";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { listUsers } from "../../services/user-service";

export const listUsersTool = createTool({
  id: "list-users",
  description: "List all users with their public-safe profile fields.",
  inputSchema: z.object({}),
  outputSchema: z.array(userSchema),
  execute: async () => {
    return listUsers();
  },
});
