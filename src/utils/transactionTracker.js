const db = require("../../db/models");
const { getTransferStatus } = require("./deBridge");
const logger = require("./logger");

/**
 * Process DeBridge webhook
 * @param {Object} webhookData - Webhook payload from DeBridge
 * @returns {Object} - Processing result
 */
async function processDebridgeWebhook(webhookData) {
  try {
    const {
      transferId,
      status,
      chainId,
      debridgeId,
      receiver,
      amount,
      externalId,
      metadata,
    } = webhookData;

    logger.info(`Processing DeBridge webhook for transfer: ${transferId}`);

    // Find transaction by DeBridge transfer ID
    const transaction = await db.transaction.findOne({
      where: {
        transactionHash: transferId,
        type: "cross_chain",
      },
    });

    if (!transaction) {
      logger.warn(`Transaction not found for DeBridge transfer: ${transferId}`);
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Map DeBridge status to our status
    let newStatus;
    let updateData = {};

    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        newStatus = "completed";
        updateData.confirmedAt = new Date();
        break;
      case "failed":
      case "reverted":
        newStatus = "failed";
        updateData.failedAt = new Date();
        updateData.failureReason =
          metadata?.reason || "Transfer failed on DeBridge";
        break;
      case "pending":
      case "processing":
        newStatus = "processing";
        break;
      default:
        newStatus = "processing";
        break;
    }

    // Update transaction status
    await transaction.update({
      status: newStatus,
      ...updateData,
      metadata: {
        ...transaction.metadata,
        lastWebhookUpdate: new Date().toISOString(),
        webhookData,
      },
    });

    logger.info(
      `Updated transaction ${transaction.internalId} status to ${newStatus}`
    );

    // Send notification to user if needed
    await sendTransferNotification(transaction, newStatus);

    return {
      success: true,
      transactionId: transaction.internalId,
      status: newStatus,
    };
  } catch (error) {
    logger.error("Error processing DeBridge webhook:", error);
    throw error;
  }
}

/**
 * Poll transaction status from DeBridge
 * @param {string} internalId - Internal transaction ID
 * @returns {Object} - Updated transaction status
 */
async function pollTransactionStatus(internalId) {
  try {
    const transaction = await db.transaction.findOne({
      where: { internalId },
    });

    if (!transaction) {
      throw new Error(`Transaction ${internalId} not found`);
    }

    if (!transaction.transactionHash) {
      throw new Error("No DeBridge transaction hash found");
    }

    logger.info(`Polling status for transaction: ${internalId}`);

    // Get status from DeBridge
    const debridgeStatus = await getTransferStatus(
      transaction.transactionHash,
      getChainName(transaction.fromChainId)
    );

    // Update transaction if status changed
    if (debridgeStatus.status !== transaction.status) {
      let updateData = {};

      if (debridgeStatus.status === "completed") {
        updateData.confirmedAt = new Date();
      } else if (debridgeStatus.status === "failed") {
        updateData.failedAt = new Date();
        updateData.failureReason = debridgeStatus.error || "Transfer failed";
      }

      await transaction.update({
        status: debridgeStatus.status,
        ...updateData,
        metadata: {
          ...transaction.metadata,
          lastPollUpdate: new Date().toISOString(),
          debridgeStatus,
        },
      });

      logger.info(
        `Updated transaction ${internalId} status to ${debridgeStatus.status}`
      );

      // Send notification if status changed
      await sendTransferNotification(transaction, debridgeStatus.status);
    }

    return {
      success: true,
      internalId,
      status: debridgeStatus.status,
      lastUpdate: debridgeStatus.timestamp,
    };
  } catch (error) {
    logger.error(`Error polling transaction status for ${internalId}:`, error);
    throw error;
  }
}

/**
 * Batch poll pending transactions
 * @param {number} limit - Maximum number of transactions to poll
 * @returns {Object} - Polling results
 */
async function batchPollPendingTransactions(limit = 50) {
  try {
    // Get pending transactions
    const pendingTransactions = await db.transaction.findAll({
      where: {
        type: "cross_chain",
        status: ["pending", "processing"],
        transactionHash: {
          [db.Sequelize.Op.ne]: null,
        },
      },
      limit,
      order: [["createdAt", "ASC"]],
    });

    logger.info(
      `Polling status for ${pendingTransactions.length} pending transactions`
    );

    const results = [];
    const errors = [];

    // Poll each transaction
    for (const transaction of pendingTransactions) {
      try {
        const result = await pollTransactionStatus(transaction.internalId);
        results.push(result);
      } catch (error) {
        errors.push({
          internalId: transaction.internalId,
          error: error.message,
        });
        logger.error(
          `Error polling transaction ${transaction.internalId}:`,
          error
        );
      }
    }

    return {
      success: true,
      total: pendingTransactions.length,
      updated: results.length,
      errors: errors.length,
      results,
      errors,
    };
  } catch (error) {
    logger.error("Error in batch poll:", error);
    throw error;
  }
}

/**
 * Send transfer notification to user
 * @param {Object} transaction - Transaction object
 * @param {string} status - New status
 */
async function sendTransferNotification(transaction, status) {
  try {
    // Get user information
    const user = await db.user.findByPk(transaction.fromUserId);
    if (!user) {
      logger.warn(`User not found for transaction ${transaction.internalId}`);
      return;
    }

    // Prepare notification data
    const notificationData = {
      userId: user.id,
      type: "transfer_status",
      title: "Transfer Status Update",
      message: getStatusMessage(status, transaction),
      metadata: {
        transactionId: transaction.internalId,
        status,
        amount: transaction.amountUSD,
        token: transaction.token?.symbol,
        fromChain: getChainName(transaction.fromChainId),
        toChain: getChainName(transaction.toChainId),
      },
    };

    // Create notification record
    await db.notification.create(notificationData);

    // TODO: Send email/SMS notification
    // await sendEmailNotification(user.email, notificationData);
    // await sendSMSNotification(user.phone, notificationData);

    logger.info(`Notification sent for transaction ${transaction.internalId}`);
  } catch (error) {
    logger.error("Error sending transfer notification:", error);
  }
}

/**
 * Get status message for notification
 * @param {string} status - Transaction status
 * @param {Object} transaction - Transaction object
 * @returns {string} - Status message
 */
function getStatusMessage(status, transaction) {
  const amount = transaction.amountUSD;
  const token = transaction.token?.symbol || "tokens";
  const fromChain = getChainName(transaction.fromChainId);
  const toChain = getChainName(transaction.toChainId);

  switch (status) {
    case "completed":
      return `Your transfer of $${amount} ${token} from ${fromChain} to ${toChain} has been completed successfully.`;
    case "failed":
      return `Your transfer of $${amount} ${token} from ${fromChain} to ${toChain} has failed. Please contact support.`;
    case "processing":
      return `Your transfer of $${amount} ${token} from ${fromChain} to ${toChain} is being processed.`;
    default:
      return `Your transfer of $${amount} ${token} from ${fromChain} to ${toChain} status has been updated to ${status}.`;
  }
}

/**
 * Get transaction status summary
 * @param {string} internalId - Internal transaction ID
 * @returns {Object} - Status summary
 */
async function getTransactionStatusSummary(internalId) {
  try {
    const transaction = await db.transaction.findOne({
      where: { internalId },
      include: [
        {
          model: db.token,
          attributes: ["symbol", "name"],
        },
      ],
    });

    if (!transaction) {
      throw new Error(`Transaction ${internalId} not found`);
    }

    const statusInfo = {
      internalId: transaction.internalId,
      status: transaction.status,
      type: transaction.type,
      amount: transaction.amountUSD,
      token: transaction.token?.symbol,
      fromChain: getChainName(transaction.fromChainId),
      toChain: getChainName(transaction.toChainId),
      createdAt: transaction.createdAt,
      confirmedAt: transaction.confirmedAt,
      failedAt: transaction.failedAt,
      failureReason: transaction.failureReason,
      transactionHash: transaction.transactionHash,
      deBridgeId: transaction.deBridgeId,
    };

    // Add estimated completion time for processing transactions
    if (transaction.status === "processing") {
      statusInfo.estimatedCompletion = new Date(
        transaction.createdAt.getTime() + 15 * 60 * 1000 // 15 minutes
      );
    }

    return {
      success: true,
      data: statusInfo,
    };
  } catch (error) {
    logger.error(`Error getting status summary for ${internalId}:`, error);
    throw error;
  }
}

// Helper function
function getChainName(chainId) {
  const chainNames = {
    1: "ethereum",
    137: "polygon",
    42161: "arbitrum",
  };
  return chainNames[chainId] || chainId;
}

module.exports = {
  processDebridgeWebhook,
  pollTransactionStatus,
  batchPollPendingTransactions,
  sendTransferNotification,
  getTransactionStatusSummary,
};
