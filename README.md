# StableBank Server

A Web3 DeFi x FinTech platform backend that provides unified banking experience across EVM-compatible chains.

## Features

- **Unified Balance Engine**: Chain-abstracted stablecoin balance aggregation
- **Multi-Chain Support**: Ethereum, Polygon, and Arbitrum
- **Virtual Card System**: Integration with Lithic for card management
- **KYC Integration**: Sumsub identity verification
- **BankTags™ System**: Unique username-based transfer tags
- **Web3 Integration**: Viem-based blockchain interactions
- **Authentication**: JWT + 2FA with MailerSend Email OTP
- **Fraud Detection**: Advanced fraud detection algorithms

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd stablebank-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx sequelize-cli db:migrate

# Start the server
npm run server
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/stablebank

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-api-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-api-key

# Third-party Services
MAILERSEND_API_KEY=your-mailersend-api-key
MAILERSEND_FROM_EMAIL=noreply@stablebank.com
MAILERSEND_FROM_NAME=StableBank
LITHIC_API_KEY=your-lithic-key
SUMSUB_APP_TOKEN=your-sumsub-token
```

## API Endpoints

### Unified Balance Engine

#### Get Unified Balance

```http
GET /api/v1/web3/unified-balance/:address
```

Returns total USD value of stablecoin balances across all supported chains.

#### Get Chain-Specific Balance

```http
GET /api/v1/web3/chain-balance/:chain/:address
```

Returns USD value of stablecoin balances for a specific chain.

### Authentication

#### Sign Up

```http
POST /api/v1/auth/signup
```

#### Sign In

```http
POST /api/v1/auth/signin
```

#### Verify OTP

```http
POST /api/v1/auth/verify-otp
```

### Web3 Operations

#### Get USDC Balance

```http
GET /api/v1/web3/balance/usdc/:address
```

#### Get Native Balance

```http
GET /api/v1/web3/balance/native/:address
```

#### Transfer USDC

```http
POST /api/v1/web3/transfer/usdc
```

## Testing

### Run Unified Balance Tests

```bash
npm run test:unified-balance
```

### Run Viem Tests

```bash
npm run test:viem
```

## Architecture

### Core Components

1. **Unified Balance Engine** (`src/utils/unifiedBalance.js`)

   - Multi-chain balance aggregation
   - Real-time price fetching via CoinGecko
   - Parallel processing for efficiency

2. **Web3 Integration** (`src/utils/viem.js`)

   - Viem-based blockchain interactions
   - Multi-chain client management
   - Transaction handling

3. **Authentication System** (`src/controllers/authController.js`)

   - JWT token management
   - 2FA with MailerSend Email OTP
   - Session tracking

4. **Virtual Card System** (`src/controllers/virtualCardController.js`)
   - Lithic integration
   - Card lifecycle management
   - Fraud detection

### Database Schema

The application uses Sequelize ORM with PostgreSQL and includes models for:

- Users and authentication
- Wallets and balances
- Virtual cards and transactions
- KYC verification
- Audit logs
- Rewards and staking

## Development

### Project Structure

```
stablebank-server/
├── src/
│   ├── controllers/     # API controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── validations/     # Input validation schemas
│   └── app.js          # Express app setup
├── db/
│   ├── migrations/      # Database migrations
│   ├── models/          # Sequelize models
│   └── seeders/         # Database seeders
├── docs/               # Documentation
└── logs/               # Application logs
```

### Adding New Features

1. **New API Endpoint**:

   - Add controller in `src/controllers/`
   - Add route in `src/routes/`
   - Add validation in `src/validations/`

2. **New Chain Support**:

   - Update `STABLECOIN_ADDRESSES` in `unifiedBalance.js`
   - Add chain client configuration
   - Update API validation

3. **New Token Support**:

   - Add contract address to `STABLECOIN_ADDRESSES`
   - Add CoinGecko ID to price mapping
   - Update token lists

## Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production

1. Set up environment variables for production
2. Configure database and Redis connections
3. Set up monitoring and logging
4. Configure rate limiting and security headers
5. Deploy with your preferred hosting provider

## Security

- JWT token authentication
- Rate limiting on all endpoints
- Input validation with Yup schemas
- Helmet.js security headers
- CORS configuration
- Environment variable protection

## Monitoring

- Winston structured logging
- Error tracking and monitoring
- Performance metrics
- Database query monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please refer to the documentation in the `docs/` directory or create an issue in the repository.
