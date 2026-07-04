import { User } from "../models/userModel.js";
import { Category } from "../models/categoryModel.js";
import { Product } from "../models/productModel.js";
import { ROLES } from "../constants/roles.js";

/**
 * Seeds sample categories and products if they don't exist
 */
const seedCategoriesAndProducts = async (superAdminId) => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount > 0) {
      console.log("ℹ️ [Seeder] Categories already exist. Skipping category/product seeding.");
      return;
    }

    const defaultCategories = [
      {
        name: "Development Boards",
        slug: "development-boards",
        image: "https://images.unsplash.com/photo-1608564697071-dd41115567f2?w=300&auto=format&fit=crop&q=80",
        description: "Microcontroller and microprocessor development boards.",
        displayOrder: 1,
        status: "published",
      },
      {
        name: "Batteries, Power Supply & Accessories",
        slug: "batteries-power-supply-accessories",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&auto=format&fit=crop&q=80",
        description: "Lithium packs, regulators, adapters, and chargers.",
        displayOrder: 2,
        status: "published",
      },
      {
        name: "Sensors",
        slug: "sensors",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80",
        description: "Ultrasonic, infrared, temperature, and motion sensors.",
        displayOrder: 3,
        status: "published",
      },
      {
        name: "Electronic Components",
        slug: "electronic-components",
        image: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=300&auto=format&fit=crop&q=80",
        description: "Resistors, capacitors, transistors, and diodes.",
        displayOrder: 4,
        status: "published",
      },
      {
        name: "Motors, Drives, Pumps & Actuators",
        slug: "motors-drives-pumps-actuators",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&auto=format&fit=crop&q=80",
        description: "DC motors, servo motors, stepper motors, and driver boards.",
        displayOrder: 5,
        status: "published",
      },
      {
        name: "Electronic Modules & Displays",
        slug: "electronic-modules-displays",
        image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=300&auto=format&fit=crop&q=80",
        description: "OLED displays, LCD screens, and breakout modules.",
        displayOrder: 6,
        status: "published",
      },
      {
        name: "IoT & Wireless Modules",
        slug: "iot-wireless-modules",
        image: "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=300&auto=format&fit=crop&q=80",
        description: "Wi-Fi, Bluetooth, LoRa, and RF modules.",
        displayOrder: 7,
        status: "published",
      },
      {
        name: "DIY & Maker Kits",
        slug: "diy-maker-kits",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80",
        description: "STEM kits, soldering templates, and project parts.",
        displayOrder: 8,
        status: "published",
      },
      {
        name: "Robotics Kits",
        slug: "robotics-kits",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&auto=format&fit=crop&q=80",
        description: "Robotic arm, chassis, and custom build kits.",
        displayOrder: 9,
        status: "published",
      },
      {
        name: "Arduino Boards",
        slug: "arduino-boards",
        image: "https://images.unsplash.com/photo-1608564697071-dd41115567f2?w=300&auto=format&fit=crop&q=80",
        description: "Official and compatible Arduino microcontroller boards.",
        displayOrder: 10,
        status: "published",
      },
      {
        name: "Raspberry Pi",
        slug: "raspberry-pi",
        image: "https://images.unsplash.com/photo-1551708389-71a34eebe447?w=300&auto=format&fit=crop&q=80",
        description: "Raspberry Pi microcomputers and official accessories.",
        displayOrder: 11,
        status: "published",
      },
      {
        name: "Test & Measurement Tools",
        slug: "test-measurement-tools",
        image: "https://images.unsplash.com/photo-1601524909162-be87252be298?w=300&auto=format&fit=crop&q=80",
        description: "Multimeters, logic analyzers, and test probes.",
        displayOrder: 12,
        status: "published",
      },
    ];

    const seededCategories = [];
    for (const cat of defaultCategories) {
      const created = await Category.create({
        ...cat,
        createdBy: superAdminId,
        updatedBy: superAdminId,
      });
      seededCategories.push(created);
    }
    console.log(`🟢 [Seeder] Seeded ${seededCategories.length} categories.`);

    // Find and seed products linked to categories
    const devBoardsCat = seededCategories.find((c) => c.slug === "development-boards");
    const sensorsCat = seededCategories.find((c) => c.slug === "sensors");
    const componentsCat = seededCategories.find((c) => c.slug === "electronic-components");
    const roboticsCat = seededCategories.find((c) => c.slug === "robotics-kits");

    const sampleProducts = [
      {
        title: "ESP32-WROOM-32D Development Board WiFi+Bluetooth",
        slug: "esp32-wroom-32d-development-board-wifi-bluetooth",
        price: 499.00,
        image: "https://images.unsplash.com/photo-1608564697071-dd41115567f2?w=300&auto=format&fit=crop&q=80",
        description: "High-performance MCU board with integrated Wi-Fi and Bluetooth connectivity, ideal for IoT prototyping.",
        sku: "DEV-ESP32-WROOM",
        badge: "NEW",
        category: devBoardsCat?._id,
        status: "published",
        isNewArrival: true,
        displayOrder: 1,
        rating: 5,
        reviewsCount: 8,
      },
      {
        title: "Arduino Uno R3 Compatible Board (Atmega328P)",
        slug: "arduino-uno-r3-compatible-board-atmega328p",
        price: 650.00,
        image: "https://images.unsplash.com/photo-1608564697071-dd41115567f2?w=300&auto=format&fit=crop&q=80",
        description: "The classic microcontroller board compatible with Arduino software, featuring 14 digital and 6 analog I/O pins.",
        sku: "DEV-UNO-R3",
        badge: "POPULAR",
        category: devBoardsCat?._id,
        status: "published",
        isNewArrival: true,
        displayOrder: 2,
        rating: 5,
        reviewsCount: 12,
      },
      {
        title: "High-Precision Ultrasonic Distance Sensor HC-SR04",
        slug: "high-precision-ultrasonic-distance-sensor-hc-sr04",
        price: 150.00,
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80",
        description: "Standard ultrasonic ranging module providing 2cm to 400cm non-contact measurement functionality.",
        sku: "SEN-HCSR04",
        badge: "NEW",
        category: sensorsCat?._id,
        status: "published",
        isNewArrival: true,
        displayOrder: 1,
        rating: 4,
        reviewsCount: 5,
      },
      {
        title: "SG90 Micro Servo Motor 9g for Robotics",
        slug: "sg90-micro-servo-motor-9g-for-robotics",
        price: 180.00,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&auto=format&fit=crop&q=80",
        description: "Lightweight, reliable micro servo motor rotating 180 degrees, perfect for RC hobby and robotic arms.",
        sku: "MOT-SG90",
        badge: "",
        category: componentsCat?._id,
        status: "published",
        isNewArrival: true,
        displayOrder: 1,
        rating: 4,
        reviewsCount: 3,
      },
      {
        title: "4WD Smart Robot Car Starter Kit with Bluetooth Control",
        slug: "4wd-smart-robot-car-starter-kit-with-bluetooth-control",
        price: 3499.00,
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&auto=format&fit=crop&q=80",
        description: "An educational DIY kit containing everything needed to assemble and program a Bluetooth-enabled robotic vehicle.",
        sku: "KIT-4WDCAR",
        badge: "BESTSELLER",
        category: roboticsCat?._id,
        status: "published",
        isNewArrival: true,
        displayOrder: 1,
        rating: 5,
        reviewsCount: 18,
      },
    ];

    await Product.insertMany(sampleProducts);
    console.log(`🟢 [Seeder] Seeded ${sampleProducts.length} sample products.`);

  } catch (err) {
    console.error("🔴 [Seeder Error] Failed to seed categories and products:", err.message);
  }
};

/**
 * Automatically seeds a single default SUPER_ADMIN user into the database
 * on server boot if no Super Admin user exists.
 */
export const seedSuperAdmin = async () => {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "shankarbhabani271@gmail.com";
    
    const name = process.env.SUPER_ADMIN_NAME || "Bhabani Shankar";
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "superadmin";

    // Check if any Super Admin exists by role, email, or generated username
    let superAdmin = await User.findOne({
      $or: [
        { role: ROLES.SUPER_ADMIN },
        { email: superAdminEmail },
        { username: username }
      ]
    });

    if (!superAdmin) {
      const password = process.env.SUPER_ADMIN_PASSWORD;
      if (!password) {
        console.warn("⚠️ [Seeder Warning] SUPER_ADMIN_PASSWORD is not defined in environment variables. Super Admin was not seeded!");
        return;
      }

      // Create the default Super Admin user (isVerified = true)
      superAdmin = await User.create({
        username: username || "superadmin",
        email: superAdminEmail,
        password: password,
        role: ROLES.SUPER_ADMIN,
        isVerified: true,
      });

      console.log(`\n👑 [Seeder] Default Super Admin account successfully created!`);
      console.log(`✉️ Email: ${superAdminEmail}`);
    } else {
      console.log("ℹ️ [Seeder] Super Admin or user with matching name/email already exists. Skipping user seeding.");
    }

    // Run categories and products seeding
    await seedCategoriesAndProducts(superAdmin._id);
  } catch (error) {
    console.error("🔴 [Seeder Error] Failed to seed default Super Admin:", error.message);
  }
};

export default seedSuperAdmin;
