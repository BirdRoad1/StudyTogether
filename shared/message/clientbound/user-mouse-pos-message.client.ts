import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CUserMousePosMessage = createMessageClass("CUserMousePosMessage",
  z.object({
    x: z.number(),
    y: z.number(),
    userId: z.string(),
    username: z.string(),
  }),
);
