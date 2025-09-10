# Fraud Detection System Documentation

## Overview

The StableBank fraud detection system provides comprehensive risk assessment for virtual card issuance and management. It uses multiple risk factors to calculate a risk score and determine appropriate actions for card creation and management.

## Risk Factors

### 1. KYC Status (Weight: 25%)

- **Approved KYC**: 0 points
- **Pending KYC**: 50 points
- **No KYC**: 100 points
- **Verification completeness**: Additional points for missing email/phone/2FA verification

### 2. Account Age (Weight: 15%)

- **< 1 day**: 100 points
- **1-7 days**: 75 points
- **7-30 days**: 50 points
- **30-90 days**: 25 points
- **> 90 days**: 0 points

### 3. Login Patterns (Weight: 20%)

- **Failed logins > 3 in 24h**: +50 points
- **Rapid successive logins**: +30 points
- **Multiple IP addresses**: +20 points

### 4. Device Fingerprint (Weight: 15%)

- **Suspicious user agents**: +50 points
- **New device fingerprint**: +30 points
- **VPN/Tor detection**: +40 points

### 5. Location Risk (Weight: 10%)

- **High-risk countries**: +60 points
- **Country mismatch**: +40 points
- **Rapid location changes**: +30 points

### 6. Behavioral Patterns (Weight: 10%)

- **Unusual activity hours**: +20 points
- **Rapid successive actions**: +30 points

### 7. Card History (Weight: 5%)

- **Recently terminated cards**: +40 points
- **Too many cards**: +30 points

## Risk Levels

- **LOW** (0-30): Card issuance approved with standard limits
- **MEDIUM** (31-60): Card issuance approved with reduced limits
- **HIGH** (61-80): Card issuance requires manual review
- **CRITICAL** (81-100): Card issuance denied

## API Endpoints

### User Endpoints

#### Create Virtual Card

```http
POST /api/v1/cards
Authorization: Bearer <token>
Content-Type: application/json

{
  "spendingLimit": 1000,
  "monthlyLimit": 5000,
  "currency": "USD",
  "isInternational": false
}

Headers:
x-device-fingerprint: <device_hash>
x-location: {"country": "US", "city": "New York"}
x-request-id: <uuid>
```

**Response:**

```json
{
  "success": true,
  "card": {
    "id": 1,
    "cardId": "lithic_token",
    "lastFour": "1234",
    "status": "active",
    "spendingLimit": 1000,
    "monthlyLimit": 5000
  },
  "fraudCheck": {
    "riskLevel": "LOW",
    "requiresReview": false,
    "message": "Card issuance approved - low risk detected"
  }
}
```

#### Get User Cards

```http
GET /api/v1/cards
Authorization: Bearer <token>
```

#### Update Card Limits

```http
PUT /api/v1/cards/:cardId/limits
Authorization: Bearer <token>
Content-Type: application/json

{
  "spendingLimit": 2000,
  "monthlyLimit": 10000
}
```

#### Get Fraud Risk Assessment

```http
GET /api/v1/cards/fraud-assessment
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Fraud Alerts

```http
GET /api/v1/admin/fraud/alerts?page=1&limit=20&severity=high
Authorization: Bearer <admin_token>
```

#### Get Fraud Statistics

```http
GET /api/v1/admin/fraud/stats?period=7d
Authorization: Bearer <admin_token>
```

#### Add User to Watchlist

```http
POST /api/v1/admin/fraud/watchlist
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 123,
  "reason": "Suspicious activity detected",
  "duration": 30
}
```

#### Remove User from Watchlist

```http
DELETE /api/v1/admin/fraud/watchlist/:userId
Authorization: Bearer <admin_token>
```

#### Review Card Issuance

```http
POST /api/v1/admin/fraud/review-card
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "cardId": 456,
  "action": "approve",
  "reason": "Manual review completed"
}
```

#### Get User Fraud Report

```http
GET /api/v1/admin/fraud/user/:userId
Authorization: Bearer <admin_token>
```

## Environment Variables

```bash
# Lithic Configuration
LITHIC_API_KEY=your_lithic_api_key
LITHIC_ENV=sandbox  # or production

# Redis Configuration (for watchlist)
REDIS_URL=redis://localhost:6379

# Fraud Detection Settings
FRAUD_CHECK_ENABLED=true
FRAUD_WATCHLIST_TTL=2592000  # 30 days in seconds
```

## Implementation Details

### Fraud Detection Flow

1. **Request Validation**: Validate input data and headers
2. **User Authentication**: Verify user identity and permissions
3. **Risk Assessment**: Calculate risk score using multiple factors
4. **Watchlist Check**: Verify if user is on fraud watchlist
5. **Decision Making**: Determine card issuance based on risk level
6. **Card Creation**: Create card with appropriate limits
7. **Audit Logging**: Log all actions for monitoring

### Risk Score Calculation

```javascript
const totalScore = riskFactors.reduce((sum, factor) => {
  return sum + factor.score * RISK_WEIGHTS[factor.type];
}, 0);

const normalizedScore = Math.min(100, totalScore / 100);
```

### Card Limits by Risk Level

- **LOW**: $1,000 daily, $5,000 monthly
- **MEDIUM**: $500 daily, $2,000 monthly
- **HIGH**: $100 daily, $500 monthly (requires review)
- **CRITICAL**: Card issuance denied

## Monitoring and Alerts

### Audit Log Events

- `fraud_check_card_issuance`: Risk assessment performed
- `virtual_card_created`: Card successfully created
- `card_limits_updated`: Card limits modified
- `user_added_to_watchlist`: User added to fraud watchlist
- `user_removed_from_watchlist`: User removed from watchlist
- `card_issuance_reviewed`: Manual review completed

### Severity Levels

- **LOW**: Normal operations
- **MEDIUM**: Moderate risk detected
- **HIGH**: High risk, requires attention
- **CRITICAL**: Immediate action required

## Best Practices

### Frontend Integration

1. **Device Fingerprinting**: Implement client-side device fingerprinting
2. **Location Data**: Collect and send location information
3. **Request IDs**: Include unique request IDs for tracking
4. **Error Handling**: Handle different risk levels appropriately

### Security Considerations

1. **Rate Limiting**: Implement rate limiting on fraud check endpoints
2. **Input Validation**: Validate all input data
3. **Audit Logging**: Log all fraud-related activities
4. **Access Control**: Restrict admin endpoints to authorized users

### Performance Optimization

1. **Caching**: Cache fraud check results for short periods
2. **Async Processing**: Use async/await for database operations
3. **Connection Pooling**: Optimize database connections
4. **Redis Usage**: Use Redis for watchlist and caching

## Troubleshooting

### Common Issues

1. **High False Positives**: Adjust risk weights and thresholds
2. **Performance Issues**: Optimize database queries and add caching
3. **Missing Data**: Ensure all required headers are sent
4. **Redis Connection**: Verify Redis connectivity for watchlist

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=fraud-detection:*
```

## Future Enhancements

1. **Machine Learning**: Implement ML-based risk scoring
2. **Real-time Monitoring**: Add real-time fraud detection
3. **Integration**: Integrate with external fraud detection services
4. **Analytics**: Add fraud analytics and reporting
5. **Automation**: Implement automated fraud response actions
