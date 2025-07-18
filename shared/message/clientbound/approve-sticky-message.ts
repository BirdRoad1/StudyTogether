import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof ApproveStickyMessage.schema>;

export class ApproveStickyMessage extends Message {
  static schema = z.object({
    clientId: z.string(),
    serverId: z.string()
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): ApproveStickyMessage {
    return new ApproveStickyMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
