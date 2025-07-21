import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const SEditNotesMessage = createMessageClass("SEditStickyNoteMessage",
  z.object({
    content: z.string(),
    type: z.enum(['personal', 'shared'])
  })
);
