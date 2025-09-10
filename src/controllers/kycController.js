const {
  createApplicant,
  getApplicantStatus,
  generateAccessToken,
} = require("../utils/sumsub");
const db = require("../../db/models");
const { AppError } = require("../middleware/errorHandler");

// POST /kyc/start
exports.startKyc = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRecord = await db.user.findByPk(userId);
    if (!userRecord) return next(new AppError("User not found", 404));
    if (
      userRecord.kycStatus === "pending" ||
      userRecord.kycStatus === "approved"
    ) {
      return next(new AppError("KYC already in progress or completed", 400));
    }
    // Create applicant in Sumsub
    const applicant = await createApplicant(userId, userRecord.email);
    // Save KYC record
    await db.KYC.create({
      userId,
      kycReference: applicant.id,
      status: "pending",
      provider: "sumsub",
      providerData: applicant,
      submittedAt: new Date(),
    });
    // Update user
    await userRecord.update({
      kycStatus: "pending",
      kycReference: applicant.id,
    });
    // Generate Sumsub access token for SDK
    const accessToken = await generateAccessToken(applicant.id);
    res.status(201).json({
      status: "success",
      data: { applicantId: applicant.id, accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// GET /kyc/status
exports.getKycStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRecord = await db.user.findByPk(userId);
    if (!userRecord) return next(new AppError("User not found", 404));
    if (!userRecord.kycReference)
      return next(new AppError("No KYC started", 400));
    // Get KYC record
    const kycRecord = await db.KYC.findOne({
      where: { userId, kycReference: userRecord.kycReference },
    });
    if (!kycRecord) return next(new AppError("KYC record not found", 404));
    // Optionally, fetch live status from Sumsub
    const sumsubStatus = await getApplicantStatus(userRecord.kycReference);
    res
      .status(200)
      .json({ status: "success", data: { kyc: kycRecord, sumsubStatus } });
  } catch (err) {
    next(err);
  }
};
