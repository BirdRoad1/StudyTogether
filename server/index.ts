import { WebSocketExpress } from "websocket-express";
import "./env/env.js";
import { env } from "./env/env.js";
import express from 'express';
import { apiRouter } from "./routes/api/index.route.js";

const app = new WebSocketExpress();
console.log("expressws setup!");

// Ensure api router is loaded after expressWs setup
app.use("/api", apiRouter);

if (env.NODE_ENV === "production") {
  app.use(express.static("web/"));
} else {
  app.use((_, res) => {
    res.status(404).send("Please visit the vite frontend while in development");
  });
}


app.listen(env.PORT, () => {
  console.log(`Listening on http://127.0.0.1:${env.PORT}`);
});
