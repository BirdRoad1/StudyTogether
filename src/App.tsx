import styles from "./css/app.module.css";

function App() {
  return (
    <div className={styles.content}>
      <h1>GroupStudy</h1>
      <div className={styles.btns}>
        <button>Create Room</button>
        <button>Join Room</button>
      </div>
    </div>
  );
}

export default App;
