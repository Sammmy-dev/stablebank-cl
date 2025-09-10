# Unified Balance Engine

The Unified Balance Engine is a core component of StableBank that provides a chain-abstracted view of stablecoin balances across multiple EVM-compatible chains. It aggregates balances from Ethereum, Polygon, and Arbitrum, converts them to USD using real-time price feeds, and presents a unified total.

## Features

- **Multi-Chain Support**: Ethereum, Polygon, and Arbitrum
- **Stablecoin Coverage**: USDC, USDT, and DAI on all supported chains
- **Real-Time Pricing**: CoinGecko API integration for accurate USD conversion
- **Parallel Processing**: Efficient concurrent balance fetching
- **Error Handling**: Graceful fallbacks and detailed error reporting
- **RESTful API**: Clean endpoints for frontend integration

## Architecture

### Core Components

1. **Chain Clients**: Viem public clients for each supported chain
2. **Token Registry**: Contract addresses for stablecoins on each chain
3. **Price Service**: CoinGecko API integration for USD pricing
4. **Balance Aggregator**: Parallel balance fetching and USD conversion
5. **API Layer**: REST endpoints for unified and chain-specific queries

### Supported Networks

| Chain    | RPC Environment Variable | Default         |
| -------- | ------------------------ | --------------- |
| Ethereum | `ETHEREUM_RPC_URL`       | Alchemy mainnet |
| Polygon  | `POLYGON_RPC_URL`        | Alchemy mainnet |
| Arbitrum | `ARBITRUM_RPC_URL`       | Alchemy mainnet |

### Supported Tokens

| Token | CoinGecko ID | Chains                      |
| ----- | ------------ | --------------------------- |
| USDC  | `usd-coin`   | Ethereum, Polygon, Arbitrum |
| USDT  | `tether`     | Ethereum, Polygon, Arbitrum |
| DAI   | `dai`        | Ethereum, Polygon, Arbitrum |

## API Endpoints

### Get Unified Balance

```
GET /api/v1/web3/unified-balance/:address
```

Returns the total USD value of all stablecoin balances across all supported chains.

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "totalUSD": 1250.75,
    "chainTotals": {
      "ethereum": 500.25,
      "polygon": 450.5,
      "arbitrum": 300.0
    },
    "balances": [
      {
        "chain": "ethereum",
        "token": "USDC",
        "address": "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C",
        "rawBalance": "500250000",
        "formattedBalance": 500.25,
        "decimals": 6,
        "symbol": "USDC",
        "priceUSD": 1.0,
        "usdValue": 500.25
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "supportedChains": ["ethereum", "polygon", "arbitrum"],
    "supportedTokens": ["USDC", "USDT", "DAI"]
  }
}
```

### Get Chain-Specific Balance

```
GET /api/v1/web3/chain-balance/:chain/:address
```

Returns the USD value of stablecoin balances for a specific chain.

**Parameters:**

- `chain`: One of `ethereum`, `polygon`, or `arbitrum`
- `address`: Wallet address to query

**Response:**

```json
{
  "success": true,
  "data": {
    "chain": "ethereum",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "totalUSD": 500.25,
    "balances": [
      {
        "chain": "ethereum",
        "token": "USDC",
        "address": "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C",
        "rawBalance": "500250000",
        "formattedBalance": 500.25,
        "decimals": 6,
        "symbol": "USDC",
        "priceUSD": 1.0,
        "usdValue": 500.25
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# RPC URLs (replace with your actual endpoints)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-api-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-api-key
```

### Contract Addresses

The engine uses verified contract addresses for each stablecoin on each chain. These are hardcoded in the `unifiedBalance.js` utility for security and performance.

## Usage Examples

### Basic Usage

```javascript
const { getUnifiedBalance } = require("./src/utils/unifiedBalance");

async function checkBalance() {
  const address = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
  const balance = await getUnifiedBalance(address);

  console.log(`Total USD: $${balance.totalUSD}`);
  console.log(`Ethereum: $${balance.chainTotals.ethereum}`);
  console.log(`Polygon: $${balance.chainTotals.polygon}`);
  console.log(`Arbitrum: $${balance.chainTotals.arbitrum}`);
}
```

### Chain-Specific Query

```javascript
const { getChainBalance } = require("./src/utils/unifiedBalance");

async function checkEthereumBalance() {
  const address = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
  const balance = await getChainBalance("ethereum", address);

  console.log(`Ethereum Total: $${balance.totalUSD}`);
  balance.balances.forEach((token) => {
    console.log(
      `${token.token}: ${token.formattedBalance} ($${token.usdValue})`
    );
  });
}
```

## Testing

Run the test suite to verify functionality:

```bash
npm run test:unified-balance
```

This will test both unified and chain-specific balance fetching with a sample wallet address.

## Error Handling

The engine implements comprehensive error handling:

- **Network Failures**: Individual chain failures don't break the entire query
- **Price API Failures**: Falls back to $1.00 for stablecoins if CoinGecko is unavailable
- **Invalid Addresses**: Returns zero balances with error details
- **Unsupported Tokens**: Gracefully skips unsupported tokens

## Performance Considerations

- **Parallel Processing**: All balance queries run concurrently
- **Caching**: Consider implementing Redis caching for price data
- **Rate Limiting**: CoinGecko API has rate limits (10-50 calls/minute)
- **Timeout Handling**: 10-second timeout for price API calls

## Security

- **Contract Verification**: All contract addresses are verified and hardcoded
- **Input Validation**: Address format validation on all endpoints
- **Error Sanitization**: Sensitive data is not exposed in error messages
- **Rate Limiting**: API endpoints are protected by Express rate limiting

## Future Enhancements

- **Additional Chains**: Support for Optimism, Base, and other L2s
- **More Tokens**: Support for additional stablecoins (FRAX, USDD, etc.)
- **Price Aggregation**: Multiple price sources for redundancy
- **Caching Layer**: Redis integration for price and balance caching
- **WebSocket Updates**: Real-time balance updates
- **Batch Queries**: Support for multiple addresses in single request

## Troubleshooting

### Common Issues

1. **RPC Timeouts**: Check your RPC endpoint configuration
2. **Price API Errors**: Verify CoinGecko API status
3. **Zero Balances**: Ensure the wallet address has tokens on supported chains
4. **Invalid Chain**: Use only supported chain names (ethereum, polygon, arbitrum)

### Debug Mode

Enable detailed logging by setting the log level in your logger configuration.

## Contributing

When adding new chains or tokens:

1. Update `STABLECOIN_ADDRESSES` with verified contract addresses
2. Add chain configuration to `clients` object
3. Update `tokensByChain` mapping
4. Add token to `tokenPriceMap` if not already included
5. Update API validation for new chains
6. Add comprehensive tests
7. Update documentation
