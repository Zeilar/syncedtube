import { useContext, useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router";
import { ISocket } from "domains/common/@types/socket";
import { toast } from "react-toastify";
import { Chat } from "../components/chat";
import { Flex } from "@chakra-ui/react";
import { Color } from "domains/common/@types/color";
import { MeContext, WebsocketContext } from "domains/public/contexts";
import { IErrorPayload } from "domains/common/@types/listener";
import { RoomContext } from "../contexts";
import Player from "../components/Player";
import { IRoomParams } from "../@types/params";
import { IRoom } from "domains/common/@types/room";
import Modal from "domains/common/components/styles/modal";
import Alert from "domains/common/components/styles/alert";
import { useDisclosure } from "@chakra-ui/hooks";
import { Input } from "@chakra-ui/input";
import Button from "domains/common/components/styles/button";
import { useSessionStorage, useTitle } from "domains/common/hooks";
import { RoomActions } from "../state/actions/room";
import { Text } from "@chakra-ui/layout";

export function Room() {
    const { roomId } = useParams<IRoomParams>();
    const { publicSocket } = useContext(WebsocketContext);
    const { push } = useHistory();
    const { dispatchSockets, setRoom, setLeader, room, setMessages } =
        useContext(RoomContext);
    const { me } = useContext(MeContext);
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const passwordPrompt = useDisclosure();
    const [submittingPassword, setSubmittingPassword] = useState(false);
    // const [password, setPassword] = useState("");
    const location = useLocation<{ password?: string } | undefined>();
    const [passwordError, setPasswordError] = useState<null | string>(null);
    console.log(location.state?.password);
    const [password, setPassword] = useSessionStorage<string>(
        roomId,
        location.state?.password ?? ""
    );

    function authorize(e: React.FormEvent) {
        e.preventDefault();
        if (!password) {
            return;
        }
        setSubmittingPassword(true);
        publicSocket.emit("room:join", { roomId, password });
    }

    useTitle(room && `SyncedTube | ${room.name}`);

    useEffect(() => {
        if (location.state?.password) {
            setPassword(location.state.password);
        }
    }, [location.state?.password, setPassword]);

    useEffect(() => {
        publicSocket.on("room:join", (payload: IRoom) => {
            dispatchSockets({
                type: RoomActions.SET_SOCKETS,
                sockets: payload.sockets,
            });
            setRoom({
                id: payload.id,
                name: payload.name,
                created_at: payload.created_at,
                leader: payload.leader,
                privacy: payload.privacy,
                videoId: payload.videoId,
            });
            setMessages(payload.messages);
            setSubmittingPassword(false);
            setPasswordError(null);
            setAuthorized(true);
            passwordPrompt.onClose();
        });
        return () => {
            publicSocket.off("room:join");
        };
    }, [publicSocket, dispatchSockets, setRoom, passwordPrompt, setMessages]);

    useEffect(() => {
        publicSocket.on("room:socket:join", (socket: ISocket) => {
            dispatchSockets({
                type: RoomActions.ADD_SOCKET,
                socket,
            });
        });
        publicSocket.on("room:socket:leave", (socket: ISocket) => {
            dispatchSockets({
                type: RoomActions.REMOVE_SOCKET,
                socketId: socket.id,
            });
        });
        publicSocket.on(
            "room:socket:update:color",
            (payload: { color: Color; socketId: string }) => {
                dispatchSockets({
                    type: RoomActions.EDIT_SOCKET_COLOR,
                    ...payload,
                });
            }
        );
        return () => {
            publicSocket
                .off("room:socket:join")
                .off("room:socket:leave")
                .off("room:socket:update:color");
        };
    }, [publicSocket, dispatchSockets]);

    useEffect(() => {
        publicSocket.on("room:kick", () => {
            toast.info("You were kicked from the room.");
            push("/");
        });
        publicSocket.on("room:destroy", () => {
            toast.info("The room has been shut down.");
            push("/");
        });
        publicSocket.on("room:connection:error", (payload: IErrorPayload) => {
            toast.error(`${payload.message}\${payload.reason}`);
            push("/");
        });
        return () => {
            publicSocket
                .off("room:kick")
                .off("room:destroy")
                .off("room:connection:error");
        };
    }, [publicSocket, push]);

    useEffect(() => {
        publicSocket.on("room:leader:new", (leader: string | null) => {
            if (me && me.id === leader) {
                toast.info("You are now the room leader.");
            }
            setLeader(leader);
        });
        return () => {
            publicSocket.off("room:leader:new");
        };
    }, [publicSocket, setRoom, me, setLeader]);

    useEffect(() => {
        publicSocket.on("socket:kick", () => {
            toast.info("You were kicked from the server.");
        });
        publicSocket.on("disconnect", () => {
            setSubmittingPassword(false);
        });
        return () => {
            publicSocket
                .off("socket:kick")
                .off("room:error:password")
                .off("room:unauthorized");
        };
    }, [publicSocket]);

    useEffect(() => {
        publicSocket.emit("room:join", {
            roomId,
            password: location.state?.password,
        });
    }, [publicSocket, roomId, location.state?.password]);

    useEffect(() => {
        return () => {
            publicSocket.emit("room:leave", roomId);
        };
    }, [publicSocket, roomId]);

    useEffect(() => {
        publicSocket.on("room:error:password", () => {
            setSubmittingPassword(false);
            setPasswordError("Incorrect password.");
            setAuthorized(false);
            passwordPrompt.onOpen();
        });
        publicSocket.on("room:unauthorized", () => {
            setAuthorized(false);
            passwordPrompt.onOpen();
        });
        return () => {
            publicSocket.off("room:error:password").off("room:unauthorized");
        };
    }, [publicSocket, passwordPrompt]);

    useEffect(() => {
        return () => {
            setMessages([]);
            setRoom(null);
            setPassword("");
            dispatchSockets({
                type: RoomActions.SET_SOCKETS,
                sockets: [],
            });
        };
    }, [roomId, setRoom, setMessages, dispatchSockets, setPassword]);

    return (
        <Flex flexGrow={1} maxH="100%" overflow="hidden">
            <Modal.Overlay isOpen={passwordPrompt.isOpen} />
            <Modal
                onClose={passwordPrompt.onClose}
                isOpen={passwordPrompt.isOpen}
                closeOnOutsideClick
            >
                <Modal.Content>
                    <Modal.Body>
                        <Modal.Header as="h3">
                            Please enter the password
                        </Modal.Header>
                        {passwordError && (
                            <Alert.Error mb="0.5rem">
                                <Text>{passwordError}</Text>
                            </Alert.Error>
                        )}
                        <Flex as="form" onSubmit={authorize}>
                            <Input
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                type="password"
                                autoFocus
                                bgColor="primary.dark"
                                placeholder="••••••••••"
                            />
                            <Button
                                ml="0.25rem"
                                variant="secondary"
                                type="submit"
                                isSuccess={authorized}
                                isLoading={submittingPassword}
                            >
                                Submit
                            </Button>
                        </Flex>
                    </Modal.Body>
                </Modal.Content>
            </Modal>
            <Player />
            <Chat />
        </Flex>
    );
}
