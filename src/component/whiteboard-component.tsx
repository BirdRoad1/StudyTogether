import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ClientContext } from "../context/ClientContext.ts";
import { useParams } from "react-router";
import styles from "../css/room.module.css";
import type { LineSegment } from "@shared/model/line-segment.ts";
import { MessageRegistry } from "@shared/message-registry.ts";
import { SRequestLineSegmentMessage } from "@shared/message/serverbound/request-line-segment.server.ts";
import { CAddLineSegmentMessage } from "@shared/message/clientbound/add-line-segment-message.client.ts";
import { CRemoveLineSegmentMessage } from "@shared/message/clientbound/remove-line-segment-message.client.ts";
import type { Message } from "@shared/message.ts";

const MIN_MOVE_DISTANCE = 5;

function distanceSqrt(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y2 - y1) * (y2 - y1));
}

type ClientLineSegment = LineSegment & {
  status: "pending" | "confirmed";
};

function findSegment2d(lineSegments: ClientLineSegment[][], id: string) {
  for (let i = 0; i < lineSegments.length; i++) {
    const group = lineSegments[i];
    const j = findSegment(group, id);
    if (j < 0) continue;
    return [i, j];
  }

  return null;
}

function findSegment(lineSegments: ClientLineSegment[], id: string) {
  return lineSegments.findIndex((s) => s.id === id);
}

function deepCopy2d(
  lineSegments: ClientLineSegment[][]
): ClientLineSegment[][] {
  return lineSegments.map(deepCopy);
}

function deepCopy(lineSegments: ClientLineSegment[]): ClientLineSegment[] {
  return [...lineSegments.map((args) => ({ ...args }))];
}

function round(num: number) {
  return Math.floor(num * 100) / 100;
}

export const Whiteboard = () => {
  const client = useContext(ClientContext);
  const { roomCode } = useParams() as { roomCode: string };
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [lastCheckedPos, setLastCheckedPos] = useState({ x: -1, y: -1 });
  const animationFrameId = useRef<number | null>(null);
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setMouseDown] = useState(false);
  const [lineSegments, setLineSegments] = useState<ClientLineSegment[][]>([]);
  const [serverSegments, setServerSegments] = useState<ClientLineSegment[]>([]);
  const positionRef = useRef<{ x: number; y: number }>(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    client?.on("open", () => {
      if (!client?.socket) {
        console.log("No socket");
        return;
      }

      const msgHandler = (message: Message) => {
        if (message.isMessageOf(CAddLineSegmentMessage)) {
          const payload = message.payload;
          for (const seg of payload.segments) {
            if (seg.type === "client") {
              // Probably confirming existing segment
              setLineSegments((old) => {
                const segment = findSegment2d(old, seg.clientId);
                if (!segment) return old;
                const [i, j] = segment;
                const deepCopy = deepCopy2d(old);

                deepCopy[i][j].status = "confirmed";
                deepCopy[i][j].id = seg.serverId;
                return deepCopy;
              });
            } else {
              // Adding a new segment!
              setServerSegments((old) => [
                ...old,
                { ...seg.segment, status: "confirmed" },
              ]);
            }
          }
        } else if (message.isMessageOf(CRemoveLineSegmentMessage)) {
          if (message.payload.type === "client") {
            // Remove client
            setLineSegments((seg) => {
              const segment = findSegment2d(seg, message.payload.id);
              if (!segment) return seg;
              const [i, j] = segment;
              const copy = deepCopy2d(seg);
              copy[i].splice(j, 1);
              return copy;
            });
          } else if (message.payload.type === "server") {
            setServerSegments((old) => {
              const i = findSegment(old, message.payload.id);
              if (i < 0) return old;
              const copy = deepCopy(old);
              copy.splice(i, 1);
              return copy;
            });
          }
        }
      };

      client?.socket?.on("message", msgHandler);
    });
    // return () => {
    //   client?.socket?.removeListener("message", msgHandler);
    // };
  }, [client, roomCode]);

  useEffect(() => {
    const currCanvas = canvas.current;
    const whiteboard = whiteboardRef.current;
    const ctx = currCanvas?.getContext("2d");
    if (!currCanvas || !ctx || !whiteboard) return;

    const bounds = currCanvas.getBoundingClientRect();

    const x = position.x - bounds.left;
    const y = position.y - bounds.top;

    if (isMouseDown && lastCheckedPos.x === -1 && lastCheckedPos.y === -1) {
      setLastCheckedPos({ x, y });
    } else if (
      !isMouseDown &&
      lastCheckedPos.x !== -1 &&
      lastCheckedPos.y !== -1
    ) {
      setLastCheckedPos({ x: -1, y: -1 });
      setLineSegments([...lineSegments, []]);
    }

    if (
      lastCheckedPos.x >= 0 &&
      lastCheckedPos.y >= 0 &&
      distanceSqrt(lastCheckedPos.x, lastCheckedPos.y, x, y) >=
        MIN_MOVE_DISTANCE &&
      isMouseDown
    ) {
      setLineSegments((segments) => {
        const firstElems = segments.slice(0, -1);
        const lastElem = segments[segments.length - 1];
        const seg: ClientLineSegment = {
          id: crypto.randomUUID(),
          startX: round(lastCheckedPos.x),
          startY: round(lastCheckedPos.y),
          endX: round(x),
          endY: round(y),
          status: "pending",
        };

        client?.socket?.send(
          MessageRegistry.buildMessage(SRequestLineSegmentMessage, {
            segment: seg,
          })
        );

        setInterval(() => {
          if (seg.status === "pending") {
            // TODO: remove segment after timeout
          }
        }, 10000);

        if (firstElems.length === 0 && lastElem === undefined) {
          return [[seg]];
        } else {
          return [...firstElems, [...lastElem, seg]];
        }
      });

      setLastCheckedPos({ x, y });
    }
  }, [client?.socket, isMouseDown, lastCheckedPos, lineSegments, position]);

  const animate = useCallback(() => {
    const currCanvas = canvas.current;
    const whiteboard = whiteboardRef.current;
    const ctx = currCanvas?.getContext("2d");
    const position = positionRef.current;
    if (!currCanvas || !ctx || !whiteboard || !position) return;

    const bounds = currCanvas.getBoundingClientRect();

    const x = position.x - bounds.left;
    const y = position.y - bounds.top;

    ctx.clearRect(0, 0, 600, 750);
    ctx.fillStyle = "#000000";
    ctx.fillRect(x - 2, y - 2, 4, 4);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ff0000";

    ctx.beginPath();
    for (let i = 0; i < serverSegments.length; i++) {
      const segment = serverSegments[i];
      ctx.moveTo(segment.startX, segment.startY);
      ctx.lineTo(segment.endX, segment.endY);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle = "#000000";

    ctx.beginPath();
    for (let i = 0; i < lineSegments.length; i++) {
      for (let j = 0; j < lineSegments[i].length; j++) {
        const segment = lineSegments[i][j];
        ctx.moveTo(segment.startX, segment.startY);
        ctx.lineTo(segment.endX, segment.endY);
      }
    }
    ctx.stroke();
    ctx.closePath();

    animationFrameId.current = requestAnimationFrame(animate);
  }, [lineSegments, serverSegments]);

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (ev.ctrlKey && ev.key === "z") {
        setLineSegments((segments) =>
          segments.filter((s) => s.length > 0).slice(0, -1)
        );
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lineSegments]);

  useEffect(() => {
    const whiteboard = whiteboardRef.current;
    const currCanvas = canvas.current;
    if (!whiteboard || !currCanvas) return;
    const resizeListener = () => {
      currCanvas.width = whiteboard.clientWidth;
      currCanvas.height = whiteboard.clientHeight;
    };
    const mouseMoveListener = ({ clientX, clientY }: MouseEvent) => {
      setPosition({ x: clientX, y: clientY });
    };
    const mouseDownListener = () => {
      setMouseDown(true);
    };
    const mouseUpListener = () => {
      setMouseDown(false);
    };
    const mouseLeaveListener = () => {
      setMouseDown(false);
    };

    whiteboard.addEventListener("resize", resizeListener);
    resizeListener();

    whiteboard.addEventListener("mousemove", mouseMoveListener);

    whiteboard.addEventListener("mousedown", mouseDownListener);

    whiteboard.addEventListener("mouseup", mouseUpListener);

    whiteboard.addEventListener("mouseleave", mouseLeaveListener);
  }, [whiteboardRef, canvas]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [animate, setMouseDown]);

  return (
    <div className={styles.whiteboard} ref={whiteboardRef}>
      <canvas id="canvas" ref={canvas} className={styles.canvas}></canvas>
    </div>
  );
};
