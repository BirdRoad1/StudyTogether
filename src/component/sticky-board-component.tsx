import { useContext, useEffect, useRef, useState } from "react";
import { ClientContext } from "../context/ClientContext.ts";
import type { StickyNote } from "@shared/model/sticky-note.ts";
import { StickyNoteComponent } from "./sticky-note-component.tsx";
import { MessageRegistry } from "@shared/message-registry.ts";
import { SEditStickyNoteMessage } from "@shared/message/serverbound/edit-sticky-note-message.server.ts";
import { CAddStickyMessage } from "@shared/message/clientbound/add-sticky-message.client.ts";
import { CApproveStickyMessage } from "@shared/message/clientbound/approve-sticky-message.client.ts";
import { CEditStickyMessage } from "@shared/message/clientbound/edit-sticky-message.client.ts";
import { SCreateStickyNoteMessage } from "@shared/message/serverbound/create-sticky-note-message.server.ts";
import type { Message } from "@shared/message.ts";
import { SRemoveStickyNoteMessage } from "@shared/message/serverbound/remove-sticky-note-message.server.ts";

type Props = { createStickySignal: number };

export const StickyBoard = ({ createStickySignal }: Props) => {
  const client = useContext(ClientContext);
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const previousSignalRef = useRef<number>(createStickySignal);

  useEffect(() => {
    if (createStickySignal > previousSignalRef.current) {
      const sticky = {
        x: 50,
        y: 50,
        title: "Hello",
        desc: "Hello, world",
        id: crypto.randomUUID(),
      };
      setStickies((old) => [...old, sticky]);

      client?.socket?.send(
        MessageRegistry.buildMessage(SCreateStickyNoteMessage, {
          sticky,
        })
      );
    }

    previousSignalRef.current = createStickySignal;
  }, [createStickySignal, client?.socket]);

  useEffect(() => {
    if (!client) return;

    const msgHandler = (message: Message) => {
      if (message.isMessageOf(CAddStickyMessage)) {
        setStickies((old) => [...old, message.payload.sticky]);
      } else if (message.isMessageOf(CApproveStickyMessage)) {
        setStickies((old) => {
          const sticky = old.find((s) => message.payload.clientId === s.id);
          const otherStickies = old.filter((s) => s != sticky);
          if (!sticky) return old;
          const copy = { ...sticky };
          copy.id = message.payload.serverId;

          return [...otherStickies, copy];
        });
      } else if (message.isMessageOf(CEditStickyMessage)) {
        setStickies((old) => {
          const sticky = old.find((s) => s.id === message.payload.sticky.id);
          if (!sticky) return old;

          const copy = structuredClone(sticky);

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

          return old.map((old) => (old.id === sticky.id ? copy : old));
        });
      } else if (message.isMessageOf(SRemoveStickyNoteMessage)) {
        setStickies((old) => {
          return old.filter((sticky) => sticky.id !== message.payload.serverId);
        });
      }
    };

    const openHandler = () => {
      client.socket?.on("message", msgHandler);
    };

    client.on("open", openHandler);

    return () => {
      client?.removeListener("open", openHandler);
      client?.socket?.removeListener("message", msgHandler);
    };
  }, [client]);

  return (
    <div>
      {stickies.map((s) => (
        <StickyNoteComponent
          key={s.id}
          sticky={s}
          onChange={(title, desc, x, y) => {
            client?.socket?.send(
              MessageRegistry.buildMessage(SEditStickyNoteMessage, {
                sticky: { id: s.id, title, desc, x, y },
              })
            );
          }}
          onRemove={() => {
            client?.socket?.send(
              MessageRegistry.buildMessage(SRemoveStickyNoteMessage, {
                serverId: s.id,
              })
            );
          }}
        />
      ))}
    </div>
  );
};
