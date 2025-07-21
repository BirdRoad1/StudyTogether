import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../context/ClientContext.ts";
import { MessageRegistry } from "@shared/message-registry.ts";
import type { Message } from "@shared/message.ts";
import type { Mouse } from "@shared/model/mouse.ts";
import { CUserMousePosMessage } from "@shared/message/clientbound/user-mouse-pos-message.client.ts";
import { SUserMousePosMessage } from "@shared/message/serverbound/user-mouse-pos-message.server.ts";
import styles from "../css/mice.module.css";

export const MiceComponent = () => {
  const client = useContext(ClientContext);
  const [mice, setMice] = useState<Mouse[]>([]);

  useEffect(() => {
    const listener = (ev: MouseEvent) => {
      client?.socket?.send(
        MessageRegistry.buildMessage(SUserMousePosMessage, {
          x: ev.clientX,
          y: ev.clientY,
        })
      );
    };
    window.addEventListener("mousemove", listener);

    return () => {
      window.removeEventListener("mousemove", listener);
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;

    const msgHandler = (message: Message) => {
      if (message.isMessageOf(CUserMousePosMessage)) {
        setMice((mice) => {
          const mouse = mice.find((m) => m.userId === message.payload.userId);
          if (!mouse) {
            const newMouse: Mouse = { ...message.payload };
            return [...mice, newMouse];
          }

          const mouseCopy = { ...mouse, ...message.payload };

          return mice.map((old) =>
            old.userId === message.payload.userId ? mouseCopy : old
          );
        });
      }
    };

    const openHandler = () => {
      client.socket?.on("message", msgHandler);
    };

    client.on("open", openHandler);

    return () => {
      client?.removeListener("open", openHandler);
      client?.socket?.removeListener("message", msgHandler);
    };
  }, [client]);

  return (
    <div>
      {mice.map((mouse) => (
        <div
          key={mouse.userId}
          style={{
            left: mouse.x,
            top: mouse.y,
          }}
          className={styles.mouse}
        >
          <p className={styles.username}>{mouse.username}</p>
        </div>
      ))}
    </div>
  );
};
