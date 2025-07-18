import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof RequestLineSegmentMessage.schema>;
const round = (n: number) => Math.floor(n * 100) / 100;

export class RequestLineSegmentMessage extends Message {
  static schema = z.object({
    segment: z.object({
      id: z.string(),
      startX: z.number().transform(round),
      startY: z.number().transform(round),
      endX: z.number().transform(round),
      endY: z.number().transform(round),
    }),
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): RequestLineSegmentMessage {
    return new RequestLineSegmentMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
