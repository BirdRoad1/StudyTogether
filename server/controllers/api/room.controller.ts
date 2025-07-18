import { RoomManager } from "../../services/RoomManager.js";
import type { WSRequestHandler } from "websocket-express";
import { WSClient } from "@shared/ws-client.js";
import { MessageRegistry } from "@shared/message-registry.js";
import { KickMessage } from "@shared/message/clientbound/kick-message.js";

export const wsCreateRoom: WSRequestHandler = async (req, res) => {
  const ws = await res.accept();
  const room = RoomManager.createRoom();

  room.handleClient(new WSClient(ws));
  room.on("destroy", () => {
    RoomManager.removeRoom(room);
  });
};

export const wsJoinRoom: WSRequestHandler = async (req, res) => {
  const ws = await res.accept();
  const client = new WSClient(ws);

  if (!("code" in req.query) || typeof req.query.code !== "string") {
    client.send(
      MessageRegistry.buildMessage(KickMessage, {
        reason: "Room code missing",
      })
    );

    console.log("Room code missing");
    client.close();
    return;
  }

  const room = RoomManager.getRoomByCode(req.query.code);
  if (!room) {
    client.send(
      MessageRegistry.buildMessage(KickMessage, {
        reason: "Room not found",
      })
    );
    
    console.log("Room not found");
    client.close();
    return;
  }

  room.handleClient(client);
};
