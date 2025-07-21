import { Message } from "@shared/message.js";
import z from "zod";

export function createMessageClass<T extends z.ZodType>(
  name: string,
  schema: T
) {
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
    },
  }[name];
}
