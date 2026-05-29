import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.model";
import MenuItem from "../models/MenuItem.model";
import User from "../models/User.model";
import Coupon from "../models/Coupon.model";
import Order from "../models/Order.model";
import Notification from "../models/Notification.model";
import RestaurantSettings from "../models/RestaurantSettings.model";
import DiningTable from "../models/DiningTable.model";

dotenv.config();

const UNSPLASH_IMAGES: Record<string, string> = {
  burger:     "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
  sandwich:   "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80",
  fries:      "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80",
  pasta:      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80",
  pizza:      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  shake:      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80",
  noodles:    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80",
  momos:      "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&q=80",
  springroll: "https://images.unsplash.com/photo-1606335543042-57c525cddcb4?w=400&q=80",
  dip:        "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80",
  coffee:     "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
};

const CATEGORIES = [
  { name: "Burger",          slug: "burger",        image: UNSPLASH_IMAGES.burger,     sortOrder: 1 },
  { name: "Sandwich",        slug: "sandwich",      image: UNSPLASH_IMAGES.sandwich,   sortOrder: 2 },
  { name: "Fries",           slug: "fries",         image: UNSPLASH_IMAGES.fries,      sortOrder: 3 },
  { name: "Pasta",           slug: "pasta",         image: UNSPLASH_IMAGES.pasta,      sortOrder: 4 },
  { name: "Side Order",      slug: "side-order",    image: UNSPLASH_IMAGES.dip,        sortOrder: 5 },
  { name: "Pizza",           slug: "pizza",         image: UNSPLASH_IMAGES.pizza,      sortOrder: 6 },
  { name: "Combo",           slug: "combo",         image: UNSPLASH_IMAGES.pizza,      sortOrder: 7 },
  { name: "Extra",           slug: "extra",         image: UNSPLASH_IMAGES.pizza,      sortOrder: 8 },
  { name: "Shake & Dessert", slug: "shake-dessert", image: UNSPLASH_IMAGES.shake,      sortOrder: 9 },
  { name: "Noodles",         slug: "noodles",       image: UNSPLASH_IMAGES.noodles,    sortOrder: 10 },
  { name: "Momos",           slug: "momos",         image: UNSPLASH_IMAGES.momos,      sortOrder: 11 },
  { name: "Spring Roll",     slug: "spring-roll",   image: UNSPLASH_IMAGES.springroll, sortOrder: 12 },
];

// Each item: name + sizes array (label + price). Single-size items use one entry.
interface SeedItem {
  name: string;
  sizes: { label: string; price: number }[];
}

const ITEMS_BY_CATEGORY: Record<string, SeedItem[]> = {
  burger: [
    { name: "Aloo Tikki Burger",   sizes: [{ label: "Regular", price: 30 }] },
    { name: "Veggie Burger",       sizes: [{ label: "Regular", price: 45 }] },
    { name: "Cheesy Burger",       sizes: [{ label: "Regular", price: 60 }] },
    { name: "Cheesy Spicy Burger", sizes: [{ label: "Regular", price: 65 }] },
    { name: "Paneer Tikka Burger", sizes: [{ label: "Regular", price: 80 }] },
  ],
  sandwich: [
    { name: "Grilled Sandwich (2 pcs.)",  sizes: [{ label: "Regular", price: 60 }] },
    { name: "Cheesy Grill",               sizes: [{ label: "Regular", price: 70 }] },
    { name: "Paneer Grilled Sandwich",    sizes: [{ label: "Regular", price: 85 }] },
    { name: "Cheese Toast",               sizes: [{ label: "Regular", price: 80 }] },
  ],
  fries: [
    { name: "French Fries",   sizes: [{ label: "Regular", price: 59 }] },
    { name: "Masala Fries",   sizes: [{ label: "Regular", price: 69 }] },
    { name: "Saucy Fries",    sizes: [{ label: "Regular", price: 79 }] },
    { name: "Peri-Peri Fries",sizes: [{ label: "Regular", price: 89 }] },
  ],
  pasta: [
    { name: "Red Pasta",      sizes: [{ label: "Regular", price: 79 }] },
    { name: "White Pasta",    sizes: [{ label: "Regular", price: 89 }] },
    { name: "Jambo Pasta",    sizes: [{ label: "Regular", price: 99 }] },
    { name: "Tandoori Pasta", sizes: [{ label: "Regular", price: 99 }] },
    { name: "Makhni Pasta",   sizes: [{ label: "Regular", price: 99 }] },
  ],
  "side-order": [
    { name: "Cheesy Dip", sizes: [{ label: "Regular", price: 20 }] },
    { name: "Spicy Dip",  sizes: [{ label: "Regular", price: 20 }] },
  ],
  pizza: [
    {
      name: "Plain Pizza",
      sizes: [
        { label: "Regular", price: 99 },
        { label: "Medium",  price: 199 },
        { label: "Large",   price: 299 },
      ],
    },
    {
      name: "Cheesy Mushroom Pizza",
      sizes: [
        { label: "Regular", price: 139 },
        { label: "Medium",  price: 269 },
        { label: "Large",   price: 399 },
      ],
    },
    { name: "Cheesy Tomato Pizza", sizes: [{ label: "Regular", price: 139 }] },
    { name: "Margherita Pizza",    sizes: [{ label: "Regular", price: 139 }] },
    { name: "Cheese & Corn Pizza", sizes: [{ label: "Regular", price: 139 }] },
    {
      name: "Achari Pizza",
      sizes: [
        { label: "Regular", price: 149 },
        { label: "Medium",  price: 289 },
        { label: "Large",   price: 399 },
      ],
    },
    { name: "Paneer Makhani Pizza", sizes: [{ label: "Regular", price: 149 }] },
    {
      name: "Veg Deluxe Pizza",
      sizes: [
        { label: "Regular", price: 169 },
        { label: "Medium",  price: 309 },
        { label: "Large",   price: 469 },
      ],
    },
    { name: "Chilli Pizza",        sizes: [{ label: "Regular", price: 169 }] },
    {
      name: "Spicy Achaari Pizza",
      sizes: [
        { label: "Regular", price: 189 },
        { label: "Medium",  price: 329 },
        { label: "Large",   price: 479 },
      ],
    },
    { name: "Gourmet Pizza",       sizes: [{ label: "Regular", price: 189 }] },
    { name: "Spicy Paneer Pizza",  sizes: [{ label: "Regular", price: 189 }] },
    {
      name: "Pizza King",
      sizes: [
        { label: "Regular", price: 209 },
        { label: "Medium",  price: 399 },
        { label: "Large",   price: 549 },
      ],
    },
  ],
  combo: [
    { name: "4 Pizza Combo",    sizes: [{ label: "Regular", price: 275 }] },
    { name: "5 Pizza Combo",    sizes: [{ label: "Regular", price: 420 }] },
    { name: "Singles Onion",    sizes: [{ label: "Add-on",  price: 65 }] },
    { name: "Singles Capsicum", sizes: [{ label: "Add-on",  price: 70 }] },
    { name: "Singles Corn",     sizes: [{ label: "Add-on",  price: 70 }] },
    { name: "Singles Tomato",   sizes: [{ label: "Add-on",  price: 70 }] },
    { name: "Onion & Capsicum", sizes: [{ label: "Add-on",  price: 80 }] },
    { name: "Onion & Corn",     sizes: [{ label: "Add-on",  price: 80 }] },
    { name: "Paneer & Capsicum",sizes: [{ label: "Add-on",  price: 100 }] },
    { name: "Paneer & Onion",   sizes: [{ label: "Add-on",  price: 100 }] },
    { name: "Corn & Capsicum",  sizes: [{ label: "Add-on",  price: 90 }] },
  ],
  extra: [
    {
      name: "Extra Topping",
      sizes: [
        { label: "Regular", price: 20 },
        { label: "Medium",  price: 30 },
        { label: "Large",   price: 50 },
      ],
    },
    {
      name: "Extra Cheese",
      sizes: [
        { label: "Regular", price: 30 },
        { label: "Medium",  price: 50 },
        { label: "Large",   price: 90 },
      ],
    },
  ],
  "shake-dessert": [
    { name: "Vanilla Shake",      sizes: [{ label: "Regular", price: 69 }] },
    { name: "Chocolate Shake",    sizes: [{ label: "Regular", price: 79 }] },
    { name: "Butterscotch Shake", sizes: [{ label: "Regular", price: 79 }] },
    { name: "Strawberry Shake",   sizes: [{ label: "Regular", price: 79 }] },
    { name: "Coke / Sprite",      sizes: [{ label: "Regular", price: 20 }] },
    { name: "Cold Coffee",        sizes: [{ label: "Regular", price: 79 }] },
    { name: "Hot Coffee",         sizes: [{ label: "Regular", price: 39 }] },
  ],
  noodles: [
    {
      name: "Simple Noodles",
      sizes: [
        { label: "Half", price: 30 },
        { label: "Full", price: 60 },
      ],
    },
    {
      name: "Veg Noodles",
      sizes: [
        { label: "Half", price: 40 },
        { label: "Full", price: 80 },
      ],
    },
    {
      name: "Paneer Noodles",
      sizes: [
        { label: "Half", price: 50 },
        { label: "Full", price: 100 },
      ],
    },
  ],
  momos: [
    {
      name: "Simple Momos",
      sizes: [
        { label: "Half", price: 50 },
        { label: "Full", price: 100 },
      ],
    },
    {
      name: "Veg Momos",
      sizes: [
        { label: "Half", price: 70 },
        { label: "Full", price: 140 },
      ],
    },
    {
      name: "Paneer Momos",
      sizes: [
        { label: "Half", price: 80 },
        { label: "Full", price: 160 },
      ],
    },
  ],
  "spring-roll": [
    { name: "Spring Roll (2 pcs.)", sizes: [{ label: "Regular", price: 79 }] },
    { name: "Spring Roll (4 pcs.)", sizes: [{ label: "Regular", price: 159 }] },
  ],
};

const SLUG_IMAGE_MAP: Record<string, string> = {
  burger: "burger", sandwich: "sandwich", fries: "fries", pasta: "pasta",
  "side-order": "dip", pizza: "pizza", combo: "pizza", extra: "pizza",
  "shake-dessert": "shake", noodles: "noodles", momos: "momos", "spring-roll": "springroll",
};

const SEED_USERS = [
  { name: "Super Admin",        email: "admin@apna.com",         phone: "9000000001", password: "Admin@123", role: "admin" },
  { name: "Restaurant Manager", email: "manager@apna.com",       phone: "9000000002", password: "Admin@123", role: "admin" },
  { name: "Rohit (Staff)",      email: "rohit.staff@apna.com",   phone: "9000000003", password: "Staff@123", role: "staff" },
  { name: "Priya (Staff)",      email: "priya.staff@apna.com",   phone: "9000000004", password: "Staff@123", role: "staff" },
  { name: "Anil (Staff)",       email: "anil.staff@apna.com",    phone: "9000000005", password: "Staff@123", role: "staff" },
  { name: "Rahul Kumar",        email: "rahul@example.com",      phone: "9100000001", password: "User@123",  role: "user" },
  { name: "Sneha Sharma",       email: "sneha@example.com",      phone: "9100000002", password: "User@123",  role: "user" },
  { name: "Vikram Singh",       email: "vikram@example.com",     phone: "9100000003", password: "User@123",  role: "user" },
  { name: "Pooja Patel",        email: "pooja@example.com",      phone: "9100000004", password: "User@123",  role: "user" },
  { name: "Amit Gupta",         email: "amit@example.com",       phone: "9100000005", password: "User@123",  role: "user" },
];

async function seed() {
  const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/apna-restaurant";
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  await Category.deleteMany({});
  await MenuItem.deleteMany({});
  await User.deleteMany({});
  await Coupon.deleteMany({});
  await Order.deleteMany({});
  await Notification.deleteMany({});
  await RestaurantSettings.deleteMany({});
  await DiningTable.deleteMany({});
  console.log("Cleared existing data");

  // Categories
  const categoryDocs = await Category.insertMany(CATEGORIES);
  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const doc of categoryDocs) categoryMap[doc.slug] = doc._id as mongoose.Types.ObjectId;
  console.log(`Inserted ${categoryDocs.length} categories`);

  // Menu Items
  const allItems: any[] = [];
  for (const [slug, items] of Object.entries(ITEMS_BY_CATEGORY)) {
    const catId = categoryMap[slug];
    if (!catId) { console.warn(`No category for slug: ${slug}`); continue; }
    const imgUrl = UNSPLASH_IMAGES[SLUG_IMAGE_MAP[slug] ?? "pizza"];
    items.forEach((item, idx) => {
      const basePrice = item.sizes[0].price;
      const sizes = item.sizes.length > 1 ? item.sizes : [];
      allItems.push({
        name: item.name,
        description: `Fresh and delicious ${item.name}.`,
        price: basePrice,
        image: imgUrl,
        category: catId,
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        tags: [slug],
        sortOrder: idx,
        sizes,
      });
    });
  }
  await MenuItem.insertMany(allItems);
  console.log(`Inserted ${allItems.length} menu items`);

  // Users
  for (const userData of SEED_USERS) {
    await User.create(userData);
  }
  console.log(`Inserted ${SEED_USERS.length} users`);
  console.log("  Admin    -> admin@apna.com / Admin@123");
  console.log("  Staff    -> rohit.staff@apna.com / Staff@123");
  console.log("  Customer -> rahul@example.com / User@123");

  // Coupons
  const tomorrow  = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextYear  = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

  await Coupon.insertMany([
    { code: "WELCOME20", type: "percentage", value: 20, minOrderAmount: 200, maxDiscount: 100, usageLimit: 500, usedCount: 42, expiresAt: nextYear,  isActive: true },
    { code: "FLAT50",    type: "flat",       value: 50, minOrderAmount: 299, usageLimit: 200, usedCount: 18,  expiresAt: nextMonth, isActive: true },
    { code: "PIZZA30",   type: "percentage", value: 30, minOrderAmount: 399, maxDiscount: 150, usageLimit: 100, usedCount: 7, expiresAt: nextMonth, isActive: true },
    { code: "BURGER10",  type: "flat",       value: 10, minOrderAmount: 99,  usageLimit: 1000, usedCount: 234, expiresAt: nextYear, isActive: true },
    { code: "WEEKEND50", type: "flat",       value: 50, minOrderAmount: 500, usageLimit: 50,  usedCount: 50,  expiresAt: tomorrow, isActive: false },
    { code: "EXPIRED",   type: "flat",       value: 30, minOrderAmount: 100, usageLimit: 100, usedCount: 100, expiresAt: yesterday, isActive: false },
  ]);
  console.log("Inserted 6 coupons");

  // Dining tables (QR ordering)
  await DiningTable.insertMany([
    { tableNumber: 1, label: "Table 1", capacity: 2, status: "available" },
    { tableNumber: 2, label: "Table 2", capacity: 4, status: "occupied" },
    { tableNumber: 3, label: "Table 3", capacity: 4, status: "available" },
    { tableNumber: 4, label: "Table 4", capacity: 6, status: "reserved" },
    { tableNumber: 5, label: "Table 5", capacity: 4, status: "available" },
    { tableNumber: 6, label: "Table 6", capacity: 8, status: "available" },
    { tableNumber: 7, label: "Window Booth", capacity: 4, status: "available" },
    { tableNumber: 8, label: "Family Table", capacity: 10, status: "available" },
  ]);
  console.log("Inserted 8 dining tables");

  // Orders + Notifications
  const menuItems = await MenuItem.find().limit(10);
  const customers = await User.find({ role: "user" }).limit(3);
  const adminUser = await User.findOne({ role: "admin" });

  if (menuItems.length >= 3 && customers.length >= 2) {
    const statuses = ["pending", "accepted", "preparing", "ready", "delivered", "delivered", "delivered", "cancelled"];
    const orderDocs: any[] = [];

    for (let i = 0; i < 12; i++) {
      const customer = customers[i % customers.length];
      const item1 = menuItems[i % menuItems.length];
      const item2 = menuItems[(i + 2) % menuItems.length];
      const qty1 = (i % 3) + 1;
      const qty2 = (i % 2) + 1;
      const subtotal = item1.price * qty1 + item2.price * qty2;
      const gst = Math.round(subtotal * 0.05);
      const delivery = i % 3 === 0 ? 30 : 0;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - (i % 7));

      orderDocs.push({
        orderNumber: `ORD-${2000 + i}`,
        customer: customer._id,
        items: [
          { menuItem: item1._id, name: item1.name, price: item1.price, quantity: qty1, subtotal: item1.price * qty1 },
          { menuItem: item2._id, name: item2.name, price: item2.price, quantity: qty2, subtotal: item2.price * qty2 },
        ],
        status: statuses[i % statuses.length],
        orderType: i % 3 === 0 ? "delivery" : i % 3 === 1 ? "dine-in" : "takeaway",
        tableNumber: i % 3 === 1 ? (i % 4) + 1 : undefined,
        subtotal,
        gstAmount: gst,
        deliveryCharge: delivery,
        discountAmount: 0,
        totalAmount: subtotal + gst + delivery,
        paymentMethod: i % 2 === 0 ? "cash" : "online",
        paymentStatus: statuses[i % statuses.length] === "delivered" ? "paid" : "pending",
        statusHistory: [{ status: statuses[i % statuses.length], updatedAt: daysAgo }],
        createdAt: daysAgo,
      });
    }
    await Order.insertMany(orderDocs);
    console.log(`Inserted ${orderDocs.length} orders`);

    if (adminUser) {
      const orders = await Order.find().limit(6);
      await Notification.insertMany([
        {
          recipient: adminUser._id, recipientRole: "admin",
          type: "new_order", title: "New Order Received",
          message: `Order ${orders[0]?.orderNumber} from ${customers[0]?.name} is awaiting preparation.`,
          isRead: false, createdAt: new Date(Date.now() - 5 * 60 * 1000),
        },
        {
          recipient: adminUser._id, recipientRole: "admin",
          type: "order_delivered", title: "Order Completed",
          message: `Order ${orders[1]?.orderNumber} has been marked as delivered.`,
          isRead: false, createdAt: new Date(Date.now() - 20 * 60 * 1000),
        },
        {
          recipient: adminUser._id, recipientRole: "admin",
          type: "payment_success", title: "Payment Received",
          message: `Payment of Rs.${orders[2]?.totalAmount} received for order ${orders[2]?.orderNumber}.`,
          isRead: false, createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
        {
          recipient: adminUser._id, recipientRole: "admin",
          type: "new_order", title: "New Order - Table 3",
          message: "Dine-in order placed at Table 3. 2 items ordered.",
          isRead: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          recipient: adminUser._id, recipientRole: "admin",
          type: "new_order", title: "Coupon Expiring Soon",
          message: "Coupon WEEKEND50 expires tomorrow. Consider renewal.",
          isRead: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          recipient: adminUser._id, recipientRole: "admin",
          type: "order_cancelled", title: "Order Cancelled",
          message: `Order ${orders[5]?.orderNumber} was cancelled by the customer.`,
          isRead: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ]);
      console.log("Inserted 6 notifications");
    }
  }

  // Restaurant Settings
  await RestaurantSettings.create({
    restaurantName: "Apna Restaurant",
    address: "27, MG Road, Sector 14, Gurgaon, Haryana",
    phone: "+91 98765 43210",
    openTime: "10:00",
    closeTime: "23:00",
    gstPercent: 5,
    deliveryCharge: 30,
    freeDeliveryAbove: 500,
    autoAcceptOrders: true,
    emailNotifications: true,
  });
  console.log("Inserted restaurant settings");

  await mongoose.disconnect();
  console.log("Seeding complete!");
}

seed().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
