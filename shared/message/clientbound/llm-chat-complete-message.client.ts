import { createMessageClass } from "@shared/typed-message.js";
import z from "zod";

export const CLLMChatCompleteMessage = createMessageClass(
  "CLLMChatCompleteMessage",
  z.object({
    type: z.enum(["shared", "personal"]),
    messages: z.array(
      z.object({
        id: z.uuidv4(),
        message: z.string(),
        type: z.enum(["shared", "personal"]),
        role: z.enum(["system", "user", "assistant"]),
      })
    ),
  }),
);
