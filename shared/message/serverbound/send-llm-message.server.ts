import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const SSendLLMMessage = createMessageClass("SSendLLMMessage",
  z.object({
    message: z
      .string()
      .min(1)
      .max(4096 * 6), // 6 tokens per char max?
    type: z.enum(["shared", "personal"]),
  })
);
