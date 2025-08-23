# Backend Setup Guide

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Redis server (for session management)

## Setup Instructions

### 1. Navigate to Backend Directory
```bash
cd /home/bozo/projects/projectBozo/diala/backend
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

### 3. Install Dependencies
```bash
# Upgrade pip
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt
```

### 4. Create Environment File
Create a `.env` file in the backend directory:

```bash
# Create .env file
touch .env
```

Add the following environment variables to `.env`:

```env
# API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key_here  # Optional for AI validation
JINA_API_KEY=your_jina_api_key_here          # Required for content extraction

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210  # Or your Convex URL

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET_KEY=your_secret_key_here
API_KEY=your_api_key_here
```

### 5. Start Redis Server
```bash
# Start Redis (required for session management)
redis-server
```

### 6. Run the Backend Server

#### Development Mode (with auto-reload):
```bash
# Using uvicorn directly
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python module
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Or using the run script if available
python run_server.py
```

#### Production Mode:
```bash
# With multiple workers
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 7. Verify Installation
Once the server is running, you can verify it's working by visiting:

- API Documentation: http://localhost:8000/docs
- ReDoc Documentation: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## API Endpoints

### Hunter LeadGen Endpoints
- `POST /api/public/hunter/search` - Start a new lead search
- `GET /api/public/hunter/search/{search_id}` - Get search status
- `GET /api/public/hunter/health` - Hunter service health check

### YouTube Transcript Endpoints
- `POST /api/public/youtube/transcript` - Fetch YouTube transcript
- `GET /api/public/youtube/job/{job_id}` - Get transcript job status

## Quick Test

### Test Hunter LeadGen API:
```bash
# Start a search
curl -X POST "http://localhost:8000/api/public/hunter/search" \
  -H "Content-Type: application/json" \
  -d '{
    "search_id": "test_search_123",
    "user_id": "test_user",
    "search_config": {
      "searchName": "Test Search",
      "searchObjective": "Find test leads",
      "selectedSources": ["web"],
      "industry": "Technology",
      "location": "United States",
      "includeEmails": true,
      "includePhones": true,
      "validationCriteria": {
        "mustHaveWebsite": true,
        "mustHaveContactInfo": true,
        "mustHaveSpecificKeywords": ["software", "technology"],
        "mustBeInIndustry": true,
        "customValidationRules": ""
      }
    }
  }'

# Check search status
curl "http://localhost:8000/api/public/hunter/search/test_search_123"
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   ```bash
   # Make sure you're in the backend directory and venv is activated
   cd /home/bozo/projects/projectBozo/diala/backend
   source venv/bin/activate
   ```

2. **Port already in use**
   ```bash
   # Kill the process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

3. **Redis connection error**
   ```bash
   # Make sure Redis is running
   redis-cli ping
   # Should return "PONG"
   ```

4. **ImportError for LeadGen modules**
   ```bash
   # Make sure you're running from the backend directory
   # The imports are relative to the backend/src structure
   ```

## Development Tips

1. **Enable Debug Logging**
   ```python
   # In your .env file
   LOG_LEVEL=DEBUG
   ```

2. **Test Individual Phases**
   ```bash
   # You can test individual LeadGen phases
   cd backend/src/core/leadgen
   python phase1_search.py  # Test phase 1
   ```

3. **Monitor Logs**
   ```bash
   # Watch the uvicorn output for real-time logs
   # Errors and progress will be displayed
   ```

## Directory Structure
```
backend/
├── src/
│   ├── main.py              # Main FastAPI app
│   ├── api/
│   │   └── public/
│   │       ├── hunter_leadgen.py    # Hunter API endpoints
│   │       └── youtube_transcripts.py
│   └── core/
│       └── leadgen/         # LeadGen processing phases
│           ├── phase1_search.py
│           ├── phase2_extract_links.py
│           ├── phase3_extract_content.py
│           ├── phase4_save_content.py
│           ├── phase5_validate.py
│           ├── phase6_create_final_report.py
│           └── utils/       # Helper modules
├── data/                    # Temporary data storage
├── requirements.txt         # Python dependencies
├── .env                    # Environment variables
└── venv/                   # Virtual environment
```

## Next Steps
1. Ensure Convex is running in the frontend
2. Configure API keys in .env
3. Test the Hunter LeadGen flow
4. Monitor logs for any issues