import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof CRemoveStickyNoteMessage.schema>;

export class CRemoveStickyNoteMessage extends Message {
  static schema = z.object({
    serverId: z.string()
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): CRemoveStickyNoteMessage {
    return new CRemoveStickyNoteMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
