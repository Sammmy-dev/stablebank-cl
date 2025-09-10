const {
  createVirtualCard,
  freezeCard,
  terminateCard,
  getCardTransactions,
} = require("../utils/lithic");
const {
  performFraudCheck,
  checkFraudWatchlist,
} = require("../utils/fraudDetection");
const db = require("../../db/models");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

// Create a new virtual card with fraud checks
exports.createCard = async (req, res, next) => {
  try {
    const user = req.user;

    // Get full user data from database
    const fullUser = await db.user.findByPk(user.id);
    if (!fullUser) {
      throw new AppError("User not found", 404);
    }

    // Prepare request data for fraud detection
    const requestData = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      deviceFingerprint: req.headers["x-device-fingerprint"],
      location: req.headers["x-location"]
        ? JSON.parse(req.headers["x-location"])
        : null,
      requestId: req.headers["x-request-id"] || require("crypto").randomUUID(),
    };

    // Perform comprehensive fraud check
    const fraudCheck = await performFraudCheck(fullUser, requestData);

    // Check if user is on fraud watchlist
    const isWatchlisted = await checkFraudWatchlist(fullUser);

    if (isWatchlisted) {
      throw new AppError("Card issuance blocked - account under review", 403);
    }

    // Handle different risk levels
    if (fraudCheck.riskLevel === "CRITICAL") {
      throw new AppError("Card issuance denied due to high fraud risk", 403);
    }

    if (fraudCheck.riskLevel === "HIGH") {
      // For high risk, we could either:
      // 1. Require additional verification
      // 2. Set lower spending limits
      // 3. Require manual review
      // For now, we'll proceed but with restrictions
      logger.warn(`High risk card issuance for user ${user.id}`, {
        riskScore: fraudCheck.score,
        factors: fraudCheck.factors,
      });
    }

    // Create the virtual card
    const lithicCard = await createVirtualCard(fullUser);

    // Determine card status and limits based on risk level
    let cardStatus = lithicCard.state === "OPEN" ? "active" : "pending";
    let spendingLimit = 1000; // Default limit
    let monthlyLimit = 5000; // Default monthly limit

    if (fraudCheck.riskLevel === "HIGH") {
      cardStatus = "pending"; // Requires manual review
      spendingLimit = 100; // Lower limits for high risk
      monthlyLimit = 500;
    } else if (fraudCheck.riskLevel === "MEDIUM") {
      spendingLimit = 500;
      monthlyLimit = 2000;
    }

    // Save card info to DB with fraud check results
    const card = await db.virtualCard.create({
      userId: fullUser.id,
      cardId: lithicCard.token,
      cardNumber: lithicCard.pan
        ? `**** **** **** ${lithicCard.last_four}`
        : null,
      lastFour: lithicCard.last_four,
      expiryMonth: lithicCard.exp_month,
      expiryYear: lithicCard.exp_year,
      status: cardStatus,
      cardType: "virtual",
      spendingLimit,
      monthlyLimit,
      balance: 0,
      currency: "USD",
      issuedAt: new Date(lithicCard.created),
      metadata: {
        ...lithicCard,
        fraudCheck: {
          riskLevel: fraudCheck.riskLevel,
          score: fraudCheck.score,
          factors: fraudCheck.factors,
          timestamp: fraudCheck.timestamp,
        },
      },
    });

    // Log successful card creation
    await db.auditLog.create({
      userId: fullUser.id,
      action: "virtual_card_created",
      resource: "virtual_card",
      resourceId: card.id.toString(),
      ipAddress: requestData.ipAddress,
      userAgent: requestData.userAgent,
      status: "success",
      severity: fraudCheck.riskLevel === "HIGH" ? "high" : "medium",
      details: {
        cardId: card.id,
        lithicToken: lithicCard.token,
        riskLevel: fraudCheck.riskLevel,
        riskScore: fraudCheck.score,
      },
      metadata: {
        deviceFingerprint: requestData.deviceFingerprint,
        requestId: requestData.requestId,
      },
    });

    res.status(201).json({
      success: true,
      card,
      fraudCheck: {
        riskLevel: fraudCheck.riskLevel,
        requiresReview: fraudCheck.requiresReview,
        message: fraudCheck.message,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Freeze a card
exports.freezeCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    await freezeCard(cardId);
    await db.virtualCard.update({ status: "suspended" }, { where: { cardId } });
    res.json({ success: true, message: "Card frozen" });
  } catch (err) {
    next(err);
  }
};

// Terminate (delete) a card
exports.terminateCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    await terminateCard(cardId);
    await db.virtualCard.update(
      { status: "terminated", terminatedAt: new Date() },
      { where: { cardId } }
    );
    res.json({ success: true, message: "Card terminated" });
  } catch (err) {
    next(err);
  }
};

// Get card spending history
exports.getSpendingHistory = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const {
      from,
      to,
      limit = 20,
      status,
      type,
    } = req.query;

    // Get transactions from Lithic
    const txs = await getCardTransactions(cardId, {
      page_size: parseInt(limit),
      begin: from,
      end: to,
      status,
      type,
    });

    res.json({ success: true, transactions: txs.data });
  } catch (err) {
    next(err);
  }
};

// Get user's cards with fraud risk information
exports.getUserCards = async (req, res, next) => {
  try {
    const user = req.user;

    const cards = await db.virtualCard.findAll({
      where: { userId: user.id },
      attributes: [
        "id",
        "cardId",
        "lastFour",
        "status",
        "cardType",
        "spendingLimit",
        "monthlyLimit",
        "balance",
        "currency",
        "issuedAt",
        "metadata",
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, cards });
  } catch (err) {
    next(err);
  }
};

// Update card limits (with fraud re-check)
exports.updateCardLimits = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { spendingLimit, monthlyLimit } = req.body;
    const user = req.user;

    // Verify card ownership
    const card = await db.virtualCard.findOne({
      where: { cardId, userId: user.id },
    });

    if (!card) {
      throw new AppError("Card not found", 404);
    }

    // Perform fraud check for limit increase
    if (
      spendingLimit > card.spendingLimit ||
      monthlyLimit > card.monthlyLimit
    ) {
      const requestData = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
        deviceFingerprint: req.headers["x-device-fingerprint"],
        location: req.headers["x-location"]
          ? JSON.parse(req.headers["x-location"])
          : null,
        requestId:
          req.headers["x-request-id"] || require("crypto").randomUUID(),
      };

      const fullUser = await db.user.findByPk(user.id);
      const fraudCheck = await performFraudCheck(fullUser, requestData);

      if (fraudCheck.riskLevel === "CRITICAL") {
        throw new AppError("Limit increase denied due to high fraud risk", 403);
      }
    }

    // Update limits
    await card.update({
      spendingLimit,
      monthlyLimit,
    });

    // Log the update
    await db.auditLog.create({
      userId: user.id,
      action: "card_limits_updated",
      resource: "virtual_card",
      resourceId: card.id.toString(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      status: "success",
      details: {
        cardId: card.id,
        oldSpendingLimit: card.spendingLimit,
        newSpendingLimit: spendingLimit,
        oldMonthlyLimit: card.monthlyLimit,
        newMonthlyLimit: monthlyLimit,
      },
    });

    res.json({ success: true, card });
  } catch (err) {
    next(err);
  }
};

// Get fraud risk assessment for a user
exports.getFraudRiskAssessment = async (req, res, next) => {
  try {
    const user = req.user;

    const requestData = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      deviceFingerprint: req.headers["x-device-fingerprint"],
      location: req.headers["x-location"]
        ? JSON.parse(req.headers["x-location"])
        : null,
      requestId: req.headers["x-request-id"] || require("crypto").randomUUID(),
    };

    const fullUser = await db.user.findByPk(user.id);
    const fraudCheck = await performFraudCheck(fullUser, requestData);
    const isWatchlisted = await checkFraudWatchlist(fullUser);

    res.json({
      success: true,
      fraudAssessment: {
        riskLevel: fraudCheck.riskLevel,
        score: fraudCheck.score,
        factors: fraudCheck.factors,
        isWatchlisted,
        message: fraudCheck.message,
      },
    });
  } catch (err) {
    next(err);
  }
};
