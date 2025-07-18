import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof CreateStickyNoteMessage.schema>;

export class CreateStickyNoteMessage extends Message {
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

  static create(id: number, data: Schema): CreateStickyNoteMessage {
    return new CreateStickyNoteMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
