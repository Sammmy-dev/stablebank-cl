# Render Deployment Guide

## 🚀 Deploy to Render (Node.js)

### 1. Create a New Web Service

- Go to [Render Dashboard](https://dashboard.render.com)
- Click "New +" → "Web Service"
- Connect your GitHub repository

### 2. Configure Build Settings

- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### 3. Environment Variables

Set these in your Render service settings:

#### Required:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

#### API Keys:

```bash
LITHIC_API_KEY=your-lithic-api-key
LITHIC_ENV=sandbox
MAILERSEND_API_KEY=your-mailersend-key
MAILERSEND_FROM_EMAIL=your-email@domain.com
MAILERSEND_FROM_NAME=StableBank
```

#### Optional (with fallbacks):

```bash
REDIS_URL=your-redis-url
SENDGRID_API_KEY=your-sendgrid-key
SUMSUB_APP_TOKEN=your-sumsub-token
SUMSUB_SECRET_KEY=your-sumsub-secret
POLYGON_MUMBAI_RPC_URL=your-rpc-url
USDC_CONTRACT_ADDRESS=your-contract-address
FRONTEND_URL=https://your-frontend-domain.com
API_URL=https://your-api-domain.com
```

### 4. Database Setup

- Create a PostgreSQL database on Render
- Copy the External Database URL
- Set it as `DATABASE_URL` environment variable

### 5. Deploy

- Click "Create Web Service"
- Render will automatically build and deploy your app
- Migrations will run automatically during deployment

## 📋 Deployment Process

1. `npm install` - Install dependencies
2. `npm run migrate` - Run database migrations
3. `npm start` - Start the server

## 🔧 Troubleshooting

- Check logs in Render dashboard for any errors
- Ensure all environment variables are set
- Verify database connection is working
- Check that migrations completed successfully
