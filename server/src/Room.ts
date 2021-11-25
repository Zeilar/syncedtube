import { IRoomDto } from "../@types/room";
import { adminNamespace, io } from "./server";
import { Socket } from "./Socket";
import { uniqueNamesGenerator } from "unique-names-generator";
import { roomNameConfig } from "../config/uniqueNamesGenerator";
import Message from "./Message";
import env from "../config/env";
import { IVideo } from "../@types/video";

const { ROOM_MAX_SOCKETS, ROOM_MAX_MESSAGES, ROOM_MAX_PLAYLIST } = env;

export class Room {
    public static readonly MAX_SOCKETS = ROOM_MAX_SOCKETS;
    public static readonly MAX_MESSAGES = ROOM_MAX_MESSAGES;
    public static readonly MAX_PLAYLIST = ROOM_MAX_PLAYLIST;
    public static readonly MAX_MESSAGE_LENGTH = 500;
    public leader: string | null;
    public sockets: Socket[] = [];
    public messages: Message[] = [];
    public playlist: IVideo[] = [];
    public created_at: Date;
    public name: string;

    public constructor(public readonly id: string) {
        this.created_at = new Date();
        this.leader = null;
        this.name = uniqueNamesGenerator(roomNameConfig);
    }

    public addMessage(message: Message) {
        if (this.messages.length >= Room.MAX_MESSAGES) {
            this.messages.shift();
        }
        this.messages.push(message);
    }

    private autoSetLeader() {
        this.leader = this.sockets[0]?.id ?? null;
        if (this.sockets.length > 0) {
            io.to(this.id).emit("room:leader:new", this.leader);
        }
        adminNamespace.emit("room:leader:new", this.leader);
    }

    public get dto(): IRoomDto {
        return {
            id: this.id,
            name: this.name,
            leader: this.leader,
            playlist: this.playlist,
            messages: this.messages,
            created_at: this.created_at,
            sockets: this.socketsDto,
        };
    }

    public get socketsDto() {
        return this.sockets.map(socket => socket.dto);
    }

    public addToPlaylist(sender: Socket, video: IVideo) {
        if (this.playlist.length >= Room.MAX_PLAYLIST) {
            return sender.ref.emit("room:playlist:error", {
                message: "Failed adding video to playlist.",
                reason: "Playlist is full.",
            });
        }
        this.playlist.push(video);
        io.to(this.id).emit("room:playlist:add", video);
        adminNamespace.emit("room:playlist:add", {
            roomId: this.id,
            videoId: video.id,
        });
    }

    public removeFromPlaylist(id: string) {
        this.playlist = this.playlist.filter(video => video.id !== id);
        io.to(this.id).emit("room:playlist:remove", id);
        adminNamespace.emit("room:playlist:remove", {
            roomId: this.id,
            videoId: id,
        });
    }

    public hasSocket(socket: Socket) {
        return this.sockets.some(element => element.id === socket.id);
    }

    public add(socket: Socket) {
        if (this.hasSocket(socket)) {
            return;
        }
        this.sockets.push(socket);
        if (!this.leader) {
            this.autoSetLeader();
        }
        socket.ref.join(this.id);
        socket.ref.emit("room:join", this.dto);
        socket.ref.to(this.id).emit("room:socket:join", socket.dto);
        this.sendMessageToAll(
            this.serverMessage({
                socket,
                body: "joined the room",
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
        if (this.leader === socket.id || this.sockets.length === 0) {
            this.autoSetLeader();
        }
        socket.ref.leave(this.id);
        socket.ref.emit("room:leave");
        socket.ref.to(this.id).emit("room:socket:leave", socket.dto);
        this.sendMessageToAll(
            this.serverMessage({
                socket,
                body: "left the room",
            })
        );
        adminNamespace.emit("room:leave", {
            socketId: socket.id,
            roomId: this.id,
        });
    }

    public sendMessage(message: Message) {
        this.addMessage(message);
        io.to(this.id).emit("message:new", message);
        adminNamespace.emit("message:new", { roomId: this.id, message });
    }

    public sendMessageToAll(message: Message) {
        this.addMessage(message);
        io.to(this.id).emit("message:new", message);
        adminNamespace.emit("message:new", { roomId: this.id, message });
    }
}
