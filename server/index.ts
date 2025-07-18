import { WebSocketExpress } from "websocket-express";
import "./env/env.js";
import { env } from "./env/env.js";
import express from "express";
import { apiRouter } from "./routes/api/index.route.js";
import path from "path";

const app = new WebSocketExpress();

// Ensure api router is loaded after expressWs setup
app.use("/api", apiRouter);

const indexFile = path.join(import.meta.dirname, "../web/", "index.html");

if (env.NODE_ENV === "production") {
  app.use(express.static("web/"));
  app.use((req, res, next) => {
    res.sendFile(indexFile);
  });
} else {
  app.use((_, res) => {
    res.status(404).send("Please visit the vite frontend while in development");
  });
}

app.listen(env.PORT, () => {
  console.log(`Listening on http://127.0.0.1:${env.PORT}`);
});
