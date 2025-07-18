import type { LineSegment } from "@shared/model/line-segment.js";

export class Whiteboard {
  lineSegments: Map<string, LineSegment> = new Map();
  addLineSegment(segment: LineSegment): string {
    const uuid = crypto.randomUUID();
    const copy = {...segment};
    copy.id = uuid;
    this.lineSegments.set(uuid, segment);
    return uuid;
  }

  removeLineSegment(uuid: string) {
    this.lineSegments.delete(uuid);
  }
}
