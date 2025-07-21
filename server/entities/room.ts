import type { User } from "./user.js";
import EventEmitter from "eventemitter3";
import { SJoinRoomMessage } from "@shared/message/serverbound/join-room-message.server.js";
import { WSClient } from "@shared/ws-client.js";
import { CJoinRoomResponseMessage } from "@shared/message/clientbound/join-room-response-message.client.js";
import { MessageRegistry } from "@shared/message-registry.js";
import { Whiteboard } from "./whiteboard.js";
import { CAddLineSegmentMessage } from "@shared/message/clientbound/add-line-segment-message.client.js";
import { SRequestLineSegmentMessage } from "@shared/message/serverbound/request-line-segment.server.js";
import { LineSegment } from "@shared/model/line-segment.js";
import { Stickies } from "./stickies.js";
import { SCreateStickyNoteMessage } from "@shared/message/serverbound/create-sticky-note-message.server.js";
import { SEditStickyNoteMessage } from "@shared/message/serverbound/edit-sticky-note-message.server.js";
import { CApproveStickyMessage } from "@shared/message/clientbound/approve-sticky-message.client.js";
import { CEditStickyMessage } from "@shared/message/clientbound/edit-sticky-message.client.js";
import { CAddStickyMessage } from "@shared/message/clientbound/add-sticky-message.client.js";
import { SRemoveStickyNoteMessage } from "@shared/message/serverbound/remove-sticky-note-message.server.js";
import { SUserMousePosMessage } from "@shared/message/serverbound/user-mouse-pos-message.server.js";
import { CUserMousePosMessage } from "@shared/message/clientbound/user-mouse-pos-message.client.js";
import { SSendLLMMessage } from "@shared/message/serverbound/send-llm-message.server.js";
import { LLMConversation } from "server/entities/llm-conversation.js";
import { CLLMChatCompleteMessage } from "@shared/message/clientbound/llm-chat-complete-message.client.js";
import { LLMMessage } from "@shared/model/llm-message.js";
import { SEditNotesMessage } from "@shared/message/serverbound/edit-notes-message.server.js";
import { CEditNotesMessage } from "@shared/message/clientbound/edit-notes-message.client.js";

interface RoomEvents {
  destroy: () => void;
}

export class Room extends EventEmitter<RoomEvents> {
  private users: User[] = [];
  private unregisteredClients: WSClient[] = [];
  private destroyTimeout?: NodeJS.Timeout;
  private whiteboard = new Whiteboard();
  private stickies = new Stickies();
  private sharedConversation = new LLMConversation();
  private convoMap = new Map<User, LLMConversation>();
  private sharedNotes = "";
  private notesMap = new Map<User, string>();

  constructor(public readonly code: string) {
    super();
  }

  handleClient(client: WSClient) {
    this.unregisteredClients.push(client);
    let user: User | undefined;
    client.on("close", () => {
      this.users = this.users.filter((u) => u.client !== client);
      this.unregisteredClients = this.unregisteredClients.filter(
        (c) => c !== client
      );

      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = setTimeout(() => {
        if (this.users.length === 0 && this.unregisteredClients.length === 0) {
          this.emit("destroy");
        }
      }, 24 * 60 * 60);
    });

    client.on("message", (msg) => {
      try {
        if (!msg.isMessageOf(SJoinRoomMessage) && user === undefined) {
          // Prevent unregistered user actions
          console.log("Ignored unregistered user msg:", msg);
          return;
        }

        if (msg.isMessageOf(SJoinRoomMessage)) {
          if (user !== undefined) return; // ignore double-join
          if (this.users.some((u) => u.name === msg.payload.username)) {
            client.send(
              MessageRegistry.buildMessage(CJoinRoomResponseMessage, {
                success: false,
                error: "The username is already taken!",
              })
            );
            return;
          }

          this.users.push(
            (user = {
              name: msg.payload.username,
              client: client,
              id: crypto.randomUUID(),
            })
          );

          this.unregisteredClients = this.unregisteredClients.filter(
            (c) => c !== client
          );

          clearTimeout(this.destroyTimeout);

          client.send(
            MessageRegistry.buildMessage(CJoinRoomResponseMessage, {
              success: true,
              code: this.code,
            })
          );

          // Send missing segments
          client.send(
            MessageRegistry.buildMessage(CAddLineSegmentMessage, {
              segments: [...this.whiteboard.lineSegments].map<{
                type: "server";
                serverId: string;
                segment: LineSegment;
              }>(([k, v]) => {
                return {
                  type: "server",
                  serverId: k,
                  segment: v,
                };
              }),
            })
          );

          // Send missing stickies
          this.stickies.stickyMap.forEach((sticky) =>
            client.send(
              MessageRegistry.buildMessage(CAddStickyMessage, { sticky })
            )
          );

          // Send missing LLM chat
          client.send(
            MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
              type: "shared",
              messages: this.sharedConversation
                .getMessages()
                .map<LLMMessage & { type: "shared" | "personal" }>((m) => ({
                  ...m,
                  type: "shared",
                })),
            })
          );

          // Send shared notes
          for (const user of this.users) {
            user.client.send(
              MessageRegistry.buildMessage(CEditNotesMessage, {
                type: "shared",
                content: this.sharedNotes,
              })
            );
          }
        } else if (msg.isMessageOf(SRequestLineSegmentMessage)) {
          const uuid = this.whiteboard.addLineSegment(msg.payload.segment);
          client.send(
            MessageRegistry.buildMessage(CAddLineSegmentMessage, {
              segments: [
                {
                  type: "client",
                  clientId: msg.payload.segment.id,
                  serverId: uuid,
                },
              ],
            })
          );

          for (const user of this.users) {
            if (user.client === client) continue;
            user.client.send(
              MessageRegistry.buildMessage(CAddLineSegmentMessage, {
                segments: [
                  {
                    type: "server",
                    serverId: uuid,
                    segment: { ...msg.payload.segment, id: uuid },
                  },
                ],
              })
            );
          }
        } else if (msg.isMessageOf(SCreateStickyNoteMessage)) {
          const sticky = msg.payload.sticky;
          const newSticky = this.stickies.add(
            sticky.title,
            sticky.desc,
            sticky.x,
            sticky.y
          );

          client.send(
            MessageRegistry.buildMessage(CApproveStickyMessage, {
              clientId: sticky.id,
              serverId: newSticky.id,
            })
          );

          for (const user of this.users) {
            if (user.client === client) continue;

            user.client.send(
              MessageRegistry.buildMessage(CAddStickyMessage, {
                sticky: newSticky,
              })
            );
          }
        } else if (msg.isMessageOf(SEditStickyNoteMessage)) {
          const sticky = msg.payload.sticky;
          const newSticky = this.stickies.get(sticky.id);
          if (!newSticky) return;

          newSticky.desc = sticky.desc;
          newSticky.title = sticky.title;
          newSticky.x = sticky.x;
          newSticky.y = sticky.y;

          for (const user of this.users) {
            user.client.send(
              MessageRegistry.buildMessage(CEditStickyMessage, {
                sticky: newSticky,
              })
            );
          }
        } else if (msg.isMessageOf(SRemoveStickyNoteMessage)) {
          if (!this.stickies.has(msg.payload.serverId)) {
            return;
          }

          this.stickies.remove(msg.payload.serverId);
          for (const user of this.users) {
            user.client.send(
              MessageRegistry.buildMessage(SRemoveStickyNoteMessage, {
                serverId: msg.payload.serverId,
              })
            );
          }
        } else if (msg.isMessageOf(SUserMousePosMessage)) {
          for (const otherUser of this.users) {
            if (!user || otherUser.id === user.id) continue;
            otherUser.client.send(
              MessageRegistry.buildMessage(CUserMousePosMessage, {
                userId: user.id,
                username: user.name,
                x: msg.payload.x,
                y: msg.payload.y,
              })
            );
          }
        } else if (msg.isMessageOf(SSendLLMMessage)) {
          if (!user) return;
          // Send msg to server and respond back!
          const text = msg.payload.message;
          if (msg.payload.type === "shared") {
            this.sharedConversation.addMessage(user.name + ": " + text, "user");
            // Notify all users
            for (const user of this.users) {
              user.client.send(
                MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
                  type: "shared",
                  messages: this.sharedConversation
                    .getMessages()
                    .map<LLMMessage & { type: "shared" | "personal" }>((m) => ({
                      ...m,
                      type: "shared",
                    })),
                })
              );
            }

            this.sharedConversation
              .generateResponse()
              .then(() => {
                for (const user of this.users) {
                  user.client.send(
                    MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
                      type: "shared",
                      messages: this.sharedConversation
                        .getMessages()
                        .map<LLMMessage & { type: "shared" | "personal" }>(
                          (m) => ({
                            ...m,
                            type: "shared",
                          })
                        ),
                    })
                  );
                }
              })
              .catch((err) => {
                this.sharedConversation.addMessage(
                  "Failed to request LLM: " + err.message,
                  "assistant"
                );
              });
          } else {
            //personal chat
            let convo = this.convoMap.get(user);
            if (!convo) {
              this.convoMap.set(user, (convo = new LLMConversation()));
            }

            convo.addMessage(text, "user");
            // Notify user
            user.client.send(
              MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
                type: "personal",
                messages: convo
                  .getMessages()
                  .map<LLMMessage & { type: "shared" | "personal" }>((m) => ({
                    ...m,
                    type: "personal",
                  })),
              })
            );

            convo
              .generateResponse()
              .then(() => {
                if (!user) return;
                user.client.send(
                  MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
                    type: "personal",
                    messages: convo
                      .getMessages()
                      .map<LLMMessage & { type: "shared" | "personal" }>(
                        (m) => ({
                          ...m,
                          type: "personal",
                        })
                      ),
                  })
                );
              })
              .catch((err) => {
                convo.addMessage(
                  "Failed to request LLM: " + err.message,
                  "assistant"
                );
              });
          }
        } else if (msg.isMessageOf(SEditNotesMessage)) {
          if (!user) return;
          if (msg.payload.type === "shared") {
            this.sharedNotes = msg.payload.content;
            for (const user of this.users) {
              user.client.send(
                MessageRegistry.buildMessage(CEditNotesMessage, {
                  type: "shared",
                  content: msg.payload.content,
                })
              );
            }
          } else {
            this.notesMap.set(user, msg.payload.content);
          }
        }

        console.log("Got message:", msg);
      } catch (err) {
        console.log("Error in socket handler:", err);
      }
    });
  }
}
