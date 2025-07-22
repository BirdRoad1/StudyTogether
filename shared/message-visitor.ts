import type { SJoinRoomMessage } from "@shared/message/serverbound/join-room-message.server.js";
import type { SRequestLineSegmentMessage } from "@shared/message/serverbound/request-line-segment.server.js";
import type { SCreateStickyNoteMessage } from "@shared/message/serverbound/create-sticky-note-message.server.js";
import type { SRemoveStickyNoteMessage } from "@shared/message/serverbound/remove-sticky-note-message.server.js";
import type { SEditStickyNoteMessage } from "@shared/message/serverbound/edit-sticky-note-message.server.js";
import type { SUserMousePosMessage } from "@shared/message/serverbound/user-mouse-pos-message.server.js";
import type { SSendLLMMessage } from "@shared/message/serverbound/send-llm-message.server.js";
import type { SEditNotesMessage } from "@shared/message/serverbound/edit-notes-message.server.js";

export type ServerboundVisitorMap = {
  visitJoinRoom: InstanceType<typeof SJoinRoomMessage>;
  visitRequestLineSegment: InstanceType<typeof SRequestLineSegmentMessage>;
  visitCreateStickyNote: InstanceType<typeof SCreateStickyNoteMessage>;
  visitRemoveStickyNote: InstanceType<typeof SRemoveStickyNoteMessage>;
  visitEditStickyNote: InstanceType<typeof SEditStickyNoteMessage>;
  visitServerUserMousePos: InstanceType<typeof SUserMousePosMessage>;
  visitSendLLM: InstanceType<typeof SSendLLMMessage>;
  visitEditNotes: InstanceType<typeof SEditNotesMessage>;
};

export type IServerboundMessageVisitor = {
  [K in keyof ServerboundVisitorMap]: (msg: ServerboundVisitorMap[K]) => void;
};
