const yup = require("yup");

// Schema for creating a virtual card
const createCardSchema = yup.object({
  body: yup.object({
    // Optional card preferences
    spendingLimit: yup.number().min(0).max(10000).optional(),
    monthlyLimit: yup.number().min(0).max(50000).optional(),
    currency: yup
      .string()
      .oneOf(["USD", "EUR", "GBP"])
      .default("USD")
      .optional(),
    isInternational: yup.boolean().default(false).optional(),
    merchantCategories: yup.array().of(yup.string()).optional(),
    memo: yup.string().max(100).optional(),
  }),
  headers: yup.object({
    "x-device-fingerprint": yup.string().max(255).optional(),
    "x-location": yup
      .string()
      .test("is-json", "Location must be valid JSON", (value) => {
        if (!value) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      })
      .optional(),
    "x-request-id": yup.string().uuid().optional(),
  }),
});

// Schema for freezing a card
const freezeCardSchema = yup.object({
  params: yup.object({
    cardId: yup
      .string()
      .required("Card ID is required")
      .min(1, "Card ID cannot be empty"),
  }),
  body: yup.object({
    reason: yup.string().max(200).optional(),
  }),
});

// Schema for terminating a card
const terminateCardSchema = yup.object({
  params: yup.object({
    cardId: yup
      .string()
      .required("Card ID is required")
      .min(1, "Card ID cannot be empty"),
  }),
  body: yup.object({
    reason: yup.string().max(200).optional(),
  }),
});

// Schema for getting card transactions
const getTransactionsSchema = yup.object({
  params: yup.object({
    cardId: yup
      .string()
      .required("Card ID is required")
      .min(1, "Card ID cannot be empty"),
  }),
  query: yup.object({
    limit: yup.number().min(1).max(100).default(20).optional(),
    offset: yup.number().min(0).default(0).optional(),
    startDate: yup.date().optional(),
    endDate: yup.date().optional(),
    status: yup
      .string()
      .oneOf(["pending", "completed", "declined", "cancelled"])
      .optional(),
    type: yup
      .string()
      .oneOf(["purchase", "refund", "chargeback", "fee", "load"])
      .optional(),
  }),
});

// Schema for updating card limits
const updateCardLimitsSchema = yup.object({
  params: yup.object({
    cardId: yup
      .string()
      .required("Card ID is required")
      .min(1, "Card ID cannot be empty"),
  }),
  body: yup.object({
    spendingLimit: yup
      .number()
      .min(0)
      .max(10000)
      .required("Spending limit is required"),
    monthlyLimit: yup
      .number()
      .min(0)
      .max(50000)
      .required("Monthly limit is required"),
  }),
});

module.exports = {
  createCardSchema,
  freezeCardSchema,
  terminateCardSchema,
  getTransactionsSchema,
  updateCardLimitsSchema,
};
