import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof AddStickyMessage.schema>;

export class AddStickyMessage extends Message {
  static schema = z.object({
    sticky: z.object({
      id: z.string(),
      title: z.string(),
      desc: z.string(),
      x: z.number(),
      y: z.number()
    }),
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): AddStickyMessage {
    return new AddStickyMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
