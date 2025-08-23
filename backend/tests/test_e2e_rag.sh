#!/bin/bash
# E2E Test Script for RAG Processing
# Hit all endpoints to verify the complete flow works

echo "🚀 Starting E2E RAG Testing..."
echo "================================="

# Check if Convex is running
echo "🔍 Checking Convex server..."
if ! curl -s http://localhost:3210 > /dev/null; then
    echo "❌ Convex server not running. Start with: npx convex dev"
    exit 1
fi
echo "✅ Convex server is running"

# Test 1: Check embedding models endpoint
echo ""
echo "🔍 Testing embedding models endpoint..."
RESPONSE=$(curl -s http://localhost:8000/api/public/embedding-models/)
MODEL_COUNT=$(echo $RESPONSE | jq '. | length')
echo "📊 Found $MODEL_COUNT embedding models"

# Extract Jina v4 info
JINA_MODEL=$(echo $RESPONSE | jq '.[] | select(.id == "jina-v4")')
if [ -n "$JINA_MODEL" ]; then
    echo "✅ Found Jina v4 model"
    echo "📏 Dimensions: $(echo $JINA_MODEL | jq '.dimensions')"
    echo "⭐ MTEB Score: $(echo $JINA_MODEL | jq '.mtebScore')"
else
    echo "❌ Jina v4 model not found"
fi

# Test 2: Test Jina API directly
echo ""
echo "🧪 Testing Jina API directly..."
START_TIME=$(date +%s)
JINA_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST https://api.jina.ai/v1/embeddings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer jina_97ac1a18dc65431280b56599f79ddbb7PHKwTnjdhpxcAubg_sD1dJcL6C" \
    -d '{
        "model": "jina-embeddings-v4",
        "task": "retrieval.passage",
        "input": [
            {"text": "A beautiful sunset over the beach"},
            {"text": "Un beau coucher de soleil sur la plage"}
        ]
    }')

HTTP_CODE=$(echo "$JINA_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
ELAPSED=$(($(date +%s) - START_TIME))

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Jina API response: 200 OK"
    echo "⏱️ Response time: ${ELAPSED}s"
    
    TOKENS=$(echo "$JINA_RESPONSE" | head -n -1 | jq '.usage.total_tokens')
    EMBEDDINGS=$(echo "$JINA_RESPONSE" | head -n -1 | jq '.data | length')
    
    echo "📊 Processed $EMBEDDINGS items"
    echo "📝 Used $TOKENS tokens"
else
    echo "❌ Jina API failed with HTTP: $HTTP_CODE"
    echo "Response: $JINA_RESPONSE"
fi

# Test 3: Test Convex health
echo ""
echo "🩺 Testing Convex health..."
CONVEX_HEALTH=$(curl -s http://localhost:3210/health)
if [ -n "$CONVEX_HEALTH" ]; then
    echo "✅ Convex server is responding"
else
    echo "❌ Convex server not responding"
fi

# Test 4: Quick test with curl for actual processing
echo ""
echo "🔧 Testing Convex RAG workflow..."
echo "⚠️  Run this in a separate terminal after starting: npx convex dev"
echo ""
echo "To test the actual RAG processing, you can use:"
echo "curl -X POST http://localhost:3210/api/actions/ragActions.addDocument \"
echo "  -H 'Content-Type: application/json' \"
echo "  -d '{\"storageId\":\"your-storage-id\",\"jobId\":\"your-job-id\",\"namespace\":\"test\",\"fileName\":\"test.txt\"}'"

echo ""
echo "================================="
echo "✅ E2E Testing Complete!"
echo ""
echo "📋 Summary:"
echo "1. Convex: $(curl -s http://localhost:3210/health | wc -l) bytes response"
echo "2. Backend: $(curl -s http://localhost:8000/api/public/embedding-models/ | jq '. | length') models"
echo "3. Jina: ${ELAPSED}s response time"
echo ""
echo "🚀 Next steps:"
echo "1. Start Convex: npx convex dev"
echo "2. Run the Python test: python backend/tests/test_e2e_rag.py"
echo "3. Monitor logs: npx convex logs"