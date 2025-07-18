import type { User } from "./user.js";
import EventEmitter from "eventemitter3";
import { JoinRoomMessage } from "@shared/message/serverbound/join-room-message.js";
import { WSClient } from "@shared/ws-client.js";
import { JoinRoomResponseMessage } from "@shared/message/clientbound/join-room-response-message.js";
import { MessageRegistry } from "@shared/message-registry.js";
import { Whiteboard } from "./whiteboard.js";
import { AddLineSegmentMessage } from "@shared/message/clientbound/add-line-segment-message.js";
import { RequestLineSegmentMessage } from "@shared/message/serverbound/request-line-segment.js";
import { LineSegment } from "@shared/model/line-segment.js";
import { Stickies } from "./stickies.js";
import { CreateStickyNoteMessage } from "@shared/message/serverbound/create-sticky-note-message.js";
import { EditStickyNoteMessage } from "@shared/message/serverbound/edit-sticky-note-message.js";
import { ApproveStickyMessage } from "@shared/message/clientbound/approve-sticky-message.js";
import { EditStickyMessage } from "@shared/message/clientbound/edit-sticky-message.js";
import { AddStickyMessage } from "@shared/message/clientbound/add-sticky-message.js";
import { RemoveStickyNoteMessage } from "@shared/message/serverbound/remove-sticky-note-message.js";
import { CRemoveStickyNoteMessage } from "@shared/message/clientbound/remove-sticky-note-message.js";
import { SUserMousePosMessage } from "@shared/message/serverbound/user-mouse-pos-message.js";
import { CUserMousePosMessage } from "@shared/message/clientbound/user-mouse-pos-message.js";

interface RoomEvents {
  destroy: () => void;
}

export class Room extends EventEmitter<RoomEvents> {
  private users: User[] = [];
  private unregisteredClients: WSClient[] = [];
  private destroyTimeout?: NodeJS.Timeout;
  private whiteboard = new Whiteboard();
  private stickies = new Stickies();

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
      }, 30000);
    });

    client.on("message", (msg) => {
      try {
        if (!(msg instanceof JoinRoomMessage) && user === undefined) {
          // Prevent unregistered user actions
          console.log("Ignored unregistered user msg:", msg);
          return;
        }

        if (msg instanceof JoinRoomMessage) {
          if (user !== undefined) return; // ignore double-join
          if (this.users.some((u) => u.name === msg.payload.username)) {
            client.send(
              MessageRegistry.buildMessage(JoinRoomResponseMessage, {
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
            MessageRegistry.buildMessage(JoinRoomResponseMessage, {
              success: true,
              code: this.code,
            })
          );

          // Send missing segments
          client.send(
            MessageRegistry.buildMessage(AddLineSegmentMessage, {
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
              MessageRegistry.buildMessage(AddStickyMessage, { sticky })
            )
          );
        } else if (msg instanceof RequestLineSegmentMessage) {
          const uuid = this.whiteboard.addLineSegment(msg.payload.segment);
          client.send(
            MessageRegistry.buildMessage(AddLineSegmentMessage, {
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
              MessageRegistry.buildMessage(AddLineSegmentMessage, {
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
        } else if (msg instanceof CreateStickyNoteMessage) {
          const sticky = msg.payload.sticky;
          const newSticky = this.stickies.add(
            sticky.title,
            sticky.desc,
            sticky.x,
            sticky.y
          );

          client.send(
            MessageRegistry.buildMessage(ApproveStickyMessage, {
              clientId: sticky.id,
              serverId: newSticky.id,
            })
          );

          for (const user of this.users) {
            if (user.client === client) continue;

            user.client.send(
              MessageRegistry.buildMessage(AddStickyMessage, {
                sticky: newSticky,
              })
            );
          }
        } else if (msg instanceof EditStickyNoteMessage) {
          const sticky = msg.payload.sticky;
          const newSticky = this.stickies.get(sticky.id);
          if (!newSticky) return;

          newSticky.desc = sticky.desc;
          newSticky.title = sticky.title;
          newSticky.x = sticky.x;
          newSticky.y = sticky.y;

          for (const user of this.users) {
            user.client.send(
              MessageRegistry.buildMessage(EditStickyMessage, {
                sticky: newSticky,
              })
            );
          }
        } else if (msg instanceof RemoveStickyNoteMessage) {
          if (!this.stickies.has(msg.payload.serverId)) {
            return;
          }

          this.stickies.remove(msg.payload.serverId);
          for (const user of this.users) {
            user.client.send(
              MessageRegistry.buildMessage(CRemoveStickyNoteMessage, {
                serverId: msg.payload.serverId,
              })
            );
          }
        } else if (msg instanceof SUserMousePosMessage) {
          for (const otherUser of this.users) {
            if (otherUser.id === user?.id) continue;
            otherUser.client.send(
              MessageRegistry.buildMessage(CUserMousePosMessage, {
                userId: otherUser.id,
                username: otherUser.name,
                x: msg.payload.x,
                y: msg.payload.y,
              })
            );
          }
        }
        // else if (msg instanceof RemoveStickyNoteMessage) {
        // }

        console.log("Got message:", msg);
      } catch (err) {
        console.log("Error in socket handler:", err);
      }
    });
  }
}
