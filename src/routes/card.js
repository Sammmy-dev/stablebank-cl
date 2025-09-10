const express = require("express");
const router = express.Router();
const cardController = require("../controllers/virtualCardController");
const { authenticate } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validation");
const {
  createCardSchema,
  freezeCardSchema,
  terminateCardSchema,
  getTransactionsSchema,
  updateCardLimitsSchema,
} = require("../validations/cardSchema");

// Create a new virtual card
router.post(
  "/",
  authenticate,
  validateRequest(createCardSchema),
  cardController.createCard
);

// Freeze a card
router.post(
  "/:cardId/freeze",
  authenticate,
  validateRequest(freezeCardSchema),
  cardController.freezeCard
);

// Terminate (delete) a card
router.delete(
  "/:cardId",
  authenticate,
  validateRequest(terminateCardSchema),
  cardController.terminateCard
);

// Get card spending history
router.get(
  "/:cardId/transactions",
  authenticate,
  validateRequest(getTransactionsSchema),
  cardController.getSpendingHistory
);

// Get user's cards
router.get("/", authenticate, cardController.getUserCards);

// Update card limits
router.put(
  "/:cardId/limits",
  authenticate,
  validateRequest(updateCardLimitsSchema),
  cardController.updateCardLimits
);

// Get fraud risk assessment
router.get(
  "/fraud-assessment",
  authenticate,
  cardController.getFraudRiskAssessment
);

module.exports = router;
