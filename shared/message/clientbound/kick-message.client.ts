import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CKickMessage = createMessageClass("CKickMessage",
  z.object({
    reason: z.string().default("No reason was provided"),
  })
);
