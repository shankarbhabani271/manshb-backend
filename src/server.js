import dotenv from "dotenv";
// Initialize env configurations immediately before any imports
dotenv.config();

import http from "http";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import { initSocket } from "./config/socket.js";
import { initCronJobs } from "./cron/cron.js";
import mongoose from "mongoose";

const preferredPort = parseInt(process.env.PORT || "5001", 10);
const server = http.createServer(app);

// Graceful shutdown helper to terminate listeners and database connections safely
const gracefulShutdown = (signal) => {
  console.log(`\n⏳ Received ${signal}. Initiating graceful shutdown...`);
  
  // Close HTTP server listener first to reject new incoming connections
  server.close(async () => {
    console.log("🟢 [Server] HTTP server closed.");
    
    try {
      // Close Mongoose DB connection pool
      await mongoose.connection.close();
      console.log("🟢 [Database] MongoDB connection closed.");
      process.exit(0);
    } catch (dbError) {
      console.error("🔴 [Database] Error during MongoDB connection close:", dbError);
      process.exit(1);
    }
  });

  // Force close process if server takes too long to shut down (10 seconds timeout)
  setTimeout(() => {
    console.error("🔴 [Server] Graceful shutdown timed out. Forcing process termination.");
    process.exit(1);
  }, 10000);
};

// Listen for OS termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Function to recursively find available port and start server
const startServer = (port) => {
  // Clear previous listeners to avoid duplicate callback attachments during port searching
  server.removeAllListeners("error");
  server.removeAllListeners("listening");

  // Bind error handler once
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`⚠️ [Server] Port ${port} is already in use. Trying next available port: ${port + 1}...`);
      // Try the next port
      startServer(port + 1);
    } else {
      console.error("🔴 [Server] Server socket error encountered:", error);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    console.log(`\n🚀 [Server] Booted successfully. Running at: http://localhost:${port}`);
    console.log(`📡 [Health] Diagnostics endpoint: http://localhost:${port}/health`);
  });
};

// Initialize Database connection, Socket engine, and Cron jobs
connectDB()
  .then(() => {
    // 1. Initialize real-time communications (Socket.io)
    initSocket(server);

    // 2. Initialize scheduled background processes (node-cron)
    initCronJobs();

    // 3. Start server with preferred port
    startServer(preferredPort);

    // Handle Unhandled Promise Rejections (e.g. database connectivity drops)
    process.on("unhandledRejection", (error) => {
      console.error("🔴 [Server] Unhandled Promise Rejection detected:", error);
      gracefulShutdown("unhandledRejection");
    });
  })
  .catch((error) => {
    console.error("🔴 [Server] Database initialization failed during startup:", error);
    process.exit(1);
  });

// Handle Uncaught Reference/Syntax exceptions
process.on("uncaughtException", (error) => {
  console.error("🔴 [Server] Uncaught Exception detected:", error);
  process.exit(1);
});
