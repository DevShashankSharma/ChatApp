import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["https://chatapprt.netlify.app/"], // frontend url
        methods: ["GET", "POST"],
        credentials: true,
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
}

// this is used to store online users 
const userSocketMap = {};  // { userId: socketId } is the structure

io.on("connection", (socket) => {
    console.log("New connection: ", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    // io.emit() -> sends events to all connected clients 
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User disconnected: ", socket.id);

        // remove the user from the userSocketMap
        for (const key in userSocketMap) {
            if (userSocketMap[key] === socket.id) {
                delete userSocketMap[key];
                break;
            }
        }
    });
});



export { io, server, app };