import { Router } from "websocket-express";
import { wsCreateRoom,wsJoinRoom } from "../../controllers/api/room.controller.js";

export const roomRouter = new Router();
roomRouter.ws("/create", wsCreateRoom);
roomRouter.ws("/join", wsJoinRoom);