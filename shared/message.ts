import type { IServerboundMessageVisitor } from "@shared/message-visitor.ts";

export abstract class Message {
  constructor(public readonly id: number) {}
  // static create<T extends ZodType>(id: number, data: z.infer<T>) {};
  abstract serialize(): unknown;

  isMessageOf<T extends Message>(
    clazz: new (...args: never[]) => T,
  ): this is T {
    return this instanceof clazz;
  }

  abstract accept(visitor: IServerboundMessageVisitor): void;
}
