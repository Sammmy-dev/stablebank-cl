# Private Key Management System

## Overview

This system securely manages user private keys for blockchain operations by:

1. **Decrypting** private keys during login using the user's password
2. **Storing** decrypted private keys temporarily in Redis (1-hour expiry)
3. **Attaching** private keys to requests via middleware
4. **Clearing** private keys on logout

## How It Works

### 1. Login Process (`authController.js`)

When a user logs in:

```javascript
// Decrypt private key using user's password
const derivedKey = custodialLite.deriveKey(password, userExist.privateKeySalt);
const decryptedPrivateKey = custodialLite.decryptPrivateKey(
  userExist.encryptedPrivateKey,
  derivedKey,
  userExist.privateKeyIv
);

// Store in Redis for 1 hour
await privateKeyManager.storePrivateKey(userExist.id, decryptedPrivateKey);
```

### 2. Middleware (`auth.js`)

The `attachPrivateKey` middleware:

```javascript
// Retrieves private key from Redis and attaches to request
const decryptedPrivateKey = await privateKeyManager.getPrivateKey(req.user.id);
req.userPrivateKey = decryptedPrivateKey;
```

### 3. Demo Token Operations (`demoTokenController.js`)

Controllers can now access the private key:

```javascript
// Private key is automatically available
const privateKey = req.userPrivateKey;
const result = await demoTokenViem.transferDemoToken(
  toAddress,
  amount,
  privateKey
);
```

### 4. Logout Process

Private keys are cleared from Redis:

```javascript
await privateKeyManager.clearPrivateKey(userId);
```

## Security Features

- **Temporary Storage**: Private keys are stored in Redis with 1-hour expiry
- **Automatic Cleanup**: Keys are cleared on logout
- **No Client Exposure**: Private keys never leave the server
- **Password-Based Decryption**: Keys are only decrypted with user's password

## API Usage

### Protected Routes

Routes that require private key access:

```javascript
router.post(
  "/transfer",
  authenticate,
  attachPrivateKey,
  demoTokenController.transferDemoToken
);
router.post(
  "/mint",
  authenticate,
  attachPrivateKey,
  demoTokenController.mintDemoToken
);
router.post(
  "/burn",
  authenticate,
  attachPrivateKey,
  demoTokenController.burnDemoToken
);
```

### Request Format

For protected routes, only send the operation parameters (no private key needed):

```json
{
  "toAddress": "0x...",
  "amount": "1000000000000000000"
}
```

The private key is automatically attached by the middleware.

## Error Handling

- **401 Unauthorized**: If private key is not available (user needs to login again)
- **500 Internal Server Error**: If Redis operations fail

## Redis Key Format

Private keys are stored with the key pattern: `user_private_key:{userId}`

## Utilities

The `privateKeyManager.js` utility provides:

- `storePrivateKey(userId, privateKey, expiry)`
- `getPrivateKey(userId)`
- `clearPrivateKey(userId)`
- `hasPrivateKey(userId)`
