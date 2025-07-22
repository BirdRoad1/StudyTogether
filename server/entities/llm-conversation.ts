import { LLMMessage, LLMMessageRole } from "@shared/model/llm-message.js";
import crypto from "crypto";

export class LLMConversation {
  private messages: LLMMessage[] = [];

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
    console.log(`LLM RES:`, JSON.stringify(json));
    const message = json.choices?.[0]?.message;
    if (!message) {
      throw new Error("No messages returned: " + json);
    }

    this.addMessage(message.content, "assistant");

    return message.content;
  }

  getMessages() {
    return this.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ ...m }));
  }
}
