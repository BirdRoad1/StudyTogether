import { Router } from "websocket-express";
import { roomRouter } from "./room.route.js";

export const apiRouter = new Router();

apiRouter.use("/room", roomRouter);
