import { useEffect, useState } from "react";
import styles from "./css/app.module.css";
import { client } from "./ws/client.tsx";

function App() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const handler = (code: string) => {
      location.href = "/room/" + code + "?username=" + username;
    };
    client?.on("join", handler);
    return () => {
      client?.removeListener("join", handler);
    };
  }, [username]);

  function createRoomClicked() {
    client?.createRoom(username);
  }

  return (
    <div className={styles.content}>
      <h1>GroupStudy</h1>
      <p className={styles.tagLine}>A collaborative, all-in-one study space</p>
      <input
        type="text"
        className={styles.username}
        placeholder="Enter a username"
        onChange={(ev) => {
          setUsername(ev.target.value);
        }}
      />
      <div className={styles.btns}>
        <button onClick={() => createRoomClicked()} className={styles.createBtn}>Create Room</button>
        <button
          onClick={() => {
            const code = prompt("Enter room code");
            if (!code || code.length !== 6) {
              alert("Invalid code!");
              return;
            }
            location.href = "/room/" + code + "?username=" + username;
          }}
          className={styles.joinBtn}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

export default App;
