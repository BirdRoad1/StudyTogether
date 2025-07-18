import z from "zod";
import { Message } from "../../message.js";

type JoinRoomResponseSchema = z.infer<typeof JoinRoomResponseMessage.schema>;

export class JoinRoomResponseMessage extends Message {
  static schema = z.discriminatedUnion("success", [
    z
      .object({
        success: z.literal(true),
        code: z.string().length(6),
      })
      .strict(),
    z
      .object({
        success: z.literal(false),
        error: z.string(),
      })
      .strict(),
  ]);

  constructor(id: number, public payload: JoinRoomResponseSchema) {
    super(id);
  }

  static create(
    id: number,
    data: JoinRoomResponseSchema
  ): JoinRoomResponseMessage {
    return new JoinRoomResponseMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
