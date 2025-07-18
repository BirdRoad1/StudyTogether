import { useEffect, useRef, useState } from "react";
import styles from "../css/stickynote.module.css";
import type { StickyNote } from "@shared/model/sticky-note.ts";

type Props = {
  sticky: StickyNote;
  onChange?: (title: string, desc: string, x: number, y: number) => void;
};

export const StickyNoteComponent = ({ sticky, onChange }: Props) => {
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [stickyX, setStickyX] = useState(sticky.x);
  const [stickyY, setStickyY] = useState(sticky.y);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(sticky.title);
  const [desc, setDesc] = useState(sticky.desc);

  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const x = ev.clientX;
      const y = ev.clientY;
      setMouseX(x);
      setMouseY(y);

      const offsetX = mouseX - stickyX;
      const offsetY = mouseY - stickyY;

      if (mouseDown) {
        setStickyX(x - (offsetX ?? 0));
        setStickyY(y - (offsetY ?? 0));
        onChange?.(title, desc, x, y);
      }
    };

    document.addEventListener("mousemove", handler);
    return () => {
      document.removeEventListener("mousemove", handler);
    };
  }, [mouseDown, mouseX, mouseY, stickyX, stickyY, desc, onChange, title]);

  useEffect(() => {
    const sticky = stickyRef.current;
    if (!sticky) return;
    sticky.addEventListener("mousedown", () => {
      setMouseDown(true);
    });

    sticky.addEventListener("mouseup", () => {
      setMouseDown(false);
      onChange?.(title, desc, mouseX - stickyX, mouseY - stickyY);
    });
  }, [desc, mouseX, mouseY, onChange, stickyX, stickyY, title]);

  function onTitleChange() {
    onChange?.(title, desc, mouseX - stickyX, mouseY - stickyY);
  }

  function onDescChange() {
    onChange?.(title, desc, mouseX - stickyX, mouseY - stickyY);
  }

  return (
    <div
      className={styles.stickynote}
      style={{
        left: stickyX,
        top: stickyY,
        // zIndex,
      }}
      ref={stickyRef}
    >
      <div className={styles.top}>
        <input
          type="text"
          onChange={(ev) => {
            setTitle(ev.target.value);
            onTitleChange();
          }}
          value={title}
          className={styles.title}
          placeholder="Title"
        />
      </div>
      <textarea
        onChange={(ev) => {
          setDesc(ev.target.value);
          onDescChange();
        }}
        value={desc}
        className={styles.desc}
        placeholder="Description"
      />
    </div>
  );
};
