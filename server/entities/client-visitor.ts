import { SJoinRoomMessage } from "@shared/message/serverbound/join-room-message.server.js";
import { CJoinRoomResponseMessage } from "@shared/message/clientbound/join-room-response-message.client.js";
import { SRequestLineSegmentMessage } from "@shared/message/serverbound/request-line-segment.server.js";
import { CAddLineSegmentMessage } from "@shared/message/clientbound/add-line-segment-message.client.js";
import { CAddStickyMessage } from "@shared/message/clientbound/add-sticky-message.client.js";
import { SCreateStickyNoteMessage } from "@shared/message/serverbound/create-sticky-note-message.server.js";
import { SRemoveStickyNoteMessage } from "@shared/message/serverbound/remove-sticky-note-message.server.js";
import { SEditStickyNoteMessage } from "@shared/message/serverbound/edit-sticky-note-message.server.js";
import { SUserMousePosMessage } from "@shared/message/serverbound/user-mouse-pos-message.server.js";
import { SSendLLMMessage } from "@shared/message/serverbound/send-llm-message.server.js";
import { CLLMChatCompleteMessage } from "@shared/message/clientbound/llm-chat-complete-message.client.js";
import { SEditNotesMessage } from "@shared/message/serverbound/edit-notes-message.server.js";
import { CEditNotesMessage } from "@shared/message/clientbound/edit-notes-message.client.js";
import { CUsersListMessage } from "@shared/message/clientbound/users-list-message.client.js";
import { IServerboundMessageVisitor } from "@shared/message-visitor.js";
import { WSClient } from "@shared/ws-client.js";
import { ServerUser } from "server/entities/server-user.js";
import { Room } from "server/entities/room.js";
import { MessageRegistry } from "@shared/message-registry.js";
import { LineSegment } from "@shared/model/line-segment.js";
import { LLMMessage } from "@shared/model/llm-message.js";
import { CApproveStickyMessage } from "@shared/message/clientbound/approve-sticky-message.client.js";
import { CEditStickyMessage } from "@shared/message/clientbound/edit-sticky-message.client.js";
import { CUserMousePosMessage } from "@shared/message/clientbound/user-mouse-pos-message.client.js";
import { LLMConversation } from "server/entities/llm-conversation.js";
import { z } from "zod";

const ToolSchema = z.array(
  z.object({
    name: z.string(),
    args: z.array(z.string()).optional(),
  })
);

const toolSeparator = '';

export class ClientVisitor implements IServerboundMessageVisitor {
  private user: ServerUser | undefined;
  constructor(private room: Room, private client: WSClient) {}

  visitJoinRoom(msg: InstanceType<typeof SJoinRoomMessage>): void {
    if (this.user !== undefined) return; // ignore double-join

    if (this.room.users.some((u) => u.name === msg.payload.username)) {
      this.client.send(
        MessageRegistry.buildMessage(CJoinRoomResponseMessage, {
          success: false,
          error: "The username is already taken!",
        })
      );
      return;
    }

    this.room.users.push(
      (this.user = {
        name: msg.payload.username,
        client: this.client,
        id: crypto.randomUUID(),
      })
    );

    this.room.unregisteredClients = this.room.unregisteredClients.filter(
      (c) => c !== this.client
    );

    clearTimeout(this.room.destroyTimeout);

    this.client.send(
      MessageRegistry.buildMessage(CJoinRoomResponseMessage, {
        success: true,
        code: this.room.code,
      })
    );

    // Send missing segments
    this.client.send(
      MessageRegistry.buildMessage(CAddLineSegmentMessage, {
        segments: [...this.room.whiteboard.lineSegments].map<{
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
    this.room.stickies.stickyMap.forEach((sticky) =>
      this.client.send(
        MessageRegistry.buildMessage(CAddStickyMessage, { sticky })
      )
    );

    // Send missing LLM chat
    this.client.send(
      MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
        type: "shared",
        messages: this.room.sharedConversation
          .getMessages()
          .map<LLMMessage & { type: "shared" | "personal" }>((m) => ({
            ...m,
            type: "shared",
          })),
      })
    );

    // Send shared notes
    this.client.send(
      MessageRegistry.buildMessage(CEditNotesMessage, {
        type: "shared",
        content: this.room.sharedNotes,
      })
    );

    // Broadcast users list
    for (const user of this.room.users) {
      user.client.send(
        MessageRegistry.buildMessage(CUsersListMessage, {
          users: this.room.users.map(({ id, name }) => ({ id, name })),
        })
      );
    }
  }

  visitRequestLineSegment(
    msg: InstanceType<typeof SRequestLineSegmentMessage>
  ): void {
    const uuid = this.room.whiteboard.addLineSegment(msg.payload.segment);
    this.client.send(
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

    for (const user of this.room.users) {
      if (user.client === this.client) continue;
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
  }

  visitCreateStickyNote(
    msg: InstanceType<typeof SCreateStickyNoteMessage>
  ): void {
    const sticky = msg.payload.sticky;
    const newSticky = this.room.stickies.add(
      sticky.title,
      sticky.desc,
      sticky.x,
      sticky.y
    );

    this.client.send(
      MessageRegistry.buildMessage(CApproveStickyMessage, {
        clientId: sticky.id,
        serverId: newSticky.id,
      })
    );

    for (const user of this.room.users) {
      if (user.client === this.client) continue;

      user.client.send(
        MessageRegistry.buildMessage(CAddStickyMessage, {
          sticky: newSticky,
        })
      );
    }
  }

  visitRemoveStickyNote(
    msg: InstanceType<typeof SRemoveStickyNoteMessage>
  ): void {
    if (!this.room.stickies.has(msg.payload.serverId)) {
      return;
    }

    this.room.stickies.remove(msg.payload.serverId);
    for (const user of this.room.users) {
      user.client.send(
        MessageRegistry.buildMessage(SRemoveStickyNoteMessage, {
          serverId: msg.payload.serverId,
        })
      );
    }
  }

  visitEditStickyNote(msg: InstanceType<typeof SEditStickyNoteMessage>): void {
    const sticky = msg.payload.sticky;
    const newSticky = this.room.stickies.get(sticky.id);
    if (!newSticky) return;

    newSticky.desc = sticky.desc;
    newSticky.title = sticky.title;
    newSticky.x = sticky.x;
    newSticky.y = sticky.y;

    for (const otherUser of this.room.users) {
      if (otherUser.id === this.user?.id) continue;
      otherUser.client.send(
        MessageRegistry.buildMessage(CEditStickyMessage, {
          sticky: newSticky,
        })
      );
    }
  }

  visitServerUserMousePos(
    msg: InstanceType<typeof SUserMousePosMessage>
  ): void {
    for (const otherUser of this.room.users) {
      if (!this.user || otherUser.id === this.user.id) continue;
      otherUser.client.send(
        MessageRegistry.buildMessage(CUserMousePosMessage, {
          userId: this.user.id,
          username: this.user.name,
          x: msg.payload.x,
          y: msg.payload.y,
        })
      );
    }
  }

  visitSendLLM(msg: InstanceType<typeof SSendLLMMessage>): void {
    if (!this.user) return;
    // Send msg to server and respond back!
    const text = msg.payload.message;
    if (msg.payload.type === "shared") {
      this.room.sharedConversation.addMessage(
        this.user.name + ": " + text,
        "user"
      );
      // Notify all users
      for (const user of this.room.users) {
        user.client.send(
          MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
            type: "shared",
            messages: this.room.sharedConversation
              .getMessages()
              .map<LLMMessage & { type: "shared" | "personal" }>((m) => ({
                ...m,
                type: "shared",
              })),
          })
        );
      }

      this.generateSharedResponse(this.room.sharedConversation, this.user);
    } else {
      let convo = this.room.convoMap.get(this.user);
      if (!convo) {
        this.room.convoMap.set(this.user, (convo = new LLMConversation()));
        convo.addMessage(this.room.getSystemPrompt(), "system");
        convo.addMessage(
          `This chat is a private chat with ${this.user.name}. No other users can see this messages though you may still affect other users with your tools`,
          "system"
        );
      }

      convo.addMessage(this.user.name + ": " + text, "user");
      console.log(convo);
      this.generatePersonalResponse(convo, this.user);
    }
  }

  visitEditNotes(msg: InstanceType<typeof SEditNotesMessage>): void {
    if (!this.user) return;
    if (msg.payload.type === "shared") {
      this.room.sharedNotes = msg.payload.content;
      for (const otherUser of this.room.users) {
        if (otherUser.id === this.user?.id) continue;

        otherUser.client.send(
          MessageRegistry.buildMessage(CEditNotesMessage, {
            type: "shared",
            content: msg.payload.content,
          })
        );
      }
    }
  }

  generateSharedResponse(conversation: LLMConversation, sender: ServerUser) {
    conversation
      .generateResponse()
      .then(async (res) => {
        await this.handleTools(res, conversation, sender);

        for (const user of this.room.users) {
          user.client.send(
            MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
              type: "shared",
              messages: conversation
                .getMessages()
                .map<LLMMessage & { type: "shared" | "personal" }>((m) => ({
                  ...m,
                  type: "shared",
                })),
            })
          );
        }
      })
      .catch((err) => {
        conversation.addMessage(
          "Failed to request LLM: " + err.message,
          "assistant"
        );
      });
  }

  generatePersonalResponse(conversation: LLMConversation, sender: ServerUser) {
    conversation
      .generateResponse()
      .then(async (res) => {
        await this.handleTools(res, conversation, sender);

        sender.client.send(
          MessageRegistry.buildMessage(CLLMChatCompleteMessage, {
            type: "personal",
            messages: conversation
              .getMessages()
              .map<LLMMessage & { type: "shared" | "personal" }>((m) => ({
                ...m,
                type: "personal",
              })),
          })
        );
      })
      .catch((err) => {
        conversation.addMessage(
          "Failed to request LLM: " + err.message,
          "assistant"
        );
      });
  }

  async handleTools(
    message: string,
    conversation: LLMConversation,
    user: ServerUser,
    depth: number = 0
  ) {
    if (!message.includes(toolSeparator)) return;
    const chunks = message.replace(/\r?\n/g, "").split(toolSeparator);
    const toolResponses: { name: string; response: string | null }[] = [];
    console.log("Chunks:", chunks);
    for (const chunk of chunks) {
      try {
        const parsed = ToolSchema.parse(JSON.parse(chunk));
        if (parsed.length >= 5) {
          conversation.addMessage(
            "You may only use up to 5 tools at a time",
            "system"
          );
          continue;
        }
        for (const tool of parsed) {
          let response: string | null = "";

          if (depth >= 5) {
            response =
              "Tool depth limit exceeded. The user must send another message before a tool can be called";
            continue;
          }

          if (tool.name === "getNotes") {
            response = this.room.sharedNotes || null;
          } else if (tool.name === "createStickyNote") {
            const title = tool.args?.[0];
            const description = tool.args?.[1];
            if (typeof title !== "string" || typeof description !== "string") {
              response = "Missing title or description";
            } else {
              const sticky = this.room.stickies.add(
                title,
                description,
                100,
                100
              );

              for (const user of this.room.users) {
                user.client.send(
                  MessageRegistry.buildMessage(CAddStickyMessage, {
                    sticky,
                  })
                );
              }
            }
          } else if (tool.name === "kickUser") {
            const name = tool.args?.[0];
            const reason = tool.args?.[1];
            if (typeof name !== "string" || typeof reason !== "string") {
              response = "Missing name or reason";
            } else {
              const userToKick = this.room.users.find((u) => u.name === name);
              if (!userToKick) {
                response = "User not found";
              } else {
                this.room.kickUser(userToKick, reason);
                response = "User was kicked";
              }
            }
          } else {
            response = "Tool not found";
          }

          toolResponses.push({ name: tool.name, response });
        }
      } catch (err) {
        console.log("Failed to parse chunk", chunk, err);
      }
    }

    if (toolResponses.length === 0) return;

    console.log("response:", JSON.stringify(toolResponses));
    conversation.addMessage(
      "Tool Response: " + JSON.stringify(toolResponses),
      "user"
    );
    const generated = await conversation.generateResponse();
    if (depth < 5) {
      await this.handleTools(generated, conversation, user, depth + 1);
    }
    console.log(conversation);
  }
}
