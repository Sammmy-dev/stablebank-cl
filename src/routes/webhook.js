const express = require("express");
const router = express.Router();
const {
  handleDebridgeWebhook,
  webhookHealthCheck,
} = require("../controllers/webhookController");

// DeBridge webhook endpoint
router.post("/debridge", handleDebridgeWebhook);

// Health check endpoint
router.get("/health", webhookHealthCheck);

module.exports = router;
