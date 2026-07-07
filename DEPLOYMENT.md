# Deployment Guide

## Architecture Overview

This system has three services:
1. **Client** (React + Vite) - Port 3000
2. **Server** (Express API Gateway) - Port 5000
3. **Python OCR Service** (FastAPI) - Port 8000
4. **MongoDB** - Port 27017

## Option 1: Docker Compose (Recommended)

```bash
# Clone
git clone <repo>
cd ocr-card-manager

# Configure environment
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
cp ocr-service/.env.example ocr-service/.env

# Edit .env files with your API keys
# For GPU: ensure nvidia-docker runtime is available

# Start all services
docker-compose up -d --build

# Services available at:
# - Frontend: http://localhost:3000
# - API Gateway: http://localhost:5000
# - OCR Service: http://localhost:8000
# - MongoDB: localhost:27017
```

## Option 2: Kubernetes / Cloud Deploy

### Python OCR Service (GPU Required for Qwen2.5-VL)

**vLLM Server (GPU Host):**
```yaml
# k8s/vllm-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-qwen
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vllm-qwen
  template:
    metadata:
      labels:
        app: vllm-qwen
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        command:
        - python
        - -m
        - vllm.entrypoints.openai.api_server
        - --model
        - Qwen/Qwen2.5-VL-7B-Instruct
        - --max-model-len
        - "8192"
        - --limit-mm-per-prompt
        - "image=5"
        - --tensor-parallel-size
        - "1"
        ports:
        - containerPort: 8000
        resources:
          limits:
            nvidia.com/gpu: 1
        volumeMounts:
        - name: hf-cache
          mountPath: /root/.cache/huggingface
      volumes:
      - name: hf-cache
        persistentVolumeClaim:
          claimName: hf-cache-pvc
```

**OCR Service (CPU or GPU):**
```bash
# Set VLLM_BASE_URL=http://vllm-qwen:8000/v1 in ocr-service/.env
# Build and deploy ocr-service Docker image
```

### Server (API Gateway)
```bash
# Build server Docker image
# Deploy with MONGODB_URI pointing to MongoDB Atlas or managed instance
# Set PYTHON_SERVICE_URL to OCR service endpoint
```

### Client
```bash
# Build client Docker image
# Set VITE_API_URL to server endpoint
# Deploy behind nginx or CDN
```

## Option 3: Managed Services

### MongoDB
- **MongoDB Atlas** (recommended): Create cluster, get connection string
- **Azure Cosmos DB** (MongoDB API)
- **AWS DocumentDB**

### GPU Compute for vLLM
- **RunPod**: GPU instances with vLLM template
-ready templates
- **Lambda Labs**: A100/H100 instances
- **AWS/GCP/Azure**: GPU VMs with NVIDIA drivers

### Container Hosting
- **Railway/Render/Fly.io**: Simple container deploy
- **AWS ECS/Fargate**, **GCP Cloud Run**, **Azure Container Apps**
- **Kubernetes**: EKS/GKE/AKS with GPU node pools

## Environment Variables Summary

| Service | Required | Optional |
|---------|----------|----------|
| Server | MONGODB_URI, PYTHON_SERVICE_URL | PORT, NODE_ENV, CLIENT_URL |
| Client | VITE_API_URL | - |
| OCR Service | - | VLLM_BASE_URL, ANTHROPIC_API_KEY, GRADER_API_KEY, OCR_BACKEND, DEVICE |

## CORS Configuration

For production, restrict CORS in `server/src/index.js`:

```js
app.use(cors({ 
  origin: ['https://your-frontend-domain.com'],
  credentials: true 
}));
```

## Health Checks

All services expose `/health`:
- Server: `GET /api/health`
- OCR Service: `GET /health`

## Monitoring

Add to docker-compose.yml:
```yaml
services:
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]
```

## SSL/HTTPS

Use reverse proxy (nginx/Traefik) in front of all services with Let's Encrypt certificates.

## Backup

MongoDB: Use Atlas backups or `mongodump` cron job.