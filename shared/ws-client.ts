import { Message } from "./message.ts";

export class WSClient {
  constructor(private ws: WebSocket) {}
  send(message: Message) {
    this.ws.send(JSON.stringify(message));
  }
}
