import { WebSocketExpress } from "websocket-express";
import "./env/env.js";
import { env } from "./env/env.js";
import express from 'express';

const app = new WebSocketExpress();
console.log("expressws setup!");

if (env.NODE_ENV === "production") {
  app.use(express.static("web/"));
} else {
  app.use((req, res) => {
    res.status(404).send("Please visit the vite frontend while in development");
  });
}

// Ensure api router is loaded after expressWs setup
const { apiRouter } = await import("./routes/api/index.route.js");
app.use("/api", apiRouter);

app.listen(env.PORT, () => {
  console.log(`Listening on http://127.0.0.1:${env.PORT}`);
});
