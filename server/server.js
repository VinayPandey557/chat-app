import dotenv from "dotenv"
dotenv.config();
import express from "express"
import cors from "cors";
import http from "http"
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const JWT_SECRET = process.env.JWT_SECRET



// Create Express app and http server
const app = express();
const server = http.createServer(app)

//socket.io server
export const io = new Server(server, {
    cors: { origin: "*"}
}) 


// Store online users

export const userSocketMap = {}; // { userId, socketId }

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
   

    if(userId) userSocketMap[userId] = socket.id;

    //Emit online users to all connected users
     io.emit("getOnlineUsers", Object.keys(userSocketMap));

     socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
     })
})


//Middleware Setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

//Route Setup
app.use("/api/status", (req, res) => {
    res.send("Server is live")
})
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)



await connectDB();

const PORT = process.env.PORT || 5000;


server.listen(PORT, () => console.log(`Server is running on ${PORT}`));




