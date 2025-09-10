const express = require("express");
const router = express.Router();
const referralController = require("../controllers/referralController");
const { authenticate } = require("../middleware/auth");

// Public routes (no authentication required)
router.get("/validate", referralController.validateReferralLink);
router.get("/rewards", referralController.getReferralRewards);
router.get("/leaderboard", referralController.getReferralLeaderboard);

// User routes (authentication required)
router.post("/create", authenticate, referralController.createReferral);
router.get("/stats", authenticate, referralController.getReferralStats);
router.get("/tree", authenticate, referralController.getReferralTree);
router.get("/analytics", authenticate, referralController.getReferralAnalytics);
router.get("/link", authenticate, referralController.getReferralLinkInfo);
router.get(
  "/activity",
  authenticate,
  referralController.getRecentReferralActivity
);
router.get("/search", authenticate, referralController.searchReferrers);
router.get(
  "/performance",
  authenticate,
  referralController.getReferralPerformance
);

module.exports = router;
