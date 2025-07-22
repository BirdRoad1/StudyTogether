import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CRemoveStickyNoteMessage = createMessageClass("CRemoveStickyNoteMessage",
  z.object({
    serverId: z.string(),
  }),
  "visitRemoveStickyNote"
);
