const db = require("../../db/models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// Helper: validate tag format (e.g., @tag, 3-20 chars, alphanumeric/underscore)
function isValidBankTag(tag) {
  return /^@[a-zA-Z0-9_]{3,20}$/.test(tag);
}

// GET /bank-tag/check?tag=@mytag
exports.checkAvailability = async (req, res, next) => {
  try {
    const { tag } = req.query;
    if (!tag || !isValidBankTag(tag)) {
      return next(
        new AppError(
          "Invalid tag format. Use @tag (3-20 chars, alphanumeric/underscore)",
          400
        )
      );
    }
    const exists = await db.user.findOne({ where: { bankTag: tag } });
    res.json({ available: !exists });
  } catch (err) {
    next(err);
  }
};

// POST /bank-tag { tag: '@mytag' }
exports.createBankTag = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tag } = req.body;
    if (!tag || !isValidBankTag(tag)) {
      return next(
        new AppError(
          "Invalid tag format. Use @tag (3-20 chars, alphanumeric/underscore)",
          400
        )
      );
    }
    const user = await db.user.findByPk(userId);
    if (!user) return next(new AppError("User not found", 404));
    if (user.bankTag) return next(new AppError("BankTag already set", 400));
    const exists = await db.user.findOne({ where: { bankTag: tag } });
    if (exists) return next(new AppError("Tag already taken", 409));
    user.bankTag = tag;
    await user.save();

    // Generate referral code for user if they don't have one
    if (!user.referralCode) {
      const referralService = require("../services/referralService");
      user.referralCode = referralService.generateReferralCode(tag);
      await user.save();
    }

    res.status(201).json({ status: "success", bankTag: tag });
  } catch (err) {
    next(err);
  }
};

// GET /bank-tag/resolve?tag=@mytag
exports.resolveBankTag = async (req, res, next) => {
  try {
    const { tag } = req.query;
    if (!tag || !isValidBankTag(tag)) {
      return next(
        new AppError(
          "Invalid tag format. Use @tag (3-20 chars, alphanumeric/underscore)",
          400
        )
      );
    }
    const user = await db.user.findOne({
      where: { bankTag: tag },
      attributes: ["id", "bankTag", "firstName", "lastName", "email"],
    });
    if (!user) return next(new AppError("Tag not found", 404));
    const wallets = await db.wallet.findAll({
      where: { userId: user.id, isActive: true },
      attributes: [
        "id",
        "chainId",
        "chainName",
        "address",
        "isActive",
        "isVerified",
      ],
      order: [["chainId", "ASC"]],
    });
    res.json({
      status: "success",
      data: {
        user,
        wallets,
        totalWallets: wallets.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /bank-tag/resolve-address?tag=@mytag&chainId=1
exports.resolveToAddress = async (req, res, next) => {
  try {
    const { tag, chainId } = req.query;
    if (!tag || !isValidBankTag(tag)) {
      return next(
        new AppError(
          "Invalid tag format. Use @tag (3-20 chars, alphanumeric/underscore)",
          400
        )
      );
    }
    if (!chainId) {
      return next(new AppError("chainId is required", 400));
    }

    const user = await db.user.findOne({
      where: { bankTag: tag },
      attributes: ["id", "bankTag", "firstName", "lastName"],
    });
    if (!user) return next(new AppError("Tag not found", 404));

    const wallet = await db.wallet.findOne({
      where: {
        userId: user.id,
        chainId: parseInt(chainId),
        isActive: true,
      },
      attributes: ["id", "chainId", "chainName", "address", "isVerified"],
    });

    if (!wallet) {
      return next(
        new AppError(`No active wallet found for chain ${chainId}`, 404)
      );
    }

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          bankTag: user.bankTag,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        wallet: {
          address: wallet.address,
          chainId: wallet.chainId,
          chainName: wallet.chainName,
          isVerified: wallet.isVerified,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /bank-tag/search?q=@partial
exports.searchBankTags = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return next(
        new AppError("Search query must be at least 2 characters", 400)
      );
    }

    const users = await db.user.findAll({
      where: {
        bankTag: { [Op.iLike]: `%${q}%` },
        status: "active",
      },
      attributes: ["id", "bankTag", "firstName", "lastName"],
      limit: 10,
      order: [["bankTag", "ASC"]],
    });

    res.json({
      status: "success",
      data: {
        results: users,
        total: users.length,
      },
    });
  } catch (err) {
    next(err);
  }
};
