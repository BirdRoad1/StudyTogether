import z from "zod";
import { createMessageClass } from "@shared/typed-message.js";

const round = (n: number) => Math.floor(n * 100) / 100;

export const SRequestLineSegmentMessage = createMessageClass("SRequestLineSegmentMessage",
  z.object({
    segment: z.object({
      id: z.string(),
      startX: z.number().transform(round),
      startY: z.number().transform(round),
      endX: z.number().transform(round),
      endY: z.number().transform(round),
    }),
  }), "visitRequestLineSegment"
);
