import { useEffect, useState, type ChangeEvent } from "react";
import styles from "../css/notepad.module.css";
import { MessageRegistry } from "@shared/message-registry.ts";
import { SEditNotesMessage } from "@shared/message/serverbound/edit-notes-message.server.ts";
import type { Message } from "@shared/message.ts";
import { CEditNotesMessage } from "@shared/message/clientbound/edit-notes-message.client.ts";
import { client } from "../ws/client.tsx";

export const Notepad = () => {

  const [isShared, setIsShared] = useState(true);
  const [personalContent, setPersonalContent] = useState("");
  const [sharedContent, setSharedContent] = useState("");

  const content = isShared ? sharedContent : personalContent;
  const setContent = isShared ? setSharedContent : setPersonalContent;

  const onChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = ev.target.value;
    setContent(newContent);
    client?.socket?.send(
      MessageRegistry.buildMessage(SEditNotesMessage, {
        type: isShared ? "shared" : "personal",
        content: newContent,
      })
    );
  };

  useEffect(() => {
    const msgListener = (msg: Message) => {
      if (msg.isMessageOf(CEditNotesMessage)) {
        if (msg.payload.type === "shared") {
          setSharedContent(msg.payload.content);
        } else {
          setContent(msg.payload.content);
        }
      }
    };

    const openListener = () => {
      client?.socket?.on("message", msgListener);
    };
    
    client?.on("open", openListener);
    return () => {
      client?.removeListener("open", openListener);
      client?.socket?.removeListener("message", msgListener);
    };
  }, [setContent]);

  return (
    <div className={styles.notepadContainer}>
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
      <textarea
        className={styles.notepad}
        placeholder="Enter your notes here..."
        onChange={onChange}
        onKeyDown={(ev) => {
          if (ev.code === "Tab") {
            ev.preventDefault();
            setContent((old) => old + "    ");
          }
        }}
        value={content}
      ></textarea>
    </div>
  );
};
