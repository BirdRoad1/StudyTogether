import { EventEmitter } from "eventemitter3";
import { Message } from "./message.js";
import WebSocket from "isomorphic-ws";
import { MessageRegistry } from "./message-registry.js";

interface Events {
  message: (message: Message) => void;
  close: (code?: number) => void;
  open: () => void;
  error: (err: Error) => void;
}

export class WSClient extends EventEmitter<Events> {
  constructor(private ws: WebSocket) {
    super();
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data.toString());
        const msg = MessageRegistry.fromData(data);

        if (!msg) {
          console.log("Unknown message:", msg);
          return;
        }

        try {
          this.emit("message", msg);
        } catch (err) {
          console.log("Error while handling message:", err);
        }
      } catch (err) {
        console.log("Failed to parse message:", ev.toString(), err);
      }
    };

    ws.onclose = (code) => {
      this.emit('close', code.code)
    };
    ws.onerror = (ev) => this.emit("error", ev.error);
    ws.onopen = () => this.emit("open");
  }

  send(message: Message) {
    this.ws.send(JSON.stringify(message));
  }

  close(code?: number) {
    this.ws.close(code);
  }
}
