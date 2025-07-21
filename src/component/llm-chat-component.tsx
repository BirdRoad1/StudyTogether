import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../css/llm-chat.module.css";
import { MessageRegistry } from "@shared/message-registry.ts";
import { SSendLLMMessage } from "@shared/message/serverbound/send-llm-message.server.ts";
import type { LLMMessage } from "@shared/model/llm-message.ts";
import { CLLMChatCompleteMessage } from "@shared/message/clientbound/llm-chat-complete-message.client.ts";
import { client } from "../ws/client.tsx";

export const LLMChat = () => {

  const [isShared, setIsShared] = useState(true);
  const [sharedMessages, setSharedMessages] = useState<LLMMessage[]>([]);
  const [personalMessages, setPersonalMessages] = useState<LLMMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesDivRef = useRef<HTMLDivElement>(null);

  const onBtnClick = useCallback(() => {
    if (!inputText) return;
    const type = isShared ? "shared" : "personal";

    setInputText("");
    client?.socket?.send(
      MessageRegistry.buildMessage(SSendLLMMessage, {
        message: inputText,
        type,
      })
    );
  }, [inputText, isShared]);

  useEffect(() => {
    if (isShared) {
      messagesDivRef.current?.scroll({
        top: messagesDivRef.current?.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [sharedMessages, isShared]);
  
  useEffect(() => {
    if (!isShared) {
      messagesDivRef.current?.scroll({
        top: messagesDivRef.current?.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [personalMessages, isShared]);

  useEffect(() => {
    const openListener = () => {
      client?.socket?.on("message", (msg) => {
        console.log(msg);
        if (msg.isMessageOf(CLLMChatCompleteMessage)) {
          if (msg.payload.type === "shared") {
            setSharedMessages(msg.payload.messages);
          } else {
            setPersonalMessages(msg.payload.messages);
          }
        }
      });
    };

    client?.on("open", openListener);

    return () => {
      client?.removeListener("open", openListener);
    };
  }, [isShared]);

  useEffect(() => {
    console.log(isShared);
  }, [isShared]);

  return (
    <div className={styles.chat}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${isShared ? styles.selected : ""}`}
          onClick={() => setIsShared(true)}
        >
          Shared
        </button>
        <button
          className={`${styles.tab} ${!isShared ? styles.selected : ""}`}
          onClick={() => setIsShared(false)}
        >
          Personal
        </button>
      </div>
      {(isShared ? sharedMessages : personalMessages).length === 0 && (
        <p className={styles.title}>LLM Chat</p>
      )}
      <div className={styles.messages} ref={messagesDivRef}>
        {(isShared ? sharedMessages : personalMessages).map((m) => {
          return (
            <div className={styles.message} key={m.id}>
              <p className={styles.author}>
                {m.role === "assistant"
                  ? "LLM"
                  : m.type === "personal"
                  ? "You"
                  : m.message.split(": ").shift()}
              </p>
              <p>
                {m.role === "user" && m.type === "shared"
                  ? m.message.split(": ").splice(1)
                  : m.message}
              </p>
            </div>
          );
        })}
      </div>
      <div className={styles.sendBar}>
        <input
          type="text"
          className={styles.input}
          value={inputText}
          onChange={(ev) => setInputText(ev.target.value)}
        />
        <button className={styles.sendBtn} onClick={onBtnClick}>
          Send
        </button>
      </div>
    </div>
  );
};
