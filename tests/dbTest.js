import mongoose from "mongoose";
import dns from "dns";

// Force IPv4 DNS resolution first
dns.setDefaultResultOrder("ipv4first");

// Direct Node.js to query Google Public DNS and Cloudflare DNS directly, bypassing problematic local ISP/router resolvers
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const uri = "mongodb+srv://shankarbhabani271_db_user:w8brwRRQM9gxbHPE@cluster0.1rt9yud.mongodb.net/urbasi?retryWrites=true&w=majority&appName=Cluster0";

console.log("⏳ Attempting to connect to MongoDB Atlas...");
mongoose.connect(uri)
  .then((conn) => {
    console.log("🟢 Connection SUCCESSFUL! Connected host:", conn.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.error("🔴 Connection FAILED:", err);
    process.exit(1);
  });
