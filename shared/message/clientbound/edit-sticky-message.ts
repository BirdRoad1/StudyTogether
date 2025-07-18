import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof EditStickyMessage.schema>;

export class EditStickyMessage extends Message {
  static schema = z.object({
    sticky: z.object({
      id: z.string(),
      title: z.string().optional(),
      desc: z.string().optional(),
      x: z.number().optional(),
      y: z.number().optional()
    }),
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): EditStickyMessage {
    return new EditStickyMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
