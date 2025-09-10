const express = require("express");
const router = express.Router();
const {
  verifyMessage,
  getUSDCBalanceByAddress,
  getNativeBalanceByAddress,
  transferUSDCToAddress,
  getTransactionByHash,
  getCurrentGasPrice,
  createSignMessageForAuth,
  getWalletInfo,
  getMyWalletInfo,
  getUnifiedBalanceByAddress,
  getChainBalanceByAddress,
} = require("../controllers/web3Controller");
const { authenticate, attachPrivateKey } = require("../middleware/auth");

// Message verification for authentication
router.post("/verify-message", verifyMessage);

// Balance endpoints
router.get("/balance/usdc/:address", getUSDCBalanceByAddress);
router.get("/balance/native/:address", getNativeBalanceByAddress);
router.get("/unified-balance/:address", getUnifiedBalanceByAddress);
router.get("/chain-balance/:chain/:address", getChainBalanceByAddress);

// Transfer endpoints (requires authentication and private key)
router.post(
  "/transfer/usdc",
  authenticate,
  attachPrivateKey,
  transferUSDCToAddress
);

// Transaction endpoints
router.get("/transaction/:hash", getTransactionByHash);

// Gas price endpoint
router.get("/gas-price", getCurrentGasPrice);

// Message creation for signing
router.post("/create-message", createSignMessageForAuth);

// Comprehensive wallet information (optional authentication for user-specific data)
router.get("/wallet/:address", getWalletInfo);

// Authenticated user's wallet information
router.get("/my-wallet", authenticate, attachPrivateKey, getMyWalletInfo);

module.exports = router;
