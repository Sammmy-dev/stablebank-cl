# Referral Tracking System Documentation

## Overview

The Referral Tracking System is a comprehensive solution that uses BankTags to track and manage user referrals. It integrates seamlessly with the existing points system and provides detailed analytics, multi-level tracking, and automated reward distribution.

## Features

- **BankTag-based Referrals**: Users can refer others using their unique BankTag
- **Multi-level Tracking**: Track referral relationships up to 3 levels deep
- **Automated Points**: Automatic point distribution for referral activities
- **Comprehensive Analytics**: Detailed referral statistics and performance metrics
- **QR Code Generation**: Generate QR codes for easy sharing of referral links
- **Leaderboards**: Track top referrers and their performance
- **Milestone Rewards**: Bonus points for reaching referral milestones
- **Activity Tracking**: Monitor referral activities (transactions, staking, investments)

## Architecture

### Components

1. **Referral Service** (`src/services/referralService.js`)

   - Core referral logic and tracking
   - BankTag validation and processing
   - Referral statistics and analytics

2. **Referral Controller** (`src/controllers/referralController.js`)

   - API endpoints for referral operations
   - Request handling and validation

3. **QR Controller** (`src/controllers/qrController.js`)

   - QR code generation for referral links
   - Wallet address QR codes

4. **Integration Points**
   - Auth controller (registration with referral)
   - BankTag controller (automatic referral code generation)
   - Points system (automatic reward distribution)

## Referral Flow

### 1. User Registration with Referral

```javascript
// Registration with referral BankTag
POST /api/v1/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+1234567890",
  "referrerBankTag": "@alice" // Referral BankTag
}
```

### 2. BankTag Setup

```javascript
// Set BankTag (automatically generates referral code)
POST /api/v1/bank-tag
{
  "tag": "@johndoe"
}
```

### 3. Referral Link Generation

```javascript
// Get referral link info
GET / api / v1 / referral / link;
// Returns: referral link, QR code, share text
```

## API Endpoints

### Public Endpoints

#### Validate Referral Link

```http
GET /api/v1/referral/validate?bankTag=@alice
```

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "referrer": {
      "id": 123,
      "bankTag": "@alice",
      "name": "Alice Smith"
    }
  }
}
```

#### Get Referral Rewards

```http
GET /api/v1/referral/rewards
```

**Response:**

```json
{
  "success": true,
  "data": {
    "signup": {
      "points": 1000,
      "description": "Points awarded when someone signs up using your referral"
    },
    "firstTransaction": {
      "points": 500,
      "description": "Points awarded when your referral makes their first transaction"
    },
    "staking": {
      "points": 200,
      "description": "Points awarded when your referral stakes tokens"
    },
    "investment": {
      "points": 300,
      "description": "Points awarded when your referral makes an investment"
    },
    "milestones": {
      "5": { "points": 1000, "description": "Bonus for reaching 5 referrals" },
      "10": {
        "points": 2500,
        "description": "Bonus for reaching 10 referrals"
      },
      "25": {
        "points": 5000,
        "description": "Bonus for reaching 25 referrals"
      },
      "50": {
        "points": 10000,
        "description": "Bonus for reaching 50 referrals"
      },
      "100": {
        "points": 25000,
        "description": "Bonus for reaching 100 referrals"
      }
    }
  }
}
```

#### Get Referral Leaderboard

```http
GET /api/v1/referral/leaderboard?limit=50
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": 123,
      "bankTag": "@alice",
      "name": "Alice Smith",
      "referralCount": 45
    }
  ]
}
```

### User Endpoints (Authentication Required)

#### Create Referral

```http
POST /api/v1/referral/create
Authorization: Bearer <token>
{
  "referrerBankTag": "@alice"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Referral created successfully",
  "data": {
    "referrer": {
      "id": 123,
      "bankTag": "@alice",
      "name": "Alice Smith"
    },
    "newUser": {
      "id": 456,
      "bankTag": "@john",
      "name": "John Doe",
      "referralCode": "JOHN_ABC123_DEF456"
    }
  }
}
```

#### Get Referral Statistics

```http
GET /api/v1/referral/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "bankTag": "@alice",
      "referralCode": "ALICE_XYZ789_ABC123"
    },
    "stats": {
      "totalReferrals": 25,
      "activeReferrals": 20,
      "totalStakingValue": 50000,
      "totalTransactionValue": 15000,
      "totalInvestmentValue": 25000,
      "totalValue": 90000
    },
    "milestones": {
      "current": "referrals_25",
      "next": "referrals_50",
      "progress": {
        "current": 25,
        "target": 50,
        "percentage": 50
      }
    },
    "referrals": [...],
    "recentActivity": [...]
  }
}
```

#### Get Referral Tree

```http
GET /api/v1/referral/tree?maxDepth=3
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "bankTag": "@alice",
      "name": "Alice Smith"
    },
    "tree": [
      {
        "id": 456,
        "bankTag": "@john",
        "firstName": "John",
        "lastName": "Doe",
        "level": 1,
        "children": [...]
      }
    ]
  }
}
```

#### Get Referral Analytics

```http
GET /api/v1/referral/analytics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "bankTag": "@alice"
    },
    "overview": {
      "totalReferrals": 25,
      "activeReferrals": 20,
      "conversionRate": 80.0
    },
    "signupsOverTime": [
      {
        "date": "2024-01-15",
        "count": 3
      }
    ],
    "referralActivity": [
      {
        "action": "transaction_completed",
        "count": 15
      }
    ],
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }
}
```

#### Get Referral Link Info

```http
GET /api/v1/referral/link
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bankTag": "@alice",
    "referralCode": "ALICE_XYZ789_ABC123",
    "referralLink": "https://app.stablebank.com/signup?ref=@alice",
    "shareText": "Join me on StableBank! Use my referral link: https://app.stablebank.com/signup?ref=@alice",
    "qrCode": "https://api.stablebank.com/qr/referral/@alice"
  }
}
```

#### Get Recent Referral Activity

```http
GET /api/v1/referral/activity?limit=20
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": 456,
        "bankTag": "@john",
        "firstName": "John",
        "lastName": "Doe"
      }
    ],
    "totalReferrals": 25
  }
}
```

#### Search Referrers

```http
GET /api/v1/referral/search?q=@al
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 123,
        "bankTag": "@alice",
        "firstName": "Alice",
        "lastName": "Smith"
      }
    ],
    "total": 1
  }
}
```

#### Get Referral Performance

```http
GET /api/v1/referral/performance?period=30d
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z",
    "totalReferrals": 25,
    "activeReferrals": 20,
    "conversionRate": 80.0,
    "averageReferralsPerDay": 0.83,
    "signupsOverTime": [...],
    "activityBreakdown": [...]
  }
}
```

## QR Code Endpoints

### Generate Referral QR Code

```http
GET /api/v1/qr/referral/@alice
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bankTag": "@alice",
    "referralLink": "https://app.stablebank.com/signup?ref=@alice",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "referrer": {
      "id": 123,
      "bankTag": "@alice",
      "name": "Alice Smith"
    }
  }
}
```

### Generate Wallet QR Code

```http
GET /api/v1/qr/wallet/0x1234567890abcdef/80001
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef",
    "chainId": 80001,
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

### Generate Custom QR Code

```http
POST /api/v1/qr/generate
{
  "url": "https://example.com",
  "size": 300,
  "color": "#000000"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "size": 300
  }
}
```

## Referral Rewards System

### Point Distribution

| Activity          | Points | Description                                      |
| ----------------- | ------ | ------------------------------------------------ |
| Signup            | 1,000  | When someone signs up using your referral        |
| First Transaction | 500    | When your referral makes their first transaction |
| Staking           | 200    | When your referral stakes tokens                 |
| Investment        | 300    | When your referral makes an investment           |

### Milestone Rewards

| Milestone | Referrals | Points | Description                      |
| --------- | --------- | ------ | -------------------------------- |
| Bronze    | 5         | 1,000  | Bonus for reaching 5 referrals   |
| Silver    | 10        | 2,500  | Bonus for reaching 10 referrals  |
| Gold      | 25        | 5,000  | Bonus for reaching 25 referrals  |
| Platinum  | 50        | 10,000 | Bonus for reaching 50 referrals  |
| Diamond   | 100       | 25,000 | Bonus for reaching 100 referrals |

## Integration Examples

### Frontend Integration

```javascript
// Registration with referral
const registerWithReferral = async (userData, referrerBankTag) => {
  const response = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...userData,
      referrerBankTag,
    }),
  });
  return response.json();
};

// Get referral stats
const getReferralStats = async (token) => {
  const response = await fetch("/api/v1/referral/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Generate referral QR code
const generateReferralQR = async (bankTag) => {
  const response = await fetch(`/api/v1/qr/referral/${bankTag}`);
  return response.json();
};
```

### Mobile App Integration

```javascript
// Share referral link
const shareReferralLink = async (bankTag) => {
  const qrResponse = await generateReferralQR(bankTag);
  const { referralLink, qrCode } = qrResponse.data;

  // Share via native sharing
  if (navigator.share) {
    await navigator.share({
      title: "Join me on StableBank!",
      text: `Use my referral link: ${referralLink}`,
      url: referralLink,
    });
  }
};
```

## Database Schema

### User Table Additions

```sql
-- Existing fields
ALTER TABLE user ADD COLUMN referralCode VARCHAR(255);
ALTER TABLE user ADD COLUMN referredBy INTEGER REFERENCES user(id);
```

### Audit Log Table

```sql
-- Tracks all referral activities
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES user(id),
  action VARCHAR(255) NOT NULL,
  details JSONB,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

1. **BankTag Validation**: All BankTags are validated for format and existence
2. **Self-Referral Prevention**: Users cannot refer themselves
3. **Duplicate Referral Prevention**: Users can only have one referrer
4. **Rate Limiting**: All referral endpoints are rate-limited
5. **Audit Logging**: All referral activities are logged for security
6. **Input Sanitization**: All inputs are validated and sanitized

## Performance Optimization

1. **Database Indexing**: Proper indexes on referral-related fields
2. **Caching**: Redis caching for frequently accessed referral data
3. **Batch Processing**: Efficient bulk operations for analytics
4. **Pagination**: All list endpoints support pagination
5. **Async Processing**: Non-blocking referral operations

## Monitoring and Analytics

### Key Metrics

- Total referrals per user
- Referral conversion rates
- Referral activity over time
- Top performing referrers
- Referral value generation

### Alerts

- Unusual referral patterns
- Referral fraud detection
- System performance issues
- High-value referral activities

## Troubleshooting

### Common Issues

1. **Referral not created**: Check BankTag format and existence
2. **Points not awarded**: Verify referral relationship and activity
3. **QR code not generated**: Check BankTag validation
4. **Analytics not loading**: Verify date ranges and permissions

### Debug Commands

```javascript
// Check referral relationship
const user = await User.findByPk(userId);
console.log("Referrer:", user.referredBy);
console.log("Referral Code:", user.referralCode);

// Check referral stats
const stats = await referralService.getReferralStats(userId);
console.log("Referral Stats:", stats);

// Validate BankTag
const validation = await referralService.validateReferralLink("@alice");
console.log("Validation:", validation);
```

## Future Enhancements

1. **Multi-level Rewards**: Rewards for 2nd and 3rd level referrals
2. **Referral Campaigns**: Time-limited referral promotions
3. **Social Integration**: Share referrals on social media
4. **Advanced Analytics**: Machine learning insights
5. **Referral Marketplace**: Exchange referral opportunities
6. **Mobile Push Notifications**: Real-time referral alerts

## Support

For technical support or questions about the referral system:

1. Check the logs in `logs/referral.log`
2. Review the audit trail in the database
3. Verify BankTag validation
4. Contact the development team

## API Rate Limits

- **Public endpoints**: 100 requests per minute
- **User endpoints**: 1000 requests per minute
- **Admin endpoints**: 5000 requests per minute

## Environment Variables

```env
FRONTEND_URL=https://app.stablebank.com
API_URL=https://api.stablebank.com
REDIS_URL=redis://localhost:6379
```

## Dependencies

```json
{
  "qrcode": "^1.5.3",
  "sequelize": "^6.37.7",
  "redis": "^4.7.1"
}
```
