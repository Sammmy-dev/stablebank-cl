const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const kycController = require("../controllers/kycController");

router.post("/start", authenticate, kycController.startKyc);
router.get("/status", authenticate, kycController.getKycStatus);

module.exports = router;
