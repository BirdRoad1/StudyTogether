import { useParams } from "react-router";
import styles from "../css/room.module.css";
import { Whiteboard } from "../component/whiteboard-component.tsx";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../context/ClientContext.ts";
import { StickyBoard } from "../component/sticky-board-component.tsx";
import type { StickyNote } from "@shared/model/sticky-note.ts";
import { AddStickyMessage } from "@shared/message/clientbound/add-sticky-message.ts";
import { ApproveStickyMessage } from "@shared/message/clientbound/approve-sticky-message.ts";
import { EditStickyMessage } from "@shared/message/clientbound/edit-sticky-message.ts";
import { MessageRegistry } from "@shared/message-registry.ts";
import { CreateStickyNoteMessage } from "@shared/message/serverbound/create-sticky-note-message.ts";

export const RoomScreen = () => {
  const { roomCode } = useParams() as { roomCode: string };
  const client = useContext(ClientContext);
  const [stickies, setStickies] = useState<StickyNote[]>([]);

  useEffect(() => {
    if (!client?.isConnected()) {
      client?.joinRoom(roomCode);
    }
  }, [client, roomCode]);

  useEffect(() => {
    if (!client) return;

    client.socket?.on("message", (message) => {
      if (message instanceof AddStickyMessage) {
        setStickies([...stickies, message.payload.sticky]);
      } else if (message instanceof ApproveStickyMessage) {
        const sticky = stickies.find((s) => message.payload.clientId === s.id);
        if (!sticky) return;
        const copy = { ...sticky };
        copy.id = message.payload.serverId;
        setStickies([...stickies, copy]);
      } else if (message instanceof EditStickyMessage) {
        const sticky = stickies.find((s) => s.id === message.payload.sticky.id);
        if (!sticky) return;

        const copy = { ...sticky };

        const others = stickies.filter((s) => s !== sticky);

        const edit = message.payload.sticky;

        if (edit.desc !== undefined) {
          copy.desc = edit.desc;
        }

        if (edit.title !== undefined) {
          copy.title = edit.title;
        }

        if (edit.x !== undefined) {
          copy.x = edit.x;
        }

        if (edit.y !== undefined) {
          copy.y = edit.y;
        }

        setStickies([...others, { ...copy }]);
      }
    });
  }, [client, setStickies, stickies]);

  return (
    <div className={styles.room}>
      <div className={styles.header}>
        <p>Room code: {roomCode}</p>
      </div>
      <div className={styles.buttons}>
        <button
          onClick={() => {
            const sticky = {
              x: 50,
              y: 50,
              title: "Hello",
              desc: "Hello, world",
              id: crypto.randomUUID(),
            };
            setStickies((old) => [...old, sticky]);

            client?.socket?.send(
              MessageRegistry.buildMessage(CreateStickyNoteMessage, {
                sticky,
              })
            );
          }}
        >
          Create sticky note
        </button>
      </div>
      <div className={styles.horizontal}>
        <Whiteboard />
        <StickyBoard stickies={stickies} />
      </div>
    </div>
  );
};
