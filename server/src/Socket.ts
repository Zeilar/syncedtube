import { Socket as S } from "socket.io";
import { adminNamespace, publicNamespace, ws } from "./server";
import { Color } from "../@types/color";
import { ISocketDto } from "../@types/socket";
import { uniqueNamesGenerator } from "unique-names-generator";
import { socketNameConfig } from "../config/uniqueNamesGenerator";

export class Socket {
    public username: string;
    public color: Color;
    public ref: S;
    public created_at: Date;

    constructor(public readonly id: string) {
        const socket = publicNamespace.sockets.get(id);
        if (!socket) {
            throw new Error(`Failed retrieving socket ref with id ${id}`);
        }
        this.ref = socket;
        this.generate();
        this.created_at = new Date();
    }

    public get dto(): ISocketDto {
        return {
            id: this.id,
            username: this.username,
            color: this.color,
            created_at: this.created_at,
        };
    }

    public get room() {
        return [...ws.rooms.values()].find(room => room.hasSocket(this));
    }

    public leaveRoom() {
        const room = this.room;
        if (!room) {
            return;
        }
        room.removeSocket(this);
    }

    public generate() {
        this.setRandomColor();
        this.setRandomName();
    }

    private async setRandomName() {
        this.username = uniqueNamesGenerator(socketNameConfig);
        adminNamespace.emit("socket:update:name", this.username);
    }

    private setRandomColor() {
        const colors = ws.leastPickedColors;
        this.setColor(colors[Math.floor(Math.random() * colors.length)]);
    }

    public setColor(color: Color) {
        this.color = color;
        this.ref.emit("socket:update:color", color);
        if (this.room) {
            publicNamespace.to(this.room.id).emit("room:socket:update:color", {
                socketId: this.id,
                color,
            });
        }
        adminNamespace.emit("socket:update:color", color);
    }
}
