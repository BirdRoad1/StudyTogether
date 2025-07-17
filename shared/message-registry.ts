import type z from "zod";
import { Message } from "./message.ts";
import { JoinRoomMessage } from "./message/join-room-message.ts";

export type MessageType = "join";

export type MessageConstructor<T extends Message = Message> = {
  new (...args: never[]): T;
  fromData: (id: number, data: unknown) => T;
  schema: z.ZodObject;
};

export class MessageRegistry {
  private static msgCtorMap = new Map<number, MessageConstructor>();

  static {
    this.registerMessageType(1, JoinRoomMessage);
  }

  static registerMessageType(id: number, ctor: MessageConstructor) {
    if (this.msgCtorMap.has(id)) {
      throw new Error("Duplicate message id: " + id);
    }

    this.msgCtorMap.set(id, ctor);
  }

  static fromData(data: unknown): Message | null {
    if (
      data === null ||
      typeof data !== "object" ||
      !("type" in data) ||
      typeof data.type !== "number" ||
      !("payload" in data) ||
      data.payload === null ||
      typeof data.payload !== "object"
    ) {
      return null;
    }

    const ctor = this.msgCtorMap.get(data.type);
    if (!ctor) {
      return null;
    }

    return ctor.fromData(data.type, data.payload);
  }
}
