export abstract class Message {
  constructor(public readonly id: number) {}
  abstract serialize(): unknown;
}
