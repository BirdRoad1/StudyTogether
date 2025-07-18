import { useParams, useSearchParams } from "react-router";
import styles from "../css/room.module.css";
import { Whiteboard } from "../component/whiteboard-component.tsx";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../context/ClientContext.ts";
// import { MessageRegistry } from "@shared/message-registry.ts";
// import { CreateStickyNoteMessage } from "@shared/message/serverbound/create-sticky-note-message.ts";
// import { StickyNoteComponent } from "../component/sticky-note-component.tsx";
// import { EditStickyNoteMessage } from "@shared/message/serverbound/edit-sticky-note-message.ts";
import { StickyBoard } from "../component/sticky-board-component.tsx";
import { MiceComponent } from "../component/mice-component.tsx";

export const RoomScreen = () => {
  const { roomCode } = useParams() as { roomCode: string };
  const client = useContext(ClientContext);
  const [createStickySignal, setCreateStickySignal] = useState(0);
  const [search] = useSearchParams();

  useEffect(() => {
    if (!client?.isConnected()) {
      let username = search.get("username");
      if (username !== null) {
        client?.joinRoom(username, roomCode);
      } else {
        do {
          username = prompt("Enter a username");
        } while (!username);
        client?.joinRoom(username, roomCode);
      }
    }
  }, [client, roomCode, search]);

  return (
    <div className={styles.room}>
      <div className={styles.header}>
        <p>Room code: {roomCode}</p>
      </div>
      <div className={styles.buttons}>
        <button
          onClick={() => {
            setCreateStickySignal((old) => old + 1);
          }}
        >
          Create sticky note
        </button>
      </div>
      <div className={styles.horizontal}>
        <Whiteboard />
        <StickyBoard createStickySignal={createStickySignal} />
        <MiceComponent />
      </div>
    </div>
  );
};
