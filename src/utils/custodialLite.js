const crypto = require("crypto");
const { privateKeyToAccount } = require("viem/accounts");

// Generate a random salt
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

// Derive a key from password and salt using PBKDF2
function deriveKey(
  password,
  salt,
  iterations = 100000,
  keyLen = 32,
  digest = "sha256"
) {
  return crypto.pbkdf2Sync(password, salt, iterations, keyLen, digest);
}

// Generate a random 32-byte private key (for Ethereum, etc.)
function generatePrivateKey() {
  return crypto.randomBytes(32).toString("hex");
}

// Encrypt the private key using AES-256-CBC
function encryptPrivateKey(privateKeyHex, derivedKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", derivedKey, iv);
  let encrypted = cipher.update(privateKeyHex, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    encrypted,
    iv: iv.toString("hex"),
  };
}

// Decrypt the private key using AES-256-CBC
function decryptPrivateKey(encrypted, derivedKey, ivHex) {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", derivedKey, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Add function to get address from private key
function getAddressFromPrivateKey(privateKey) {
  return privateKeyToAccount(`0x${privateKey}`).address;
}

module.exports = {
  generateSalt,
  deriveKey,
  generatePrivateKey,
  encryptPrivateKey,
  decryptPrivateKey,
  getAddressFromPrivateKey,
};
