const {
  User,
  Transaction,
  Staking,
  Investment,
  AuditLog,
} = require("../../db/models");
const { sequelize } = require("../../db/models");
const pointsIntegration = require("./pointsIntegration");
const logger = require("../utils/logger");
const crypto = require("crypto");

class ReferralService {
  constructor() {
    this.referralStats = {
      signupBonus: 1000,
      firstTransactionBonus: 500,
      stakingBonus: 200,
      investmentBonus: 300,
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
   * Generate a unique referral code based on BankTag
   */
  generateReferralCode(bankTag) {
    if (!bankTag) return null;

    // Remove @ symbol and create a clean referral code
    const cleanTag = bankTag.replace("@", "");
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString("hex");

    return `${cleanTag}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Validate BankTag format
   */
  isValidBankTag(bankTag) {
    return /^@[a-zA-Z0-9_]{3,20}$/.test(bankTag);
  }

  /**
   * Find referrer by BankTag
   */
  async findReferrerByBankTag(bankTag) {
    try {
      if (!this.isValidBankTag(bankTag)) {
        throw new Error("Invalid BankTag format");
      }

      const referrer = await User.findOne({
        where: {
          bankTag,
          status: "active",
        },
        attributes: [
          "id",
          "bankTag",
          "firstName",
          "lastName",
          "email",
          "referralCode",
        ],
      });

      if (!referrer) {
        throw new Error("Referrer not found");
      }

      return referrer;
    } catch (error) {
      logger.error(`Error finding referrer by BankTag ${bankTag}:`, error);
      throw error;
    }
  }

  /**
   * Create referral relationship
   */
  async createReferral(newUserId, referrerBankTag, metadata = {}) {
    try {
      // Find referrer
      const referrer = await this.findReferrerByBankTag(referrerBankTag);

      if (!referrer) {
        throw new Error("Referrer not found");
      }

      // Check if user is trying to refer themselves
      if (referrer.id === newUserId) {
        throw new Error("Cannot refer yourself");
      }

      // Get new user
      const newUser = await User.findByPk(newUserId);
      if (!newUser) {
        throw new Error("New user not found");
      }

      // Check if user already has a referrer
      if (newUser.referredBy) {
        throw new Error("User already has a referrer");
      }

      // Generate referral code for new user if they don't have one
      if (!newUser.referralCode) {
        newUser.referralCode = this.generateReferralCode(newUser.bankTag);
      }

      // Update new user with referrer
      await newUser.update({
        referredBy: referrer.id,
        referralCode: newUser.referralCode,
      });

      // Log the referral
      await AuditLog.create({
        userId: newUserId,
        action: "referral_created",
        details: {
          referrerId: referrer.id,
          referrerBankTag: referrer.bankTag,
          referrerName: `${referrer.firstName} ${referrer.lastName}`,
          newUserBankTag: newUser.bankTag,
          newUserName: `${newUser.firstName} ${newUser.lastName}`,
          ...metadata,
        },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });

      // Award referral points
      await pointsIntegration.processReferralSignup(newUserId, referrer.id);

      logger.info(
        `Referral created: ${referrer.bankTag} referred ${newUser.bankTag}`
      );

      return {
        referrer: {
          id: referrer.id,
          bankTag: referrer.bankTag,
          name: `${referrer.firstName} ${referrer.lastName}`,
        },
        newUser: {
          id: newUser.id,
          bankTag: newUser.bankTag,
          name: `${newUser.firstName} ${newUser.lastName}`,
          referralCode: newUser.referralCode,
        },
      };
    } catch (error) {
      logger.error(`Error creating referral:`, error);
      throw error;
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Get direct referrals
      const directReferrals = await User.findAll({
        where: { referredBy: userId },
        attributes: [
          "id",
          "bankTag",
          "firstName",
          "lastName",
          "email",
          "createdAt",
          "status",
        ],
        order: [["createdAt", "DESC"]],
      });

      // Get referral counts by status
      const activeReferrals = directReferrals.filter(
        (ref) => ref.status === "active"
      );
      const totalReferrals = directReferrals.length;
      const activeCount = activeReferrals.length;

      // Calculate total value from referrals
      const referralIds = directReferrals.map((ref) => ref.id);

      let totalStakingValue = 0;
      let totalTransactionValue = 0;
      let totalInvestmentValue = 0;

      if (referralIds.length > 0) {
        // Get staking value
        const stakingStats = await Staking.findAll({
          where: {
            userId: { [sequelize.Op.in]: referralIds },
            status: "active",
          },
          attributes: [
            [sequelize.fn("SUM", sequelize.col("amountUSD")), "totalAmount"],
          ],
          raw: true,
        });
        totalStakingValue = parseFloat(stakingStats[0]?.totalAmount || 0);

        // Get transaction value
        const transactionStats = await Transaction.findAll({
          where: {
            userId: { [sequelize.Op.in]: referralIds },
            status: "completed",
          },
          attributes: [
            [sequelize.fn("SUM", sequelize.col("amountUSD")), "totalAmount"],
          ],
          raw: true,
        });
        totalTransactionValue = parseFloat(
          transactionStats[0]?.totalAmount || 0
        );

        // Get investment value
        const investmentStats = await Investment.findAll({
          where: {
            userId: { [sequelize.Op.in]: referralIds },
            status: "active",
          },
          attributes: [
            [sequelize.fn("SUM", sequelize.col("amountUSD")), "totalAmount"],
          ],
          raw: true,
        });
        totalInvestmentValue = parseFloat(investmentStats[0]?.totalAmount || 0);
      }

      // Calculate milestone progress
      const milestones = Object.keys(this.referralStats.milestoneRewards);
      const currentMilestone = milestones.find((milestone) => {
        const count = parseInt(milestone.split("_")[1]);
        return totalReferrals >= count;
      });

      const nextMilestone = milestones.find((milestone) => {
        const count = parseInt(milestone.split("_")[1]);
        return totalReferrals < count;
      });

      // Get recent referral activity
      const recentActivity = await AuditLog.findAll({
        where: {
          userId: { [sequelize.Op.in]: referralIds },
          action: {
            [sequelize.Op.in]: [
              "transaction_completed",
              "staking_created",
              "investment_created",
            ],
          },
        },
        order: [["createdAt", "DESC"]],
        limit: 10,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["bankTag", "firstName", "lastName"],
          },
        ],
      });

      return {
        user: {
          id: user.id,
          bankTag: user.bankTag,
          referralCode: user.referralCode,
        },
        stats: {
          totalReferrals,
          activeReferrals: activeCount,
          totalStakingValue,
          totalTransactionValue,
          totalInvestmentValue,
          totalValue:
            totalStakingValue + totalTransactionValue + totalInvestmentValue,
        },
        milestones: {
          current: currentMilestone,
          next: nextMilestone,
          progress: nextMilestone
            ? {
                current: totalReferrals,
                target: parseInt(nextMilestone.split("_")[1]),
                percentage: Math.round(
                  (totalReferrals / parseInt(nextMilestone.split("_")[1])) * 100
                ),
              }
            : null,
        },
        referrals: directReferrals,
        recentActivity,
      };
    } catch (error) {
      logger.error(`Error getting referral stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get referral tree (multi-level)
   */
  async getReferralTree(userId, maxDepth = 3) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const buildTree = async (userId, depth = 0) => {
        if (depth >= maxDepth) return null;

        const referrals = await User.findAll({
          where: { referredBy: userId },
          attributes: [
            "id",
            "bankTag",
            "firstName",
            "lastName",
            "email",
            "createdAt",
            "status",
          ],
          order: [["createdAt", "DESC"]],
        });

        const tree = [];
        for (const referral of referrals) {
          const children = await buildTree(referral.id, depth + 1);
          tree.push({
            ...referral.toJSON(),
            children,
            level: depth + 1,
          });
        }

        return tree;
      };

      const tree = await buildTree(userId);

      return {
        user: {
          id: user.id,
          bankTag: user.bankTag,
          name: `${user.firstName} ${user.lastName}`,
        },
        tree,
      };
    } catch (error) {
      logger.error(`Error getting referral tree for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get referral leaderboard
   */
  async getReferralLeaderboard(limit = 50) {
    try {
      const leaderboard = await User.findAll({
        attributes: [
          "id",
          "bankTag",
          "firstName",
          "lastName",
          [
            sequelize.fn("COUNT", sequelize.col("referrals.id")),
            "referralCount",
          ],
        ],
        include: [
          {
            model: User,
            as: "referrals",
            attributes: [],
            where: { status: "active" },
          },
        ],
        group: ["user.id", "user.bankTag", "user.firstName", "user.lastName"],
        having: sequelize.literal("COUNT(referrals.id) > 0"),
        order: [[sequelize.fn("COUNT", sequelize.col("referrals.id")), "DESC"]],
        limit,
      });

      return leaderboard.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        bankTag: user.bankTag,
        name: `${user.firstName} ${user.lastName}`,
        referralCount: parseInt(user.dataValues.referralCount),
      }));
    } catch (error) {
      logger.error("Error getting referral leaderboard:", error);
      throw error;
    }
  }

  /**
   * Track referral activity (transactions, staking, investments)
   */
  async trackReferralActivity(userId, activityType, activityData) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.referredBy) {
        return null; // No referrer to track
      }

      // Log the activity
      await AuditLog.create({
        userId,
        action: `referral_${activityType}`,
        details: {
          referrerId: user.referredBy,
          activityType,
          ...activityData,
        },
      });

      // Process points based on activity type
      switch (activityType) {
        case "first_transaction":
          await pointsIntegration.processReferralFirstTransaction(userId);
          break;
        case "staking":
          await pointsIntegration.processReferralStaking(userId);
          break;
        case "investment":
          await pointsIntegration.processReferralInvestment(userId);
          break;
      }

      logger.info(
        `Referral activity tracked: ${activityType} for user ${userId}`
      );
      return true;
    } catch (error) {
      logger.error(`Error tracking referral activity:`, error);
      throw error;
    }
  }

  /**
   * Validate referral link
   */
  async validateReferralLink(bankTag) {
    try {
      if (!this.isValidBankTag(bankTag)) {
        return {
          valid: false,
          error: "Invalid BankTag format",
        };
      }

      const referrer = await User.findOne({
        where: {
          bankTag,
          status: "active",
        },
        attributes: ["id", "bankTag", "firstName", "lastName"],
      });

      if (!referrer) {
        return {
          valid: false,
          error: "Referrer not found",
        };
      }

      return {
        valid: true,
        referrer: {
          id: referrer.id,
          bankTag: referrer.bankTag,
          name: `${referrer.firstName} ${referrer.lastName}`,
        },
      };
    } catch (error) {
      logger.error(`Error validating referral link:`, error);
      return {
        valid: false,
        error: "Validation failed",
      };
    }
  }

  /**
   * Get referral analytics
   */
  async getReferralAnalytics(userId, startDate = null, endDate = null) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Get all referrals
      const referrals = await User.findAll({
        where: { referredBy: userId },
        attributes: ["id", "createdAt", "status"],
      });

      const referralIds = referrals.map((ref) => ref.id);

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

      // Get referral signups over time
      const signupsOverTime = await User.findAll({
        where: {
          referredBy: userId,
          ...dateFilter,
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
        order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
      });

      // Get activity from referrals
      let referralActivity = [];
      if (referralIds.length > 0) {
        referralActivity = await AuditLog.findAll({
          where: {
            userId: { [sequelize.Op.in]: referralIds },
            action: {
              [sequelize.Op.in]: [
                "transaction_completed",
                "staking_created",
                "investment_created",
              ],
            },
            ...dateFilter,
          },
          attributes: [
            "action",
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          group: ["action"],
          order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        });
      }

      // Calculate conversion rates
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(
        (ref) => ref.status === "active"
      ).length;
      const conversionRate =
        totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;

      return {
        user: {
          id: user.id,
          bankTag: user.bankTag,
        },
        overview: {
          totalReferrals,
          activeReferrals,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        signupsOverTime,
        referralActivity,
        dateRange: { startDate, endDate },
      };
    } catch (error) {
      logger.error(
        `Error getting referral analytics for user ${userId}:`,
        error
      );
      throw error;
    }
  }
}

module.exports = new ReferralService();
