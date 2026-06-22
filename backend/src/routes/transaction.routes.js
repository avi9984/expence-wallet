import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import { pay } from "../controllers/transaction.controller.js";

const router = express.Router();

router.post("/pay", authMiddleware, pay);

export default router;