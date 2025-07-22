import { useEffect, useRef, useState } from "react";
import styles from "../css/stickynote.module.css";
import type { StickyNote } from "@shared/model/sticky-note.ts";

type Props = {
  sticky: StickyNote;
  zIndex?: number;
  onChange?: (title: string, desc: string, x: number, y: number) => void;
  onRemove?: () => void;
};

export const StickyNoteComponent = ({ sticky, onChange, onRemove,zIndex }: Props) => {
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [stickyX, setStickyX] = useState(sticky.x);
  const [stickyY, setStickyY] = useState(sticky.y);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(sticky.title);
  const [desc, setDesc] = useState(sticky.desc);
  const mouseDownRef = useRef(mouseDown);

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
        onChange?.(title, desc, x - (offsetX ?? 0), y - (offsetY ?? 0));
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
      mouseDownRef.current = true;
    });

    sticky.addEventListener("mouseup", () => {
      setMouseDown(false);
      mouseDownRef.current = false;
    });
  }, [desc, mouseX, mouseY, onChange, stickyX, stickyY, title]);

  useEffect(() => {
    if (mouseDownRef.current) return;
    setStickyX(sticky.x);
    setStickyY(sticky.y);
  }, [sticky.x, sticky.y]);

  useEffect(() => {
    setTitle(sticky.title);
  }, [sticky.title]);

  useEffect(() => {
    setDesc(sticky.desc);
  }, [sticky.desc]);

  return (
    <div
      className={styles.stickynote}
      style={{
        left: stickyX,
        top: stickyY,
        zIndex,
      }}
      ref={stickyRef}
    >
      <div className={styles.top}>
        <input
          type="text"
          onChange={(ev) => {
            setTitle(ev.target.value);
            onChange?.(ev.target.value, desc, stickyX, stickyY);
          }}
          value={title}
          className={styles.title}
          placeholder="Title"
        />
      </div>
      <textarea
        onChange={(ev) => {
          setDesc(ev.target.value);
          onChange?.(title, ev.target.value, stickyX, stickyY);
        }}
        value={desc}
        className={styles.desc}
        placeholder="Description"
      />
      <button className={styles.remove} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
};
