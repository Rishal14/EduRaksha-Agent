# EduRaksha Backend Deployment Guide

This guide covers deploying the EduRaksha backend service in various environments.

## 🚀 Quick Deployment Options

### 1. Local Development
```bash
cd backend
npm install
npm run dev
```

### 2. Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t eduraksha-backend .
docker run -p 3001:3001 eduraksha-backend
```

### 3. Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
heroku create eduraksha-backend
heroku config:set NODE_ENV=production
heroku config:set ETHEREUM_RPC_URL=your_rpc_url
heroku config:set PRIVATE_KEY=your_private_key
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
railway login
railway init
railway up
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Select the backend directory
3. Configure environment variables
4. Deploy

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint | `https://sepolia.infura.io/v3/...` |
| `PRIVATE_KEY` | Ethereum private key | `0x1234...` |
| `ISSUER_PRIVATE_KEY` | Issuer private key | `0x5678...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | CORS allowed origin | `*` |
| `LOG_LEVEL` | Logging level | `info` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🐳 Docker Deployment

### Single Container
```bash
# Build image
docker build -t eduraksha-backend .

# Run container
docker run -d \
  --name eduraksha-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e ETHEREUM_RPC_URL=your_rpc_url \
  -e PRIVATE_KEY=your_private_key \
  -e ISSUER_PRIVATE_KEY=your_issuer_key \
  eduraksha-backend
```

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f eduraksha-backend

# Stop services
docker-compose down
```

### Docker Compose with External Services
```yaml
version: '3.8'

services:
  eduraksha-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - redis
      - postgres
    networks:
      - eduraksha-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - eduraksha-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: eduraksha
      POSTGRES_USER: eduraksha
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - eduraksha-network

volumes:
  redis_data:
  postgres_data:

networks:
  eduraksha-network:
    driver: bridge
```

## ☁️ Cloud Platform Deployment

### AWS ECS (Elastic Container Service)

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name eduraksha-backend
```

2. **Build and Push Image**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker build -t eduraksha-backend .
docker tag eduraksha-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/eduraksha-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/eduraksha-backend:latest
```

3. **Create ECS Task Definition**
```json
{
  "family": "eduraksha-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::your-account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "eduraksha-backend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/eduraksha-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "PRIVATE_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:your-account:secret:eduraksha/private-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/eduraksha-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

1. **Build and Deploy**
```bash
# Build image
gcloud builds submit --tag gcr.io/your-project/eduraksha-backend

# Deploy to Cloud Run
gcloud run deploy eduraksha-backend \
  --image gcr.io/your-project/eduraksha-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets PRIVATE_KEY=private-key:latest
```

### Azure Container Instances

```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group your-rg \
  --name eduraksha-backend \
  --image your-registry.azurecr.io/eduraksha-backend:latest \
  --dns-name-label eduraksha-backend \
  --ports 3001 \
  --environment-variables NODE_ENV=production \
  --secrets PRIVATE_KEY=your-private-key
```

## 🔒 Security Considerations

### Environment Variables
- Store sensitive data in environment variables
- Use secrets management services (AWS Secrets Manager, Azure Key Vault, etc.)
- Never commit private keys to version control

### Network Security
- Use HTTPS in production
- Configure CORS properly
- Implement rate limiting
- Use firewalls and security groups

### Container Security
- Run containers as non-root user
- Use minimal base images
- Scan images for vulnerabilities
- Keep dependencies updated

## 📊 Monitoring and Logging

### Health Checks
```bash
# Check service health
curl http://localhost:3001/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Logging
```bash
# View application logs
docker logs eduraksha-backend

# Follow logs in real-time
docker logs -f eduraksha-backend
```

### Metrics
- Request count and response times
- Error rates and types
- ZKP generation success rates
- VC issuance statistics

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        run: |
          docker build -t eduraksha-backend .
          docker tag eduraksha-backend:latest ${{ secrets.REGISTRY }}/eduraksha-backend:latest
          docker push ${{ secrets.REGISTRY }}/eduraksha-backend:latest
      - name: Deploy to production
        run: |
          # Deploy to your platform
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Check what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>
```

2. **Environment Variables Not Set**
```bash
# Check environment variables
echo $NODE_ENV
echo $ETHEREUM_RPC_URL

# Set them if missing
export NODE_ENV=production
export ETHEREUM_RPC_URL=your_rpc_url
```

3. **Docker Build Fails**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t eduraksha-backend .
```

4. **Service Won't Start**
```bash
# Check logs
docker logs eduraksha-backend

# Check container status
docker ps -a

# Restart container
docker restart eduraksha-backend
```

### Performance Optimization

1. **Enable Compression**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Use Redis for Caching**
```javascript
const redis = require('redis');
const client = redis.createClient();
```

3. **Database Connection Pooling**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 📞 Support

For deployment issues:
1. Check the logs: `docker logs eduraksha-backend`
2. Verify environment variables
3. Test the health endpoint
4. Check network connectivity
5. Review security group/firewall settings 