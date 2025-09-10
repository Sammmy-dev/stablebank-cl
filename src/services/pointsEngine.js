const {
  User,
  Reward,
  Staking,
  Transaction,
  AuditLog,
} = require("../../db/models");
const { sequelize } = require("../../db/models");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");

class PointsEngine {
  constructor() {
    // Points configuration for different activities
    this.pointsConfig = {
      // Referral activities
      referral: {
        signup: 1000, // Points for successful referral signup
        first_transaction: 500, // Points when referred user makes first transaction
        staking: 200, // Points when referred user stakes
        investment: 300, // Points when referred user invests
      },

      // Staking activities
      staking: {
        flexible: 50, // Points per $100 staked
        locked_30: 75, // Points per $100 staked
        locked_90: 100, // Points per $100 staked
        locked_180: 150, // Points per $100 staked
        locked_365: 200, // Points per $100 staked
        daily_bonus: 10, // Daily bonus for active staking
        milestone_1000: 1000, // Milestone bonus for $1000+ staked
        milestone_5000: 2500, // Milestone bonus for $5000+ staked
        milestone_10000: 5000, // Milestone bonus for $10000+ staked
      },

      // Transaction activities
      transaction: {
        send: 5, // Points per $10 sent
        receive: 2, // Points per $10 received
        international: 10, // Bonus points for international transfers
        large_transfer: 50, // Bonus for transfers > $1000
      },

      // Engagement activities
      engagement: {
        daily_login: 5, // Daily login bonus
        profile_completion: 100, // Complete profile
        kyc_verification: 200, // KYC verification
        two_factor_setup: 50, // 2FA setup
        card_activation: 75, // Virtual card activation
        first_investment: 300, // First investment
      },

      // Special events
      special: {
        birthday: 500, // Birthday bonus
        anniversary: 1000, // Account anniversary
        holiday_bonus: 250, // Holiday bonuses
        promotional: 1000, // Promotional events
      },
    };

    // Tier multipliers
    this.tierMultipliers = {
      bronze: 1.0,
      silver: 1.2,
      gold: 1.5,
      platinum: 2.0,
      diamond: 3.0,
    };

    // Referral milestone rewards
    this.referralStats = {
      milestoneRewards: {
        referrals_5: 1000, // 5 referrals
        referrals_10: 2500, // 10 referrals
        referrals_25: 5000, // 25 referrals
        referrals_50: 10000, // 50 referrals
        referrals_100: 25000, // 100 referrals
      },
    };
  }

  /**
   * Calculate user tier based on total points
   */
  calculateTier(totalPoints) {
    if (totalPoints >= 50000) return "diamond";
    if (totalPoints >= 25000) return "platinum";
    if (totalPoints >= 10000) return "gold";
    if (totalPoints >= 5000) return "silver";
    return "bronze";
  }

  /**
   * Get tier multiplier for points calculation
   */
  getTierMultiplier(tier) {
    return this.tierMultipliers[tier] || 1.0;
  }

  /**
   * Calculate points for staking activity
   */
  calculateStakingPoints(stakingData) {
    const { stakingType, amountUSD } = stakingData;
    const basePoints = this.pointsConfig.staking[stakingType] || 0;
    const pointsPerHundred = basePoints;
    const points = Math.floor((amountUSD / 100) * pointsPerHundred);

    // Add milestone bonuses
    let milestoneBonus = 0;
    if (amountUSD >= 10000) {
      milestoneBonus = this.pointsConfig.staking.milestone_10000;
    } else if (amountUSD >= 5000) {
      milestoneBonus = this.pointsConfig.staking.milestone_5000;
    } else if (amountUSD >= 1000) {
      milestoneBonus = this.pointsConfig.staking.milestone_1000;
    }

    return points + milestoneBonus;
  }

  /**
   * Calculate points for referral activity
   */
  calculateReferralPoints(action, referredUserData = {}) {
    return this.pointsConfig.referral[action] || 0;
  }

  /**
   * Calculate points for transaction activity
   */
  calculateTransactionPoints(transactionData) {
    const { type, amountUSD, isInternational, isLarge } = transactionData;
    let points = 0;

    if (type === "send") {
      points = Math.floor(
        (amountUSD / 10) * this.pointsConfig.transaction.send
      );
    } else if (type === "receive") {
      points = Math.floor(
        (amountUSD / 10) * this.pointsConfig.transaction.receive
      );
    }

    // Add bonuses
    if (isInternational) {
      points += this.pointsConfig.transaction.international;
    }
    if (isLarge) {
      points += this.pointsConfig.transaction.large_transfer;
    }

    return points;
  }

  /**
   * Award points to a user
   */
  async awardPoints(userId, action, points, metadata = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Get user's current tier
      const currentTier = this.calculateTier(user.totalPoints || 0);
      const multiplier = this.getTierMultiplier(currentTier);
      const adjustedPoints = Math.floor(points * multiplier);

      // Create reward record
      const reward = await Reward.create({
        userId,
        type: "points",
        action,
        points: adjustedPoints,
        amount: 0, // Points don't have USD value
        status: "credited",
        tier: currentTier,
        multiplier,
        metadata: {
          ...metadata,
          basePoints: points,
          adjustedPoints,
          tier: currentTier,
        },
      });

      // Update user's total points
      await user.update({
        totalPoints: (user.totalPoints || 0) + adjustedPoints,
      });

      // Check if tier changed
      const newTier = this.calculateTier(user.totalPoints + adjustedPoints);
      if (newTier !== currentTier) {
        await user.update({ tier: newTier });

        // Award tier upgrade bonus
        const tierUpgradeBonus = this.calculateTierUpgradeBonus(
          currentTier,
          newTier
        );
        if (tierUpgradeBonus > 0) {
          await this.awardPoints(userId, "tier_upgrade", tierUpgradeBonus, {
            fromTier: currentTier,
            toTier: newTier,
          });
        }
      }

      // Log the points award
      await AuditLog.create({
        userId,
        action: "points_awarded",
        details: {
          action,
          points: adjustedPoints,
          totalPoints: user.totalPoints + adjustedPoints,
          tier: newTier,
          rewardId: reward.id,
        },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });

      // Cache user points for quick access
      await this.cacheUserPoints(userId, user.totalPoints + adjustedPoints);

      logger.info(
        `Awarded ${adjustedPoints} points to user ${userId} for action: ${action}`
      );
      return reward;
    } catch (error) {
      logger.error(`Error awarding points to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate tier upgrade bonus
   */
  calculateTierUpgradeBonus(fromTier, toTier) {
    const tierBonuses = {
      bronze: 0,
      silver: 500,
      gold: 1000,
      platinum: 2500,
      diamond: 5000,
    };

    const fromBonus = tierBonuses[fromTier] || 0;
    const toBonus = tierBonuses[toTier] || 0;
    return toBonus - fromBonus;
  }

  /**
   * Process staking points
   */
  async processStakingPoints(stakingId) {
    try {
      const staking = await Staking.findByPk(stakingId, {
        include: [{ model: User, as: "user" }],
      });

      if (!staking || staking.status !== "active") {
        return null;
      }

      const points = this.calculateStakingPoints({
        stakingType: staking.stakingType,
        amountUSD: parseFloat(staking.amountUSD),
      });

      if (points > 0) {
        return await this.awardPoints(staking.userId, "staking", points, {
          stakingId,
          stakingType: staking.stakingType,
          amountUSD: staking.amountUSD,
        });
      }

      return null;
    } catch (error) {
      logger.error(
        `Error processing staking points for staking ${stakingId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process referral points
   */
  async processReferralPoints(referrerId, action, referredUserData = {}) {
    try {
      const points = this.calculateReferralPoints(action, referredUserData);

      if (points > 0) {
        return await this.awardPoints(
          referrerId,
          `referral_${action}`,
          points,
          {
            referredUserId: referredUserData.id,
            referredUserEmail: referredUserData.email,
            action,
          }
        );
      }

      return null;
    } catch (error) {
      logger.error(
        `Error processing referral points for user ${referrerId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process transaction points
   */
  async processTransactionPoints(transactionId) {
    try {
      const transaction = await Transaction.findByPk(transactionId, {
        include: [{ model: User, as: "user" }],
      });

      if (!transaction) {
        return null;
      }

      const isInternational =
        transaction.recipientCountry !== transaction.senderCountry;
      const isLarge = parseFloat(transaction.amountUSD) > 1000;

      const points = this.calculateTransactionPoints({
        type: transaction.type,
        amountUSD: parseFloat(transaction.amountUSD),
        isInternational,
        isLarge,
      });

      if (points > 0) {
        return await this.awardPoints(
          transaction.userId,
          "transaction",
          points,
          {
            transactionId,
            transactionType: transaction.type,
            amountUSD: transaction.amountUSD,
            isInternational,
            isLarge,
          }
        );
      }

      return null;
    } catch (error) {
      logger.error(
        `Error processing transaction points for transaction ${transactionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process engagement points
   */
  async processEngagementPoints(userId, action, metadata = {}) {
    try {
      const points = this.pointsConfig.engagement[action] || 0;

      if (points > 0) {
        return await this.awardPoints(
          userId,
          `engagement_${action}`,
          points,
          metadata
        );
      }

      return null;
    } catch (error) {
      logger.error(
        `Error processing engagement points for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get user points summary
   */
  async getUserPointsSummary(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const totalPoints = user.totalPoints || 0;
      const tier = this.calculateTier(totalPoints);
      const multiplier = this.getTierMultiplier(tier);

      // Get recent rewards
      const recentRewards = await Reward.findAll({
        where: { userId, type: "points" },
        order: [["createdAt", "DESC"]],
        limit: 10,
      });

      // Get points breakdown by action
      const pointsBreakdown = await Reward.findAll({
        where: { userId, type: "points" },
        attributes: [
          "action",
          [sequelize.fn("SUM", sequelize.col("points")), "totalPoints"],
        ],
        group: ["action"],
        order: [[sequelize.fn("SUM", sequelize.col("points")), "DESC"]],
      });

      return {
        totalPoints,
        tier,
        multiplier,
        recentRewards,
        pointsBreakdown,
        nextTier: this.getNextTier(tier),
        pointsToNextTier: this.getPointsToNextTier(totalPoints, tier),
      };
    } catch (error) {
      logger.error(`Error getting points summary for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get next tier
   */
  getNextTier(currentTier) {
    const tiers = ["bronze", "silver", "gold", "platinum", "diamond"];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }

  /**
   * Get points needed for next tier
   */
  getPointsToNextTier(totalPoints, currentTier) {
    const tierThresholds = {
      bronze: 5000,
      silver: 10000,
      gold: 25000,
      platinum: 50000,
    };

    const nextTier = this.getNextTier(currentTier);
    if (!nextTier) return 0;

    const threshold = tierThresholds[currentTier];
    return Math.max(0, threshold - totalPoints);
  }

  /**
   * Cache user points in Redis
   */
  async cacheUserPoints(userId, points) {
    try {
      await redisClient.set(`user:${userId}:points`, points, "EX", 3600); // 1 hour
    } catch (error) {
      logger.error(`Error caching points for user ${userId}:`, error);
    }
  }

  /**
   * Get cached user points
   */
  async getCachedUserPoints(userId) {
    try {
      const cached = await redisClient.get(`user:${userId}:points`);
      return cached ? parseInt(cached) : null;
    } catch (error) {
      logger.error(`Error getting cached points for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100) {
    try {
      const users = await User.findAll({
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
        limit,
      });

      return users.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        totalPoints: user.totalPoints || 0,
        tier: user.tier || "bronze",
      }));
    } catch (error) {
      logger.error("Error getting leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get points history
   */
  async getPointsHistory(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await Reward.findAndCountAll({
        where: { userId, type: "points" },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return {
        rewards: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error(`Error getting points history for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new PointsEngine();
