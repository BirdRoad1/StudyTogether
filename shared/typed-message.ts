import type {
  IServerboundMessageVisitor,
  ServerboundVisitorMap,
} from "@shared/message-visitor.ts";
import { Message } from "@shared/message.js";
import z from "zod";

export function createMessageClass<
  T extends z.ZodType,
  K extends keyof ServerboundVisitorMap
>(name: string, schema: T, acceptFunc?: K) {
  return {
    [name]: class extends Message {
      static schema = schema;

      constructor(id: number, public payload: z.infer<T>) {
        super(id);
      }

      static create(id: number, data: z.infer<T>) {
        return new this(id, data);
      }

      serialize(): unknown {
        return { id: this.id, payload: this.payload };
      }

      accept(visitor: IServerboundMessageVisitor): void {
        if (!acceptFunc) {
          throw new Error("No visitor method for class: " + name);
        }
        const func = visitor[acceptFunc];
        if (!func) {
          throw new Error("No visitor method for class: " + name);
        }

        func.call(visitor, this as unknown as ServerboundVisitorMap[K]);
      }
    },
  }[name];
}
