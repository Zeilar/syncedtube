import { Input } from "@chakra-ui/input";
import { Box, Flex } from "@chakra-ui/layout";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { IMessage } from "../../@types/message";
import { ISocket } from "../../@types/socket";
import { socket } from "./App";
import Message from "./Message";

interface IProps {
    roomId: string;
    sockets: ISocket[];
    me: ISocket;
}

export default function Chat({ roomId, sockets, me }: IProps) {
    const [isOpen, setIsOpen] = useState(true); // useLocalStorage for initial value
    const [messages, setMessages] = useState<IMessage[]>([]);
    const scrollChat = useRef<boolean>(true);
    const chatElement = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        socket.on("message:new", (message: IMessage) => {
            scrollChat.current = true;
            setMessages((messages) => {
                const array = [...messages, message];
                if (array.length > 30) {
                    array.shift();
                }
                return array;
            });
        });

        socket.on("message:error", (payload: { id: string; error: string }) => {
            setMessages((messages) =>
                [...messages].map((message) => {
                    // If message already had en error, do nothing
                    if (message.notSent) {
                        return message;
                    }
                    return {
                        ...message,
                        notSent: message.id === payload.id,
                    };
                })
            );
            toast.error(payload.error);
        });

        socket.once("room:join", (payload: { messages: IMessage[] }) => {
            setMessages(payload.messages);
        });

        return () => {
            socket.off("message:new").off("message:error").off("room:join");
        };
    }, []);

    function sendMessage(e: FormEvent) {
        e.preventDefault();
        if (!input.current) {
            return;
        }
        const body = input.current.value;
        if (!body) {
            return;
        }
        input.current.value = "";
        const message: IMessage = {
            body,
            created_at: new Date(),
            id: uuidv4(),
            socket: me,
        };
        setMessages((messages) => [...messages, message]);
        socket.emit("message:send", { roomId, body, id: message.id });
    }

    useEffect(() => {
        scrollChat.current = false;
        chatElement.current?.scrollTo({ top: 9999, behavior: "smooth" });
    }, [messages]);

    console.log("should scroll", scrollChat.current);

    if (!isOpen) {
        return null;
    }

    return (
        <Flex flexDir="column" h="100vh" bgColor="gray.900">
            <Flex
                flexDir="column"
                overflowY="auto"
                overflowX="hidden"
                p="1rem"
                ref={chatElement}
            >
                {messages.map((message) => (
                    <Message key={message.id} message={message} />
                ))}
            </Flex>
            <Box
                as="form"
                onSubmit={sendMessage}
                mt="auto"
                p="1rem"
                bgColor="gray.800"
            >
                <Input ref={input} />
            </Box>
        </Flex>
    );
}
