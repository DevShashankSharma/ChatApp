import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://chat-app-xl4c.vercel.app"
        ],
        credentials: true
    }
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

    // presence notify single user join
    if (userId) {
        io.emit("userOnline", userId);
    }

    // 🔵 TYPING EVENT
    socket.on("typing", (receiverId) => {
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing");
        }
    });

    // 🔵 TYPING TO ALL (for global announcements / group)
    socket.on('typingAll', () => {
        // broadcast to everyone that this user is typing in global chat
        io.emit('typingAll', { userId });
    });

    socket.on('stopTypingAll', () => {
        io.emit('stopTypingAll', { userId });
    });

    // 🔵 STOP TYPING
    socket.on("stopTyping", (receiverId) => {
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping");
        }
    });


    socket.on("disconnect", () => {
        console.log("User disconnected: ", socket.id);

        // remove the user from the userSocketMap
        for (const key in userSocketMap) {
            if (userSocketMap[key] === socket.id) {
                delete userSocketMap[key];
                break;
            }
        }
        // broadcast updated online list and presence event
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        io.emit("userOffline");
    });

    // Read receipt: payload { messageId, readerId }
    socket.on("messageRead", (payload) => {
        const { receiverId, messageId, readerId } = payload;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageRead", { messageId, readerId });
        }
    });

    // Message edited
    socket.on("editMessage", (payload) => {
        const { receiverId, message } = payload; // message is updated message doc
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("editMessage", message);
        }
    });

    // Message deleted
    socket.on("deleteMessage", (payload) => {
        const { receiverId, messageId } = payload;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("deleteMessage", { messageId });
        }
    });

    // Reaction added/removed
    socket.on("reaction", (payload) => {
        const { receiverId, message } = payload;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("reaction", message);
        }
    });

    // Simple WebRTC signaling events for call setup
    socket.on("callUser", (data) => {
        const { userToCall, from, signalData, callType } = data;
        const targetSocket = getReceiverSocketId(userToCall);
        if (targetSocket) {
            io.to(targetSocket).emit("incomingCall", { from, signalData, callType });
        }
    });

    socket.on("answerCall", (data) => {
        const { to, signalData } = data;
        const targetSocket = getReceiverSocketId(to);
        if (targetSocket) {
            io.to(targetSocket).emit("callAnswered", { signalData });
        }
    });

    socket.on("rejectCall", (data) => {
        const { to } = data;
        const targetSocket = getReceiverSocketId(to);
        if (targetSocket) {
            io.to(targetSocket).emit("callRejected");
        }
    });

    socket.on("endCall", (data) => {
        const { to } = data;
        const targetSocket = getReceiverSocketId(to);
        if (targetSocket) {
            io.to(targetSocket).emit("callEnded");
        }
    });
});



export { io, server, app };