import { WSClient } from "@shared/ws-client.js";
import { LLMConversation } from "server/entities/llm-conversation.js";
import { ServerUser } from "server/entities/server-user.js";
import { Stickies } from "server/entities/stickies.js";
import { Whiteboard } from "server/entities/whiteboard.js";

export interface IRoom {
    // --- Properties
    users: ServerUser[];
    unregisteredClients: WSClient[];
    destroyTimeout?: NodeJS.Timeout;
    whiteboard: Whiteboard;
    stickies: Stickies;
    sharedConversation: LLMConversation;
    convoMap: Map<ServerUser, LLMConversation>;
    sharedNotes: string;
    notesMap: Map<ServerUser, string>;
    readonly code: string;
  
    handleClient(
      client: WSClient
    ): void;
  }