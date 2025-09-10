const express = require("express");
const router = express.Router();
const adminFraudController = require("../controllers/adminFraudController");
const { authenticate, authorize } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validation");
const yup = require("yup");

// Validation schemas for admin fraud operations
const addToWatchlistSchema = yup.object({
  body: yup.object({
    userId: yup.number().required("User ID is required"),
    reason: yup.string().max(500).required("Reason is required"),
    duration: yup.number().min(1).max(365).default(30),
  }),
});

const reviewCardSchema = yup.object({
  body: yup.object({
    cardId: yup.number().required("Card ID is required"),
    action: yup
      .string()
      .oneOf(["approve", "reject"])
      .required("Action is required"),
    reason: yup.string().max(500).optional(),
  }),
});

// Fraud monitoring routes (admin only)
router.get(
  "/fraud/alerts",
  authenticate,
  authorize("admin"),
  adminFraudController.getFraudAlerts
);

router.get(
  "/fraud/stats",
  authenticate,
  authorize("admin"),
  adminFraudController.getFraudStats
);

// Watchlist management routes
router.get(
  "/fraud/watchlist",
  authenticate,
  authorize("admin"),
  adminFraudController.getWatchlist
);

router.post(
  "/fraud/watchlist",
  authenticate,
  authorize("admin"),
  validateRequest(addToWatchlistSchema),
  adminFraudController.addToWatchlist
);

router.delete(
  "/fraud/watchlist/:userId",
  authenticate,
  authorize("admin"),
  adminFraudController.removeFromWatchlist
);

// Card review routes
router.post(
  "/fraud/review-card",
  authenticate,
  authorize("admin"),
  validateRequest(reviewCardSchema),
  adminFraudController.reviewCardIssuance
);

// User fraud report
router.get(
  "/fraud/user/:userId",
  authenticate,
  authorize("admin"),
  adminFraudController.getUserFraudReport
);

module.exports = router;
