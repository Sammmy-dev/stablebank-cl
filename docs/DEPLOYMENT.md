# StableBank Deployment Guide

## Overview

This guide covers the complete deployment process for the StableBank server, from local development setup to production deployment using Docker and cloud infrastructure.

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **PostgreSQL**: 13.x or higher
- **Redis**: 6.x or higher
- **Docker**: 20.x or higher (for containerized deployment)
- **Git**: Latest version

### Required Accounts & API Keys

- **Polygon RPC**: Alchemy, Infura, or QuickNode
- **Twilio**: Account SID and Auth Token
- **Lithic**: API Key for virtual cards
- **Sumsub**: App Token for KYC
- **CoinGecko**: API Key (optional, for higher rate limits)

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd stablebank-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy example environment file
cp .env.example .env
```

Configure the following environment variables:

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

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-api-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-api-key
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your-api-key

# Third-party Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

LITHIC_API_KEY=your-lithic-api-key
LITHIC_WEBHOOK_SECRET=your-lithic-webhook-secret

SUMSUB_APP_TOKEN=your-sumsub-token
SUMSUB_SECRET_KEY=your-sumsub-secret

SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@stablebank.com

# Application Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log

# Blockchain Configuration
PRIVATE_KEY=your-deployment-private-key
CONTRACT_OWNER_ADDRESS=0x1234567890abcdef...
```

### 4. Database Setup

#### Install PostgreSQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**

```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE stablebank;
CREATE USER stablebank_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stablebank TO stablebank_user;
\q
```

#### Run Migrations

```bash
# Run database migrations
npx sequelize-cli db:migrate

# Seed database with initial data
npx sequelize-cli db:seed:all
```

### 5. Redis Setup

#### Install Redis

**Ubuntu/Debian:**

```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

**macOS:**

```bash
brew install redis
brew services start redis
```

**Windows:**
Download and install from [Redis official website](https://redis.io/download)

### 6. Smart Contract Deployment

#### Deploy to Polygon Amoy Testnet

```bash
# Compile contracts
npm run compile

# Deploy to Polygon Amoy
npm run deploy:polygon-amoy
```

The deployment will create a `deployment-info-polygon.json` file with contract details.

### 7. Start Development Server

```bash
# Start the server
npm run server

# Or use nodemon for development
npx nodemon src/server.js
```

The server will be available at `http://localhost:3000`

## Docker Deployment

### 1. Docker Configuration

The project includes a `Dockerfile` and `docker-compose.yaml` for containerized deployment.

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "run", "server"]
```

#### Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://stablebank_user:password@postgres:5432/stablebank
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=stablebank
      - POSTGRES_USER=stablebank_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. Build and Run with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```
