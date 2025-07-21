import { Message } from "./message.js";
import { SJoinRoomMessage } from "./message/serverbound/join-room-message.server.js";
import { CJoinRoomResponseMessage } from "./message/clientbound/join-room-response-message.client.js";
import type { z, ZodType } from "zod";
import { CKickMessage } from "./message/clientbound/kick-message.client.js";
import { SRequestLineSegmentMessage } from "./message/serverbound/request-line-segment.server.js";
import { CAddLineSegmentMessage } from "./message/clientbound/add-line-segment-message.client.js";
import { CRemoveLineSegmentMessage } from "./message/clientbound/remove-line-segment-message.client.js";
import { CAddStickyMessage } from "./message/clientbound/add-sticky-message.client.js";
import { CEditStickyMessage } from "./message/clientbound/edit-sticky-message.client.js";
import { SCreateStickyNoteMessage } from "./message/serverbound/create-sticky-note-message.server.js";
import { SRemoveStickyNoteMessage } from "./message/serverbound/remove-sticky-note-message.server.js";
import { SEditStickyNoteMessage } from "./message/serverbound/edit-sticky-note-message.server.js";
import { CApproveStickyMessage } from "./message/clientbound/approve-sticky-message.client.js";
import { CUserMousePosMessage } from "./message/clientbound/user-mouse-pos-message.client.js";
import { SUserMousePosMessage } from "./message/serverbound/user-mouse-pos-message.server.js";
import { SSendLLMMessage } from "@shared/message/serverbound/send-llm-message.server.js";
import { CLLMChatCompleteMessage } from "@shared/message/clientbound/llm-chat-complete-message.client.js";
import { SEditNotesMessage } from "@shared/message/serverbound/edit-notes-message.server.js";
import { CEditNotesMessage } from "@shared/message/clientbound/edit-notes-message.client.js";

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
    this.registerMessageType(1, SJoinRoomMessage);
    this.registerMessageType(2, CJoinRoomResponseMessage);
    this.registerMessageType(3, CKickMessage);
    this.registerMessageType(4, SRequestLineSegmentMessage);
    this.registerMessageType(5, CAddLineSegmentMessage);
    this.registerMessageType(6, CRemoveLineSegmentMessage);
    this.registerMessageType(7, CRemoveLineSegmentMessage);
    this.registerMessageType(8, CAddStickyMessage);
    this.registerMessageType(9, CEditStickyMessage);
    this.registerMessageType(10, SCreateStickyNoteMessage);
    this.registerMessageType(11, SRemoveStickyNoteMessage);
    this.registerMessageType(12, SEditStickyNoteMessage);
    this.registerMessageType(13, CApproveStickyMessage);
    this.registerMessageType(14, SRemoveStickyNoteMessage);
    this.registerMessageType(15, CUserMousePosMessage);
    this.registerMessageType(16, SUserMousePosMessage);
    this.registerMessageType(17, SSendLLMMessage);
    this.registerMessageType(18, CLLMChatCompleteMessage);
    this.registerMessageType(19, SEditNotesMessage);
    this.registerMessageType(20, CEditNotesMessage);
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
