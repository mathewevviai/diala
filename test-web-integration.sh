#!/bin/bash

# Web Content Processing Test Script
# This script tests the complete web content processing system

echo "🚀 Testing Web Content Processing System..."
echo "======================================"

# Check if Convex is running
echo "🔍 Checking Convex development server..."
if pgrep -f "convex dev" > /dev/null; then
    echo "✅ Convex dev server is running"
else
    echo "⚠️  Starting Convex development server..."
    cd frontend && npx convex dev &
cd ..
fi

# Check if Jina API key is set
if [ -z "$JINA_API_KEY" ] && [ -f "frontend/.env.local" ]; then
    echo "🔑 Loading Jina API key from .env.local..."
    export $(grep -v '^#' frontend/.env.local | xargs)
fi

if [ -z "$JINA_API_KEY" ]; then
    echo "⚠️  JINA_API_KEY not found in environment"
    echo "Please add JINA_API_KEY to frontend/.env.local"
    echo "Get API key from: https://jina.ai/reader-api"
    exit 1
fi

echo "✅ Jina API key found"

# Test URLs
echo "📝 Testing with provided URLs:"
echo "1. http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there"
echo "2. https://dergipark.org.tr/en/download/article-file/4570887"

# Test the API directly
echo "🔍 Testing Jina Reader API..."
curl -s "https://r.jina.ai/http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there" \
  -H "Authorization: Bearer $JINA_API_KEY" \
  -H "Accept: application/json" | jq '.title' || echo "❌ API test failed"

echo ""
echo "🎯 Testing Complete!"
echo "=========================================="
echo "To test manually:"
echo "1. cd frontend && npm run dev:all"
echo "2. Open http://localhost:3000/onboarding/rag"
echo "3. Enable dev mode to auto-fill URLs"
echo "4. Select web platform and process content"
echo ""
echo "📋 Environment Setup Complete!"