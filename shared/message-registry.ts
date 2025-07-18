import { Message } from "./message.js";
import { JoinRoomMessage } from "./message/serverbound/join-room-message.js";
import { JoinRoomResponseMessage } from "./message/clientbound/join-room-response-message.js";
import type { z, ZodType } from "zod";
import { KickMessage } from "./message/clientbound/kick-message.js";
import { RequestLineSegmentMessage } from "./message/serverbound/request-line-segment.js";
import { AddLineSegmentMessage } from "./message/clientbound/add-line-segment-message.js";
import { RemoveLineSegmentMessage } from "./message/clientbound/remove-line-segment-message.js";
export type MessageType = "join";

export type MessageConstructor<
  T extends Message = Message,
  S extends ZodType = ZodType
> = {
  new (...args: never[]): T;
  schema: S;
  create(id: number, data: z.infer<S>): T;
  // fromData: (id: number, data: unknown) => T;
};

export class MessageRegistry {
  private static msgCtorMap = new Map<number, MessageConstructor>();

  static {
    this.registerMessageType(1, JoinRoomMessage);
    this.registerMessageType(2, JoinRoomResponseMessage);
    this.registerMessageType(3, KickMessage);
    this.registerMessageType(4, RequestLineSegmentMessage);
    this.registerMessageType(5, AddLineSegmentMessage);
    this.registerMessageType(6, RemoveLineSegmentMessage);
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
      !("id" in data) ||
      typeof data.id !== "number" ||
      !("payload" in data) ||
      data.payload === null ||
      typeof data.payload !== "object"
    ) {
      return null;
    }

    const ctor = this.msgCtorMap.get(data.id);
    if (!ctor) {
      return null;
    }

    return ctor.create(data.id, data.payload);
  }

  static buildMessage<T extends MessageConstructor>(
    ctor: T,
    message: z.infer<T["schema"]>
  ): Message {
    let id: undefined | number;
    for (const [msgId, msgCtor] of this.msgCtorMap) {
      if (msgCtor === ctor) {
        id = msgId;
      }
    }

    if (id === undefined)
      throw new Error(`The message ${ctor.name} has not been registered`);

    return ctor.create(id, message);
  }
}
