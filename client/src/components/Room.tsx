import { useEffect, useMemo, useRef, useState } from "react";
import { Redirect, useParams } from "react-router";
import { ISocket } from "../../@types/socket";
import { socket } from "./App";
import ReactPlayer from "react-player";
import { PrimaryButton } from "./styles/button";
import { toast } from "react-toastify";
import { Box, Flex, Grid } from "@chakra-ui/layout";
import Chat from "./Chat";
import { validate } from "uuid";

interface IParams {
    roomId: string;
}

const defaultVideo = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // What video could this possibly be, I wonder

export default function Room() {
    const { roomId } = useParams<IParams>();
    const [sockets, setSockets] = useState<ISocket[]>([]);
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [playlistInput, setPlaylistInput] = useState("");
    const player = useRef<ReactPlayer>(null);

    const me = useMemo(
        () => sockets.find((element) => element.id === socket.id),
        [sockets]
    );

    function addVideo() {
        const canPlay = ReactPlayer.canPlay(
            "https://www.youtube.com/watch?v=ig44rDYo8IM&list=PLfGn95Njqu_SDNqqJdVZi3jq6ILi_pWgt&index=5"
        );

        if (!canPlay) {
            return toast.warn("Invalid URL.");
        }
    }

    useEffect(() => {
        if (!validate(roomId)) {
            return;
        }

        socket.emit("room:join", roomId);
        socket.on("room:update:socket", (sockets: ISocket[]) => {
            setSockets(sockets);
        });

        // Just to be safe
        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            setSockets([]);
            setPlaylist([]);
            setPlaylistInput("");
        };
    }, [roomId]);

    useEffect(() => {
        if (!me) return;
        console.log(`welcome ${me.username}`);
    }, [me]);

    // TODO: use "light" prop for playlist thumbnails

    if (!validate(roomId)) {
        console.log(roomId, "is invalid");
        toast.error(
            "Invalid room id. Please click the button to generate one.",
            { toastId: "invalid-room-id" } // For some reason this toast fires twice, prevent this with id
        );
        return <Redirect to="/" />;
    }

    return (
        <Flex m="auto" w="100%" h="100%" p="5%">
            <PrimaryButton onClick={addVideo}>Add video</PrimaryButton>
            <Grid w="100%" gridTemplateColumns="75% 25%" gridGap="2rem">
                <Box w="100%">
                    <ReactPlayer
                        width="100%"
                        height="100%"
                        ref={player}
                        url={playlist[0] || defaultVideo}
                    />
                </Box>
                <Chat roomId={roomId} />
            </Grid>
        </Flex>
    );
}