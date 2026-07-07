# Answer Paper Correction System

A full-stack OCR-based handwritten answer paper correction system with automated grading.

## Features

- **PDF/Image Upload** – Drag-and-drop scanned exam scripts (PDF, PNG, JPEG, WebP)
- **Handwriting OCR** – Multiple backends: Qwen2.5-VL (VLM), TrOCR, PaddleOCR, Tesseract
- **Question/Answer Segmentation** – Automatic detection of question boundaries
- **LLM-Based Grading** – Compare answers against rubric/model answer using Anthropic, OpenAI, or local LLM
- **Deterministic Fallback** – Rubric keyword grader works offline (CI, fresh clone)
- **Detailed Feedback** – Per-question marks, matched/missing criteria, confidence scores
- **Evaluation History** – MongoDB storage with query API
- **GPU Optimized** – vLLM for batched inference on A100/H100

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Client    │────▶│   Server    │────▶│  Python OCR     │
│  (React)    │     │  (Express)  │     │  (FastAPI)      │
└─────────────┘     └─────────────┘     └────────┬────────┘
       ▲                                        │
       │                                        ▼
       │                              ┌─────────────────┐
       │                              │  Grading LLM    │
       └──────────────────────────────│  (Anthropic/    │
                                      │   OpenAI/vLLM)  │
                                      └─────────────────┘
```

## Tech Stack

- **Frontend:** React 18, Vite, Material-UI, Axios, React Router
- **API Gateway:** Node.js, Express, Multer, Mongoose
- **OCR/Grading Service:** Python, FastAPI, PyTorch, Transformers, vLLM
- **Database:** MongoDB
- **OCR Backends:** Qwen2.5-VL (recommended), TrOCR, PaddleOCR, Tesseract
- **Grading:** Anthropic API, OpenAI-compatible, Deterministic rubric fallback

## Prerequisites

- Docker & Docker Compose (recommended)
- OR: Node.js 18+, Python 3.11+, MongoDB 7+
- GPU: NVIDIA A100/H100 with 40GB+ VRAM for Qwen2.5-VL (optional, falls back to CPU)

## Quick Start (Docker)

```bash
# Clone and navigate
git clone <repo>
cd ocr-card-manager

# Copy env files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
cp ocr-service/.env.example ocr-service/.env

# Edit .env files with your API keys (optional for basic testing)
# For GPU: ensure nvidia-docker is installed and VLLM_BASE_URL is set

# Start all services
docker-compose up -d --build

# Services:
# - Frontend: http://localhost:3000
# - API Gateway: http://localhost:5000
# - OCR Service: http://localhost:8000
# - MongoDB: localhost:27017
```

## Manual Setup (Development)

### 1. Start MongoDB
```bash
# Local MongoDB
mongod --dbpath /data/db

# Or Docker only MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 2. Start Python OCR Service
```bash
cd ocr-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# For GPU: pip install -r requirements-gpu.txt
cp .env.example .env
# Edit .env with your VLLM_BASE_URL and API keys
uvicorn app.main:app --reload --port 8000
```

### 3. Start Node Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env with MONGODB_URI and PYTHON_SERVICE_URL
npm run dev
```

### 4. Start Client
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

### Root `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/answer-paper-correction
PYTHON_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000
```

### Server `server/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/answer-paper-correction
PYTHON_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000
```

### Client `client/.env`
```env
VITE_API_URL=http://localhost:5000
```

### OCR Service `ocr-service/.env`
```env
# OCR Backend: auto | qwen2vl | trocr | paddle | tesseract | stub
OCR_BACKEND=auto

# Qwen2.5-VL via vLLM (recommended for GPU)
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_API_KEY=EMPTY
QWEN_MODEL_ID=Qwen/Qwen2.5-VL-7B-Instruct

# TrOCR fallback
TROCR_MODEL_ID=microsoft/trocr-large-handwritten

# Device: auto | cuda | cpu
DEVICE=auto

# Preprocessing
PDF_RENDER_DPI=200
MAX_PAGES=30
DESKEW=true

# Grading
GRADER_PROVIDER=auto
GRADER_BASE_URL=
GRADER_API_KEY=
GRADER_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5
GRADER_TIMEOUT_S=60
```

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | System health check (server + python service) |

### OCR
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ocr | Process image/PDF, return extracted text + segments |

### Evaluation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/evaluation | Upload script + rubric, get graded result |
| GET | /api/evaluation/history | Get recent evaluations |
| GET | /api/evaluation/:id | Get single evaluation |

### Direct Grading (no OCR)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/grade | Grade pre-extracted segments against answer key |

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, UI components
│   │   ├── pages/          # ScriptEvaluator page
│   │   ├── api.js          # Axios API client
│   │   └── theme.js        # MUI theme
│   ├── Dockerfile
│   └── package.json
├── server/                 # Express API gateway
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── middleware/     # Multer upload
│   │   ├── models/         # Evaluation schema
│   │   ├── routes/         # evaluation, ocr, health
│   │   └── index.js        # App entry
│   ├── Dockerfile
│   └── package.json
├── ocr-service/            # Python FastAPI service
│   ├── app/
│   │   ├── config.py       # Pydantic settings
│   │   ├── schemas.py      # Pydantic models
│   │   ├── preprocess.py   # PDF→images, deskew
│   │   ├── segment.py      # Q/A segmentation
│   │   ├── pipeline.py     # End-to-end pipeline
│   │   ├── routers.py      # FastAPI routes
│   │   ├── main.py         # App factory
│   │   ├── ocr/            # OCR backends
│   │   │   ├── base.py
│   │   │   ├── factory.py
│   │   │   ├── qwen_vl.py
│   │   │   ├── trocr.py
│   │   │   ├── paddle.py
│   │   │   └── tesseract.py
│   │   └── grade/          # Grading backends
│   │       ├── base.py
│   │       ├── rubric.py
│   │       ├── llm.py
│   │       └── factory.py
│   ├── tests/              # Pytest suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── requirements-gpu.txt
├── docker-compose.yml
├── .env.example
└── README.md
```

## GPU Setup (Production)

For Qwen2.5-VL on A100/H100:

```bash
# 1. Start vLLM server (on GPU host)
docker run --gpus all -p 8000:8000 \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-VL-7B-Instruct \
  --max-model-len 8192 \
  --limit-mm-per-prompt "image=5"

# 2. Set VLLM_BASE_URL=http://<gpu-host>:8000/v1 in ocr-service/.env
# 3. OCR_BACKEND=qwen2vl
```

The system auto-detects GPU and falls back to CPU/other backends if unavailable.

## Testing

```bash
# Python service tests
cd ocr-service
pytest -v

# Server tests
cd server
npm test
```

## Production Deployment

1. Set `NODE_ENV=production` in server
2. Use MongoDB Atlas or production MongoDB
3. Configure reverse proxy (nginx) for client/server
4. Use managed GPU instances for vLLM
5. Set up monitoring/logging (Prometheus, Grafana, Loki)
6. Enable HTTPS with certificates

## License

MIT