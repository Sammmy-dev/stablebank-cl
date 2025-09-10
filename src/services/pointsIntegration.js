const pointsEngine = require("./pointsEngine");
const {
  User,
  Staking,
  Transaction,
  Investment,
  VirtualCard,
  KYC,
} = require("../../db/models");
const logger = require("../utils/logger");

class PointsIntegration {
  /**
   * Process points for new staking
   */
  async processStakingPoints(stakingId) {
    try {
      logger.info(`Processing staking points for staking ID: ${stakingId}`);
      return await pointsEngine.processStakingPoints(stakingId);
    } catch (error) {
      logger.error(`Error processing staking points for ${stakingId}:`, error);
      throw error;
    }
  }

  /**
   * Process points for new transaction
   */
  async processTransactionPoints(transactionId) {
    try {
      logger.info(
        `Processing transaction points for transaction ID: ${transactionId}`
      );
      return await pointsEngine.processTransactionPoints(transactionId);
    } catch (error) {
      logger.error(
        `Error processing transaction points for ${transactionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process referral points when new user signs up
   */
  async processReferralSignup(newUserId, referrerId) {
    try {
      if (!referrerId) return null;

      logger.info(
        `Processing referral signup points for referrer: ${referrerId}, new user: ${newUserId}`
      );

      const newUser = await User.findByPk(newUserId);
      if (!newUser) {
        throw new Error("New user not found");
      }

      // Check if this is the first referral for the referrer (milestone check)
      const referralCount = await User.count({
        where: { referredBy: referrerId },
      });

      const result = await pointsEngine.processReferralPoints(
        referrerId,
        "signup",
        {
          id: newUser.id,
          email: newUser.email,
        }
      );

      // Check for milestone rewards
      const milestones = [5, 10, 25, 50, 100];
      for (const milestone of milestones) {
        if (referralCount === milestone) {
          await pointsEngine.awardPoints(
            referrerId,
            `referral_milestone_${milestone}`,
            pointsEngine.referralStats.milestoneRewards[
              `referrals_${milestone}`
            ] || 0,
            {
              milestone,
              referralCount,
              milestoneType: `referrals_${milestone}`,
            }
          );
          break;
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error processing referral signup points:`, error);
      throw error;
    }
  }

  /**
   * Process referral points when referred user makes first transaction
   */
  async processReferralFirstTransaction(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.referredBy) return null;

      // Check if this is the user's first transaction
      const transactionCount = await Transaction.count({
        where: { userId },
      });

      if (transactionCount === 1) {
        logger.info(
          `Processing referral first transaction points for referrer: ${user.referredBy}`
        );
        return await pointsEngine.processReferralPoints(
          user.referredBy,
          "first_transaction",
          {
            id: user.id,
            email: user.email,
          }
        );
      }

      return null;
    } catch (error) {
      logger.error(
        `Error processing referral first transaction points:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process referral points when referred user stakes
   */
  async processReferralStaking(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.referredBy) return null;

      logger.info(
        `Processing referral staking points for referrer: ${user.referredBy}`
      );
      return await pointsEngine.processReferralPoints(
        user.referredBy,
        "staking",
        {
          id: user.id,
          email: user.email,
        }
      );
    } catch (error) {
      logger.error(`Error processing referral staking points:`, error);
      throw error;
    }
  }

  /**
   * Process referral points when referred user invests
   */
  async processReferralInvestment(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.referredBy) return null;

      logger.info(
        `Processing referral investment points for referrer: ${user.referredBy}`
      );
      return await pointsEngine.processReferralPoints(
        user.referredBy,
        "investment",
        {
          id: user.id,
          email: user.email,
        }
      );
    } catch (error) {
      logger.error(`Error processing referral investment points:`, error);
      throw error;
    }
  }

  /**
   * Process engagement points for profile completion
   */
  async processProfileCompletion(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return null;

      // Check if profile is complete (has all required fields)
      const isComplete =
        user.firstName &&
        user.lastName &&
        user.dateOfBirth &&
        user.country &&
        user.phoneNumber;

      if (isComplete) {
        logger.info(`Processing profile completion points for user: ${userId}`);
        return await pointsEngine.processEngagementPoints(
          userId,
          "profile_completion"
        );
      }

      return null;
    } catch (error) {
      logger.error(`Error processing profile completion points:`, error);
      throw error;
    }
  }

  /**
   * Process engagement points for KYC verification
   */
  async processKYCVerification(userId) {
    try {
      const kyc = await KYC.findOne({
        where: { userId, status: "approved" },
      });

      if (kyc) {
        logger.info(`Processing KYC verification points for user: ${userId}`);
        return await pointsEngine.processEngagementPoints(
          userId,
          "kyc_verification"
        );
      }

      return null;
    } catch (error) {
      logger.error(`Error processing KYC verification points:`, error);
      throw error;
    }
  }

  /**
   * Process engagement points for 2FA setup
   */
  async process2FASetup(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.is2FAEnabled) return null;

      logger.info(`Processing 2FA setup points for user: ${userId}`);
      return await pointsEngine.processEngagementPoints(
        userId,
        "two_factor_setup"
      );
    } catch (error) {
      logger.error(`Error processing 2FA setup points:`, error);
      throw error;
    }
  }

  /**
   * Process engagement points for virtual card activation
   */
  async processCardActivation(userId) {
    try {
      const card = await VirtualCard.findOne({
        where: { userId, status: "active" },
      });

      if (card) {
        logger.info(`Processing card activation points for user: ${userId}`);
        return await pointsEngine.processEngagementPoints(
          userId,
          "card_activation"
        );
      }

      return null;
    } catch (error) {
      logger.error(`Error processing card activation points:`, error);
      throw error;
    }
  }

  /**
   * Process engagement points for first investment
   */
  async processFirstInvestment(userId) {
    try {
      const investmentCount = await Investment.count({
        where: { userId },
      });

      if (investmentCount === 1) {
        logger.info(`Processing first investment points for user: ${userId}`);
        return await pointsEngine.processEngagementPoints(
          userId,
          "first_investment"
        );
      }

      return null;
    } catch (error) {
      logger.error(`Error processing first investment points:`, error);
      throw error;
    }
  }

  /**
   * Process special event points (birthday, anniversary, etc.)
   */
  async processSpecialEventPoints(userId, eventType, metadata = {}) {
    try {
      logger.info(
        `Processing special event points for user: ${userId}, event: ${eventType}`
      );
      return await pointsEngine.awardPoints(
        userId,
        `special_${eventType}`,
        pointsEngine.pointsConfig.special[eventType] || 0,
        metadata
      );
    } catch (error) {
      logger.error(`Error processing special event points:`, error);
      throw error;
    }
  }

  /**
   * Process birthday points
   */
  async processBirthdayPoints(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.dateOfBirth) return null;

      const today = new Date();
      const birthday = new Date(user.dateOfBirth);

      // Check if today is user's birthday
      if (
        today.getMonth() === birthday.getMonth() &&
        today.getDate() === birthday.getDate()
      ) {
        // Check if we already awarded birthday points this year
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const existingReward = await pointsEngine.getPointsHistory(
          userId,
          1,
          100
        );

        const hasBirthdayReward = existingReward.rewards.some(
          (reward) =>
            reward.action === "special_birthday" &&
            new Date(reward.createdAt) >= startOfYear
        );

        if (!hasBirthdayReward) {
          logger.info(`Processing birthday points for user: ${userId}`);
          return await this.processSpecialEventPoints(userId, "birthday", {
            birthYear: birthday.getFullYear(),
          });
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error processing birthday points:`, error);
      throw error;
    }
  }

  /**
   * Process account anniversary points
   */
  async processAnniversaryPoints(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return null;

      const today = new Date();
      const accountCreated = new Date(user.createdAt);

      // Check if today is account anniversary
      if (
        today.getMonth() === accountCreated.getMonth() &&
        today.getDate() === accountCreated.getDate()
      ) {
        const yearsSinceCreation =
          today.getFullYear() - accountCreated.getFullYear();

        if (yearsSinceCreation > 0) {
          // Check if we already awarded anniversary points this year
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          const existingReward = await pointsEngine.getPointsHistory(
            userId,
            1,
            100
          );

          const hasAnniversaryReward = existingReward.rewards.some(
            (reward) =>
              reward.action === "special_anniversary" &&
              new Date(reward.createdAt) >= startOfYear
          );

          if (!hasAnniversaryReward) {
            logger.info(
              `Processing anniversary points for user: ${userId}, years: ${yearsSinceCreation}`
            );
            return await this.processSpecialEventPoints(userId, "anniversary", {
              yearsSinceCreation,
            });
          }
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error processing anniversary points:`, error);
      throw error;
    }
  }

  /**
   * Process daily staking bonus points
   */
  async processDailyStakingBonus(userId) {
    try {
      const activeStakings = await Staking.findAll({
        where: {
          userId,
          status: "active",
          amountUSD: { [require("sequelize").Op.gte]: 100 }, // Minimum $100 staked
        },
      });

      if (activeStakings.length > 0) {
        const totalStakedUSD = activeStakings.reduce(
          (sum, staking) => sum + parseFloat(staking.amountUSD),
          0
        );

        // Award daily bonus based on total staked amount
        const dailyBonus =
          Math.floor(totalStakedUSD / 100) *
          pointsEngine.pointsConfig.staking.daily_bonus;

        if (dailyBonus > 0) {
          logger.info(
            `Processing daily staking bonus for user: ${userId}, bonus: ${dailyBonus}`
          );
          return await pointsEngine.awardPoints(
            userId,
            "staking_daily_bonus",
            dailyBonus,
            {
              totalStakedUSD,
              activeStakingsCount: activeStakings.length,
            }
          );
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error processing daily staking bonus:`, error);
      throw error;
    }
  }

  /**
   * Bulk process points for existing users (for migration)
   */
  async bulkProcessExistingPoints() {
    try {
      logger.info("Starting bulk processing of existing points...");

      const users = await User.findAll();
      let processedCount = 0;

      for (const user of users) {
        try {
          // Process profile completion
          await this.processProfileCompletion(user.id);

          // Process KYC verification
          await this.processKYCVerification(user.id);

          // Process 2FA setup
          await this.process2FASetup(user.id);

          // Process card activation
          await this.processCardActivation(user.id);

          processedCount++;
        } catch (error) {
          logger.error(`Error processing points for user ${user.id}:`, error);
        }
      }

      logger.info(
        `Bulk processing completed. Processed ${processedCount} users.`
      );
      return processedCount;
    } catch (error) {
      logger.error("Error in bulk processing:", error);
      throw error;
    }
  }
}

module.exports = new PointsIntegration();
