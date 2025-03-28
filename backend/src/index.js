import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
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
    origin: "http://localhost:5173",
    credentials: true
}));


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});