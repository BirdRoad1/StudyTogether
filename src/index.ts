import express from "express";
import "./env/env.js";
import { env } from "./env/env.js";

const app = express();

app.listen(env.PORT, () => {
  console.log(`Listening on http://127.0.0.1:${env.PORT}`);
});
