import { useParams, useSearchParams } from "react-router";
import styles from "../css/room.module.css";
import { Whiteboard } from "../component/whiteboard-component.tsx";
import { useEffect, useState } from "react";
import { StickyBoard } from "../component/sticky-board-component.tsx";
import { MiceComponent } from "../component/mice-component.tsx";
import { LLMChat } from "../component/llm-chat-component.tsx";
import { Notepad } from "../component/notepad.tsx";
import { client } from "../ws/client.tsx";
import type { Message } from "@shared/message.ts";
import { CUsersListMessage } from "@shared/message/clientbound/users-list-message.client.ts";
import type { User } from "@shared/model/user.ts";

export const RoomScreen = () => {
  const { roomCode } = useParams() as { roomCode: string };
  const [createStickySignal, setCreateStickySignal] = useState(0);
  const [search] = useSearchParams();
  const [lastCopied, setLastCopied] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showToolResponses, setShowToolResponses] = useState(false);
  const [showCursors, setShowCursors] = useState(false);

  useEffect(() => {
    const msgListener = (message: Message) => {
      if (message.isMessageOf(CUsersListMessage)) {
        setUsers(message.payload.users);
      }
    };
    const openListener = () => {
      client.socket?.on("message", msgListener);
    };
    client.on("open", openListener);

    return () => {
      client.removeListener("open", openListener);
      client.socket?.removeListener("message", msgListener);
    };
  }, []);

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
        <p>Code:</p>
        <span
          className={styles.code}
          onClick={() => {
            navigator.clipboard.writeText(roomCode);
            setLastCopied(true);
            setTimeout(() => {
              setLastCopied(false);
            }, 500);
          }}
        >
          {lastCopied ? "Copied!" : roomCode}
        </span>
      </div>
      <div className={styles.buttons}>
        <button
          className={styles.stickyNoteBtn}
          onClick={() => {
            setCreateStickySignal((old) => old + 1);
          }}
        >
          Create sticky note
        </button>

        <div className={styles.showCursors}>
          <input
            type="checkbox"
            name="check"
            checked={showCursors}
            onChange={(ev) => setShowCursors(ev.target.checked)}
          />
          <label htmlFor="check">Show Cursors</label>
        </div>
        <div className={styles.showCursors}>
          <input
            type="checkbox"
            name="check"
            onChange={(ev) => setShowToolResponses(ev.target.checked)}
            checked={showToolResponses}
          />
          <label htmlFor="check">Show tool responses</label>
        </div>
        <p
          className={styles.usersCount}
          title={users.map((u) => u.name).join("\n")}
        >
          {users.length} Users
        </p>
      </div>
      <div className={styles.horizontal}>
        <Whiteboard />
        <StickyBoard createStickySignal={createStickySignal} />
        <Notepad />
        <MiceComponent users={users} visible={showCursors}/>

        <LLMChat showToolResponses={showToolResponses} />
      </div>
    </div>
  );
};
