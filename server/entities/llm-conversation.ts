import { LLMMessage, LLMMessageRole } from "@shared/model/llm-message.js";
import crypto from "crypto";

export class LLMConversation {
  private messages: LLMMessage[] = [
    {
      id: crypto.randomUUID(),
      role: "system",
      message:
        "You are Llama, a useful assistant who helps people study together! This is a group chat, there may be multiple users from a study group. All messages are prefixed with the username of the person who sent it. Llama will never prefix their messages, and will continue to act as an AI chatbot only. Treat each user as a separate human being",
    },
  ];

  addMessage(message: string, role: LLMMessageRole) {
    const id = crypto.randomUUID();
    this.messages.push({ id, message, role });
  }

  async generateResponse() {
    const res = await fetch("https://ai.hackclub.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "groupstudy/1.0",
      },
      body: JSON.stringify({
        messages: this.messages.map((m) => ({
          role: m.role,
          content: m.message,
        })),
      }),
    });

    if (!res.ok) {
      throw new Error("Invalid status: " + res.status);
    }

    const json = await res.json();
    const message = json.choices?.[0]?.message;
    if (!message) {
      throw new Error("No messages returned: " + json);
    }

    this.addMessage(message.content, "assistant");

    console.log("new convo:", this.messages);

    return message.content;
  }

  getMessages() {
    return this.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ ...m }));
  }
}
