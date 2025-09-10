const {
  executeTransfer,
  getTransferDetails,
  getTransferHistory,
  validateRecipient,
  getTokenInfo,
} = require("../utils/transferService");
const { calculateTransferFee } = require("../utils/deBridge");
const logger = require("../utils/logger");
const custodialLite = require("../utils/custodialLite");
const db = require("../../db/models");

/**
 * Initiate cross-chain transfer
 * POST /api/v1/transfer/cross-chain
 */
async function initiateCrossChainTransfer(req, res) {
  try {
    const userId = req.user.id;
    const {
      fromChain,
      toChain,
      tokenSymbol,
      amount,
      recipient, // Can be wallet address or @BankTag
      description = "",
      password, // User's password for private key decryption
    } = req.body;

    // Validate required fields
    if (
      !fromChain ||
      !toChain ||
      !tokenSymbol ||
      !amount ||
      !recipient ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: fromChain, toChain, tokenSymbol, amount, recipient, password",
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Validate chains
    const supportedChains = ["ethereum", "polygon", "arbitrum"];
    if (
      !supportedChains.includes(fromChain) ||
      !supportedChains.includes(toChain)
    ) {
      return res.status(400).json({
        success: false,
        message: `Unsupported chain. Supported chains: ${supportedChains.join(
          ", "
        )}`,
      });
    }

    if (fromChain === toChain) {
      return res.status(400).json({
        success: false,
        message: "Source and destination chains must be different",
      });
    }

    // Validate token
    const supportedTokens = ["USDC", "USDT", "DAI"];
    if (!supportedTokens.includes(tokenSymbol)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported token. Supported tokens: ${supportedTokens.join(
          ", "
        )}`,
      });
    }

    // Decrypt user's private key
    const userRecord = await db.user.findByPk(userId);
    let decryptedPrivateKey = null;
    if (
      userRecord.encryptedPrivateKey &&
      userRecord.privateKeySalt &&
      userRecord.privateKeyIv
    ) {
      try {
        const derivedKey = custodialLite.deriveKey(
          password,
          userRecord.privateKeySalt
        );
        decryptedPrivateKey = custodialLite.decryptPrivateKey(
          userRecord.encryptedPrivateKey,
          derivedKey,
          userRecord.privateKeyIv
        );
      } catch (e) {
        logger.error("Failed to decrypt user private key for transfer:", e);
        return res.status(400).json({
          success: false,
          message: "Invalid password or failed to decrypt private key.",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "User does not have a custodial private key set up.",
      });
    }

    logger.info(
      `User ${userId} initiating transfer: ${amount} ${tokenSymbol} from ${fromChain} to ${toChain}`
    );

    // Execute transfer with decrypted private key
    const transferResult = await executeTransfer(
      {
        fromUserId: userId,
        fromChain,
        toChain,
        tokenSymbol,
        amount,
        recipient,
        description,
      },
      decryptedPrivateKey
    );

    res.status(201).json({
      success: true,
      message: "Transfer initiated successfully",
      data: transferResult,
    });
  } catch (error) {
    logger.error("Error in initiateCrossChainTransfer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate transfer",
      error: error.message,
    });
  }
}

/**
 * Get transfer details by internal ID
 * GET /api/v1/transfer/:internalId
 */
async function getTransferById(req, res) {
  try {
    const { internalId } = req.params;
    const userId = req.user.id;

    if (!internalId) {
      return res.status(400).json({
        success: false,
        message: "Internal ID is required",
      });
    }

    const transferDetails = await getTransferDetails(internalId);

    // Check if user has access to this transfer
    if (
      transferDetails.fromUser.id !== userId &&
      transferDetails.toUser?.id !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this transfer",
      });
    }

    res.json({
      success: true,
      data: transferDetails,
    });
  } catch (error) {
    logger.error("Error in getTransferById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transfer details",
      error: error.message,
    });
  }
}

/**
 * Get user's transfer history
 * GET /api/v1/transfer/history
 */
async function getTransferHistoryByUser(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, type, chain } = req.query;

    const history = await getTransferHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      chain,
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error("Error in getTransferHistoryByUser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transfer history",
      error: error.message,
    });
  }
}

/**
 * Calculate transfer fee
 * POST /api/v1/transfer/calculate-fee
 */
async function calculateTransferFeeController(req, res) {
  try {
    const { fromChain, toChain, tokenSymbol, amount } = req.body;

    // Validate required fields
    if (!fromChain || !toChain || !tokenSymbol || !amount) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: fromChain, toChain, tokenSymbol, amount",
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Get token info
    const tokenInfo = await getTokenInfo(tokenSymbol, fromChain);

    // Calculate fee
    const feeInfo = await calculateTransferFee(
      fromChain,
      toChain,
      tokenInfo.address,
      amount
    );

    res.json({
      success: true,
      data: {
        fromChain,
        toChain,
        tokenSymbol,
        amount,
        fee: feeInfo.feeUSD,
        totalAmount:
          Number(feeInfo.totalAmount) / Math.pow(10, tokenInfo.decimals),
        estimatedTime: feeInfo.estimatedTime,
        tokenInfo,
      },
    });
  } catch (error) {
    logger.error("Error in calculateTransferFee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate transfer fee",
      error: error.message,
    });
  }
}

/**
 * Validate recipient (address or BankTag)
 * POST /api/v1/transfer/validate-recipient
 */
async function validateRecipientEndpoint(req, res) {
  try {
    const { recipient, chainId } = req.body;

    if (!recipient || !chainId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: recipient, chainId",
      });
    }

    const validation = await validateRecipient(recipient, chainId);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient",
        error: validation.error,
      });
    }

    res.json({
      success: true,
      data: {
        recipient,
        isValid: true,
        address: validation.address,
        bankTag: validation.bankTag,
        user: validation.user,
        wallet: validation.wallet,
        type: validation.type,
      },
    });
  } catch (error) {
    logger.error("Error in validateRecipientEndpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate recipient",
      error: error.message,
    });
  }
}

/**
 * Get supported tokens for a chain
 * GET /api/v1/transfer/supported-tokens/:chain
 */
async function getSupportedTokens(req, res) {
  try {
    const { chain } = req.params;

    if (!chain) {
      return res.status(400).json({
        success: false,
        message: "Chain parameter is required",
      });
    }

    const supportedChains = ["ethereum", "polygon", "arbitrum"];
    if (!supportedChains.includes(chain)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported chain. Supported chains: ${supportedChains.join(
          ", "
        )}`,
      });
    }

    const tokens = {
      USDC: {
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        address: {
          ethereum: "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C", // Placeholder
          polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          arbitrum: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        }[chain],
      },
      USDT: {
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        address: {
          ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
          arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        }[chain],
      },
      DAI: {
        symbol: "DAI",
        name: "Dai Stablecoin",
        decimals: 18,
        address: {
          ethereum: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          polygon: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
          arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        }[chain],
      },
    };

    res.json({
      success: true,
      data: {
        chain,
        tokens: Object.values(tokens).filter((token) => token.address),
      },
    });
  } catch (error) {
    logger.error("Error in getSupportedTokens:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get supported tokens",
      error: error.message,
    });
  }
}

/**
 * Get transfer statistics for user
 * GET /api/v1/transfer/stats
 */
async function getTransferStats(req, res) {
  try {
    const userId = req.user.id;
    const db = require("../../db/models");

    // Get transfer counts by status
    const statusStats = await db.transaction.findAll({
      where: {
        [db.Sequelize.Op.or]: [{ fromUserId: userId }, { toUserId: userId }],
        type: "cross_chain",
      },
      attributes: [
        "status",
        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
      ],
      group: ["status"],
    });

    // Get total volume
    const volumeStats = await db.transaction.findAll({
      where: {
        fromUserId: userId,
        type: "cross_chain",
        status: "completed",
      },
      attributes: [
        [db.Sequelize.fn("SUM", db.Sequelize.col("amountUSD")), "totalVolume"],
        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "totalTransfers"],
      ],
    });

    // Get recent activity
    const recentTransfers = await db.transaction.findAll({
      where: {
        [db.Sequelize.Op.or]: [{ fromUserId: userId }, { toUserId: userId }],
        type: "cross_chain",
      },
      include: [
        {
          model: db.token,
          attributes: ["symbol"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const stats = {
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      totalVolume: volumeStats[0]?.dataValues.totalVolume || 0,
      totalTransfers: volumeStats[0]?.dataValues.totalTransfers || 0,
      recentActivity: recentTransfers,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in getTransferStats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transfer statistics",
      error: error.message,
    });
  }
}

module.exports = {
  initiateCrossChainTransfer,
  getTransferById,
  getTransferHistoryByUser,
  calculateTransferFeeController,
  validateRecipientEndpoint,
  getSupportedTokens,
  getTransferStats,
};
