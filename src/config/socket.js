import { Server } from "socket.io";

let io;

/**
 * Initializes the Socket.io instance and binds it to the HTTP server.
 * @param {object} httpServer - Native HTTP/HTTPS server instance
 * @returns {Server} Initialized Socket.io server instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Manage real-time events and connections
  io.on("connection", (socket) => {
    console.log(`🔌 [Socket] Client connected: ${socket.id}`);

    // Allow clients to join unique rooms (e.g. user specific notification rooms)
    socket.on("join_room", (roomName) => {
      socket.join(roomName);
      console.log(`👤 [Socket] Client ${socket.id} joined room: ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ [Socket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("🔌 Socket.io communication engine initialized.");
  return io;
};

/**
 * Retrieves the active Socket.io server instance.
 * @returns {Server} Active Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return io;
};
