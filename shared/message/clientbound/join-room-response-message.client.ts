import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CJoinRoomResponseMessage = createMessageClass("CJoinRoomResponseMessage",
  z.discriminatedUnion("success", [
    z
      .object({
        success: z.literal(true),
        code: z.string().length(6),
      })
      .strict(),
    z
      .object({
        success: z.literal(false),
        error: z.string(),
      })
      .strict(),
  ]),
);