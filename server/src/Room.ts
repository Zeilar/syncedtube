import { IRoomDto } from "../@types/room";
import { adminNamespace, io, ws } from "./server";
import { Socket } from "./Socket";
import { uniqueNamesGenerator } from "unique-names-generator";
import { nameConfig } from "../config/uniqueNamesGenerator";
import Message from "./Message";
import env from "../config/env";

const { ROOM_MAX_SOCKETS, ROOM_MAX_MESSAGES } = env;

export class Room {
    public static readonly MAX_SOCKETS = ROOM_MAX_SOCKETS;
    public static readonly MAX_MESSAGES = ROOM_MAX_MESSAGES;
    public sockets: Socket[] = [];
    public messages: Message[] = [];
    public playlist: string[] = ["68ugkg9RePc"]; // YouTube video ids
    public created_at: Date;
    public name: string;

    public constructor(public readonly id: string) {
        this.created_at = new Date();
        this.name = uniqueNamesGenerator(nameConfig);
    }

    public addMessage(message: Message) {
        if (this.messages.length >= Room.MAX_MESSAGES) {
            this.messages.shift();
        }
        this.messages.push(message);
    }

    public get dto(): IRoomDto {
        return {
            id: this.id,
            name: this.name,
            playlist: this.playlist,
            messages: this.messages,
            created_at: this.created_at,
            sockets: this.socketsDto,
        };
    }

    public get socketsDto() {
        return this.sockets.map(socket => socket.id);
    }

    public hasSocket(socket: Socket) {
        return this.sockets.some(element => element.id === socket.id);
    }

    public add(socket: Socket) {
        if (this.hasSocket(socket)) {
            return;
        }
        this.sockets.push(socket);
        socket.ref.join(this.id);
        socket.ref.emit("room:join", {
            sockets: this.socketsDto,
            messages: this.messages,
            playlist: this.playlist,
        });
        socket.ref.to(this.id).emit("room:socket:join", socket.dto);
        this.sendMessageToAll(
            this.serverMessage({
                socket,
                body: `${socket.username} has joined the room`,
            })
        );
        adminNamespace.emit("room:join", {
            socketId: socket.id,
            roomId: this.id,
        });
    }

    public serverMessage(args: { socket: Socket; body: string }) {
        return new Message({
            roomId: this.id,
            serverMessage: true,
            socket: args.socket.dto,
            body: args.body,
        });
    }

    public remove(socket: Socket) {
        this.sockets = this.sockets.filter(element => element.id !== socket.id);
        socket.ref.leave(this.id);
        socket.ref.emit("room:leave");
        socket.ref.to(this.id).emit("room:socket:leave", socket.dto);
        this.sendMessageToAll(
            this.serverMessage({
                socket,
                body: `${socket.username} has left the room`,
            })
        );
        adminNamespace.emit("room:leave", {
            socketId: socket.id,
            roomId: this.id,
        });
        if (this.sockets.length <= 0) {
            ws.deleteRoom(this);
        }
    }

    public sendMessage(sender: Socket, message: Message) {
        this.addMessage(message);
        sender.ref.to(this.id).emit("message:new", message);
        adminNamespace.emit("message:new", { roomId: this.id, message });
    }

    public sendMessageToAll(message: Message) {
        this.addMessage(message);
        io.to(this.id).emit("message:new", message);
        adminNamespace.emit("message:new", { roomId: this.id, message });
    }
}
