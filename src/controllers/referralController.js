const referralService = require("../services/referralService");
const { User } = require("../../db/models");
const logger = require("../utils/logger");

class ReferralController {
  /**
   * Create referral using BankTag
   */
  async createReferral(req, res) {
    try {
      const { referrerBankTag } = req.body;
      const userId = req.user.id;

      if (!referrerBankTag) {
        return res.status(400).json({
          success: false,
          message: "Referrer BankTag is required",
        });
      }

      const result = await referralService.createReferral(
        userId,
        referrerBankTag,
        {
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );

      res.status(201).json({
        success: true,
        message: "Referral created successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error creating referral:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create referral",
      });
    }
  }

  /**
   * Get user's referral statistics
   */
  async getReferralStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await referralService.getReferralStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting referral stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get referral statistics",
        error: error.message,
      });
    }
  }

  /**
   * Get referral tree (multi-level)
   */
  async getReferralTree(req, res) {
    try {
      const userId = req.user.id;
      const { maxDepth = 3 } = req.query;

      const tree = await referralService.getReferralTree(
        userId,
        parseInt(maxDepth)
      );

      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      logger.error("Error getting referral tree:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get referral tree",
        error: error.message,
      });
    }
  }

  /**
   * Get referral leaderboard
   */
  async getReferralLeaderboard(req, res) {
    try {
      const { limit = 50 } = req.query;
      const leaderboard = await referralService.getReferralLeaderboard(
        parseInt(limit)
      );

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      logger.error("Error getting referral leaderboard:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get referral leaderboard",
        error: error.message,
      });
    }
  }

  /**
   * Validate referral link
   */
  async validateReferralLink(req, res) {
    try {
      const { bankTag } = req.query;

      if (!bankTag) {
        return res.status(400).json({
          success: false,
          message: "BankTag is required",
        });
      }

      const validation = await referralService.validateReferralLink(bankTag);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error("Error validating referral link:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate referral link",
        error: error.message,
      });
    }
  }

  /**
   * Get referral analytics
   */
  async getReferralAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const analytics = await referralService.getReferralAnalytics(
        userId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error("Error getting referral analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get referral analytics",
        error: error.message,
      });
    }
  }

  /**
   * Get user's referral link info
   */
  async getReferralLinkInfo(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId, {
        attributes: ["id", "bankTag", "firstName", "lastName", "referralCode"],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.bankTag) {
        return res.status(400).json({
          success: false,
          message: "BankTag not set. Please set a BankTag first.",
        });
      }

      const referralLink = `${
        process.env.FRONTEND_URL || "https://app.stablebank.com"
      }/signup?ref=${user.bankTag}`;
      const referralCode =
        user.referralCode || referralService.generateReferralCode(user.bankTag);

      res.json({
        success: true,
        data: {
          bankTag: user.bankTag,
          referralCode,
          referralLink,
          shareText: `Join me on StableBank! Use my referral link: ${referralLink}`,
          qrCode: `${
            process.env.API_URL || "https://api.stablebank.com"
          }/qr/referral/${user.bankTag}`,
        },
      });
    } catch (error) {
      logger.error("Error getting referral link info:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get referral link info",
        error: error.message,
      });
    }
  }

  /**
   * Get referral rewards configuration
   */
  async getReferralRewards(req, res) {
    try {
      const rewards = {
        signup: {
          points: 1000,
          description:
            "Points awarded when someone signs up using your referral",
        },
        firstTransaction: {
          points: 500,
          description:
            "Points awarded when your referral makes their first transaction",
        },
        staking: {
          points: 200,
          description: "Points awarded when your referral stakes tokens",
        },
        investment: {
          points: 300,
          description: "Points awarded when your referral makes an investment",
        },
        milestones: {
          5: {
            points: 1000,
            description: "Bonus for reaching 5 referrals",
          },
          10: {
            points: 2500,
            description: "Bonus for reaching 10 referrals",
          },
          25: {
            points: 5000,
            description: "Bonus for reaching 25 referrals",
          },
          50: {
            points: 10000,
            description: "Bonus for reaching 50 referrals",
          },
          100: {
            points: 25000,
            description: "Bonus for reaching 100 referrals",
          },
        },
      };

      res.json({
        success: true,
        data: rewards,
      });
    } catch (error) {
      logger.error("Error getting referral rewards:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get referral rewards",
        error: error.message,
      });
    }
  }

  /**
   * Get recent referral activity
   */
  async getRecentReferralActivity(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get user's referrals
      const referrals = await User.findAll({
        where: { referredBy: userId },
        attributes: ["id", "bankTag", "firstName", "lastName"],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: {
          referrals,
          totalReferrals: referrals.length,
        },
      });
    } catch (error) {
      logger.error("Error getting recent referral activity:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get recent referral activity",
        error: error.message,
      });
    }
  }

  /**
   * Search for potential referrers by BankTag
   */
  async searchReferrers(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters",
        });
      }

      const users = await User.findAll({
        where: {
          bankTag: { [require("sequelize").Op.iLike]: `%${q}%` },
          status: "active",
        },
        attributes: ["id", "bankTag", "firstName", "lastName"],
        limit: 10,
        order: [["bankTag", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          results: users,
          total: users.length,
        },
      });
    } catch (error) {
      logger.error("Error searching referrers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search referrers",
        error: error.message,
      });
    }
  }

  /**
   * Get referral performance metrics
   */
  async getReferralPerformance(req, res) {
    try {
      const userId = req.user.id;
      const { period = "30d" } = req.query;

      // Calculate date range based on period
      const now = new Date();
      let startDate;

      switch (period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const analytics = await referralService.getReferralAnalytics(
        userId,
        startDate.toISOString(),
        now.toISOString()
      );

      // Calculate performance metrics
      const performance = {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        totalReferrals: analytics.overview.totalReferrals,
        activeReferrals: analytics.overview.activeReferrals,
        conversionRate: analytics.overview.conversionRate,
        averageReferralsPerDay: analytics.overview.totalReferrals / 30, // Assuming 30 days
        signupsOverTime: analytics.signupsOverTime,
        activityBreakdown: analytics.referralActivity,
      };

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      logger.error("Error getting referral performance:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get referral performance",
        error: error.message,
      });
    }
  }
}

module.exports = new ReferralController();
