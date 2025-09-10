const { processDebridgeWebhook } = require("../utils/transactionTracker");
const logger = require("../utils/logger");

/**
 * Handle DeBridge webhook
 * POST /api/v1/webhook/debridge
 */
async function handleDebridgeWebhook(req, res) {
  try {
    const webhookData = req.body;

    // Validate webhook signature (implement based on DeBridge documentation)
    const isValidSignature = validateWebhookSignature(req);
    if (!isValidSignature) {
      logger.warn("Invalid webhook signature received");
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    logger.info("Received DeBridge webhook:", webhookData);

    // Process the webhook
    const result = await processDebridgeWebhook(webhookData);

    if (result.success) {
      res.json({
        success: true,
        message: "Webhook processed successfully",
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Webhook processing failed",
        error: result.message,
      });
    }
  } catch (error) {
    logger.error("Error processing DeBridge webhook:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

/**
 * Validate webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} - Whether signature is valid
 */
function validateWebhookSignature(req) {
  // TODO: Implement signature validation based on DeBridge documentation
  // This is a placeholder implementation
  const signature = req.headers["x-debridge-signature"];
  const timestamp = req.headers["x-debridge-timestamp"];

  if (!signature || !timestamp) {
    return false;
  }

  // Add your signature validation logic here
  // Example: verify HMAC signature with your webhook secret

  return true; // Placeholder - always return true for now
}

/**
 * Health check endpoint for webhooks
 * GET /api/v1/webhook/health
 */
async function webhookHealthCheck(req, res) {
  try {
    res.json({
      success: true,
      message: "Webhook service is healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Webhook health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Webhook service is unhealthy",
      error: error.message,
    });
  }
}

module.exports = {
  handleDebridgeWebhook,
  webhookHealthCheck,
};
