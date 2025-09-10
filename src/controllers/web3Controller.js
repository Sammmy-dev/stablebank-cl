const {
  verifySignedMessage,
  getDummyUSDCBalance,
  transferDummyUSDC,
  getTransactionStatus,
  getGasPrice,
  getAccountBalance,
  createSignMessage,
} = require("../utils/viem-dummy");
const {
  getUnifiedBalance,
  getChainBalance,
} = require("../utils/unifiedBalance");
const logger = require("../utils/logger");
const privateKeyManager = require("../utils/privateKeyManager");

/**
 * Verify a signed message for authentication
 * POST /api/v1/web3/verify-message
 */
async function verifyMessage(req, res) {
  try {
    const { message, signature, address } = req.body;

    // Validate required fields
    if (!message || !signature || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: message, signature, address",
      });
    }

    const isValid = await verifySignedMessage(message, signature, address);

    res.json({
      success: true,
      data: {
        isValid,
        address,
        message,
      },
    });
  } catch (error) {
    logger.error("Error in verifyMessage controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify message",
      error: error.message,
    });
  }
}

/**
 * Get dummy USDC balance for a wallet address
 * GET /api/v1/web3/balance/usdc/:address
 */
async function getUSDCBalanceByAddress(req, res) {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const balance = await getDummyUSDCBalance(address);

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    logger.error("Error in getUSDCBalanceByAddress controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dummy USDC balance",
      error: error.message,
    });
  }
}

/**
 * Get native token balance (MATIC) for a wallet address
 * GET /api/v1/web3/balance/native/:address
 */
async function getNativeBalanceByAddress(req, res) {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const balance = await getAccountBalance(address);

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    logger.error("Error in getNativeBalanceByAddress controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get native balance",
      error: error.message,
    });
  }
}

/**
 * Transfer dummy USDC from user wallet to recipient
 * POST /api/v1/web3/transfer/usdc
 * Requires authentication and private key attachment
 */
async function transferUSDCToAddress(req, res) {
  try {
    const { toAddress, amount } = req.body;

    // Validate required fields
    if (!toAddress || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: toAddress, amount",
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Get user's private key from Redis (attached by middleware)
    if (!req.userPrivateKey) {
      return res.status(401).json({
        success: false,
        message: "Private key not available. Please login again.",
      });
    }

    const result = await transferDummyUSDC(
      toAddress,
      amount,
      req.userPrivateKey
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error in transferUSDCToAddress controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to transfer dummy USDC",
      error: error.message,
    });
  }
}

/**
 * Get transaction status by hash
 * GET /api/v1/web3/transaction/:hash
 */
async function getTransactionByHash(req, res) {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash is required",
      });
    }

    const transaction = await getTransactionStatus(hash);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    logger.error("Error in getTransactionByHash controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction status",
      error: error.message,
    });
  }
}

/**
 * Get current gas price
 * GET /api/v1/web3/gas-price
 */
async function getCurrentGasPrice(req, res) {
  try {
    const gasPrice = await getGasPrice();

    res.json({
      success: true,
      data: gasPrice,
    });
  } catch (error) {
    logger.error("Error in getCurrentGasPrice controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get gas price",
      error: error.message,
    });
  }
}

/**
 * Create a message for signing (for authentication)
 * POST /api/v1/web3/create-message
 */
async function createSignMessageForAuth(req, res) {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const timestamp = Date.now();
    const message = createSignMessage(address, timestamp);

    res.json({
      success: true,
      data: {
        message,
        timestamp,
        address,
      },
    });
  } catch (error) {
    logger.error("Error in createSignMessageForAuth controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create sign message",
      error: error.message,
    });
  }
}

/**
 * Get comprehensive wallet information
 * GET /api/v1/web3/wallet/:address
 */
async function getWalletInfo(req, res) {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    // Get both USDC and native balances
    const [usdcBalance, nativeBalance, gasPrice] = await Promise.all([
      getDummyUSDCBalance(address),
      getAccountBalance(address),
      getGasPrice(),
    ]);

    res.json({
      success: true,
      data: {
        address,
        balances: {
          dummyUsdc: usdcBalance,
          native: nativeBalance,
        },
        gasPrice,
      },
    });
  } catch (error) {
    logger.error("Error in getWalletInfo controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet information",
      error: error.message,
    });
  }
}

/**
 * Get authenticated user's wallet information
 * GET /api/v1/web3/my-wallet
 * Requires authentication and private key attachment
 */
async function getMyWalletInfo(req, res) {
  try {
    if (!req.user || !req.userPrivateKey) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get user's wallet address from the private key
    const { privateKeyToAccount } = require("viem/accounts");
    const userAccount = privateKeyToAccount(req.userPrivateKey);
    const userAddress = userAccount.address;

    // Get both USDC and native balances
    const [usdcBalance, nativeBalance, gasPrice] = await Promise.all([
      getDummyUSDCBalance(userAddress),
      getAccountBalance(userAddress),
      getGasPrice(),
    ]);

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        address: userAddress,
        balances: {
          dummyUsdc: usdcBalance,
          native: nativeBalance,
        },
        gasPrice,
      },
    });
  } catch (error) {
    logger.error("Error in getMyWalletInfo controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user wallet information",
      error: error.message,
    });
  }
}

/**
 * Get unified balance across all supported chains and stablecoins
 * GET /api/v1/web3/unified-balance/:address
 */
async function getUnifiedBalanceByAddress(req, res) {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const unifiedBalance = await getUnifiedBalance(address);

    res.json({
      success: true,
      data: unifiedBalance,
    });
  } catch (error) {
    logger.error("Error in getUnifiedBalanceByAddress controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unified balance",
      error: error.message,
    });
  }
}

/**
 * Get balance for a specific chain
 * GET /api/v1/web3/chain-balance/:chain/:address
 */
async function getChainBalanceByAddress(req, res) {
  try {
    const { chain, address } = req.params;

    if (!address || !chain) {
      return res.status(400).json({
        success: false,
        message: "Chain and wallet address are required",
      });
    }

    // Validate chain parameter
    const supportedChains = ["ethereum", "polygon", "arbitrum"];
    if (!supportedChains.includes(chain.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported chain. Supported chains: ${supportedChains.join(
          ", "
        )}`,
      });
    }

    const chainBalance = await getChainBalance(chain.toLowerCase(), address);

    res.json({
      success: true,
      data: chainBalance,
    });
  } catch (error) {
    logger.error("Error in getChainBalanceByAddress controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chain balance",
      error: error.message,
    });
  }
}

module.exports = {
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
};
