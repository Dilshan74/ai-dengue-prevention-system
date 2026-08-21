import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri);

    console.log("MongoDB Connected");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;