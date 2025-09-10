const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
// const userRoutes = require("./user");
const bankTagRoutes = require("./bankTag");
const cardRoutes = require("./card");
const adminRoutes = require("./admin");
// const transactionRoutes = require("./transaction");
// const earnRoutes = require("./earn");
const kycRoutes = require("./kyc");
const web3Routes = require("./web3");
const transferRoutes = require("./transfer");
const webhookRoutes = require("./webhook");
const pointsRoutes = require("./points");
const referralRoutes = require("./referral");
const qrRoutes = require("./qr");

// API Routes
router.use("/auth", authRoutes);
// router.use("/users", userRoutes);
router.use("/bank-tag", bankTagRoutes);
router.use("/cards", cardRoutes);
router.use("/admin", adminRoutes);
// router.use("/transactions", transactionRoutes);
// router.use("/earn", earnRoutes);
router.use("/kyc", kycRoutes);
router.use("/web3", web3Routes);
router.use("/transfer", transferRoutes);
router.use("/webhook", webhookRoutes);
router.use("/points", pointsRoutes);
router.use("/referral", referralRoutes);
router.use("/qr", qrRoutes);

module.exports = router;
