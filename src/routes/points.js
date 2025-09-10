const express = require("express");
const router = express.Router();
const pointsController = require("../controllers/pointsController");
const { authenticate, authorize } = require("../middleware/auth");

// Public routes (no authentication required)
router.get("/config", pointsController.getPointsConfig);

// User routes (authentication required)
router.get("/summary", authenticate, pointsController.getUserPoints);
router.get("/tier", authenticate, pointsController.getUserTier);
router.get("/history", authenticate, pointsController.getPointsHistory);
router.get("/leaderboard", authenticate, pointsController.getLeaderboard);
router.post("/daily-login", authenticate, pointsController.processDailyLogin);

// Admin routes (admin role required)
router.post(
  "/award",
  authenticate,
  authorize("admin"),
  pointsController.awardPoints
);
router.get(
  "/analytics",
  authenticate,
  authorize("admin"),
  pointsController.getPointsAnalytics
);

module.exports = router;
