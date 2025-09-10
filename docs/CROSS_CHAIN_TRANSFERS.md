# Cross-Chain Transfer System

The Cross-Chain Transfer System enables seamless stablecoin transfers across multiple EVM-compatible chains using DeBridge infrastructure, with support for both wallet addresses and BankTags™.

## Features

- **DeBridge Integration**: Secure cross-chain transfers using DeBridge smart contracts
- **BankTag Support**: Send to users using `@username` instead of wallet addresses
- **Multi-Chain Support**: Ethereum, Polygon, and Arbitrum
- **Stablecoin Coverage**: USDC, USDT, and DAI on all supported chains
- **Real-Time Tracking**: Webhook and polling-based transaction status updates
- **Fee Calculation**: Transparent fee calculation before transfer execution
- **Transaction History**: Complete transfer history with detailed status tracking

## Architecture

### Core Components

1. **DeBridge Integration** (`src/utils/deBridge.js`)

   - Smart contract interactions for cross-chain transfers
   - Fee calculation and validation
   - Transfer execution and status monitoring

2. **Transfer Service** (`src/utils/transferService.js`)

   - BankTag resolution and recipient validation
   - Transfer orchestration and database management
   - Token information and chain mapping

3. **Transaction Tracker** (`src/utils/transactionTracker.js`)

   - Webhook processing for DeBridge callbacks
   - Polling mechanism for status updates
   - Notification system for status changes

4. **API Layer** (`src/controllers/transferController.js`)
   - RESTful endpoints for transfer operations
   - Input validation and error handling
   - User authentication and authorization

## API Endpoints

### Initiate Cross-Chain Transfer

```http
POST /api/v1/transfer/cross-chain
```

**Request Body:**

```json
{
  "fromChain": "polygon",
  "toChain": "arbitrum",
  "tokenSymbol": "USDC",
  "amount": 100.5,
  "recipient": "@username",
  "description": "Payment for services"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transfer initiated successfully",
  "data": {
    "internalId": "uuid-here",
    "transferId": "debridge-transfer-id",
    "status": "processing",
    "fromChain": "polygon",
    "toChain": "arbitrum",
    "tokenSymbol": "USDC",
    "amount": 100.5,
    "recipient": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "recipientBankTag": "@username",
    "fee": 0.25,
    "estimatedTime": "5-15 minutes",
    "transactionHash": "0x..."
  }
}
```

### Get Transfer Details

```http
GET /api/v1/transfer/:internalId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "internalId": "uuid-here",
    "status": "completed",
    "type": "cross_chain",
    "fromUser": {
      "id": 1,
      "bankTag": "@sender",
      "firstName": "John",
      "lastName": "Doe"
    },
    "toUser": {
      "id": 2,
      "bankTag": "@recipient",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "token": {
      "symbol": "USDC",
      "name": "USD Coin"
    },
    "amount": 100.5,
    "amountUSD": 100.5,
    "feeUSD": 0.25,
    "fromChain": "polygon",
    "toChain": "arbitrum",
    "fromBankTag": "@sender",
    "toBankTag": "@recipient",
    "description": "Payment for services",
    "transactionHash": "0x...",
    "deBridgeId": "0x...",
    "confirmedAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:25:00.000Z"
  }
}
```

### Get Transfer History

```http
GET /api/v1/transfer/history?page=1&limit=20&status=completed&chain=polygon
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transfers": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Calculate Transfer Fee

```http
POST /api/v1/transfer/calculate-fee
```

**Request Body:**

```json
{
  "fromChain": "polygon",
  "toChain": "arbitrum",
  "tokenSymbol": "USDC",
  "amount": 100.5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "fromChain": "polygon",
    "toChain": "arbitrum",
    "tokenSymbol": "USDC",
    "amount": 100.5,
    "fee": 0.25,
    "totalAmount": 100.75,
    "estimatedTime": "5-15 minutes",
    "tokenInfo": {
      "symbol": "USDC",
      "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "decimals": 6,
      "name": "USD Coin"
    }
  }
}
```

### Validate Recipient

```http
POST /api/v1/transfer/validate-recipient
```

**Request Body:**

```json
{
  "recipient": "@username",
  "chainId": 137
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recipient": "@username",
    "isValid": true,
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "bankTag": "@username",
    "user": {
      "id": 2,
      "bankTag": "@username",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "type": "bankTag"
  }
}
```

### Get Supported Tokens

```http
GET /api/v1/transfer/supported-tokens/polygon
```

**Response:**

```json
{
  "success": true,
  "data": {
    "chain": "polygon",
    "tokens": [
      {
        "symbol": "USDC",
        "name": "USD Coin",
        "decimals": 6,
        "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
      },
      {
        "symbol": "USDT",
        "name": "Tether USD",
        "decimals": 6,
        "address": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
      },
      {
        "symbol": "DAI",
        "name": "Dai Stablecoin",
        "decimals": 18,
        "address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
      }
    ]
  }
}
```

## Webhook Integration

### DeBridge Webhook

```http
POST /api/v1/webhook/debridge
```

**Headers:**

```
X-DeBridge-Signature: signature-here
X-DeBridge-Timestamp: timestamp-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "transferId": "0x...",
  "status": "completed",
  "chainId": 137,
  "debridgeId": "0x...",
  "receiver": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "amount": "100500000",
  "externalId": "uuid-here",
  "metadata": {
    "reason": "Transfer completed successfully"
  }
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# RPC URLs for each chain
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-api-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-api-key

# Service wallet for DeBridge transactions
SERVICE_WALLET_PRIVATE_KEY=your-private-key

# Webhook secret for DeBridge
DEBRIDGE_WEBHOOK_SECRET=your-webhook-secret
```

### DeBridge Contract Addresses

The system uses verified DeBridge contract addresses:

| Chain    | Contract Address                             |
| -------- | -------------------------------------------- |
| Ethereum | `0x43dE2d77bf8027e25dD1794aD5b6b29a47456b10` |
| Polygon  | `0x43dE2d77bf8027e25dD1794aD5b6b29a47456b10` |
| Arbitrum | `0x43dE2d77bf8027e25dD1794aD5b6b29a47456b10` |

## Usage Examples

### Basic Transfer Flow

```javascript
const { executeTransfer } = require("./src/utils/transferService");

async function sendCrossChainTransfer() {
  const transferResult = await executeTransfer({
    fromUserId: 1,
    fromChain: "polygon",
    toChain: "arbitrum",
    tokenSymbol: "USDC",
    amount: 100.5,
    recipient: "@username",
    description: "Payment for services",
  });

  console.log("Transfer initiated:", transferResult.internalId);
}
```

### BankTag Resolution

```javascript
const { validateRecipient } = require("./src/utils/transferService");

async function resolveBankTag() {
  const validation = await validateRecipient("@username", 137);

  if (validation.isValid) {
    console.log("Resolved address:", validation.address);
    console.log("User:", validation.user);
  }
}
```

### Transaction Tracking

```javascript
const { pollTransactionStatus } = require("./src/utils/transactionTracker");

async function trackTransaction() {
  const status = await pollTransactionStatus("internal-id-here");
  console.log("Transaction status:", status);
}
```

## Transaction Status Flow

1. **Pending**: Transfer initiated, waiting for DeBridge processing
2. **Processing**: DeBridge has received the transfer, processing on destination chain
3. **Completed**: Transfer successfully completed on destination chain
4. **Failed**: Transfer failed (with reason)

## Error Handling

### Common Error Scenarios

1. **Insufficient Balance**: User doesn't have enough tokens
2. **Invalid Recipient**: BankTag doesn't exist or wallet address is invalid
3. **Unsupported Chain**: Source or destination chain not supported
4. **DeBridge Error**: Cross-chain transfer failed on DeBridge
5. **Network Error**: RPC connection issues

### Error Response Format

```json
{
  "success": false,
  "message": "Transfer failed",
  "error": "Insufficient balance",
  "code": "INSUFFICIENT_BALANCE"
}
```

## Security Considerations

- **Signature Validation**: All webhooks are validated using HMAC signatures
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API endpoints are protected by rate limiting
- **Authentication**: All transfer endpoints require user authentication
- **Authorization**: Users can only access their own transfers

## Performance Optimization

- **Parallel Processing**: Multiple transfers can be processed concurrently
- **Caching**: Token information and DeBridge data is cached
- **Batch Polling**: Multiple transaction statuses are polled in batches
- **Connection Pooling**: Database connections are pooled for efficiency

## Monitoring and Logging

- **Structured Logging**: All operations are logged with structured data
- **Transaction Tracking**: Complete audit trail of all transfers
- **Error Monitoring**: Failed transfers are logged with detailed error information
- **Performance Metrics**: Transfer times and success rates are tracked

## Testing

Run the transfer system tests:

```bash
npm run test:transfer
```

This will test:

- Recipient validation (BankTag and address)
- Transfer flow simulation
- Transaction tracking
- Fee calculation
- DeBridge integration

## Troubleshooting

### Common Issues

1. **Transfer Stuck in Processing**

   - Check DeBridge network status
   - Verify destination chain RPC connectivity
   - Review transaction hash on block explorer

2. **BankTag Resolution Fails**

   - Verify BankTag exists in database
   - Check if user has active wallet on target chain
   - Ensure BankTag format is correct (@username)

3. **Fee Calculation Errors**

   - Verify DeBridge contract is accessible
   - Check token is supported on source chain
   - Ensure amount is within min/max limits

4. **Webhook Not Received**
   - Verify webhook URL is correctly configured
   - Check webhook signature validation
   - Ensure DeBridge webhook is enabled

### Debug Mode

Enable detailed logging by setting the log level in your logger configuration.

## Future Enhancements

- **Additional Chains**: Support for Optimism, Base, and other L2s
- **More Tokens**: Support for additional stablecoins (FRAX, USDD, etc.)
- **Batch Transfers**: Support for multiple recipients in single transaction
- **Scheduled Transfers**: Recurring or scheduled cross-chain transfers
- **Advanced Routing**: Optimal route selection for cross-chain transfers
- **Gas Optimization**: Dynamic gas estimation and optimization
