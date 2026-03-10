import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import announcementRoutes from './routes/announcement.route.js';
import { connectDB } from './lib/db.js';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { app, server, io } from './lib/socket.js';

// const app = express();
dotenv.config(); 
const PORT = process.env.PORT;  



app.use(express.json({ limit: "50mb" }));  //! set limit to 50mb so that large files can be uploaded
app.use(cookieParser());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://chat-app-xl4c.vercel.app"
    ],
    credentials: true
}));
app.set("trust proxy", 1);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/announcements", announcementRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});