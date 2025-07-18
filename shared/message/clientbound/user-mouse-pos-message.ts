import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof CUserMousePosMessage.schema>;

export class CUserMousePosMessage extends Message {
  static schema = z.object({
    x: z.number(),
    y: z.number(),
    userId: z.string(),
    username: z.string()
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): CUserMousePosMessage {
    return new CUserMousePosMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
