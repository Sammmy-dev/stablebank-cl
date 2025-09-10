# StableBank Database Schema

## Overview

The StableBank database uses PostgreSQL with Sequelize ORM. The schema is designed to support a comprehensive Web3 DeFi x FinTech platform with multi-chain wallet management, virtual cards, KYC verification, and fraud detection.

## Database Models

### 1. User Model (`user.js`)

**Purpose**: Core user account information and authentication data

**Table**: `users`

**Fields**:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(20) UNIQUE NOT NULL,
  role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  bankTag VARCHAR(50) UNIQUE,
  isEmailVerified BOOLEAN DEFAULT false,
  isPhoneVerified BOOLEAN DEFAULT false,
  is2FAEnabled BOOLEAN DEFAULT false,
  isVerified BOOLEAN DEFAULT false,
  kycStatus ENUM('not_started', 'pending', 'approved', 'rejected') DEFAULT 'not_started',
  kycLevel ENUM('basic', 'enhanced', 'corporate') DEFAULT 'basic',
  otp VARCHAR(6),
  otpExpires TIMESTAMP,
  encryptedPrivateKey TEXT,
  privateKeySalt VARCHAR(255),
  privateKeyIv VARCHAR(255),
  lastLoginAt TIMESTAMP,
  loginAttempts INTEGER DEFAULT 0,
  lockedUntil TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_users_email` on `email`
- `idx_users_phone` on `phoneNumber`
- `idx_users_bankTag` on `bankTag`
- `idx_users_kyc_status` on `kycStatus`

**Relationships**:

- Has many Wallets
- Has many Transactions
- Has many VirtualCards
- Has many UserSessions
- Has one KYC record
- Has many AuditLogs

### 2. Wallet Model (`wallet.js`)

**Purpose**: Multi-chain wallet addresses for users

**Table**: `wallets`

**Fields**:

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chainId INTEGER NOT NULL,
  chainName VARCHAR(50) NOT NULL,
  address VARCHAR(42) NOT NULL,
  isActive BOOLEAN DEFAULT true,
  isVerified BOOLEAN DEFAULT false,
  balance DECIMAL(20, 8) DEFAULT 0,
  lastSyncAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_wallets_user_id` on `userId`
- `idx_wallets_address` on `address`
- `idx_wallets_chain_id` on `chainId`
- `idx_wallets_user_chain` on `userId, chainId`

**Relationships**:

- Belongs to User
- Has many Transactions (as source or destination)

### 3. Transaction Model (`transaction.js`)

**Purpose**: Cross-chain transfer records and transaction tracking

**Table**: `transactions`

**Fields**:

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internalId VARCHAR(100) UNIQUE NOT NULL,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('transfer', 'swap', 'stake', 'unstake', 'reward') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  sourceChainId INTEGER,
  destinationChainId INTEGER,
  sourceAddress VARCHAR(42),
  destinationAddress VARCHAR(42),
  tokenSymbol VARCHAR(10) NOT NULL,
  tokenAddress VARCHAR(42),
  amount DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  gasUsed BIGINT,
  gasPrice BIGINT,
  transactionHash VARCHAR(66),
  blockNumber BIGINT,
  confirmations INTEGER DEFAULT 0,
  deBridgeId VARCHAR(100),
  description TEXT,
  metadata JSONB,
  estimatedTime VARCHAR(50),
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_transactions_user_id` on `userId`
- `idx_transactions_internal_id` on `internalId`
- `idx_transactions_hash` on `transactionHash`
- `idx_transactions_status` on `status`
- `idx_transactions_created_at` on `createdAt`
- `idx_transactions_debridge_id` on `deBridgeId`

**Relationships**:

- Belongs to User
- Has many AuditLogs

### 4. Virtual Card Model (`virtualCard.js`)

**Purpose**: Virtual card management and metadata

**Table**: `virtualCards`

**Fields**:

```sql
CREATE TABLE virtualCards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lithicCardId VARCHAR(100) UNIQUE,
  cardNumber VARCHAR(16),
  cvv VARCHAR(4),
  expiryMonth VARCHAR(2),
  expiryYear VARCHAR(4),
  cardType ENUM('virtual', 'physical') DEFAULT 'virtual',
  status ENUM('active', 'inactive', 'suspended', 'cancelled') DEFAULT 'active',
  spendingLimit DECIMAL(10, 2),
  currentBalance DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  fraudRiskScore INTEGER,
  lastUsedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_virtual_cards_user_id` on `userId`
- `idx_virtual_cards_lithic_id` on `lithicCardId`
- `idx_virtual_cards_status` on `status`

**Relationships**:

- Belongs to User
- Has many CardTransactions

### 5. Card Transaction Model (`cardTransaction.js`)

**Purpose**: Virtual card transaction records

**Table**: `cardTransactions`

**Fields**:

```sql
CREATE TABLE cardTransactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cardId UUID NOT NULL REFERENCES virtualCards(id) ON DELETE CASCADE,
  lithicTransactionId VARCHAR(100) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  merchant VARCHAR(255),
  merchantCategory VARCHAR(100),
  transactionType ENUM('purchase', 'refund', 'chargeback') DEFAULT 'purchase',
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  fraudRiskScore INTEGER,
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_card_transactions_card_id` on `cardId`
- `idx_card_transactions_lithic_id` on `lithicTransactionId`
- `idx_card_transactions_created_at` on `createdAt`
- `idx_card_transactions_merchant` on `merchant`

**Relationships**:

- Belongs to VirtualCard

### 6. KYC Model (`kyc.js`)

**Purpose**: KYC verification records and documents

**Table**: `kycs`

**Fields**:

```sql
CREATE TABLE kycs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sumsubApplicantId VARCHAR(100) UNIQUE,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  dateOfBirth DATE NOT NULL,
  nationality VARCHAR(3) NOT NULL,
  documentType ENUM('passport', 'national_id', 'drivers_license') NOT NULL,
  documentNumber VARCHAR(100),
  documentCountry VARCHAR(3),
  status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
  level ENUM('basic', 'enhanced', 'corporate') DEFAULT 'basic',
  verificationUrl TEXT,
  expiresAt TIMESTAMP,
  verifiedAt TIMESTAMP,
  nextReviewAt TIMESTAMP,
  rejectionReason TEXT,
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_kycs_user_id` on `userId`
- `idx_kycs_sumsub_id` on `sumsubApplicantId`
- `idx_kycs_status` on `status`

**Relationships**:

- Belongs to User

### 7. User Session Model (`userSession.js`)

**Purpose**: User session tracking and management

**Table**: `userSessions`

**Fields**:

```sql
CREATE TABLE userSessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sessionToken VARCHAR(255) UNIQUE NOT NULL,
  refreshToken VARCHAR(255) UNIQUE NOT NULL,
  deviceInfo JSONB,
  ipAddress INET,
  userAgent TEXT,
  location VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  expiresAt TIMESTAMP NOT NULL,
  lastActivityAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_user_sessions_user_id` on `userId`
- `idx_user_sessions_token` on `sessionToken`
- `idx_user_sessions_refresh_token` on `refreshToken`
- `idx_user_sessions_expires_at` on `expiresAt`

**Relationships**:

- Belongs to User

### 8. Audit Log Model (`auditLog.js`)

**Purpose**: System activity tracking for compliance and security

**Table**: `auditLogs`

**Fields**:

```sql
CREATE TABLE auditLogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resourceId VARCHAR(100),
  details JSONB,
  ipAddress INET,
  userAgent TEXT,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_audit_logs_user_id` on `userId`
- `idx_audit_logs_action` on `action`
- `idx_audit_logs_created_at` on `createdAt`
- `idx_audit_logs_severity` on `severity`

**Relationships**:

- Belongs to User (optional)

### 9. Balance Model (`balance.js`)

**Purpose**: Token balance tracking and snapshots

**Table**: `balances`

**Fields**:

```sql
CREATE TABLE balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  walletId UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  tokenSymbol VARCHAR(10) NOT NULL,
  tokenAddress VARCHAR(42),
  balance DECIMAL(20, 8) NOT NULL,
  usdValue DECIMAL(20, 2),
  lastPrice DECIMAL(20, 8),
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_balances_user_id` on `userId`
- `idx_balances_wallet_id` on `walletId`
- `idx_balances_token` on `tokenSymbol, tokenAddress`
- `idx_balances_last_updated` on `lastUpdated`

**Relationships**:

- Belongs to User
- Belongs to Wallet

### 10. Investment Model (`investment.js`)

**Purpose**: Staking and investment records

**Table**: `investments`

**Fields**:

```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('staking', 'yield_farming', 'liquidity_provision') NOT NULL,
  tokenSymbol VARCHAR(10) NOT NULL,
  tokenAddress VARCHAR(42),
  amount DECIMAL(20, 8) NOT NULL,
  apy DECIMAL(5, 2),
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP,
  rewardsEarned DECIMAL(20, 8) DEFAULT 0,
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_investments_user_id` on `userId`
- `idx_investments_type` on `type`
- `idx_investments_status` on `status`
- `idx_investments_start_date` on `startDate`

**Relationships**:

- Belongs to User

### 11. Staking Model (`staking.js`)

**Purpose**: Staking pool and reward management

**Table**: `stakings`

**Fields**:

```sql
CREATE TABLE stakings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poolId VARCHAR(100) NOT NULL,
  tokenSymbol VARCHAR(10) NOT NULL,
  tokenAddress VARCHAR(42),
  stakedAmount DECIMAL(20, 8) NOT NULL,
  rewardAmount DECIMAL(20, 8) DEFAULT 0,
  apy DECIMAL(5, 2),
  lockPeriod INTEGER, -- in days
  unlockDate TIMESTAMP,
  status ENUM('active', 'unlocking', 'completed', 'cancelled') DEFAULT 'active',
  transactionHash VARCHAR(66),
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_stakings_user_id` on `userId`
- `idx_stakings_pool_id` on `poolId`
- `idx_stakings_status` on `status`
- `idx_stakings_unlock_date` on `unlockDate`

**Relationships**:

- Belongs to User

### 12. Reward Model (`reward.js`)

**Purpose**: Reward and incentive tracking

**Table**: `rewards`

**Fields**:

```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('referral', 'staking', 'promotion', 'achievement') NOT NULL,
  tokenSymbol VARCHAR(10) NOT NULL,
  tokenAddress VARCHAR(42),
  amount DECIMAL(20, 8) NOT NULL,
  usdValue DECIMAL(20, 2),
  status ENUM('pending', 'claimed', 'expired') DEFAULT 'pending',
  expiresAt TIMESTAMP,
  claimedAt TIMESTAMP,
  transactionHash VARCHAR(66),
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_rewards_user_id` on `userId`
- `idx_rewards_type` on `type`
- `idx_rewards_status` on `status`
- `idx_rewards_expires_at` on `expiresAt`

**Relationships**:

- Belongs to User

### 13. Token Model (`token.js`)

**Purpose**: Supported token information and metadata

**Table**: `tokens`

**Fields**:

```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(42),
  chainId INTEGER NOT NULL,
  chainName VARCHAR(50) NOT NULL,
  decimals INTEGER NOT NULL,
  isStablecoin BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  coingeckoId VARCHAR(100),
  price DECIMAL(20, 8),
  lastPriceUpdate TIMESTAMP,
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_tokens_symbol` on `symbol`
- `idx_tokens_address` on `address`
- `idx_tokens_chain_id` on `chainId`
- `idx_tokens_stablecoin` on `isStablecoin`

### 14. Notification Model (`notification.js`)

**Purpose**: User notification management

**Table**: `notifications`

**Fields**:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('transaction', 'security', 'promotion', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT false,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'low',
  metadata JSONB,
  readAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:

- `idx_notifications_user_id` on `userId`
- `idx_notifications_type` on `type`
- `idx_notifications_read` on `isRead`
- `idx_notifications_created_at` on `createdAt`

**Relationships**:

- Belongs to User

## Database Relationships

### Entity Relationship Diagram

```
Users (1) ──── (N) Wallets
Users (1) ──── (N) Transactions
Users (1) ──── (N) VirtualCards
Users (1) ──── (N) UserSessions
Users (1) ──── (1) KYC
Users (1) ──── (N) AuditLogs
Users (1) ──── (N) Balances
Users (1) ──── (N) Investments
Users (1) ──── (N) Stakings
Users (1) ──── (N) Rewards
Users (1) ──── (N) Notifications

Wallets (1) ──── (N) Balances
VirtualCards (1) ──── (N) CardTransactions
```

## Database Migrations

### Migration Files Structure

```
db/
├── migrations/
│   ├── 20240101000001-create-users.js
│   ├── 20240101000002-create-wallets.js
│   ├── 20240101000003-create-transactions.js
│   ├── 20240101000004-create-virtual-cards.js
│   ├── 20240101000005-create-card-transactions.js
│   ├── 20240101000006-create-kycs.js
│   ├── 20240101000007-create-user-sessions.js
│   ├── 20240101000008-create-audit-logs.js
│   ├── 20240101000009-create-balances.js
│   ├── 20240101000010-create-investments.js
│   ├── 20240101000011-create-stakings.js
│   ├── 20240101000012-create-rewards.js
│   ├── 20240101000013-create-tokens.js
│   └── 20240101000014-create-notifications.js
```

### Running Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## Database Seeding

### Seed Files Structure

```
db/
├── seeders/
│   ├── 20240101000001-demo-users.js
│   ├── 20240101000002-demo-wallets.js
│   ├── 20240101000003-demo-transactions.js
│   ├── 20240101000004-supported-tokens.js
│   └── 20240101000005-demo-cards.js
```

### Running Seeders

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Run specific seeder
npx sequelize-cli db:seed --seed 20240101000001-demo-users.js

# Undo last seeder
npx sequelize-cli db:seed:undo

# Undo all seeders
npx sequelize-cli db:seed:undo:all
```

## Database Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/stablebank
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stablebank
DB_USER=username
DB_PASSWORD=password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Sequelize Configuration
SEQUELIZE_ENV=development
```

### Sequelize Configuration (`db/config/config.js`)

```javascript
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
```

## Performance Optimization

### Indexing Strategy

1. **Primary Keys**: All tables use UUID primary keys for security
2. **Foreign Keys**: Indexed for join performance
3. **Frequently Queried Fields**: Email, phone, bankTag, status fields
4. **Composite Indexes**: User + chain combinations for wallets
5. **Time-based Indexes**: Created/updated timestamps for analytics

### Query Optimization

1. **Connection Pooling**: Configured for optimal connection management
2. **Eager Loading**: Used to prevent N+1 query problems
3. **Pagination**: Implemented for large result sets
4. **Caching**: Redis integration for frequently accessed data

### Backup Strategy

1. **Daily Backups**: Automated PostgreSQL backups
2. **Point-in-Time Recovery**: WAL archiving enabled
3. **Cross-Region Replication**: For disaster recovery
4. **Encrypted Backups**: All backups encrypted at rest

## Security Considerations

### Data Protection

1. **Encryption**: Sensitive data encrypted at rest
2. **Hashing**: Passwords hashed with bcrypt
3. **Tokenization**: Private keys encrypted with user passwords
4. **Access Control**: Role-based permissions

### Compliance

1. **GDPR**: Right to be forgotten implemented
2. **KYC/AML**: Comprehensive verification tracking
3. **Audit Trails**: Complete activity logging
4. **Data Retention**: Configurable retention policies
