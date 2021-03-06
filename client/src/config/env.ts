const {
    REACT_APP_HOST_PORT,
    REACT_APP_ROOM_MAX_MESSAGES,
    REACT_APP_ROOM_MAX_PLAYLIST,
    REACT_APP_ROOM_MAX_SOCKETS,
    REACT_APP_SECURE,
    REACT_APP_VERSION,
    REACT_APP_MAX_ROOMS,
} = process.env;

const env = {
    HOST_PORT: parseInt(REACT_APP_HOST_PORT),
    ROOM_MAX_MESSAGES: parseInt(REACT_APP_ROOM_MAX_MESSAGES),
    ROOM_MAX_PLAYLIST: parseInt(REACT_APP_ROOM_MAX_PLAYLIST),
    ROOM_MAX_SOCKETS: parseInt(REACT_APP_ROOM_MAX_SOCKETS),
    SECURE: Boolean(REACT_APP_SECURE),
    VERSION: REACT_APP_VERSION,
    MAX_ROOMS: parseInt(REACT_APP_MAX_ROOMS),
};

export default env;
