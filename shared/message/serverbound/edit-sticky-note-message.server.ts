import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const SEditStickyNoteMessage = createMessageClass("SEditStickyNoteMessage",
  z.object({
    sticky: z.object({
      id: z.string(),
      title: z.string(),
      desc: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  })
);
