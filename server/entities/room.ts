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
interface RoomEvents {
  destroy: () => void;
}

export class Room extends EventEmitter<RoomEvents> {
  private users: User[] = [];
  private unregisteredClients: WSClient[] = [];
  private destroyTimeout?: NodeJS.Timeout;
  private whiteboard = new Whiteboard();

  constructor(public readonly code: string) {
    super();
  }

  handleClient(client: WSClient) {
    console.log("b4");
    this.unregisteredClients.push(client);
    let user: User | undefined;
    // console.log(client);
    client.on("close", () => {
      console.log("CLOSE EMITTED");
      this.users = this.users.filter((u) => u.client !== client);
      this.unregisteredClients = this.unregisteredClients.filter(
        (c) => c !== client
      );

      console.log("new users:", this.users);

      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = setTimeout(() => {
        if (this.users.length === 0 && this.unregisteredClients.length === 0) {
          this.emit("destroy");
        }
      }, 30000);
    });

    client.on("message", (msg) => {
      try {
        if (msg instanceof JoinRoomMessage) {
          if (user !== undefined) return; // ignore double-join
          if (this.users.some((u) => u.name === msg.payload.username)) {
            client.send(
              MessageRegistry.buildMessage(JoinRoomResponseMessage, {
                success: false,
                error: "The username is already taken!",
              })
            );
            console.log(this.users);
            return;
          }

          this.users.push(
            (user = {
              name: msg.payload.username,
              client: client,
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
        }

        console.log("Got message:", msg);
      } catch (err) {
        console.log("Error in socket handler:", err);
      }
    });
  }
}
