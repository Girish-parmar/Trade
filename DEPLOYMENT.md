# Deployment Guide - TRADEPRO AI

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / macOS / Windows with WSL2
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum

### Software Requirements
- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **MongoDB**: 7.0 or higher
- **Docker**: 20.x or higher (for Docker deployment)
- **Yarn**: 1.22.x or higher

---

## Local Development

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/tradepro-ai.git
cd tradepro-ai
```

2. **Set up Python virtual environment**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name tradepro-mongo mongo:7.0

# Or using local MongoDB
mongod --dbpath /path/to/data
```

6. **Run the backend**
```bash
uvicorn server:app --reload --port 8001
```

Backend should now be running at `http://localhost:8001`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
yarn install
```

3. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start the frontend**
```bash
yarn start
```

Frontend should now be running at `http://localhost:3000`

---

## Docker Deployment

### Using Docker Compose (Recommended for local/staging)

1. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Build and start services**
```bash
docker-compose up -d
```

3. **View logs**
```bash
docker-compose logs -f
```

4. **Stop services**
```bash
docker-compose down
```

5. **Stop and remove volumes**
```bash
docker-compose down -v
```

### Individual Container Deployment

**Backend**
```bash
cd backend
docker build -t tradepro-backend .
docker run -d -p 8001:8001 \
  -e MONGO_URL=mongodb://host.docker.internal:27017 \
  -e DB_NAME=tradepro_db \
  --name tradepro-backend \
  tradepro-backend
```

**Frontend**
```bash
cd frontend
docker build -t tradepro-frontend .
docker run -d -p 3000:80 \
  -e REACT_APP_BACKEND_URL=http://localhost:8001 \
  --name tradepro-frontend \
  tradepro-frontend
```

---

## Production Deployment

### Cloud Platforms

#### AWS Deployment

**Using Elastic Beanstalk**

1. Install EB CLI
```bash
pip install awsebcli
```

2. Initialize EB application
```bash
eb init -p docker tradepro-ai
```

3. Create environment
```bash
eb create production
```

4. Deploy
```bash
eb deploy
```

**Using ECS (Fargate)**

1. Create ECR repositories
```bash
aws ecr create-repository --repository-name tradepro-backend
aws ecr create-repository --repository-name tradepro-frontend
```

2. Build and push images
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t tradepro-backend ./backend
docker tag tradepro-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tradepro-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tradepro-backend:latest

# Build and push frontend
docker build -t tradepro-frontend ./frontend
docker tag tradepro-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tradepro-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tradepro-frontend:latest
```

3. Create ECS task definitions and services using AWS Console or CLI

#### Digital Ocean Deployment

1. Create MongoDB cluster
2. Create two apps (backend and frontend)
3. Configure environment variables
4. Deploy using App Platform

#### Heroku Deployment

**Backend**
```bash
cd backend
heroku create tradepro-backend
heroku addons:create mongolab:sandbox
git push heroku main
```

**Frontend**
```bash
cd frontend
heroku create tradepro-frontend
heroku buildpacks:set mars/create-react-app
git push heroku main
```

### Kubernetes Deployment

1. **Create namespace**
```bash
kubectl create namespace tradepro
```

2. **Deploy MongoDB**
```bash
kubectl apply -f k8s/mongodb.yaml -n tradepro
```

3. **Deploy Backend**
```bash
kubectl apply -f k8s/backend.yaml -n tradepro
```

4. **Deploy Frontend**
```bash
kubectl apply -f k8s/frontend.yaml -n tradepro
```

5. **Verify deployment**
```bash
kubectl get pods -n tradepro
kubectl get services -n tradepro
```

---

## Environment Configuration

### Backend Environment Variables

```bash
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=tradepro_db

# Security
JWT_SECRET=your-super-secret-key-change-in-production

# Admin
ADMIN_EMAIL=admin@tradepro.com
ADMIN_PASSWORD=SecurePassword123!

# CORS
CORS_ORIGINS=https://app.tradepro.ai
FRONTEND_URL=https://app.tradepro.ai

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=INFO
```

### Frontend Environment Variables

```bash
# API
REACT_APP_BACKEND_URL=https://api.tradepro.ai

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true

# Third-party
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

---

## Database Setup

### MongoDB Configuration

1. **Create database and user**
```javascript
use tradepro_db;

db.createUser({
  user: "tradepro_user",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "tradepro_db" }
  ]
});
```

2. **Create indexes**
```javascript
// Users
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

// Strategies
db.strategies.createIndex({ "user_id": 1 });
db.strategies.createIndex({ "status": 1 });

// Orders
db.orders.createIndex({ "user_id": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "created_at": -1 });

// Positions
db.positions.createIndex({ "user_id": 1 });
db.positions.createIndex({ "symbol": 1 });
```

3. **Enable authentication**
```bash
# Edit mongod.conf
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### Database Backup

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/tradepro_db" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/tradepro_db" /backup/20240101
```

---

## Monitoring & Logging

### Application Monitoring

**Using Sentry**
```python
# Backend
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

```javascript
// Frontend
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Health Checks

**Backend Health Endpoint**
```bash
curl http://localhost:8001/health
```

**Database Health**
```bash
mongosh --eval "db.adminCommand('ping')"
```

### Log Management

**Backend Logs**
```bash
# View logs
tail -f /var/log/tradepro/backend.log

# Using Docker
docker logs -f tradepro-backend
```

**Frontend Logs**
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

---

## Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/tradepro"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/tradepro_db" --out=$BACKUP_DIR/$DATE/db

# Backup application files
tar -czf $BACKUP_DIR/$DATE/app.tar.gz /app

# Remove backups older than 30 days
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$DATE"
```

### Schedule Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Verify MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Check environment variables
env | grep MONGO
```

**Frontend build fails**
```bash
# Clear cache
rm -rf node_modules yarn.lock
yarn install

# Check Node version
node --version
```

**Database connection issues**
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/tradepro_db"

# Check if MongoDB is running
sudo systemctl status mongod

# View MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

**CORS errors**
- Verify `CORS_ORIGINS` in backend `.env`
- Check frontend `REACT_APP_BACKEND_URL`
- Ensure cookies are enabled

**Authentication issues**
- Verify `JWT_SECRET` is set
- Check cookie settings (httpOnly, secure, sameSite)
- Clear browser cookies

### Performance Optimization

**Backend**
- Enable database indexes
- Implement caching (Redis)
- Use connection pooling
- Optimize database queries

**Frontend**
- Enable code splitting
- Implement lazy loading
- Optimize images
- Use CDN for static assets
- Enable gzip compression

---

## Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Backup encryption

---

## Support

For deployment support:
- Email: devops@tradepro.ai
- Slack: #tradepro-deployment
- Documentation: https://docs.tradepro.ai/deployment