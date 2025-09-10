const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateRequest } = require("../middleware/validation");
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
} = require("../validations/authSchema");
const {
  authenticate,
  authenticateRefreshToken,
} = require("../middleware/auth");

// Public routes
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);
router.post("/logout", authController.logout);

// Protected routes
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/sessions", authenticate, authController.getSessions);
router.delete(
  "/sessions/:refreshTokenId",
  authenticate,
  authController.revokeSession
);

// New routes
router.post(
  "/send-otp",
  validateRequest(sendOtpSchema),
  authController.sendOtp
);
router.post(
  "/verify-otp",
  validateRequest(verifyOtpSchema),
  authController.verifyOtp
);

module.exports = router;
