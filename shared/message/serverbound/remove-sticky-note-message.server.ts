import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const SRemoveStickyNoteMessage = createMessageClass("SRemoveStickyNoteMessage",
  z.object({
    serverId: z.string(),
  })
);
