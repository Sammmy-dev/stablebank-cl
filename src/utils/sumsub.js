const axios = require("axios");

const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || "https://api.sumsub.com";
const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;

// Helper to sign requests (Sumsub requires HMAC-SHA256 signature)
const crypto = require("crypto");

function getSignature(method, path, body = "") {
  const ts = Math.floor(Date.now() / 1000);
  const dataToSign = ts + method.toUpperCase() + path + body;
  const signature = crypto
    .createHmac("sha256", SUMSUB_SECRET_KEY)
    .update(dataToSign)
    .digest("hex");
  return { ts, signature };
}

async function createApplicant(userId, email) {
  const path = "/resources/applicants?levelName=basic-kyc-level";
  const method = "POST";
  const body = JSON.stringify({ externalUserId: String(userId), email });
  const { ts, signature } = getSignature(method, path, body);
  const headers = {
    "X-App-Token": SUMSUB_APP_TOKEN,
    "X-App-Access-Sig": signature,
    "X-App-Access-Ts": ts,
    "Content-Type": "application/json",
  };
  const url = SUMSUB_BASE_URL + path;
  const res = await axios.post(
    url,
    { externalUserId: String(userId), email },
    { headers }
  );
  return res.data;
}

async function getApplicantStatus(applicantId) {
  const path = `/resources/applicants/${applicantId}/requiredIdDocsStatus`; // or /status
  const method = "GET";
  const { ts, signature } = getSignature(method, path);
  const headers = {
    "X-App-Token": SUMSUB_APP_TOKEN,
    "X-App-Access-Sig": signature,
    "X-App-Access-Ts": ts,
  };
  const url = SUMSUB_BASE_URL + path;
  const res = await axios.get(url, { headers });
  return res.data;
}

async function generateAccessToken(applicantId) {
  const path = `/resources/accessTokens?userId=${applicantId}`;
  const method = "POST";
  const { ts, signature } = getSignature(method, path);
  const headers = {
    "X-App-Token": SUMSUB_APP_TOKEN,
    "X-App-Access-Sig": signature,
    "X-App-Access-Ts": ts,
  };
  const url = SUMSUB_BASE_URL + path;
  const res = await axios.post(url, {}, { headers });
  return res.data;
}

module.exports = {
  createApplicant,
  getApplicantStatus,
  generateAccessToken,
};
