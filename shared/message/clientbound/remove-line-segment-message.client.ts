import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CRemoveLineSegmentMessage = createMessageClass("CRemoveLineSegmentMessage",
  z.union([
    z.object({
      type: z.enum(["client", "server"]),
      id: z.uuid(),
    }),
  ])
);
