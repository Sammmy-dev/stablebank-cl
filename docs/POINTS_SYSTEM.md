# Points System Documentation

## Overview

The Points System is a comprehensive reward mechanism that tracks user actions and assigns points for various activities like referrals, staking, transactions, and engagement. The system includes both on-chain (smart contract) and off-chain (database) components for maximum flexibility and performance.

## Features

- **Multi-tier System**: Bronze, Silver, Gold, Platinum, Diamond tiers with increasing benefits
- **Activity Tracking**: Points for referrals, staking, transactions, and engagement
- **Tier Multipliers**: Higher tiers earn more points per activity
- **Referral System**: Rewards for successful referrals and their activities
- **Smart Contract Integration**: On-chain points tracking and verification
- **Real-time Analytics**: Comprehensive reporting and analytics
- **Caching**: Redis-based caching for performance
- **Audit Trail**: Complete audit logging for all point transactions

## Architecture

### Components

1. **Points Engine** (`src/services/pointsEngine.js`)

   - Core points calculation and management
   - Tier calculations and multipliers
   - Points awarding and tracking

2. **Points Integration** (`src/services/pointsIntegration.js`)

   - Automatic points processing for various activities
   - Integration with existing systems (staking, transactions, etc.)

3. **Points Controller** (`src/controllers/pointsController.js`)

   - API endpoints for points operations
   - User interface for points management

4. **Smart Contract** (`contracts/PointsSystem.sol`)
   - On-chain points tracking
   - Immutable audit trail
   - Decentralized verification

## Points Configuration

### Tier System

| Tier     | Min Points | Multiplier | Benefits                                             |
| -------- | ---------- | ---------- | ---------------------------------------------------- |
| Bronze   | 0          | 1.0x       | Basic rewards, Standard support                      |
| Silver   | 5,000      | 1.2x       | 20% points bonus, Priority support, Lower fees       |
| Gold     | 10,000     | 1.5x       | 50% points bonus, VIP support, Exclusive offers      |
| Platinum | 25,000     | 2.0x       | 100% points bonus, Dedicated support, Premium offers |
| Diamond  | 50,000     | 3.0x       | 200% points bonus, Personal account manager          |

### Activity Points

#### Referral Activities

- **Signup**: 1,000 points
- **First Transaction**: 500 points
- **Staking**: 200 points
- **Investment**: 300 points

#### Staking Activities

- **Flexible**: 50 points per $100 staked
- **30-day Lock**: 75 points per $100 staked
- **90-day Lock**: 100 points per $100 staked
- **180-day Lock**: 150 points per $100 staked
- **365-day Lock**: 200 points per $100 staked
- **Milestone Bonuses**: 1,000-5,000 points for large amounts

#### Transaction Activities

- **Send**: 5 points per $10 sent
- **Receive**: 2 points per $10 received
- **International**: +10 bonus points
- **Large Transfer**: +50 bonus points (>$1,000)

#### Engagement Activities

- **Daily Login**: 5 points
- **Profile Completion**: 100 points
- **KYC Verification**: 200 points
- **2FA Setup**: 50 points
- **Card Activation**: 75 points
- **First Investment**: 300 points

#### Special Events

- **Birthday**: 500 points
- **Account Anniversary**: 1,000 points
- **Holiday Bonus**: 250 points
- **Promotional Events**: 1,000 points

## API Endpoints

### Public Endpoints

#### Get Points Configuration

```http
GET /api/v1/points/config
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tiers": {
      "bronze": { "minPoints": 0, "multiplier": 1.0 },
      "silver": { "minPoints": 5000, "multiplier": 1.2 },
      "gold": { "minPoints": 10000, "multiplier": 1.5 },
      "platinum": { "minPoints": 25000, "multiplier": 2.0 },
      "diamond": { "minPoints": 50000, "multiplier": 3.0 }
    },
    "activities": {
      "referral": { "signup": 1000, "first_transaction": 500 },
      "staking": { "flexible": 50, "locked_30": 75 },
      "transaction": { "send": 5, "receive": 2 },
      "engagement": { "daily_login": 5, "profile_completion": 100 }
    }
  }
}
```

### User Endpoints (Authentication Required)

#### Get User Points Summary

```http
GET /api/v1/points/summary
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalPoints": 12500,
    "tier": "gold",
    "multiplier": 1.5,
    "recentRewards": [...],
    "pointsBreakdown": [...],
    "nextTier": "platinum",
    "pointsToNextTier": 12500
  }
}
```

#### Get User Tier Information

```http
GET /api/v1/points/tier
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "currentTier": "gold",
    "totalPoints": 12500,
    "multiplier": 1.5,
    "nextTier": "platinum",
    "pointsToNextTier": 12500,
    "tierBenefits": {
      "pointsMultiplier": 1.5,
      "features": ["50% points bonus", "VIP support", "Exclusive offers"],
      "description": "Premium benefits and exclusive features"
    }
  }
}
```

#### Get Points History

```http
GET /api/v1/points/history?page=1&limit=20
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": 1,
        "action": "staking",
        "points": 500,
        "tier": "gold",
        "multiplier": 1.5,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### Get Leaderboard

```http
GET /api/v1/points/leaderboard?limit=100
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "totalPoints": 75000,
      "tier": "diamond"
    }
  ]
}
```

#### Process Daily Login Points

```http
POST /api/v1/points/daily-login
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 456,
    "action": "engagement_daily_login",
    "points": 5,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Daily login points awarded successfully"
}
```

### Admin Endpoints (Admin Role Required)

#### Award Points Manually

```http
POST /api/v1/points/award
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 123,
  "action": "special_promotional",
  "points": 1000,
  "metadata": {
    "campaign": "summer_2024",
    "reason": "Promotional bonus"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 789,
    "userId": 123,
    "action": "special_promotional",
    "points": 1000,
    "tier": "gold",
    "multiplier": 1.5,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Successfully awarded 1000 points to user"
}
```

#### Get Points Analytics

```http
GET /api/v1/points/analytics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalPointsAwarded": 150000,
    "pointsByAction": [
      {
        "action": "staking",
        "totalPoints": 75000,
        "count": 150
      }
    ],
    "tierDistribution": [
      {
        "tier": "bronze",
        "userCount": 500
      }
    ],
    "topEarners": [...],
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }
}
```

## Smart Contract Integration

### Contract Address

```
PointsSystem: 0x... (deployed on Polygon)
```

### Key Functions

#### Register User

```solidity
function registerUser(address user, address referrer) external onlyOwner
```

#### Award Points

```solidity
function awardPoints(address user, string memory action) external onlyOwner
```

#### Get User Points

```solidity
function getUserPoints(address user) external view returns (UserPoints memory)
```

#### Get Tier Multiplier

```solidity
function getTierMultiplier(address user) external view returns (uint256)
```

### Events

#### Points Awarded

```solidity
event PointsAwarded(address indexed user, uint256 points, string action, uint256 timestamp)
```

#### Tier Upgraded

```solidity
event TierUpgraded(address indexed user, string fromTier, string toTier, uint256 timestamp)
```

#### Referral Points Awarded

```solidity
event ReferralPointsAwarded(address indexed referrer, address indexed referred, uint256 points, uint256 timestamp)
```

## Integration Examples

### Staking Integration

When a user creates a new staking:

```javascript
const pointsIntegration = require("./src/services/pointsIntegration");

// After successful staking creation
await pointsIntegration.processStakingPoints(stakingId);
```

### Transaction Integration

When a user completes a transaction:

```javascript
// After successful transaction
await pointsIntegration.processTransactionPoints(transactionId);

// Check for referral first transaction
await pointsIntegration.processReferralFirstTransaction(userId);
```

### Referral Integration

When a new user signs up with a referral:

```javascript
// After user registration
await pointsIntegration.processReferralSignup(newUserId, referrerId);
```

### Engagement Integration

For profile completion:

```javascript
// After profile update
await pointsIntegration.processProfileCompletion(userId);
```

For KYC verification:

```javascript
// After KYC approval
await pointsIntegration.processKYCVerification(userId);
```

## Database Schema

### User Table Additions

```sql
ALTER TABLE user ADD COLUMN totalPoints INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user ADD COLUMN tier ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond') NOT NULL DEFAULT 'bronze';
```

### Reward Table (Existing)

```sql
CREATE TABLE reward (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  userId INTEGER NOT NULL,
  type ENUM('points', 'cashback', 'bonus', 'referral', 'staking_reward', 'investment_reward') NOT NULL,
  action VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'credited', 'claimed', 'expired') NOT NULL DEFAULT 'pending',
  tier ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond'),
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  metadata JSON,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

## Deployment

### 1. Database Migration

```bash
npx sequelize-cli db:migrate
```

### 2. Smart Contract Deployment

```bash
npx hardhat compile
npx hardhat run scripts/deploy-points-system.js --network polygon
```

### 3. Environment Variables

```env
POINTS_CONTRACT_ADDRESS=0x...
POINTS_PRIVATE_KEY=...
REDIS_URL=redis://localhost:6379
```

### 4. Service Integration

Update existing controllers to call points integration services:

```javascript
// In stakingController.js
const pointsIntegration = require("../services/pointsIntegration");

// After successful staking
await pointsIntegration.processStakingPoints(staking.id);
```

## Monitoring and Analytics

### Key Metrics

- Total points awarded
- Points by activity type
- Tier distribution
- Top earners
- Referral performance
- Daily/weekly/monthly trends

### Alerts

- Unusual point awarding patterns
- Tier upgrade events
- Referral fraud detection
- System performance issues

## Security Considerations

1. **Rate Limiting**: All points endpoints are rate-limited
2. **Authentication**: All user endpoints require valid JWT tokens
3. **Authorization**: Admin endpoints require admin role
4. **Audit Logging**: All point transactions are logged
5. **Smart Contract**: On-chain verification and immutable records
6. **Input Validation**: All inputs are validated and sanitized

## Performance Optimization

1. **Redis Caching**: User points cached for quick access
2. **Database Indexes**: Optimized queries with proper indexing
3. **Batch Processing**: Bulk operations for efficiency
4. **Async Processing**: Non-blocking point calculations
5. **Connection Pooling**: Optimized database connections

## Troubleshooting

### Common Issues

1. **Points not awarded**: Check if user is active and action is valid
2. **Tier not updating**: Verify total points calculation
3. **Referral issues**: Ensure referral relationship is properly set
4. **Smart contract errors**: Check contract state and permissions

### Debug Commands

```javascript
// Check user points
const user = await User.findByPk(userId);
console.log("User points:", user.totalPoints, user.tier);

// Check recent rewards
const rewards = await Reward.findAll({
  where: { userId, type: "points" },
  order: [["createdAt", "DESC"]],
  limit: 10,
});

// Verify smart contract state
const contract = new ethers.Contract(address, abi, provider);
const userPoints = await contract.getUserPoints(userAddress);
```

## Support

For technical support or questions about the points system:

1. Check the logs in `logs/points.log`
2. Review the audit trail in the database
3. Verify smart contract events
4. Contact the development team

## Future Enhancements

1. **Points Marketplace**: Exchange points for rewards
2. **Gamification**: Achievements and badges
3. **Social Features**: Points sharing and gifting
4. **Advanced Analytics**: Machine learning insights
5. **Mobile App**: Native mobile integration
6. **API Rate Limiting**: Dynamic rate limiting based on tier
