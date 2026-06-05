import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || "mongodb://mongodb:27017/apna_restorant_test";

beforeAll(async () => {
  console.log("Connecting to test MongoDB at URI:", TEST_MONGODB_URI);
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(TEST_MONGODB_URI);
      console.log("Successfully connected to test MongoDB");
    } else {
      console.log("Already connected to MongoDB");
    }
  } catch (err) {
    console.error("Failed to connect to test MongoDB:", err);
    throw err;
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
