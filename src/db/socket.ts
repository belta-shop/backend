import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: ["*"],
    methods: ["GET", "POST"],
  },
});

const adminNamespace = io.of("/admin");

export { io, adminNamespace };
