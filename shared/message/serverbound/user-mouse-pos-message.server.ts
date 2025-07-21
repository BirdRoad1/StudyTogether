import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const SUserMousePosMessage = createMessageClass("SUserMousePosMessage",
  z.object({
    x: z.number(),
    y: z.number(),
  })
);
