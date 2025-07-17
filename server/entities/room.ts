import { WebSocket } from "ws";
import { User } from "./user.js";
import { MessageRegistry } from "../../shared/message-registry.js";
import EventEmitter from "eventemitter3";
import { JoinRoomMessage } from "../../shared/message/join-room-message.js";

interface RoomEvents {
  destroy: () => void;
}

export class Room extends EventEmitter<RoomEvents> {
  private users: User[] = [];
  private unregisteredClients: WebSocket[] = [];
  constructor(public readonly code: string) {
    super();
  }

  handleClient(ws: WebSocket) {
    this.unregisteredClients.push(ws);

    // let user: User | undefined;
    ws.on("message", (data, isBinary) => {
      try {
        if (isBinary) return;
        const json = JSON.parse(data.toString());
        const msg = MessageRegistry.fromData(json);
        if (!msg) {
          console.log("Unknown message:", msg);
          return;
        }

        if (msg instanceof JoinRoomMessage) {
          this.users.push(
            (user = {
              name: msg.username,
              ws,
            })
          );

          this.unregisteredClients = this.unregisteredClients.filter(
            (c) => c !== ws
          );
        }

        console.log(msg);
      } catch (err) {
        console.log("Error in socket handler:", err);
      }
    });

    ws.on("close", () => {
      this.users = this.users.filter((u) => u.ws !== ws);
      this.unregisteredClients = this.unregisteredClients.filter(
        (c) => c !== ws
      );

      if (this.users.length === 0 && this.unregisteredClients.length === 0) {
        this.emit("destroy");
      }
    });
  }
}
