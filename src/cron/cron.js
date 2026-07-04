import cron from "node-cron";
import { User } from "../models/userModel.js";

/**
 * Initializes and schedules app-wide background cron tasks.
 */
export const initCronJobs = () => {
  // Schedule a daily midnight database cleanup task (0 0 * * *)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("🧹 [Cron Job] Running database cleanup for unverified users...");
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Delete users who registered but never verified within 24 hours
      const result = await User.deleteMany({
        isVerified: false,
        createdAt: { $lt: oneDayAgo },
      });
      
      console.log(`✅ [Cron Job] Completed. Removed ${result.deletedCount} expired unverified users.`);
    } catch (error) {
      console.error("🔴 [Cron Job] Error during unverified users cleanup:", error);
    }
  });

  console.log("⏰ Background cron scheduler initialized successfully.");
};
export default initCronJobs;
