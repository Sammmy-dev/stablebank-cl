const db = require("../../db/models");
const {
  executeCrossChainTransfer,
  calculateTransferFee,
  validateTransferParams,
  getTransferStatus,
} = require("./deBridge");
const logger = require("./logger");
const { v4: uuidv4 } = require("uuid");

/**
 * Resolve BankTag to wallet address
 * @param {string} bankTag - BankTag (e.g., @username)
 * @param {number} chainId - Target chain ID
 * @returns {Object} - Resolved wallet information
 */
async function resolveBankTag(bankTag, chainId) {
  try {
    if (!bankTag.startsWith("@")) {
      throw new Error("BankTag must start with @");
    }

    const user = await db.user.findOne({
      where: { bankTag },
      attributes: ["id", "bankTag", "firstName", "lastName"],
    });

    if (!user) {
      throw new Error(`BankTag ${bankTag} not found`);
    }

    const wallet = await db.wallet.findOne({
      where: {
        userId: user.id,
        chainId: parseInt(chainId),
        isActive: true,
      },
      attributes: ["id", "chainId", "chainName", "address", "isVerified"],
    });

    if (!wallet) {
      throw new Error(
        `No active wallet found for ${bankTag} on chain ${chainId}`
      );
    }

    return {
      user: {
        id: user.id,
        bankTag: user.bankTag,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      wallet: {
        id: wallet.id,
        address: wallet.address,
        chainId: wallet.chainId,
        chainName: wallet.chainName,
        isVerified: wallet.isVerified,
      },
    };
  } catch (error) {
    logger.error(`Error resolving BankTag ${bankTag}:`, error);
    throw error;
  }
}

/**
 * Validate recipient (address or BankTag)
 * @param {string} recipient - Wallet address or BankTag
 * @param {number} chainId - Target chain ID
 * @returns {Object} - Validation result with resolved address
 */
async function validateRecipient(recipient, chainId) {
  try {
    // Check if it's a BankTag
    if (recipient.startsWith("@")) {
      const resolved = await resolveBankTag(recipient, chainId);
      return {
        isValid: true,
        address: resolved.wallet.address,
        bankTag: recipient,
        user: resolved.user,
        wallet: resolved.wallet,
        type: "bankTag",
      };
    }

    // Validate as wallet address
    if (recipient.length !== 42 || !recipient.startsWith("0x")) {
      throw new Error("Invalid wallet address format");
    }

    // Check if address exists in our system
    const wallet = await db.wallet.findOne({
      where: {
        address: recipient,
        chainId: parseInt(chainId),
        isActive: true,
      },
      include: [
        {
          model: db.user,
          attributes: ["id", "bankTag", "firstName", "lastName"],
        },
      ],
    });

    return {
      isValid: true,
      address: recipient,
      bankTag: wallet?.user?.bankTag || null,
      user: wallet?.user || null,
      wallet: wallet || null,
      type: "address",
    };
  } catch (error) {
    logger.error(`Error validating recipient ${recipient}:`, error);
    return {
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Get token information
 * @param {string} tokenSymbol - Token symbol (USDC, USDT, DAI)
 * @param {string} chain - Chain name
 * @returns {Object} - Token information
 */
async function getTokenInfo(tokenSymbol, chain) {
  const tokens = {
    USDC: {
      ethereum: "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C", // Placeholder
      polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      arbitrum: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      decimals: 6,
      name: "USD Coin",
    },
    USDT: {
      ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      decimals: 6,
      name: "Tether USD",
    },
    DAI: {
      ethereum: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      polygon: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      decimals: 18,
      name: "Dai Stablecoin",
    },
  };

  const token = tokens[tokenSymbol];
  if (!token) {
    throw new Error(`Unsupported token: ${tokenSymbol}`);
  }

  const address = token[chain];
  if (!address) {
    throw new Error(`Token ${tokenSymbol} not supported on ${chain}`);
  }

  return {
    symbol: tokenSymbol,
    address,
    decimals: token.decimals,
    name: token.name,
    chain,
  };
}

/**
 * Create transfer transaction record
 * @param {Object} transferData - Transfer data
 * @returns {Object} - Created transaction record
 */
async function createTransferRecord(transferData) {
  const {
    fromUserId,
    toUserId,
    fromWalletId,
    toWalletId,
    fromAddress,
    toAddress,
    fromBankTag,
    toBankTag,
    tokenSymbol,
    amount,
    amountUSD,
    fromChain,
    toChain,
    description,
    feeUSD = 0,
  } = transferData;

  try {
    // Get token info
    const tokenInfo = await getTokenInfo(tokenSymbol, fromChain);
    const token = await db.token.findOne({
      where: { symbol: tokenSymbol, chainId: getChainId(fromChain) },
    });

    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found in database`);
    }

    const transaction = await db.transaction.create({
      internalId: uuidv4(),
      type: "cross_chain",
      status: "pending",
      fromUserId,
      toUserId,
      fromWalletId,
      toWalletId,
      fromAddress,
      toAddress,
      fromBankTag,
      toBankTag,
      tokenId: token.id,
      amount: amount,
      amountUSD: amountUSD,
      feeUSD: feeUSD,
      fromChainId: getChainId(fromChain),
      toChainId: getChainId(toChain),
      description,
      metadata: {
        tokenInfo,
        transferType: "cross_chain",
        source: "debridge",
      },
    });

    logger.info(`Created transfer record: ${transaction.internalId}`);
    return transaction;
  } catch (error) {
    logger.error("Error creating transfer record:", error);
    throw error;
  }
}

/**
 * Update transfer status
 * @param {string} internalId - Internal transaction ID
 * @param {string} status - New status
 * @param {Object} updateData - Additional update data
 * @returns {Object} - Updated transaction
 */
async function updateTransferStatus(internalId, status, updateData = {}) {
  try {
    const updateFields = {
      status,
      ...updateData,
    };

    if (status === "completed") {
      updateFields.confirmedAt = new Date();
    } else if (status === "failed") {
      updateFields.failedAt = new Date();
    }

    const transaction = await db.transaction.findOne({
      where: { internalId },
    });

    if (!transaction) {
      throw new Error(`Transaction ${internalId} not found`);
    }

    await transaction.update(updateFields);

    logger.info(`Updated transfer ${internalId} status to ${status}`);
    return transaction;
  } catch (error) {
    logger.error(`Error updating transfer status for ${internalId}:`, error);
    throw error;
  }
}

/**
 * Execute cross-chain transfer with BankTag support
 * @param {Object} transferRequest - Transfer request
 * @param {string} privateKey - User's decrypted private key (required)
 * @returns {Object} - Transfer result
 */
async function executeTransfer(transferRequest, privateKey) {
  if (!privateKey) {
    throw new Error("User private key is required for executeTransfer");
  }
  const {
    fromUserId,
    fromChain,
    toChain,
    tokenSymbol,
    amount,
    recipient, // Can be address or BankTag
    description = "",
  } = transferRequest;
  try {
    logger.info(
      `Processing transfer request: ${amount} ${tokenSymbol} from ${fromChain} to ${toChain}`
    );
    // Validate recipient
    const toChainId = getChainId(toChain);
    const recipientValidation = await validateRecipient(recipient, toChainId);
    if (!recipientValidation.isValid) {
      throw new Error(`Invalid recipient: ${recipientValidation.error}`);
    }
    // Get sender wallet
    const fromWallet = await db.wallet.findOne({
      where: {
        userId: fromUserId,
        chainId: getChainId(fromChain),
        isActive: true,
      },
    });
    if (!fromWallet) {
      throw new Error(`No active wallet found for user on ${fromChain}`);
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
    // Create transfer record
    const transferRecord = await createTransferRecord({
      fromUserId,
      toUserId: recipientValidation.user?.id,
      fromWalletId: fromWallet.id,
      toWalletId: recipientValidation.wallet?.id,
      fromAddress: fromWallet.address,
      toAddress: recipientValidation.address,
      fromBankTag: null, // Will be resolved from user
      toBankTag: recipientValidation.bankTag,
      tokenSymbol,
      amount: feeInfo.amount.toString(),
      amountUSD: amount, // Assuming 1:1 for stablecoins
      fromChain,
      toChain,
      description,
      feeUSD: feeInfo.feeUSD,
    });
    // Execute DeBridge transfer
    const debridgeResult = await executeCrossChainTransfer(
      {
        fromChain,
        toChain,
        tokenAddress: tokenInfo.address,
        amount: feeInfo.amount,
        recipientAddress: recipientValidation.address,
        senderAddress: fromWallet.address,
        description,
      },
      privateKey
    );
    // Update transfer record with DeBridge info
    await updateTransferStatus(transferRecord.internalId, "processing", {
      transactionHash: debridgeResult.transactionHash,
      deBridgeId: debridgeResult.debridgeId,
      metadata: {
        ...transferRecord.metadata,
        debridgeResult,
        estimatedTime: debridgeResult.estimatedTime,
      },
    });
    return {
      success: true,
      internalId: transferRecord.internalId,
      transferId: debridgeResult.transferId,
      status: "processing",
      fromChain,
      toChain,
      tokenSymbol,
      amount,
      recipient: recipientValidation.address,
      recipientBankTag: recipientValidation.bankTag,
      fee: feeInfo.feeUSD,
      estimatedTime: debridgeResult.estimatedTime,
      transactionHash: debridgeResult.transactionHash,
    };
  } catch (error) {
    logger.error("Error executing transfer:", error);
    throw error;
  }
}

/**
 * Get transfer status and details
 * @param {string} internalId - Internal transaction ID
 * @returns {Object} - Transfer status and details
 */
async function getTransferDetails(internalId) {
  try {
    const transaction = await db.transaction.findOne({
      where: { internalId },
      include: [
        {
          model: db.user,
          as: "fromUser",
          attributes: ["id", "bankTag", "firstName", "lastName"],
        },
        {
          model: db.user,
          as: "toUser",
          attributes: ["id", "bankTag", "firstName", "lastName"],
        },
        {
          model: db.wallet,
          as: "fromWallet",
          attributes: ["id", "chainId", "chainName", "address"],
        },
        {
          model: db.wallet,
          as: "toWallet",
          attributes: ["id", "chainId", "chainName", "address"],
        },
        {
          model: db.token,
          attributes: ["id", "symbol", "name", "decimals"],
        },
      ],
    });

    if (!transaction) {
      throw new Error(`Transaction ${internalId} not found`);
    }

    // Get DeBridge status if available
    let debridgeStatus = null;
    if (transaction.transactionHash) {
      try {
        debridgeStatus = await getTransferStatus(
          transaction.transactionHash,
          getChainName(transaction.fromChainId)
        );
      } catch (error) {
        logger.warn(
          `Could not fetch DeBridge status for ${transaction.transactionHash}:`,
          error
        );
      }
    }

    return {
      internalId: transaction.internalId,
      status: transaction.status,
      type: transaction.type,
      fromUser: transaction.fromUser,
      toUser: transaction.toUser,
      fromWallet: transaction.fromWallet,
      toWallet: transaction.toWallet,
      token: transaction.token,
      amount: transaction.amount,
      amountUSD: transaction.amountUSD,
      feeUSD: transaction.feeUSD,
      fromChain: getChainName(transaction.fromChainId),
      toChain: getChainName(transaction.toChainId),
      fromBankTag: transaction.fromBankTag,
      toBankTag: transaction.toBankTag,
      description: transaction.description,
      transactionHash: transaction.transactionHash,
      deBridgeId: transaction.deBridgeId,
      debridgeStatus,
      confirmedAt: transaction.confirmedAt,
      failedAt: transaction.failedAt,
      failureReason: transaction.failureReason,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  } catch (error) {
    logger.error(`Error getting transfer details for ${internalId}:`, error);
    throw error;
  }
}

/**
 * Get user's transfer history
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} - Transfer history
 */
async function getTransferHistory(userId, options = {}) {
  const { page = 1, limit = 20, status, type, chain } = options;

  try {
    const whereClause = {
      [db.Sequelize.Op.or]: [{ fromUserId: userId }, { toUserId: userId }],
    };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (chain) {
      const chainId = getChainId(chain);
      whereClause[db.Sequelize.Op.or] = [
        { fromChainId: chainId },
        { toChainId: chainId },
      ];
    }

    const { count, rows } = await db.transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.user,
          as: "fromUser",
          attributes: ["id", "bankTag", "firstName", "lastName"],
        },
        {
          model: db.user,
          as: "toUser",
          attributes: ["id", "bankTag", "firstName", "lastName"],
        },
        {
          model: db.token,
          attributes: ["symbol", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return {
      transfers: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error(`Error getting transfer history for user ${userId}:`, error);
    throw error;
  }
}

// Helper functions
function getChainId(chainName) {
  const chainIds = {
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
  };
  return chainIds[chainName] || chainName;
}

function getChainName(chainId) {
  const chainNames = {
    1: "ethereum",
    137: "polygon",
    42161: "arbitrum",
  };
  return chainNames[chainId] || chainId;
}

module.exports = {
  resolveBankTag,
  validateRecipient,
  getTokenInfo,
  createTransferRecord,
  updateTransferStatus,
  executeTransfer,
  getTransferDetails,
  getTransferHistory,
};
