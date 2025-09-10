const express = require("express");
const router = express.Router();
const {
  initiateCrossChainTransfer,
  getTransferById,
  getTransferHistoryByUser,
  calculateTransferFeeController,
  validateRecipientEndpoint,
  getSupportedTokens,
  getTransferStats,
} = require("../controllers/transferController");
const { authenticate } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticate);

// Cross-chain transfer endpoints
router.post("/cross-chain", initiateCrossChainTransfer);
router.get("/:internalId", getTransferById);
router.get("/history", getTransferHistoryByUser);

// Utility endpoints
router.post("/calculate-fee", calculateTransferFeeController);
router.post("/validate-recipient", validateRecipientEndpoint);
router.get("/supported-tokens/:chain", getSupportedTokens);
router.get("/stats", getTransferStats);

module.exports = router;
