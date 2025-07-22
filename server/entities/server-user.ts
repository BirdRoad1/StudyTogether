import { User } from "@shared/model/user.js";
import { WSClient } from "@shared/ws-client.js";

export type ServerUser = User & {
  client: WSClient;
};
