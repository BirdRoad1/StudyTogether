import { useContext, useEffect } from "react";
import styles from "./css/app.module.css";
import { ClientContext } from "./context/ClientContext.ts";

function App() {
  const client = useContext(ClientContext);

  useEffect(() => {
    console.log(client, client?.socket);
    client?.on("join", (code) => {
      location.href = "/room/" + code;
    });
  }, [client]);

  function createRoomClicked() {
    client?.createRoom();
  }

  return (
    <div className={styles.content}>
      <h1>GroupStudy</h1>
      <div className={styles.btns}>
        <button onClick={() => createRoomClicked()}>Create Room</button>
        <button
          onClick={() => {
            const code = prompt("Enter room code");
            if (!code || code.length !== 6) {
              alert('Invalid code!');
              return;
            }
            location.href = "/room/" + code;
          }}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

export default App;
