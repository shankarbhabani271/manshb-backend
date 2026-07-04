import mongoose from "mongoose";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const uri = "mongodb+srv://shankarbhabani271_db_user:w8brwRRQM9gxbHPE@cluster0.1rt9yud.mongodb.net/urbasi?retryWrites=true&w=majority&appName=Cluster0";

// ── Schema ─────────────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({ name: String, slug: String, image: String, description: String, displayOrder: Number, status: String });
const Category = mongoose.model("Category", categorySchema);

const productSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true, lowercase: true },
  price: Number, image: String, description: String,
  sku: String, badge: String,
  category: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: "published" },
  isNewArrival: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });
const Product = mongoose.model("Product", productSchema);

// ── Sample product data (16 items) ─────────────────────────────────────────
const PRODUCTS = [
  { title: "ESP32-WROOM-32D Development Board WiFi+Bluetooth",      slug: "esp32-wroom-32d-v2",                sku: "DEV-ESP32-V2",   badge: "HOT",     price: 499,   rating: 5, reviewsCount: 312, image: "https://images.unsplash.com/photo-1608564697071-dd41115567f2?w=300&auto=format&fit=crop&q=80" },
  { title: "Arduino Uno R3 Compatible Board (ATmega328P)",          slug: "arduino-uno-r3-v2",                 sku: "DEV-ARD-UNO",   badge: "",        price: 349,   rating: 4, reviewsCount: 204, image: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=300&auto=format&fit=crop&q=80" },
  { title: "HC-SR04 Ultrasonic Distance Sensor Module",            slug: "hc-sr04-ultrasonic-v2",             sku: "SEN-HC04",      badge: "NEW",     price: 79,    rating: 4, reviewsCount: 189, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80" },
  { title: "Raspberry Pi 4 Model B – 4GB RAM",                     slug: "rpi4-4gb-v2",                       sku: "DEV-RPI4-4G",   badge: "",        price: 5499,  rating: 5, reviewsCount: 421, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&auto=format&fit=crop&q=80" },
  { title: "28BYJ-48 Stepper Motor + ULN2003 Driver Board",        slug: "28byj48-stepper-uln2003-v2",        sku: "MOT-STP-28",    badge: "",        price: 149,   rating: 4, reviewsCount: 93,  image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&auto=format&fit=crop&q=80" },
  { title: "DHT22 Temperature & Humidity Sensor",                   slug: "dht22-temp-humidity-v2",            sku: "SEN-DHT22",     badge: "NEW",     price: 129,   rating: 4, reviewsCount: 156, image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=300&auto=format&fit=crop&q=80" },
  { title: "L298N Dual H-Bridge Motor Driver Module",               slug: "l298n-motor-driver-v2",             sku: "MOD-L298N",     badge: "",        price: 119,   rating: 4, reviewsCount: 211, image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=300&auto=format&fit=crop&q=80" },
  { title: "16×2 I2C LCD Display Module (Blue Backlight)",          slug: "lcd-16x2-i2c-blue-v2",             sku: "DIS-LCD-16I2",  badge: "",        price: 99,    rating: 4, reviewsCount: 87,  image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80" },
  { title: "MPU-6050 6-DOF Gyroscope + Accelerometer Module",      slug: "mpu6050-gyro-accel-v2",             sku: "SEN-MPU6050",   badge: "HOT",     price: 159,   rating: 5, reviewsCount: 342, image: "https://images.unsplash.com/photo-1586325194227-7625ed4e2a09?w=300&auto=format&fit=crop&q=80" },
  { title: "NodeMCU ESP8266 WiFi Development Board",                slug: "nodemcu-esp8266-v2",                sku: "DEV-NODEMCU",   badge: "",        price: 249,   rating: 4, reviewsCount: 278, image: "https://images.unsplash.com/photo-1608564697071-dd41115567f2?w=300&auto=format&fit=crop&q=80" },
  { title: "SG90 Micro Servo Motor 9g",                             slug: "sg90-micro-servo-v2",               sku: "MOT-SG90",      badge: "",        price: 69,    rating: 4, reviewsCount: 134, image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&auto=format&fit=crop&q=80" },
  { title: "OLED 0.96\" 128×64 I2C Display Module",                 slug: "oled-096-128x64-i2c-v2",           sku: "DIS-OLED-096",  badge: "NEW",     price: 189,   rating: 5, reviewsCount: 298, image: "https://images.unsplash.com/photo-1592659762303-90081d34b277?w=300&auto=format&fit=crop&q=80" },
  { title: "IR Obstacle Avoidance Sensor Module",                   slug: "ir-obstacle-sensor-v2",             sku: "SEN-IROBS",     badge: "",        price: 49,    rating: 3, reviewsCount: 67,  image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=300&auto=format&fit=crop&q=80" },
  { title: "Breadboard 830 Points + 65pcs Jumper Wires Kit",       slug: "breadboard-830-jumpers-kit-v2",     sku: "KIT-BB830JW",   badge: "",        price: 179,   rating: 4, reviewsCount: 412, image: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=300&auto=format&fit=crop&q=80" },
  { title: "BMP280 Barometric Pressure & Temperature Sensor",       slug: "bmp280-pressure-temp-v2",           sku: "SEN-BMP280",    badge: "NEW",     price: 109,   rating: 4, reviewsCount: 88,  image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80" },
  { title: "DC 5V 2-Channel Relay Module for Arduino / Pi",        slug: "relay-2ch-5v-v2",                   sku: "MOD-RLY2CH",    badge: "",        price: 89,    rating: 4, reviewsCount: 143, image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=300&auto=format&fit=crop&q=80" },
];

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  // Get first available category
  const cat = await Category.findOne({});
  if (!cat) { console.error("❌ No category found. Create at least one category first."); process.exit(1); }
  console.log(`📦 Using category: ${cat.name} (${cat._id})`);

  let inserted = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const existing = await Product.findOne({ slug: p.slug });
    if (existing) {
      // Make sure it has isNewArrival: true
      if (!existing.isNewArrival) {
        await Product.updateOne({ _id: existing._id }, { isNewArrival: true });
        console.log(`🔄 Updated isNewArrival: ${p.title}`);
      } else {
        console.log(`⏭  Skipped (already exists): ${p.title}`);
      }
      skipped++;
      continue;
    }
    await Product.create({ ...p, category: cat._id, status: "published", isNewArrival: true, displayOrder: inserted + 1 });
    console.log(`✅ Inserted: ${p.title}`);
    inserted++;
  }

  console.log(`\n🎉 Done! ${inserted} inserted, ${skipped} skipped/updated.`);
  process.exit(0);
}

run().catch((err) => { console.error("❌ Error:", err.message); process.exit(1); });
