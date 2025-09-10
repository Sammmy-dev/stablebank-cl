const pointsEngine = require("../services/pointsEngine");
const { User, Reward, sequelize } = require("../../db/models");
const logger = require("../utils/logger");

class PointsController {
  /**
   * Get user points summary
   */
  async getUserPoints(req, res) {
    try {
      const userId = req.user.id;
      const summary = await pointsEngine.getUserPointsSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error("Error getting user points:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user points",
        error: error.message,
      });
    }
  }

  /**
   * Get points leaderboard
   */
  async getLeaderboard(req, res) {
    try {
      const { limit = 100 } = req.query;
      const leaderboard = await pointsEngine.getLeaderboard(parseInt(limit));

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      logger.error("Error getting leaderboard:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get leaderboard",
        error: error.message,
      });
    }
  }

  /**
   * Get user points history
   */
  async getPointsHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const history = await pointsEngine.getPointsHistory(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error("Error getting points history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get points history",
        error: error.message,
      });
    }
  }

  /**
   * Get points configuration (public info)
   */
  async getPointsConfig(req, res) {
    try {
      const config = {
        tiers: {
          bronze: { minPoints: 0, multiplier: 1.0 },
          silver: { minPoints: 5000, multiplier: 1.2 },
          gold: { minPoints: 10000, multiplier: 1.5 },
          platinum: { minPoints: 25000, multiplier: 2.0 },
          diamond: { minPoints: 50000, multiplier: 3.0 },
        },
        activities: {
          referral: {
            signup: 1000,
            first_transaction: 500,
            staking: 200,
            investment: 300,
          },
          staking: {
            flexible: 50,
            locked_30: 75,
            locked_90: 100,
            locked_180: 150,
            locked_365: 200,
          },
          transaction: {
            send: 5,
            receive: 2,
            international: 10,
            large_transfer: 50,
          },
          engagement: {
            daily_login: 5,
            profile_completion: 100,
            kyc_verification: 200,
            two_factor_setup: 50,
            card_activation: 75,
            first_investment: 300,
          },
        },
      };

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      logger.error("Error getting points config:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get points configuration",
        error: error.message,
      });
    }
  }

  /**
   * Award points manually (admin only)
   */
  async awardPoints(req, res) {
    try {
      const { userId, action, points, metadata } = req.body;

      // Validate required fields
      if (!userId || !action || !points) {
        return res.status(400).json({
          success: false,
          message: "userId, action, and points are required",
        });
      }

      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const reward = await pointsEngine.awardPoints(
        userId,
        action,
        parseInt(points),
        {
          ...metadata,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          awardedBy: req.user.id,
        }
      );

      res.json({
        success: true,
        data: reward,
        message: `Successfully awarded ${points} points to user`,
      });
    } catch (error) {
      logger.error("Error awarding points:", error);
      res.status(500).json({
        success: false,
        message: "Failed to award points",
        error: error.message,
      });
    }
  }

  /**
   * Get user tier information
   */
  async getUserTier(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const totalPoints = user.totalPoints || 0;
      const tier = pointsEngine.calculateTier(totalPoints);
      const multiplier = pointsEngine.getTierMultiplier(tier);
      const nextTier = pointsEngine.getNextTier(tier);
      const pointsToNextTier = pointsEngine.getPointsToNextTier(
        totalPoints,
        tier
      );

      res.json({
        success: true,
        data: {
          currentTier: tier,
          totalPoints,
          multiplier,
          nextTier,
          pointsToNextTier,
          tierBenefits: this.getTierBenefits(tier),
        },
      });
    } catch (error) {
      logger.error("Error getting user tier:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user tier",
        error: error.message,
      });
    }
  }

  /**
   * Get tier benefits
   */
  getTierBenefits(tier) {
    const benefits = {
      bronze: {
        pointsMultiplier: 1.0,
        features: ["Basic rewards", "Standard support"],
        description: "Starting tier with basic benefits",
      },
      silver: {
        pointsMultiplier: 1.2,
        features: ["20% points bonus", "Priority support", "Lower fees"],
        description: "Enhanced rewards and support",
      },
      gold: {
        pointsMultiplier: 1.5,
        features: [
          "50% points bonus",
          "VIP support",
          "Exclusive offers",
          "Higher limits",
        ],
        description: "Premium benefits and exclusive features",
      },
      platinum: {
        pointsMultiplier: 2.0,
        features: [
          "100% points bonus",
          "Dedicated support",
          "Premium offers",
          "Highest limits",
        ],
        description: "Elite tier with maximum benefits",
      },
      diamond: {
        pointsMultiplier: 3.0,
        features: [
          "200% points bonus",
          "Personal account manager",
          "Exclusive events",
          "Custom solutions",
        ],
        description: "Ultimate tier with personalized service",
      },
    };

    return benefits[tier] || benefits.bronze;
  }

  /**
   * Get points analytics (admin only)
   */
  async getPointsAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate) {
        dateFilter.createdAt = { [sequelize.Op.gte]: new Date(startDate) };
      }
      if (endDate) {
        dateFilter.createdAt = {
          ...dateFilter.createdAt,
          [sequelize.Op.lte]: new Date(endDate),
        };
      }

      // Get total points awarded
      const totalPointsAwarded = await Reward.sum("points", {
        where: {
          type: "points",
          ...dateFilter,
        },
      });

      // Get points by action
      const pointsByAction = await Reward.findAll({
        where: {
          type: "points",
          ...dateFilter,
        },
        attributes: [
          "action",
          [sequelize.fn("SUM", sequelize.col("points")), "totalPoints"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["action"],
        order: [[sequelize.fn("SUM", sequelize.col("points")), "DESC"]],
      });

      // Get tier distribution
      const tierDistribution = await User.findAll({
        attributes: [
          "tier",
          [sequelize.fn("COUNT", sequelize.col("id")), "userCount"],
        ],
        group: ["tier"],
        order: [["tier", "ASC"]],
      });

      // Get top earners
      const topEarners = await User.findAll({
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "totalPoints",
          "tier",
        ],
        where: {
          totalPoints: { [sequelize.Op.gt]: 0 },
        },
        order: [["totalPoints", "DESC"]],
        limit: 10,
      });

      res.json({
        success: true,
        data: {
          totalPointsAwarded: totalPointsAwarded || 0,
          pointsByAction,
          tierDistribution,
          topEarners,
          dateRange: { startDate, endDate },
        },
      });
    } catch (error) {
      logger.error("Error getting points analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get points analytics",
        error: error.message,
      });
    }
  }

  /**
   * Process daily login points
   */
  async processDailyLogin(req, res) {
    try {
      const userId = req.user.id;

      // Check if user already got daily login points today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingReward = await Reward.findOne({
        where: {
          userId,
          action: "engagement_daily_login",
          createdAt: {
            [sequelize.Op.gte]: today,
          },
        },
      });

      if (existingReward) {
        return res.json({
          success: true,
          message: "Daily login points already awarded today",
          data: { alreadyAwarded: true },
        });
      }

      const reward = await pointsEngine.processEngagementPoints(
        userId,
        "daily_login",
        {
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );

      res.json({
        success: true,
        data: reward,
        message: "Daily login points awarded successfully",
      });
    } catch (error) {
      logger.error("Error processing daily login points:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process daily login points",
        error: error.message,
      });
    }
  }
}

module.exports = new PointsController();
