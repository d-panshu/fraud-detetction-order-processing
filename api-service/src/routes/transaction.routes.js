import express from "express";
import { createTransaction } from "../controllers/transaction.controller.js";


const router = express.Router();

router.post("/transaction", createTransaction);

export default router;