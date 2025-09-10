const Lithic = require("lithic");
const logger = require("./logger");

logger.info("Initializing Lithic client with config:", {
  apiKey: process.env.LITHIC_API_KEY ? "present" : "missing",
  environment: process.env.LITHIC_ENV || "sandbox"
});

const lithic = new Lithic({
  apiKey: process.env.LITHIC_API_KEY,
  environment: process.env.LITHIC_ENV || "sandbox",
});

// Create a virtual card
async function createVirtualCard(user) {
  return lithic.cards.create({
    type: "VIRTUAL",
    memo: `StableBank card for user ${user.id}`,
    // Add more fields as needed
  });
}

// Freeze a card
async function freezeCard(cardToken) {
  return lithic.cards.update(cardToken, { state: "INACTIVE" });
}

// Terminate (delete) a card
async function terminateCard(cardToken) {
  return lithic.cards.update(cardToken, { state: "CLOSED" });
}

// Get card transactions
async function getCardTransactions(cardToken, params = {}) {
  return lithic.transactions.list({ card_token: cardToken, ...params });
}

module.exports = {
  createVirtualCard,
  freezeCard,
  terminateCard,
  getCardTransactions,
};
