import "dotenv/config";
import convict from "convict";

const envConfig = convict({
    NODE_ENV: {
        doc: "The stage of the application.",
        default: "production",
        format: ["production", "development"],
        env: "NODE_ENV",
    },
    PORT: {
        doc: "The port the server will run on.",
        format: "port",
        default: 3000,
        env: "PORT",
        arg: "port",
    },
    ADMIN_PASSWORD: {
        doc: "Admin password for the socket dashboard.",
        format: String,
        default: null,
        nullable: true, // In demo this is omitted so that anyone can access the dashboard.
        env: "ADMIN_PASSWORD",
    },
    ROOM_MAX_SOCKETS: {
        doc: "Max amount of sockets per room.",
        nullable: true,
        default: 10,
        env: "ROOM_MAX_SOCKETS",
    },
    ROOM_MAX_MESSAGES: {
        doc: "Max amount of messages per room.",
        nullable: true,
        default: 30,
        env: "ROOM_MAX_MESSAGES",
    },
});

envConfig.loadFile(`config/env/${envConfig.get("NODE_ENV")}.json`);
envConfig.validate({ allowed: "strict" });

export default envConfig.getProperties();