const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const bankTagController = require("../controllers/bankTagController");

router.get("/check", bankTagController.checkAvailability);
router.post("/", authenticate, bankTagController.createBankTag);
router.get("/resolve", bankTagController.resolveBankTag);
router.get("/resolve-address", bankTagController.resolveToAddress);
router.get("/search", bankTagController.searchBankTags);

module.exports = router;
