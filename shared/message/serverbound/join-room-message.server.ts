import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

export const SJoinRoomMessage = createMessageClass("SJoinRoomMessage",
  z.object({
    username: z.string().min(1),
  }), "visitJoinRoom"
);
