import crypto from "crypto";
import { StickyNote } from "@shared/model/sticky-note.js";

export class Stickies {
  public stickyMap: Map<string, StickyNote> = new Map();
  add(title: string, desc: string, x: number, y: number): StickyNote {
    const id = crypto.randomUUID();
    const note: StickyNote = {
      id,
      title,
      desc,
      x,
      y,
    };

    this.stickyMap.set(id, note);

    return note;
  }

  get(id: string) {
    return this.stickyMap.get(id);
  }

  edit(
    id: string,
    title?: string,
    desc?: string,
    x?: number,
    y?: number
  ): StickyNote | null {
    const sticky = this.stickyMap.get(id);
    if (!sticky) return null;
    if (title !== undefined) {
      sticky.title = title;
    }

    if (desc !== undefined) {
      sticky.desc = desc;
    }

    if (x !== undefined) {
      sticky.x = x;
    }

    if (y !== undefined) {
      sticky.y = y;
    }

    return sticky;
  }
}
