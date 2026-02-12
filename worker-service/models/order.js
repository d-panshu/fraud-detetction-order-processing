import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true },
  userId: String,
  amount: Number,
  fraudProbability: Number,
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
