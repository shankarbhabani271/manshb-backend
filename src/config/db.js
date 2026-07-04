import mongoose from "mongoose";
import dns from "dns";
import { seedSuperAdmin } from "./seeder.js";

// Resolve querySrv ECONNREFUSED issues on local Windows networks
// 1. Prioritize IPv4 DNS lookups (Node 17+ defaults to IPv6 which fails on some ISP routers)
dns.setDefaultResultOrder("ipv4first");

// 2. Query public DNS servers directly to resolve Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (error) {
  console.warn("⚠️ [DNS Warning] Failed to bind custom DNS servers. Using default resolver:", error.message);
}

/**
 * Asynchronously connects to MongoDB using Mongoose with retry logic and connection pooling.
 * @param {number} retries - Number of connection attempts before failing
 * @param {number} delay - Delay between retries in milliseconds
 */
const connectDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`, {
        maxPoolSize: 10, // Maintain up to 10 active socket connections
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      });
      console.log(`\n🟢 MongoDB Connected! Db Host: ${connectionInstance.connection.host}`);
      
      // Auto-run Super Admin database seeding check
      await seedSuperAdmin();
      
      return;
    } catch (error) {
      retries -= 1;
      console.error(`🔴 MongoDB Connection FAILED. Retries left: ${retries}. Error:`, error.message);
      if (retries === 0) {
        console.error("🔴 All MongoDB connection attempts failed. Exiting...");
        process.exit(1);
      }
      console.log(`⏳ Waiting ${delay / 1000} seconds before retrying connection...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;
