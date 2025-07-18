import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof SUserMousePosMessage.schema>;

export class SUserMousePosMessage extends Message {
  static schema = z.object({
    x: z.number(),
    y: z.number(),
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): SUserMousePosMessage {
    return new SUserMousePosMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
