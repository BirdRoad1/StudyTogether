import express from "express";
import "./env/env.js";
import { env } from "./env/env.js";

const app = express();
if (env.NODE_ENV === "production") {
  app.use(express.static("web/"));
} else {
  app.use((req, res) => {
    res.status(404).send("Please visit the vite frontend while in development");
  });
}

app.listen(env.PORT, () => {
  console.log(`Listening on http://127.0.0.1:${env.PORT}`);
});
