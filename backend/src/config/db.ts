// src/config/db.ts
import mongoose from "mongoose";
import config from "@config/index";

// Share an in-progress connection between concurrent requests.
let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<typeof mongoose> => {
  if (!config.MONGO_DB_URI) {
    throw new Error("MONGO_DB_URI is not defined");
  }

  // Reuse the existing connection when the function instance is warm.
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.MONGO_DB_URI, {
        serverSelectionTimeoutMS: 10000
      })
      .then((connection) => {
        console.log("✅ MongoDB Connected Successfully");

        return connection;
      })
      .finally(() => {
        // Allow another connection attempt after a failure
        // or a subsequent database disconnection.
        connectionPromise = null;
      });
  }

  return connectionPromise;
};

export default connectDB;
