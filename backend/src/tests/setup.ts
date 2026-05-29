import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const TEST_MONGODB_URI = "mongodb://shopflow_user:shopflow_mongo_password@localhost:27017/apna_restorant_test?authSource=admin";

beforeAll(async () => {
  process.env.MONGODB_URI = TEST_MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGODB_URI);
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
