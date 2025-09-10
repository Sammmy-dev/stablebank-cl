const db = require("../../db/models");
const {
  performFraudCheck,
  checkFraudWatchlist,
} = require("../utils/fraudDetection");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");

// Get fraud alerts and suspicious activities
exports.getFraudAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, severity, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      action: {
        [db.Sequelize.Op.or]: [
          "fraud_check_card_issuance",
          "user_login",
          "virtual_card_created",
          "card_limits_updated",
        ],
      },
    };

    if (severity) {
      whereClause.severity = severity;
    }

    if (status) {
      whereClause.status = status;
    }

    const alerts = await db.auditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.user,
          as: "user",
          attributes: ["id", "email", "firstName", "lastName", "kycStatus"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      alerts: alerts.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: alerts.count,
        pages: Math.ceil(alerts.count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Add user to fraud watchlist
exports.addToWatchlist = async (req, res, next) => {
  try {
    const { userId, reason, duration = 30 } = req.body; // duration in days

    // Verify user exists
    const user = await db.user.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Add to Redis watchlist
    const watchlistKey = `fraud_watchlist:${userId}`;
    await redisClient.setEx(
      watchlistKey,
      duration * 24 * 60 * 60,
      JSON.stringify({
        reason,
        addedBy: req.user.id,
        addedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + duration * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
    );

    // Log the action
    await db.auditLog.create({
      userId: req.user.id,
      action: "user_added_to_watchlist",
      resource: "user",
      resourceId: userId.toString(),
      status: "success",
      severity: "high",
      details: {
        targetUserId: userId,
        reason,
        duration,
      },
    });

    res.json({
      success: true,
      message: "User added to fraud watchlist",
      watchlistEntry: {
        userId,
        reason,
        duration,
        expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Remove user from fraud watchlist
exports.removeFromWatchlist = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Remove from Redis watchlist
    const watchlistKey = `fraud_watchlist:${userId}`;
    await redisClient.del(watchlistKey);

    // Log the action
    await db.auditLog.create({
      userId: req.user.id,
      action: "user_removed_from_watchlist",
      resource: "user",
      resourceId: userId.toString(),
      status: "success",
      severity: "medium",
      details: {
        targetUserId: userId,
      },
    });

    res.json({
      success: true,
      message: "User removed from fraud watchlist",
    });
  } catch (err) {
    next(err);
  }
};

// Get watchlist entries
exports.getWatchlist = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get all watchlist keys from Redis
    const keys = await redisClient.keys("fraud_watchlist:*");
    const watchlistEntries = [];

    for (const key of keys.slice(offset, offset + parseInt(limit))) {
      const userId = key.split(":")[1];
      const entry = await redisClient.get(key);

      if (entry) {
        const entryData = JSON.parse(entry);
        const user = await db.user.findByPk(userId, {
          attributes: [
            "id",
            "email",
            "firstName",
            "lastName",
            "kycStatus",
            "status",
          ],
        });

        if (user) {
          watchlistEntries.push({
            userId,
            user,
            ...entryData,
          });
        }
      }
    }

    res.json({
      success: true,
      watchlist: watchlistEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: keys.length,
        pages: Math.ceil(keys.length / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Review and approve/reject high-risk card issuance
exports.reviewCardIssuance = async (req, res, next) => {
  try {
    const { cardId, action, reason } = req.body; // action: 'approve' or 'reject'

    const card = await db.virtualCard.findByPk(cardId, {
      include: [
        {
          model: db.user,
          as: "user",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    if (!card) {
      throw new AppError("Card not found", 404);
    }

    if (action === "approve") {
      // Update card status to active
      await card.update({ status: "active" });

      // Update Lithic card if needed
      // Note: You might need to implement card activation in Lithic utility

      logger.info(`Card ${cardId} approved by admin ${req.user.id}`);
    } else if (action === "reject") {
      // Terminate the card
      await card.update({
        status: "terminated",
        terminatedAt: new Date(),
        terminatedBy: req.user.id,
      });

      // Terminate in Lithic
      const { terminateCard } = require("../utils/lithic");
      await terminateCard(card.cardId);

      logger.info(`Card ${cardId} rejected by admin ${req.user.id}`);
    }

    // Log the review action
    await db.auditLog.create({
      userId: req.user.id,
      action: "card_issuance_reviewed",
      resource: "virtual_card",
      resourceId: cardId.toString(),
      status: "success",
      severity: "high",
      details: {
        cardId,
        action,
        reason,
        originalRiskLevel: card.metadata?.fraudCheck?.riskLevel,
      },
    });

    res.json({
      success: true,
      message: `Card ${
        action === "approve" ? "approved" : "rejected"
      } successfully`,
      card,
    });
  } catch (err) {
    next(err);
  }
};

// Get fraud statistics and metrics
exports.getFraudStats = async (req, res, next) => {
  try {
    const { period = "7d" } = req.query; // 7d, 30d, 90d

    let days;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 7;
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get fraud check statistics
    const fraudChecks = await db.auditLog.findAll({
      where: {
        action: "fraud_check_card_issuance",
        createdAt: {
          [db.Sequelize.Op.gte]: startDate,
        },
      },
      attributes: [
        "severity",
        "status",
        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
      ],
      group: ["severity", "status"],
    });

    // Get card creation statistics
    const cardCreations = await db.auditLog.findAll({
      where: {
        action: "virtual_card_created",
        createdAt: {
          [db.Sequelize.Op.gte]: startDate,
        },
      },
      attributes: [
        "severity",
        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
      ],
      group: ["severity"],
    });

    // Get watchlist statistics
    const watchlistKeys = await redisClient.keys("fraud_watchlist:*");
    const watchlistCount = watchlistKeys.length;

    // Calculate risk level distribution
    const riskLevels = await db.auditLog.findAll({
      where: {
        action: "fraud_check_card_issuance",
        createdAt: {
          [db.Sequelize.Op.gte]: startDate,
        },
      },
      attributes: [
        [
          db.Sequelize.fn(
            "JSON_EXTRACT",
            db.Sequelize.col("details"),
            "$.riskLevel"
          ),
          "riskLevel",
        ],
        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
      ],
      group: ["riskLevel"],
    });

    res.json({
      success: true,
      stats: {
        period,
        fraudChecks,
        cardCreations,
        watchlistCount,
        riskLevels,
        totalFraudChecks: fraudChecks.reduce(
          (sum, check) => sum + parseInt(check.dataValues.count),
          0
        ),
        totalCardCreations: cardCreations.reduce(
          (sum, creation) => sum + parseInt(creation.dataValues.count),
          0
        ),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get detailed fraud report for a specific user
exports.getUserFraudReport = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await db.user.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Get user's fraud-related audit logs
    const fraudLogs = await db.auditLog.findAll({
      where: {
        userId,
        action: {
          [db.Sequelize.Op.or]: [
            "fraud_check_card_issuance",
            "user_login",
            "virtual_card_created",
            "card_limits_updated",
          ],
        },
      },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    // Get user's cards
    const cards = await db.virtualCard.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // Check if user is on watchlist
    const isWatchlisted = await checkFraudWatchlist(user);

    // Perform current fraud assessment
    const currentFraudCheck = await performFraudCheck(user, {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      deviceFingerprint: req.headers["x-device-fingerprint"],
      location: req.headers["x-location"]
        ? JSON.parse(req.headers["x-location"])
        : null,
      requestId: req.headers["x-request-id"] || require("crypto").randomUUID(),
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        kycStatus: user.kycStatus,
        status: user.status,
        createdAt: user.createdAt,
      },
      fraudReport: {
        isWatchlisted,
        currentRiskLevel: currentFraudCheck.riskLevel,
        currentRiskScore: currentFraudCheck.score,
        fraudLogs,
        cards,
        riskFactors: currentFraudCheck.factors,
      },
    });
  } catch (err) {
    next(err);
  }
};

// module.exports = {
//   getFraudAlerts,
//   addToWatchlist,
//   removeFromWatchlist,
//   getWatchlist,
//   reviewCardIssuance,
//   getFraudStats,
//   getUserFraudReport,
// };
