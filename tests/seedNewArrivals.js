import mongoose from "mongoose";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { Product } from "../src/models/productModel.js";

const uri = "mongodb+srv://shankarbhabani271_db_user:w8brwRRQM9gxbHPE@cluster0.1rt9yud.mongodb.net/urbasi?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  // Update all 5 products to be new arrivals
  const res = await Product.updateMany({}, { $set: { isNewArrival: true } });
  console.log("Updated products count:", res.modifiedCount);
  process.exit(0);
}
run().catch(console.error);
