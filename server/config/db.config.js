import mongoose from "mongoose";
import { env } from "../config/env.config.js";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

let memoryServer = null;

const getMongoUri = async () => {
  const MONGO_URI = env.mongo_uri;

  if (!MONGO_URI) {
    throw new Error(
      "MongoDB connection URI is not defined in environment variables. Please set MONGO_URI in your environment."
    );
  }

  // If "memory" keyword, spin up in-memory MongoDB
  if (MONGO_URI === "memory") {
    if (!memoryServer) {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      console.log("🧠 Using in-memory MongoDB (development mode)");
    }
    return memoryServer.getUri();
  }

  return MONGO_URI;
};

export const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = await getMongoUri();
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log("MongoDB Connected");
  return cached.conn;
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.log("Error disconnecting from MongoDB", error);
    process.exit(1);
  }
};
