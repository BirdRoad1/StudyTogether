import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CEditStickyMessage = createMessageClass("CEditStickyMessage",
  z.object({
    sticky: z.object({
      id: z.string(),
      title: z.string().optional(),
      desc: z.string().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    }),
  })
);
