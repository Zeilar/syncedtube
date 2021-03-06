import { WS_HOST } from "domains/common/config/host";
import { createContext, ReactNode, useRef } from "react";
import { Socket, io } from "socket.io-client";

interface IContext {
    adminSocket: Socket;
    adminLogin: (password: string) => void;
}

interface IProps {
    children: ReactNode;
}

export const WebsocketContext = createContext({} as IContext);

export function WebsocketContextProvider({ children }: IProps) {
    const adminSocket = useRef(
        io(`${WS_HOST}/admin`, { reconnection: false })
    ).current;

    function adminLogin(password: string) {
        adminSocket.auth = {};
        adminSocket.auth.token = password;
        adminSocket.connect();
    }

    const values: IContext = {
        adminSocket,
        adminLogin,
    };

    return (
        <WebsocketContext.Provider value={values}>
            {children}
        </WebsocketContext.Provider>
    );
}
