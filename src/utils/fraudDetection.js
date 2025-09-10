const db = require("../../db/models");
const logger = require("./logger");
const redisClient = require("./redis");

// Risk scoring weights
const RISK_WEIGHTS = {
  KYC_STATUS: 25,
  ACCOUNT_AGE: 15,
  LOGIN_PATTERN: 20,
  DEVICE_FINGERPRINT: 15,
  LOCATION_RISK: 10,
  BEHAVIORAL_PATTERN: 10,
  CARD_HISTORY: 5,
};

// Risk thresholds
const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
};

/**
 * Calculate risk score for card issuance
 */
async function calculateRiskScore(user, requestData) {
  try {
    const riskFactors = await Promise.all([
      checkKYCStatus(user),
      checkAccountAge(user),
      checkLoginPattern(user),
      checkDeviceFingerprint(user, requestData),
      checkLocationRisk(user, requestData),
      checkBehavioralPattern(user),
      checkCardHistory(user),
    ]);

    const totalScore = riskFactors.reduce((sum, factor) => {
      return sum + factor.score * RISK_WEIGHTS[factor.type];
    }, 0);

    const normalizedScore = Math.min(100, totalScore / 100);

    return {
      score: normalizedScore,
      riskLevel: getRiskLevel(normalizedScore),
      factors: riskFactors,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error("Error calculating risk score:", error);
    throw error;
  }
}

/**
 * Check KYC status and completeness
 */
async function checkKYCStatus(user) {
  const kycScore = {
    type: "KYC_STATUS",
    score: 0,
    details: {},
  };

  // Check KYC status
  if (user.kycStatus === "approved") {
    kycScore.score = 0;
    kycScore.details.status = "approved";
  } else if (user.kycStatus === "pending") {
    kycScore.score = 50;
    kycScore.details.status = "pending";
  } else {
    kycScore.score = 100;
    kycScore.details.status = "not_started";
  }

  // Check verification completeness
  let verificationScore = 0;
  if (!user.isEmailVerified) verificationScore += 25;
  if (!user.isPhoneVerified) verificationScore += 25;
  if (!user.is2FAEnabled) verificationScore += 25;

  kycScore.score = Math.max(kycScore.score, verificationScore);
  kycScore.details.verification = {
    email: user.isEmailVerified,
    phone: user.isPhoneVerified,
    twoFactor: user.is2FAEnabled,
  };

  return kycScore;
}

/**
 * Check account age and activity
 */
async function checkAccountAge(user) {
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

  const ageScore = {
    type: "ACCOUNT_AGE",
    score: 0,
    details: { daysSinceCreation },
  };

  if (daysSinceCreation < 1) {
    ageScore.score = 100;
  } else if (daysSinceCreation < 7) {
    ageScore.score = 75;
  } else if (daysSinceCreation < 30) {
    ageScore.score = 50;
  } else if (daysSinceCreation < 90) {
    ageScore.score = 25;
  } else {
    ageScore.score = 0;
  }

  return ageScore;
}

/**
 * Check login patterns and suspicious activity
 */
async function checkLoginPattern(user) {
  const loginScore = {
    type: "LOGIN_PATTERN",
    score: 0,
    details: {},
  };

  // Get recent login attempts
  const recentLogins = await db.auditLog.findAll({
    where: {
      userId: user.id,
      action: "user_login",
      createdAt: {
        [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  // Check for multiple failed logins
  const failedLogins = recentLogins.filter((log) => log.status === "failure");
  if (failedLogins.length > 3) {
    loginScore.score += 50;
    loginScore.details.failedLogins = failedLogins.length;
  }

  // Check for rapid successive logins
  const rapidLogins = recentLogins.filter((log, index) => {
    if (index === 0) return false;
    const timeDiff =
      new Date(log.createdAt) - new Date(recentLogins[index - 1].createdAt);
    return timeDiff < 60000; // Less than 1 minute apart
  });

  if (rapidLogins.length > 2) {
    loginScore.score += 30;
    loginScore.details.rapidLogins = rapidLogins.length;
  }

  // Check for logins from multiple locations
  const uniqueIPs = [...new Set(recentLogins.map((log) => log.ipAddress))];
  if (uniqueIPs.length > 3) {
    loginScore.score += 20;
    loginScore.details.uniqueIPs = uniqueIPs.length;
  }

  return loginScore;
}

/**
 * Check device fingerprint for suspicious patterns
 */
async function checkDeviceFingerprint(user, requestData) {
  const deviceScore = {
    type: "DEVICE_FINGERPRINT",
    score: 0,
    details: {},
  };

  const { userAgent, ipAddress, deviceFingerprint } = requestData;

  // Check for known suspicious user agents
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
  ];

  const isSuspiciousUA = suspiciousUserAgents.some((pattern) =>
    pattern.test(userAgent)
  );
  if (isSuspiciousUA) {
    deviceScore.score += 50;
    deviceScore.details.suspiciousUserAgent = true;
  }

  // Check device fingerprint consistency
  if (deviceFingerprint) {
    const existingFingerprints = await db.auditLog.findAll({
      where: {
        userId: user.id,
        "metadata.deviceFingerprint": deviceFingerprint,
      },
      limit: 1,
    });

    if (existingFingerprints.length === 0) {
      deviceScore.score += 30;
      deviceScore.details.newDeviceFingerprint = true;
    }
  }

  // Check for VPN/Tor usage (basic check)
  const vpnIPs = await redisClient.get("vpn_ips");
  if (vpnIPs && JSON.parse(vpnIPs).includes(ipAddress)) {
    deviceScore.score += 40;
    deviceScore.details.vpnDetected = true;
  }

  return deviceScore;
}

/**
 * Check location-based risk factors
 */
async function checkLocationRisk(user, requestData) {
  const locationScore = {
    type: "LOCATION_RISK",
    score: 0,
    details: {},
  };

  const { ipAddress, location } = requestData;

  // Check for high-risk countries (example list)
  const highRiskCountries = ["XX", "YY", "ZZ"]; // Replace with actual high-risk country codes
  if (location && highRiskCountries.includes(location.country)) {
    locationScore.score += 60;
    locationScore.details.highRiskCountry = location.country;
  }

  // Check for location mismatch with user's registered country
  if (user.country && location && user.country !== location.country) {
    locationScore.score += 40;
    locationScore.details.countryMismatch = {
      registered: user.country,
      current: location.country,
    };
  }

  // Check for rapid location changes
  const recentLocations = await db.auditLog.findAll({
    where: {
      userId: user.id,
      action: "user_login",
      createdAt: {
        [db.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    attributes: ["location", "createdAt"],
    order: [["createdAt", "DESC"]],
    limit: 5,
  });

  if (recentLocations.length > 1) {
    const locationChanges = recentLocations.filter((log, index) => {
      if (index === 0) return false;
      const timeDiff =
        new Date(log.createdAt) -
        new Date(recentLocations[index - 1].createdAt);
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // If locations changed within 24 hours, it's suspicious
      return (
        hoursDiff < 24 &&
        log.location?.country !== recentLocations[index - 1].location?.country
      );
    });

    if (locationChanges.length > 0) {
      locationScore.score += 30;
      locationScore.details.rapidLocationChange = true;
    }
  }

  return locationScore;
}

/**
 * Check behavioral patterns
 */
async function checkBehavioralPattern(user) {
  const behaviorScore = {
    type: "BEHAVIORAL_PATTERN",
    score: 0,
    details: {},
  };

  // Check for unusual activity patterns
  const recentActivity = await db.auditLog.findAll({
    where: {
      userId: user.id,
      createdAt: {
        [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    attributes: ["action", "createdAt"],
  });

  // Check for unusual time patterns (e.g., activity at 3 AM)
  const unusualHours = recentActivity.filter((log) => {
    const hour = new Date(log.createdAt).getHours();
    return hour >= 23 || hour <= 5;
  });

  if (unusualHours.length > 2) {
    behaviorScore.score += 20;
    behaviorScore.details.unusualHours = unusualHours.length;
  }

  // Check for rapid successive actions
  const rapidActions = recentActivity.filter((log, index) => {
    if (index === 0) return false;
    const timeDiff =
      new Date(log.createdAt) - new Date(recentActivity[index - 1].createdAt);
    return timeDiff < 5000; // Less than 5 seconds apart
  });

  if (rapidActions.length > 5) {
    behaviorScore.score += 30;
    behaviorScore.details.rapidActions = rapidActions.length;
  }

  return behaviorScore;
}

/**
 * Check existing card history
 */
async function checkCardHistory(user) {
  const cardScore = {
    type: "CARD_HISTORY",
    score: 0,
    details: {},
  };

  // Check existing cards
  const existingCards = await db.virtualCard.findAll({
    where: { userId: user.id },
  });

  // Check for recently terminated cards
  const recentlyTerminated = existingCards.filter((card) => {
    const terminatedRecently =
      card.terminatedAt &&
      Date.now() - new Date(card.terminatedAt).getTime() <
        7 * 24 * 60 * 60 * 1000; // Last 7 days
    return terminatedRecently;
  });

  if (recentlyTerminated.length > 0) {
    cardScore.score += 40;
    cardScore.details.recentlyTerminated = recentlyTerminated.length;
  }

  // Check for too many cards
  if (existingCards.length > 3) {
    cardScore.score += 30;
    cardScore.details.tooManyCards = existingCards.length;
  }

  return cardScore;
}

/**
 * Get risk level based on score
 */
function getRiskLevel(score) {
  if (score <= RISK_THRESHOLDS.LOW) return "LOW";
  if (score <= RISK_THRESHOLDS.MEDIUM) return "MEDIUM";
  if (score <= RISK_THRESHOLDS.HIGH) return "HIGH";
  return "CRITICAL";
}

/**
 * Perform comprehensive fraud check
 */
async function performFraudCheck(user, requestData) {
  try {
    const riskAssessment = await calculateRiskScore(user, requestData);

    // Log the fraud check
    await db.auditLog.create({
      userId: user.id,
      action: "fraud_check_card_issuance",
      resource: "virtual_card",
      ipAddress: requestData.ipAddress,
      userAgent: requestData.userAgent,
      location: requestData.location,
      status: riskAssessment.riskLevel === "CRITICAL" ? "failure" : "success",
      severity:
        riskAssessment.riskLevel === "CRITICAL"
          ? "critical"
          : riskAssessment.riskLevel === "HIGH"
          ? "high"
          : "medium",
      details: {
        riskScore: riskAssessment.score,
        riskLevel: riskAssessment.riskLevel,
        factors: riskAssessment.factors,
      },
      metadata: {
        deviceFingerprint: requestData.deviceFingerprint,
        requestId: requestData.requestId,
      },
    });

    // Cache the risk assessment for 1 hour
    const cacheKey = `fraud_check:${user.id}:${Date.now()}`;
    await redisClient.set(cacheKey, riskAssessment, 3600);

    return {
      approved: riskAssessment.riskLevel !== "CRITICAL",
      riskLevel: riskAssessment.riskLevel,
      score: riskAssessment.score,
      factors: riskAssessment.factors,
      requiresReview: riskAssessment.riskLevel === "HIGH",
      message: getRiskMessage(riskAssessment.riskLevel),
    };
  } catch (error) {
    logger.error("Error performing fraud check:", error);
    throw error;
  }
}

/**
 * Get user-friendly risk message
 */
function getRiskMessage(riskLevel) {
  const messages = {
    LOW: "Card issuance approved - low risk detected",
    MEDIUM: "Card issuance approved - moderate risk detected",
    HIGH: "Card issuance requires manual review - high risk detected",
    CRITICAL: "Card issuance denied - critical risk detected",
  };
  return messages[riskLevel] || "Risk assessment completed";
}

/**
 * Check if user is on fraud watchlist
 */
async function checkFraudWatchlist(user) {
  try {
    const watchlistKey = `fraud_watchlist:${user.id}`;
    const isWatchlisted = await redisClient.get(watchlistKey);

    if (isWatchlisted) {
      await db.auditLog.create({
        userId: user.id,
        action: "fraud_watchlist_check",
        resource: "user",
        resourceId: user.id.toString(),
        status: "failure",
        severity: "high",
        details: { watchlisted: true },
      });
    }

    return !!isWatchlisted;
  } catch (error) {
    logger.error("Error checking fraud watchlist:", error);
    return false;
  }
}

module.exports = {
  performFraudCheck,
  calculateRiskScore,
  checkFraudWatchlist,
  getRiskLevel,
};
