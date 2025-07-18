import { WSClient } from "@shared/ws-client.ts";
import { JoinRoomMessage } from "@shared/message/serverbound/join-room-message.js";
import WebSocket from "isomorphic-ws";
import { JoinRoomResponseMessage } from "@shared/message/clientbound/join-room-response-message.ts";
import { MessageRegistry } from "@shared/message-registry.js";
import EventEmitter from "eventemitter3";
import { KickMessage } from "@shared/message/clientbound/kick-message.js";
import type { Message } from "@shared/message.ts";

type Events = {
  join: (code: string) => void;
};

export class Client extends EventEmitter<Events> {
  public socket: WSClient | undefined;
  redirectTimeout: ReturnType<typeof setTimeout> | undefined;
  getBackendUrl() {
    return import.meta.env.PROD
      ? ""
      : `http://localhost:${
          (window as unknown as Record<string, unknown>).BACKEND_PORT
        }`;
  }

  onClose() {
    this.socket = undefined;
    this.redirectTimeout = setTimeout(() => {
      // location.href = "/";
    }, 1000);
  }

  onKick(reason: string) {
    this.close();
    alert("Kicked: " + reason);
  }

  handleMessage(message: Message) {
    if (message instanceof JoinRoomResponseMessage) {
      if (!message.payload.success) {
        alert(message.payload.error);
        return;
      }

      // Joined room
      this.emit("join", message.payload.code);
    } else if (message instanceof KickMessage) {
      this.onKick(message.payload.reason);
    }
  }

  createRoom() {
    this.close();

    const url = `${this.getBackendUrl()}/api/room/create`;

    this.socket = new WSClient(new WebSocket(url));
    this.socket.on("message", this.handleMessage.bind(this));
    this.socket.on("open", () => {
      this.socket?.send(
        MessageRegistry.buildMessage(JoinRoomMessage, {
          username: prompt("Enter a username") ?? 'Bob',
        })
      );
    });

    this.socket.on("error", () => {
      console.log("Connection failed");
    });

    this.socket.on("close", this.onClose);
  }

  joinRoom(code: string) {
    this.close();

    const url = `${this.getBackendUrl()}/api/room/join?code=${code}`;

    this.socket = new WSClient(new WebSocket(url));
    this.socket.on("message", this.handleMessage.bind(this));

    this.socket.on("open", () => {
      this.socket?.send(
        MessageRegistry.buildMessage(JoinRoomMessage, { username: prompt("Enter a username") ?? 'Bob' })
      );
    });

    this.socket.on("error", () => {
      console.log("Connection failed");
    });

    this.socket.on("close", this.onClose);
  }

  isConnected() {
    return this.socket !== undefined;
  }

  close(code?: number) {
    this.socket?.close(code);
    this.socket = undefined;
  }
}
