const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qrController");

// Public routes (no authentication required)
router.get("/referral/:bankTag", qrController.generateReferralQR);
router.get("/wallet/:address", qrController.generateWalletQR);
router.get("/wallet/:address/:chainId", qrController.generateWalletQR);
router.post("/generate", qrController.generateQRCode);

module.exports = router;
