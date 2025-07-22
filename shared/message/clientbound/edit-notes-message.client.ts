import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CEditNotesMessage = createMessageClass(
  "CEditNotesMessage",
  z.object({
    type: z.enum(["shared", "personal"]),
    content: z.string(),
  }),
);
