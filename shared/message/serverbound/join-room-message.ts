import z from "zod";
import { Message } from "../../message.js";

type JoinRoomSchema = z.infer<typeof JoinRoomMessage.schema>;

export class JoinRoomMessage extends Message {
  static schema = z.object({
    username: z.string().min(1),
  });

  constructor(id: number, public payload: JoinRoomSchema) {
    super(id);
  }

  static create(id: number, data: JoinRoomSchema): JoinRoomMessage {
    return new JoinRoomMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
