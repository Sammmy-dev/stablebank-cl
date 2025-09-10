## StableBank Server API

Base URL: `/api/v1`

Notes:

- Auth means Bearer token in `Authorization: Bearer <access_token>` unless otherwise stated.
- Admin means auth + `role: admin`.
- Timestamps are ISO-8601.

### Auth (`/auth`)

POST `/register`

- Request:

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd"
}
```

- Response:

```json
{
  "user": { "id": 123, "email": "user@example.com"},
  "accessToken": "<jwt>",
  "refreshToken": "<refresh_jwt>"
}
```

POST `/login`

- Request:

```json
{ "email": "user@example.com", "password": "StrongP@ssw0rd" }
```

- Response:

```json
{ "accessToken": "<jwt>", "refreshToken": "<refresh_jwt>" }
```

POST `/refresh`

- Request:

```json
{ "refreshToken": "<refresh_jwt>" }
```

- Response:

```json
{ "accessToken": "<jwt>", "refreshToken": "<refresh_jwt>" }
```

POST `/logout`

- Request:

```json
{ "refreshToken": "<refresh_jwt>" }
```

- Response:

```json
{ "message": "Logged out" }
```

POST `/logout-all` (auth)

- Request: none
- Response:

```json
{ "message": "All sessions revoked" }
```

GET `/sessions` (auth)

- Response:

```json
{
  "sessions": [
    {
      "id": "abcd",
      "userAgent": "Chrome",
      "ip": "1.2.3.4",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

DELETE `/sessions/:refreshTokenId` (auth)

- Response:

```json
{ "message": "Session revoked" }
```

### Bank Tag (`/bank-tag`)

GET `/check`

- Query: `?bankTag=jane`
- Response:

```json
{ "available": true }
```

POST `/` (auth)

- Request:

```json
{ "bankTag": "jane", "displayName": "Jane D." }
```

- Response:

```json
{ "id": 42, "bankTag": "jane", "displayName": "Jane D.", "ownerUserId": 123 }
```

GET `/resolve`

- Query: `?bankTag=jane`
- Response:

```json
{ "bankTag": "jane", "address": "0xabc...", "metadata": {} }
```

GET `/resolve-address`

- Query: `?address=0xabc...`
- Response:

```json
{ "address": "0xabc...", "bankTag": "jane" }
```

GET `/search`

- Query: `?q=j`
- Response:

```json
{ "results": [{ "bankTag": "jane", "displayName": "Jane D." }] }
```

### Cards (`/cards`)

POST `/` (auth)

- Request:

```json
{
  "currency": "USD",
  "spendLimit": 500,
  "merchantLocks": ["ONLINE"],
  "metadata": { "label": "Travel" }
}
```

- Response:

```json
{ "cardId": 1001, "last4": "4242", "status": "active" }
```

POST `/:cardId/freeze` (auth)

- Request:

```json
{ "reason": "suspicious_activity" }
```

- Response:

```json
{ "cardId": 1001, "status": "frozen" }
```

DELETE `/:cardId` (auth)

- Response:

```json
{ "cardId": 1001, "status": "terminated" }
```

GET `/:cardId/transactions` (auth)

- Query: `?from=2024-01-01&to=2024-12-31&limit=50`
- Response:

```json
{
  "transactions": [
    {
      "id": "txn_1",
      "amount": 23.45,
      "currency": "USD",
      "merchant": "Store",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

GET `/` (auth)

- Response:

```json
{ "cards": [{ "cardId": 1001, "last4": "4242", "status": "active" }] }
```

PUT `/:cardId/limits` (auth)

- Request:

```json
{ "dailyLimit": 200, "monthlyLimit": 2000 }
```

- Response:

```json
{ "cardId": 1001, "limits": { "dailyLimit": 200, "monthlyLimit": 2000 } }
```

GET `/fraud-assessment` (auth)

- Response:

```json
{ "riskScore": 7, "riskLevel": "medium" }
```

### Admin (`/admin`) — admin only

GET `/fraud/alerts`

- Response:

```json
{
  "alerts": [
    { "id": "al_1", "severity": "high", "message": "Multiple failed attempts" }
  ]
}
```

GET `/fraud/stats`

- Response:

```json
{ "stats": { "alerts": 10, "high": 2, "medium": 5, "low": 3 } }
```

GET `/fraud/watchlist`

- Response:

```json
{
  "watchlist": [
    { "userId": 123, "reason": "chargeback", "until": "2024-12-31T00:00:00Z" }
  ]
}
```

POST `/fraud/watchlist`

- Request:

```json
{ "userId": 123, "reason": "chargeback", "duration": 30 }
```

- Response:

```json
{ "userId": 123, "reason": "chargeback", "until": "2024-02-01T00:00:00Z" }
```

DELETE `/fraud/watchlist/:userId`

- Response:

```json
{ "removed": true }
```

POST `/fraud/review-card`

- Request:

```json
{ "cardId": 1001, "action": "approve", "reason": "manual review" }
```

- Response:

```json
{ "cardId": 1001, "decision": "approve" }
```

GET `/fraud/user/:userId`

- Response:

```json
{ "userId": 123, "riskScore": 5, "flags": ["velocity"] }
```

### Points (`/points`)

GET `/config`

- Response:

```json
{ "tiers": [{ "name": "Bronze", "threshold": 0 }], "rules": [] }
```

GET `/summary` (auth)

- Response:

```json
{ "total": 1200, "lifetime": 1500, "tier": "Silver" }
```

GET `/tier` (auth)

- Response:

```json
{ "tier": { "name": "Silver", "progress": 0.6 } }
```

GET `/history` (auth)

- Response:

```json
{
  "items": [
    {
      "id": "pt_1",
      "points": 50,
      "type": "trade",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

GET `/leaderboard` (auth)

- Response:

```json
{ "leaders": [{ "userId": 1, "points": 2000, "rank": 1 }] }
```

POST `/daily-login` (auth)

- Response:

```json
{ "awarded": 10, "total": 1210 }
```

POST `/award` (admin)

- Request:

```json
{ "userId": 123, "points": 50, "reason": "campaign" }
```

- Response:

```json
{ "userId": 123, "newTotal": 1250 }
```

GET `/analytics` (admin)

- Response:

```json
{ "activeUsers": 120, "awardedToday": 5000 }
```

### Referral (`/referral`)

GET `/validate`

- Query: `?code=ABC123`
- Response:

```json
{ "valid": true, "referrer": { "id": 1, "bankTag": "jane" } }
```

GET `/rewards`

- Response:

```json
{ "rewards": [{ "type": "signup", "points": 100 }] }
```

GET `/leaderboard`

- Response:

```json
{ "leaders": [{ "userId": 1, "count": 20 }] }
```

POST `/create` (auth)

- Response:

```json
{ "code": "ABC123", "url": "https://app/ref/ABC123" }
```

GET `/stats` (auth)

- Response:

```json
{ "invited": 10, "converted": 3 }
```

GET `/tree` (auth)

- Response:

```json
{ "tree": [{ "userId": 1, "children": [] }] }
```

GET `/analytics` (auth)

- Response:

```json
{ "clicks": 120, "signups": 15 }
```

GET `/link` (auth)

- Response:

```json
{ "code": "ABC123", "url": "https://app/ref/ABC123" }
```

GET `/activity` (auth)

- Response:

```json
{ "items": [{ "type": "join", "userId": 5, "at": "2024-01-01T00:00:00Z" }] }
```

GET `/search` (auth)

- Query: `?q=jane`
- Response:

```json
{ "results": [{ "userId": 1, "bankTag": "jane" }] }
```

GET `/performance` (auth)

- Response:

```json
{ "conversionRate": 0.25, "avgTimeToConvertDays": 3 }
```

### QR (`/qr`)

GET `/referral/:bankTag`

- Example: `/referral/jane`
- Response:

```json
{ "pngDataUri": "data:image/png;base64,..." }
```

GET `/wallet/:address`

- Example: `/wallet/0xabc...`
- Response:

```json
{ "pngDataUri": "data:image/png;base64,..." }
```

GET `/wallet/:address/:chainId`

- Example: `/wallet/0xabc.../80002`
- Response:

```json
{ "pngDataUri": "data:image/png;base64,..." }
```

POST `/generate`

- Request:

```json
{ "text": "hello world", "size": 256 }
```

- Response:

```json
{ "pngDataUri": "data:image/png;base64,..." }
```
