export type LLMMessageRole = "assistant" | "user" | "system";
export type LLMMessageType = "shared" | "personal";

export interface LLMMessage {
  id: string;
  role: LLMMessageRole;
  message: string;
  type?: "shared" | "personal";
}
