import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const CUsersListMessage = createMessageClass(
  "CUsersListMessage",
  z.object({
    users: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    ),
  }),
);
