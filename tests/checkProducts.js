import mongoose from "mongoose";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { Product } from "../src/models/productModel.js";

const uri = "mongodb+srv://shankarbhabani271_db_user:w8brwRRQM9gxbHPE@cluster0.1rt9yud.mongodb.net/urbasi?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const products = await Product.find({});
  console.log("Total products count:", products.length);
  const newArrivals = products.filter(p => p.isNewArrival);
  console.log("New arrivals count:", newArrivals.length);
  if (products.length > 0) {
    console.log("First product in full:", products[0]);
  }
  process.exit(0);
}
run().catch(console.error);
