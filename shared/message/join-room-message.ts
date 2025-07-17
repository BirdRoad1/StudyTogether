import z from "zod";
import { Message } from "../message.ts";

type JoinRoomSchema = z.infer<typeof JoinRoomMessage.schema>;

export class JoinRoomMessage extends Message implements JoinRoomSchema {
  static schema = z.object({
    username: z.string().min(1),
  });

  constructor(
    id: number,
    data: JoinRoomSchema,
    public username = data.username
  ) {
    super(id);
  }

  static fromData(id: number, data: unknown): JoinRoomMessage {
    return new JoinRoomMessage(id, this.schema.parse(data));
  }
}
