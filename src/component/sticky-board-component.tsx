import { useContext } from "react";
import { ClientContext } from "../context/ClientContext.ts";
import type { StickyNote } from "@shared/model/sticky-note.ts";
import { StickyNoteComponent } from "./sticky-note-component.tsx";
import { MessageRegistry } from "@shared/message-registry.ts";
import { EditStickyNoteMessage } from "@shared/message/serverbound/edit-sticky-note-message.ts";

type Props = {
  stickies: StickyNote[];
};

export const StickyBoard = ({ stickies }: Props) => {
  const client = useContext(ClientContext);

  return (
    <div>
      {stickies.map((s) => (
        <StickyNoteComponent
          key={s.id}
          sticky={s}
          onChange={(title, desc, x, y) => {
            client?.socket?.send(
              MessageRegistry.buildMessage(EditStickyNoteMessage, {
                sticky: { id: s.id, title, desc, x, y },
              })
            );
          }}
        />
      ))}
    </div>
  );
};
