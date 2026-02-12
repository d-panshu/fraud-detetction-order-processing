import { producer } from "../config/kafka.js";
import { v4 as uuidv4 } from "uuid";

export const createTransaction = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const transactionId = uuidv4();

    const event = {
      transactionId,
      userId,
      amount: Number(amount),
      createdAt: new Date().toISOString(),
    };

    await producer.send({
      topic: "transactions",
      messages: [
        {
          key: transactionId,
          value: JSON.stringify(event),
        },
      ],
    });

    return res.status(202).json({
      message: "Transaction accepted",
      transactionId,
    });

  } catch (err) {
    console.error("Producer error:", err);
    return res.status(500).json({ message: "Internal error" });
  }
};
