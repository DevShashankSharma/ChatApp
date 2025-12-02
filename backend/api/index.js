import express from 'express';
import authRoutes from '../routes/auth.route.js';
import messageRoutes from '../routes/message.route.js';
import { connectDB } from '../lib/db.js';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { app, server, io } from '../lib/socket.js';

// const app = express();
dotenv.config();
const PORT = process.env.PORT||8000;

app.set("trust proxy", 1);

// CONNECT TO DATABASE FIRST
await connectDB();


app.use(express.json({ limit: "50mb" }));  //! set limit to 50mb so that large files can be uploaded
app.use(cookieParser());
app.use(cors({
    origin: "https://chatapprt.netlify.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.get("/", (req, res) => {
    res.send("Backend is running...");
});
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // connectDB();
});