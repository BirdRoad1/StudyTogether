import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof RemoveLineSegmentMessage.schema>;

export class RemoveLineSegmentMessage extends Message {
  static schema = z.union([
    z.object({
      type: z.enum(['client', 'server']),
      id: z.uuid(),
    }),
  ]);

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): RemoveLineSegmentMessage {
    return new RemoveLineSegmentMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
