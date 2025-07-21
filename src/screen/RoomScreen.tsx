import { useParams, useSearchParams } from "react-router";
import styles from "../css/room.module.css";
import { Whiteboard } from "../component/whiteboard-component.tsx";
import {  useEffect, useState } from "react";
import { StickyBoard } from "../component/sticky-board-component.tsx";
import { MiceComponent } from "../component/mice-component.tsx";
import { LLMChat } from "../component/llm-chat-component.tsx";
import { Notepad } from "../component/notepad.tsx";
import { client } from "../ws/client.tsx";

export const RoomScreen = () => {
  const { roomCode } = useParams() as { roomCode: string };
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
  }, [roomCode, search]);

  useEffect(() => {
    const kickListener = (reason: string) => {
      alert("Kicked: " + reason);
      location.href = "/";
    };
    
    client?.on("kick", kickListener);

    return () => {
      client?.removeListener("kick", kickListener);
    };
  }, []);

  useEffect(() => {
    const unloadEvent = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
    };

    window.addEventListener("beforeunload", unloadEvent);

    return () => {
      window.removeEventListener("beforeunload", unloadEvent);
    };
  }, []);

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
        <Notepad />
        <MiceComponent />
        <LLMChat />
      </div>
    </div>
  );
};
