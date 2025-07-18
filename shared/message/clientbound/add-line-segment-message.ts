import z from "zod";
import { Message } from "../../message.js";

type Schema = z.infer<typeof AddLineSegmentMessage.schema>;

const round = (n: number) => Math.floor(n * 100) / 100;

export class AddLineSegmentMessage extends Message {
  static schema = z.object({
    segments: z.array(
      z.discriminatedUnion("type", [
        z
          .object({
            type: z.literal("client"),
            serverId: z.string(),
            clientId: z.string(),
          })
          .strict(),
        z.object({
          type: z.literal("server"),
          serverId: z.string(),
          segment: z
            .object({
              id: z.string(),
              startX: z.number().transform(round),
              startY: z.number().transform(round),
              endX: z.number().transform(round),
              endY: z.number().transform(round),
            })
            .strict(),
        }),
      ])
    ),
  });

  constructor(id: number, public payload: Schema) {
    super(id);
  }

  static create(id: number, data: Schema): AddLineSegmentMessage {
    return new AddLineSegmentMessage(id, data);
  }

  serialize(): unknown {
    return { id: this.id, payload: this.payload };
  }
}
