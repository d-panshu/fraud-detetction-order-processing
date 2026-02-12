import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose.connect("mongodb://mongodb:27017/fraud-system");
  console.log("Worker connected to MongoDB");
};
