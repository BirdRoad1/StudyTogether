import { useEffect, useState } from "react";
import { MessageRegistry } from "@shared/message-registry.ts";
import type { Message } from "@shared/message.ts";
import type { Mouse } from "@shared/model/mouse.ts";
import { CUserMousePosMessage } from "@shared/message/clientbound/user-mouse-pos-message.client.ts";
import { SUserMousePosMessage } from "@shared/message/serverbound/user-mouse-pos-message.server.ts";
import styles from "../css/mice.module.css";
import { client } from "../ws/client.tsx";
import type { User } from "@shared/model/user.ts";

type Props = {
  users: User[];
  visible: boolean;
};

export const MiceComponent = ({ users, visible }: Props) => {
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
  });

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

          // Create mouse copy with new data
          const mouseCopy = { ...mouse, ...message.payload };

          // Replace old mouse with new mouse
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
  }, []);

  useEffect(() => {
    setMice((old) => {
      console.log(
        "pre- mice:",
        old,
        users,
        old.filter((mouse) => users.some((u) => u.id === mouse.userId))
      );
      return old.filter((mouse) => users.some((u) => u.id === mouse.userId));
    });
  }, [users]);

  return (
    <div
      className={styles.overlay}
      style={{ visibility: visible ? "visible" : "hidden" }}
    >
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
