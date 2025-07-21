import { WSClient } from "@shared/ws-client.ts";
import { SJoinRoomMessage } from "@shared/message/serverbound/join-room-message.server.js";
import WebSocket from "isomorphic-ws";
import { CJoinRoomResponseMessage } from "@shared/message/clientbound/join-room-response-message.client";
import { MessageRegistry } from "@shared/message-registry.js";
import EventEmitter from "eventemitter3";
import { CKickMessage } from "@shared/message/clientbound/kick-message.client.js";
import type { Message } from "@shared/message.ts";

type Events = {
  open: () => void;
  join: (code: string) => void;
  kick: (reason: string) => void;
  close: () => void;
};

export class Client extends EventEmitter<Events> {
  public socket: WSClient | undefined;
  redirectTimeout: ReturnType<typeof setTimeout> | undefined;
  getBackendUrl() {
    return import.meta.env.PROD
      ? ""
      : `http://${location.hostname}:${
          (window as unknown as Record<string, unknown>).BACKEND_PORT
        }`;
  }

  onClose() {
    this.socket = undefined;
  }

  onKick(reason: string) {
    this.close();
    this.emit("kick", reason);
  }

  handleMessage(message: Message) {
    console.log(message, message.isMessageOf(CJoinRoomResponseMessage));
    if (message.isMessageOf(CJoinRoomResponseMessage)) {
      if (!message.payload.success) {
        alert(message.payload.error);
        return;
      }

      // Joined room
      this.emit("join", message.payload.code);
    } else if (message.isMessageOf(CKickMessage)) {
      this.onKick(message.payload.reason);
    }
  }

  createRoom(username: string) {
    this.close();

    const url = `${this.getBackendUrl()}/api/room/create`;

    this.socket = new WSClient(new WebSocket(url));
    this.socket.on("message", this.handleMessage.bind(this));
    this.socket.on("open", () => {
      this.emit("open");
      this.socket?.send(
        MessageRegistry.buildMessage(SJoinRoomMessage, {
          username,
        })
      );
    });

    this.socket.on("error", () => {
      console.log("Connection failed");
    });

    this.socket.on("close", this.onClose);
  }

  joinRoom(username: string, code: string) {
    this.close();

    const url = `${this.getBackendUrl()}/api/room/join?code=${code}`;

    this.socket = new WSClient(new WebSocket(url));
    this.socket.on("message", this.handleMessage.bind(this));

    this.socket.on("open", () => {
      this.emit("open");
      this.socket?.send(
        MessageRegistry.buildMessage(SJoinRoomMessage, {
          username,
        })
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

export const client = new Client();
