import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";

import { getWallet, getWalletTransactions, resetWallet } from "../controllers/wallet.controller.js";

const router = express.Router();

router.get("/:id", authMiddleware, getWallet);

router.get("/:id/transactions", authMiddleware, getWalletTransactions);

router.post("/:id/reset", authMiddleware, resetWallet);

export default router;