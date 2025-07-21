import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CApproveStickyMessage = createMessageClass("CApproveStickyMessage",
  z.object({
    clientId: z.string(),
    serverId: z.string(),
  })
);
