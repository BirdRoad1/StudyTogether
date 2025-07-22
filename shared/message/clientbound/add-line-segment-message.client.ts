import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

const round = (n: number) => Math.floor(n * 100) / 100;

export const CAddLineSegmentMessage = createMessageClass(
  "CAddLineSegmentMessage",
  z.object({
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
  }),
);
