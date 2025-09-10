# StableBank API Reference

## Base URL

```
https://api.stablebank.com/api/v1
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this standard format:

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical details"
}
```

## Authentication Endpoints

### Register User

**POST** `/auth/signup`

Creates a new user account with custodial-lite wallet generation.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "phoneNumber": "+1234567890",
  "role": "user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered. OTP sent to phone number.",
  "data": {
    "userId": "123",
    "phoneNumber": "+1234567890",
    "walletAddress": "0x1234567890abcdef..."
  }
}
```

### Send OTP

**POST** `/auth/send-otp`

Sends a new OTP to the user's phone number.

**Request Body:**

```json
{
  "phoneNumber": "+1234567890"
}
```

### Verify OTP

**POST** `/auth/verify-otp`

Verifies the OTP and activates the user account.

**Request Body:**

```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "bankTag": "@johndoe",
      "walletAddress": "0x1234567890abcdef..."
    }
  }
}
```

### Sign In

**POST** `/auth/signin`

Authenticates user with email and password.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

### Refresh Token

**POST** `/auth/refresh`

Refreshes the access token using a valid refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Sign Out

**POST** `/auth/signout`

Invalidates the current session.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

## Web3 Endpoints

### Get Unified Balance

**GET** `/web3/unified-balance/:address`

Returns the total USD value of stablecoin balances across all supported chains.

**Parameters:**

- `address` (string): Wallet address to query

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUSDValue": 1250.75,
    "breakdown": {
      "ethereum": {
        "USDC": 500.25,
        "USDT": 300.5,
        "DAI": 0.0,
        "total": 800.75
      },
      "polygon": {
        "USDC": 250.0,
        "USDT": 200.0,
        "DAI": 0.0,
        "total": 450.0
      },
      "arbitrum": {
        "USDC": 0.0,
        "USDT": 0.0,
        "DAI": 0.0,
        "total": 0.0
      }
    },
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### Get Chain-Specific Balance

**GET** `/web3/chain-balance/:chain/:address`

Returns USD value of stablecoin balances for a specific chain.

**Parameters:**

- `chain` (string): Chain name (ethereum, polygon, arbitrum)
- `address` (string): Wallet address to query

**Response:**

```json
{
  "success": true,
  "data": {
    "chain": "polygon",
    "address": "0x1234567890abcdef...",
    "balances": {
      "USDC": 250.0,
      "USDT": 200.0,
      "DAI": 0.0
    },
    "totalUSDValue": 450.0,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### Get USDC Balance

**GET** `/web3/balance/usdc/:address`

Returns the dummy USDC balance for a wallet address on Polygon Amoy testnet.

**Parameters:**

- `address` (string): Wallet address to query

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef...",
    "balance": "1000.000000",
    "balanceWei": "1000000000",
    "decimals": 6,
    "symbol": "dUSDC",
    "chain": "Polygon Amoy"
  }
}
```

### Get Native Balance

**GET** `/web3/balance/native/:address`

Returns the native token (MATIC) balance for a wallet address.

**Parameters:**

- `address` (string): Wallet address to query

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef...",
    "balance": "0.5",
    "balanceWei": "500000000000000000",
    "symbol": "MATIC",
    "chain": "Polygon Amoy"
  }
}
```

### Transfer USDC

**POST** `/web3/transfer/usdc`

Transfers dummy USDC tokens between addresses.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "to": "0xabcdef1234567890...",
  "amount": "100.50",
  "gasLimit": "21000"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transactionHash": "0x1234567890abcdef...",
    "from": "0x1234567890abcdef...",
    "to": "0xabcdef1234567890...",
    "amount": "100.50",
    "gasUsed": "21000",
    "gasPrice": "20000000000",
    "status": "pending"
  }
}
```

### Get Transaction Status

**GET** `/web3/transaction/:hash`

Returns the status of a transaction by its hash.

**Parameters:**

- `hash` (string): Transaction hash

**Response:**

```json
{
  "success": true,
  "data": {
    "hash": "0x1234567890abcdef...",
    "status": "confirmed",
    "blockNumber": 12345,
    "confirmations": 12,
    "gasUsed": "21000",
    "effectiveGasPrice": "20000000000"
  }
}
```

### Get Gas Price

**GET** `/web3/gas-price`

Returns the current gas price for the network.

**Response:**

```json
{
  "success": true,
  "data": {
    "gasPrice": "20000000000",
    "gasPriceGwei": "20",
    "chain": "Polygon Amoy",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### Verify Signed Message

**POST** `/web3/verify-message`

Verifies a signed message for authentication purposes.

**Request Body:**

```json
{
  "message": "Sign this message to authenticate with StableBank",
  "signature": "0x1234567890abcdef...",
  "address": "0x1234567890abcdef..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "address": "0x1234567890abcdef...",
    "message": "Sign this message to authenticate with StableBank"
  }
}
```

### Get Wallet Info

**GET** `/web3/wallet/:address`

Returns comprehensive wallet information.

**Parameters:**

- `address` (string): Wallet address to query

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef...",
    "balances": {
      "native": "0.5",
      "usdc": "1000.00"
    },
    "transactions": {
      "total": 15,
      "recent": [
        {
          "hash": "0x1234567890abcdef...",
          "type": "transfer",
          "amount": "100.00",
          "timestamp": "2024-01-15T10:30:00Z"
        }
      ]
    },
    "lastActivity": "2024-01-15T10:30:00Z"
  }
}
```

## Transfer Endpoints

### Create Transfer

**POST** `/transfer/create`

Creates a new cross-chain transfer.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "recipient": "@johndoe",
  "amount": "100.50",
  "token": "USDC",
  "sourceChain": "polygon",
  "destinationChain": "ethereum",
  "description": "Payment for services"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transferId": "transfer_123456789",
    "status": "pending",
    "estimatedFee": "5.25",
    "estimatedTime": "5-10 minutes",
    "deBridgeId": "debridge_123456789"
  }
}
```

### Get Transfer Status

**GET** `/transfer/status/:transferId`

Returns the current status of a transfer.

**Parameters:**

- `transferId` (string): Internal transfer ID

**Response:**

```json
{
  "success": true,
  "data": {
    "transferId": "transfer_123456789",
    "status": "completed",
    "from": "0x1234567890abcdef...",
    "to": "0xabcdef1234567890...",
    "amount": "100.50",
    "token": "USDC",
    "sourceChain": "polygon",
    "destinationChain": "ethereum",
    "fee": "5.25",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:35:00Z",
    "deBridgeId": "debridge_123456789"
  }
}
```

### Get Transfer History

**GET** `/transfer/history`

Returns the transfer history for the authenticated user.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (pending, processing, completed, failed)
- `chain` (string): Filter by chain

**Response:**

```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "transferId": "transfer_123456789",
        "status": "completed",
        "amount": "100.50",
        "token": "USDC",
        "sourceChain": "polygon",
        "destinationChain": "ethereum",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## BankTag Endpoints

### Create BankTag

**POST** `/banktag/create`

Creates a new BankTag for the authenticated user.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "bankTag": "johndoe"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bankTag": "@johndoe",
    "userId": "123",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Resolve BankTag

**GET** `/banktag/resolve/:bankTag`

Resolves a BankTag to user and wallet information.

**Parameters:**

- `bankTag` (string): BankTag to resolve (e.g., @johndoe)

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "firstName": "John",
      "lastName": "Doe",
      "bankTag": "@johndoe"
    },
    "wallets": [
      {
        "chainId": 137,
        "chainName": "Polygon",
        "address": "0x1234567890abcdef...",
        "isVerified": true
      }
    ]
  }
}
```

## Virtual Card Endpoints

### Create Virtual Card

**POST** `/card/create`

Creates a new virtual card for the authenticated user.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "type": "virtual",
  "spendingLimit": 1000,
  "currency": "USD"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "cardId": "card_123456789",
    "cardNumber": "4111111111111111",
    "cvv": "123",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "spendingLimit": 1000,
    "currency": "USD",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Card Details

**GET** `/card/:cardId`

Returns detailed information about a virtual card.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Parameters:**

- `cardId` (string): Card ID

**Response:**

```json
{
  "success": true,
  "data": {
    "cardId": "card_123456789",
    "cardNumber": "4111111111111111",
    "cvv": "123",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "spendingLimit": 1000,
    "currentBalance": 750,
    "currency": "USD",
    "status": "active",
    "transactions": [
      {
        "id": "txn_123",
        "amount": 50.0,
        "merchant": "Amazon",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Get Card Transactions

**GET** `/card/:cardId/transactions`

Returns transaction history for a virtual card.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Parameters:**

- `cardId` (string): Card ID

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response:**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "amount": 50.0,
        "merchant": "Amazon",
        "category": "shopping",
        "timestamp": "2024-01-15T10:30:00Z",
        "status": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## KYC Endpoints

### Start KYC Verification

**POST** `/kyc/start`

Initiates KYC verification process.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "nationality": "US",
  "documentType": "passport"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "kycId": "kyc_123456789",
    "status": "pending",
    "verificationUrl": "https://verify.sumsub.com/...",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

### Get KYC Status

**GET** `/kyc/status`

Returns the current KYC verification status.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "kycId": "kyc_123456789",
    "status": "approved",
    "level": "basic",
    "verifiedAt": "2024-01-15T10:30:00Z",
    "nextReview": "2025-01-15T10:30:00Z"
  }
}
```

## Admin Endpoints

### Get Fraud Alerts

**GET** `/admin/fraud/alerts`

Returns fraud alerts for admin review.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `severity` (string): Filter by severity (low, medium, high)
- `status` (string): Filter by status (open, resolved, false_positive)

**Response:**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_123456789",
        "userId": "123",
        "type": "suspicious_transaction",
        "severity": "high",
        "score": 85,
        "description": "Unusual transfer pattern detected",
        "createdAt": "2024-01-15T10:30:00Z",
        "status": "open"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Update Fraud Alert

**PUT** `/admin/fraud/alerts/:alertId`

Updates the status of a fraud alert.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Parameters:**

- `alertId` (string): Alert ID

**Request Body:**

```json
{
  "status": "resolved",
  "notes": "False positive - user confirmed transaction"
}
```

## Webhook Endpoints

### deBridge Webhook

**POST** `/webhook/debridge`

Receives webhook notifications from deBridge for transfer status updates.

**Request Body:**

```json
{
  "transferId": "debridge_123456789",
  "status": "completed",
  "fromChain": "polygon",
  "toChain": "ethereum",
  "amount": "100.50",
  "token": "USDC",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Lithic Webhook

**POST** `/webhook/lithic`

Receives webhook notifications from Lithic for card events.

**Request Body:**

```json
{
  "event": "card.created",
  "cardId": "card_123456789",
  "userId": "123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Codes

| Code | Description                              |
| ---- | ---------------------------------------- |
| 400  | Bad Request - Invalid input data         |
| 401  | Unauthorized - Authentication required   |
| 403  | Forbidden - Insufficient permissions     |
| 404  | Not Found - Resource not found           |
| 422  | Unprocessable Entity - Validation failed |
| 429  | Too Many Requests - Rate limit exceeded  |
| 500  | Internal Server Error - Server error     |

## Rate Limits

- **Authentication endpoints**: 5 requests per minute per IP
- **Web3 endpoints**: 100 requests per 15 minutes per IP
- **Transfer endpoints**: 10 requests per minute per user
- **Admin endpoints**: 50 requests per minute per user

## Pagination

Endpoints that return lists support pagination with these query parameters:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

Response includes pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```
