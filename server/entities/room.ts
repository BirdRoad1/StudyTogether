import type { ServerUser } from "./server-user.js";
import EventEmitter from "eventemitter3";
import { WSClient } from "@shared/ws-client.js";
import { MessageRegistry } from "@shared/message-registry.js";
import { Whiteboard } from "./whiteboard.js";
import { Stickies } from "./stickies.js";
import { LLMConversation } from "server/entities/llm-conversation.js";
import { CUsersListMessage } from "@shared/message/clientbound/users-list-message.client.js";
import { ClientVisitor } from "server/entities/client-visitor.js";
import { IRoom } from "server/interface/IRoom.js";
import { CKickMessage } from "@shared/message/clientbound/kick-message.client.js";

interface RoomEvents {
  destroy: () => void;
}

export class Room extends EventEmitter<RoomEvents> implements IRoom {
  public users: ServerUser[] = [];
  public unregisteredClients: WSClient[] = [];
  public destroyTimeout?: NodeJS.Timeout;
  public whiteboard = new Whiteboard();
  public stickies = new Stickies();
  public sharedConversation = new LLMConversation();
  public convoMap = new Map<ServerUser, LLMConversation>();
  public sharedNotes = "";
  public notesMap = new Map<ServerUser, string>();

  constructor(public readonly code: string) {
    super();
    this.sharedConversation.addMessage(this.getSystemPrompt(), "system");
  }

  getSystemPrompt() {
    return `You are Llama, a useful assistant who helps people study together!
    You are an assistant on the website GroupStudy by Jose. The website URL is https://groupstudy.jlmsz.com.
    The URL to this chat is https://groupstudy.jlmsz.com/room/${this.code}.
    The repo is https://github.com/BirdRoad1/StudyTogether.
    
    This is a group chat, there may be multiple users from a study group.
    All messages are prefixed with the username of the person who sent it.
    Llama will never prefix their messages, and will continue to act as an AI chatbot only.
    Treat each user as a separate human being. Do not use markdown.
    You are allowed and encouraged to structure your response using line breaks and symbols.
    
    # Tools
    You have been given access to some tools to better equip you to help students. Only use these tools when explicitly told to.
    When telling the student what tools you have access to, you can give them summaries but do not repeat function names verbatim.
    When asked to use a tool, respond with a JSON array of tool requests in the following format:
    [{"name": "Tool Name","args": ["Arg1", "Arg2", "Arg3"]}]
    It is a JSON payload surrounded with the character "".
    Arguments are always represented as JSON strings, regardless of type.
    You can omit args when not needed.
    It is recommended that you also include a description of what you're doing when accessing a tool for the user.
    A tool's output is a JSON payload formatted like this [{name: string, response: string | null}]. null is a valid response
    so ensure that you handle it correctly such as by telling the user there's no data available.
    Make sure to parse the result correctly and do not hallucinate a fake response.
    
    After a tool request, the system will reply to you with the tool's output in JSON.
    
    Available tools:
    - getNotes(): Get the text content of the user's notes of the active session
    - createStickyNote(title: string, desc: string): Creates a sticky note
    - kickUser(name: string, reason: string): Removes a user from the session. You may kick a user who is too disruptive or vulgar, but make sure to warn them first and be patient.
    
    Example request:
    [{"name": "getNotes"}]
    Example response:
    [{"name": "getNotes", "response": "These are the notes!"}]
    Example response:
    [{"name": "getNotes", "response": null}] // In this case, the user has no notes available which is OK`;
  }

  kickUser(user: ServerUser, reason: string) {
    user.client.send(
      MessageRegistry.buildMessage(CKickMessage, {
        reason,
      })
    );
    user.client.close();
  }

  handleClient(client: WSClient) {
    this.unregisteredClients.push(client);
    const visitor = new ClientVisitor(this, client);

    client.on("close", () => {
      this.users = this.users.filter((u) => u.client !== client);
      this.unregisteredClients = this.unregisteredClients.filter(
        (c) => c !== client
      );

      // Broadcast users list
      for (const user of this.users) {
        user.client.send(
          MessageRegistry.buildMessage(CUsersListMessage, {
            users: this.users.map(({ id, name }) => ({ id, name })),
          })
        );
      }

      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = setTimeout(() => {
        if (this.users.length === 0 && this.unregisteredClients.length === 0) {
          this.emit("destroy");
        }
      }, 24 * 60 * 60);
    });

    client.on("message", (msg) => {
      msg.accept(visitor);
    });
  }
}
