import express from "express";
import { roomRouter } from "./room.route.js";

export const apiRouter = express.Router();

apiRouter.use("/room", roomRouter);
