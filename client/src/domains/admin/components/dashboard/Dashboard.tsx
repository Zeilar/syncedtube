import { Box, Flex, Grid } from "@chakra-ui/layout";
import { IMessage } from "domains/common/@types/message";
import BrandLogo from "domains/common/components/styles/BrandLogo";
import { useEffect, useContext } from "react";
import { Route, Switch } from "react-router";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { IRoom } from "domains/common/@types/room";
import { ISocket } from "domains/common/@types/socket";
import { RoomContext, SocketContext } from "../../contexts";
import * as RoomActions from "../../state/actions/room";
import * as SocketActions from "../../state/actions/socket";
import DashboardItem from "./DashboardItem";
import Rooms from "./room/Rooms";
import Sockets from "./Sockets";
import { WebsocketContext } from "domains/common/contexts";
import { Color } from "common/@types/color";
import Button from "domains/common/components/styles/button";

export default function Dashboard() {
    const { rooms, dispatchRooms } = useContext(RoomContext);
    const { sockets, dispatchSockets } = useContext(SocketContext);
    const { adminSocket } = useContext(WebsocketContext);

    useEffect(() => {
        adminSocket.emit("data:get");
        adminSocket.on("error", (message: string) => {
            toast.error(message);
        });
        adminSocket.on("connect_error", (error) => {
            toast.error(error.message);
        });
        adminSocket.on(
            "data:get",
            (data: { rooms: IRoom[]; sockets: ISocket[] }) => {
                dispatchRooms({
                    type: RoomActions.SET_ROOMS,
                    rooms: data.rooms,
                });
                dispatchSockets({
                    type: SocketActions.SET_SOCKETS,
                    sockets: data.sockets,
                });
            }
        );
        adminSocket.on(
            "room:kick",
            (payload: { roomId: string; socketId: string }) => {
                dispatchRooms({
                    type: RoomActions.REMOVE_SOCKET_FROM_ROOM,
                    ...payload,
                });
                toast.success("Removed socket.");
            }
        );
        adminSocket.on("room:new", (room: IRoom) => {
            dispatchRooms({ type: RoomActions.ADD_ROOM, room });
        });
        adminSocket.on("room:destroy", (roomId: string) => {
            dispatchRooms({ type: RoomActions.REMOVE_ROOM, roomId });
        });
        adminSocket.on("socket:update:color", (color: Color) => {
            //
        });
        adminSocket.on("socket:connect", (socket: ISocket) => {
            dispatchSockets({
                type: SocketActions.ADD_SOCKET,
                socket,
            });
        });
        adminSocket.on("socket:disconnect", (socketId: string) => {
            dispatchSockets({
                type: SocketActions.REMOVE_SOCKET,
                socketId,
            });
        });
        adminSocket.on(
            "message:new",
            (payload: { roomId: string; message: IMessage }) => {
                dispatchRooms({
                    type: RoomActions.ADD_MESSAGE,
                    ...payload,
                });
            }
        );
        adminSocket.on(
            "room:join",
            (payload: { socketId: string; roomId: string }) => {
                dispatchRooms({
                    type: RoomActions.ADD_SOCKET_TO_ROOM,
                    ...payload,
                });
            }
        );
        adminSocket.on(
            "room:leave",
            (payload: { socketId: string; roomId: string }) => {
                dispatchRooms({
                    type: RoomActions.REMOVE_SOCKET_FROM_ROOM,
                    ...payload,
                });
            }
        );
        return () => {
            adminSocket.removeAllListeners();
        };
    }, [dispatchRooms, dispatchSockets, adminSocket]);

    return (
        <Grid bgColor="gray.800" flexGrow={1} gridTemplateColumns="25rem 1fr">
            <Flex
                flexDir="column"
                bgColor="gray.700"
                p="0.5rem"
                boxShadow="md"
                zIndex={100}
            >
                <Box w="fit-content" m="1rem auto 2rem">
                    <Link to="/">
                        <BrandLogo />
                    </Link>
                </Box>
                <DashboardItem icon="mdiAccountGroupOutline" to="/admin/rooms">
                    Rooms
                </DashboardItem>
                <DashboardItem icon="mdiPowerSocket" to="/admin/sockets">
                    Sockets
                </DashboardItem>
                <Button.Icon
                    icon="mdiRefresh"
                    onClick={() => adminSocket.emit("data:get")}
                />
            </Flex>
            <Switch>
                <Route path="/admin" exact>
                    Main
                </Route>
                <Route path="/admin/rooms" exact>
                    <Rooms rooms={rooms} />
                </Route>
                <Route path="/admin/sockets" exact>
                    <Sockets sockets={sockets} />
                </Route>
                <Route>404</Route>
            </Switch>
        </Grid>
    );
}
