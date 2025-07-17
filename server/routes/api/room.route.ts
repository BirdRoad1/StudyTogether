import { Router } from "websocket-express";
import { wsCreateRoom } from "../../controllers/api/room.controller.js";

const roomRouter = new Router();
roomRouter.ws("/create", wsCreateRoom);

export { roomRouter };
