# Viem Setup and Configuration

This document explains how to set up and configure viem for the StableBank project.

## Installation

Viem has been installed as a dependency:

```bash
npm install viem
```

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Viem/Web3 Configuration
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/your-project-id
SERVICE_WALLET_PRIVATE_KEY=your_service_wallet_private_key_here
USDC_CONTRACT_ADDRESS=0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747
```

### Configuration Details

- **POLYGON_MUMBAI_RPC_URL**: Your Polygon Mumbai testnet RPC endpoint

  - You can use Infura, Alchemy, or your own node
  - Example: `https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID`

- **SERVICE_WALLET_PRIVATE_KEY**: Private key for the service wallet

  - This wallet will be used for contract transactions
  - Must have MATIC for gas fees
  - Format: `0x...` (64 character hex string)

- **USDC_CONTRACT_ADDRESS**: USDC contract address on Polygon Mumbai
  - Default: `0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747`
  - This is the official USDC testnet contract

## Features Implemented

### 1. Polygon Mumbai Connection

- Public client for read operations
- Wallet client for write operations
- Automatic chain configuration

### 2. Message Verification

- Verify signed messages for authentication
- Supports EIP-191 personal message signing
- Used for wallet-based login

### 3. Balance Reading

- USDC balance from smart contract
- Native MATIC balance
- Formatted and raw balance values

### 4. Contract Transactions

- USDC transfers from service wallet
- Transaction status monitoring
- Gas price estimation

## API Endpoints

### Authentication

- `POST /api/v1/web3/verify-message` - Verify signed message
- `POST /api/v1/web3/create-message` - Create message for signing

### Balance Queries

- `GET /api/v1/web3/balance/usdc/:address` - Get USDC balance
- `GET /api/v1/web3/balance/native/:address` - Get MATIC balance
- `GET /api/v1/web3/wallet/:address` - Get comprehensive wallet info

### Transactions

- `POST /api/v1/web3/transfer/usdc` - Transfer USDC
- `GET /api/v1/web3/transaction/:hash` - Get transaction status
- `GET /api/v1/web3/gas-price` - Get current gas price

## Usage Examples

### 1. Verify a Signed Message

```javascript
const response = await fetch("/api/v1/web3/verify-message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message:
      "StableBank Authentication\n\nAddress: 0x...\nTimestamp: 1234567890\n\nSign this message to authenticate with StableBank.",
    signature: "0x...",
    address: "0x...",
  }),
});
```

### 2. Get USDC Balance

```javascript
const response = await fetch("/api/v1/web3/balance/usdc/0x1234...");
const data = await response.json();
console.log(data.data.formatted); // e.g., "100.5"
```

### 3. Transfer USDC

```javascript
const response = await fetch("/api/v1/web3/transfer/usdc", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    toAddress: "0x...",
    amount: 10.5, // 10.5 USDC
  }),
});
```

## Security Considerations

1. **Private Key Security**: Never commit private keys to version control
2. **Environment Variables**: Use `.env` files for sensitive configuration
3. **Rate Limiting**: Implement rate limiting on Web3 endpoints
4. **Input Validation**: Validate all addresses and amounts
5. **Error Handling**: Don't expose sensitive error details

## Testing

### Test USDC Contract Address

The default USDC contract address (`0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747`) is the official USDC testnet contract on Polygon Mumbai.

### Getting Test MATIC

You can get test MATIC from the Polygon Mumbai faucet:

- https://faucet.polygon.technology/
- https://mumbaifaucet.com/

### Getting Test USDC

You can get test USDC by:

1. Using the faucet at https://faucet.polygon.technology/
2. Or swapping MATIC for USDC on QuickSwap testnet

## Troubleshooting

### Common Issues

1. **RPC Connection Failed**

   - Check your RPC URL
   - Ensure you have proper API key/access
   - Verify network connectivity

2. **Insufficient Gas**

   - Ensure service wallet has MATIC for gas fees
   - Check gas price and adjust if needed

3. **Contract Not Found**

   - Verify USDC contract address
   - Ensure you're connected to Polygon Mumbai

4. **Invalid Private Key**
   - Check private key format (0x prefix)
   - Ensure it's a valid 64-character hex string

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will provide detailed logs for all viem operations.
