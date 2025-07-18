import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof KickMessage.schema>;

export class KickMessage extends Message {
  static schema = z.object({
    reason: z.string().default("No reason was provided"),
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): KickMessage {
    return new KickMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
