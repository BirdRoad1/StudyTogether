import { RoomManager } from "../../services/RoomManager.js";
import { WSRequestHandler } from "websocket-express";

export const wsCreateRoom: WSRequestHandler = async (req, res) => {
  const ws = await res.accept();
  const room = RoomManager.createRoom();

  room.handleClient(ws);
  room.on("destroy", () => {
    RoomManager.removeRoom(room);
  });
};
