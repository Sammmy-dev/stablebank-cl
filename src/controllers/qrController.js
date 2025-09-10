const QRCode = require("qrcode");
const referralService = require("../services/referralService");
const logger = require("../utils/logger");

class QRController {
  /**
   * Generate QR code for referral link
   */
  async generateReferralQR(req, res) {
    try {
      const { bankTag } = req.params;

      if (!bankTag) {
        return res.status(400).json({
          success: false,
          message: "BankTag is required",
        });
      }

      // Validate the BankTag
      const validation = await referralService.validateReferralLink(bankTag);
      if (!validation.valid) {
        return res.status(404).json({
          success: false,
          message: validation.error,
        });
      }

      // Generate referral link
      const referralLink = `${
        process.env.FRONTEND_URL || "https://app.stablebank.com"
      }/signup?ref=${bankTag}`;

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(referralLink, {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 300,
      });

      res.json({
        success: true,
        data: {
          bankTag,
          referralLink,
          qrCode: qrCodeDataURL,
          referrer: validation.referrer,
        },
      });
    } catch (error) {
      logger.error("Error generating referral QR code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate QR code",
        error: error.message,
      });
    }
  }

  /**
   * Generate QR code for any URL
   */
  async generateQRCode(req, res) {
    try {
      const { url, size = 300, color = "#000000" } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "URL is required",
        });
      }

      // Validate URL
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid URL format",
        });
      }

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: color,
          light: "#FFFFFF",
        },
        width: parseInt(size),
      });

      res.json({
        success: true,
        data: {
          url,
          qrCode: qrCodeDataURL,
          size: parseInt(size),
        },
      });
    } catch (error) {
      logger.error("Error generating QR code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate QR code",
        error: error.message,
      });
    }
  }

  /**
   * Generate QR code for wallet address
   */
  async generateWalletQR(req, res) {
    try {
      const { address, chainId = 80001 } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required",
        });
      }

      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          message: "Invalid wallet address format",
        });
      }

      // Generate QR code for wallet address
      const qrCodeDataURL = await QRCode.toDataURL(address, {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 300,
      });

      res.json({
        success: true,
        data: {
          address,
          chainId: parseInt(chainId),
          qrCode: qrCodeDataURL,
        },
      });
    } catch (error) {
      logger.error("Error generating wallet QR code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate wallet QR code",
        error: error.message,
      });
    }
  }
}

module.exports = new QRController();
