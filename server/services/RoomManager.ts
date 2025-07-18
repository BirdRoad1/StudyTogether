import { Room } from "../entities/room.js";

export class RoomManager {
  private static readonly CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static rooms: Room[] = [];
  static createRoom() {
    const code = this.generateCode();
    const room = new Room(code);

    this.rooms.push(room);

    return room;
  }


  public static getRoomByCode(code: string) {
    return this.rooms.find((r) => r.code === code);
  }

  private static generateCode(): string {
    let code: string;

    do {
      code = "";
      for (let i = 0; i < 6; i++) {
        code +=
          this.CODE_CHARS[Math.floor(Math.random() * this.CODE_CHARS.length)];
      }
    } while (this.getRoomByCode(code) !== undefined);

    return code;
  }

  static removeRoom(room: Room) {
    this.rooms = this.rooms.filter((r) => r.code !== room.code);
  }
}
