#!/bin/bash

# Jina2Docs - Fast URL content extraction with Jina Reader API
# Usage: ./jina2docs.sh <URL> [keywords...]
#        ./jina2docs.sh --batch <file> [keywords...]
#        ./jina2docs.sh <URL> --output <dir> [keywords...]

set -e

# Default values
BATCH_MODE=false
CUSTOM_OUTPUT=""
FOLLOW_LINKS=0
BATCH_FILE=""

# Parse arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <URL> [keywords...]"
    echo "       $0 --batch <file> [keywords...]"
    echo "       $0 <URL> --output <dir> [keywords...]"
    echo "       $0 <URL> --follow-links <depth> [keywords...]"
    echo "Example: $0 https://platform.openai.com/docs/models/whisper-1 whisper audio transcription"
    exit 1
fi

# Check for batch mode
if [ "$1" = "--batch" ]; then
    BATCH_MODE=true
    BATCH_FILE="$2"
    shift 2
    KEYWORDS=("$@")
elif [[ "$2" == "--output" ]]; then
    URL="$1"
    CUSTOM_OUTPUT="$3"
    shift 3
    KEYWORDS=("$@")
elif [[ "$2" == "--follow-links" ]]; then
    URL="$1"
    FOLLOW_LINKS="$3"
    shift 3
    KEYWORDS=("$@")
else
    URL="$1"
    shift
    KEYWORDS=("$@")
fi

# Get API key from backend .env
ENV_FILE="$(dirname "$0")/../../backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: backend/.env not found"
    exit 1
fi

JINA_API_KEY=$(grep "^JINA_API_KEY=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
if [ -z "$JINA_API_KEY" ]; then
    echo "Error: JINA_API_KEY not found in backend/.env"
    exit 1
fi

# Create output directory
if [ -n "$CUSTOM_OUTPUT" ]; then
    OUTPUT_DIR="$(dirname "$0")/../../$CUSTOM_OUTPUT"
else
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    OUTPUT_DIR="$(dirname "$0")/../../docs/jina-extracts/${TIMESTAMP}"
fi
mkdir -p "$OUTPUT_DIR"

# Function to extract content from a single URL
extract_url() {
    local url="$1"
    local output_file="$2"
    
    echo "Extracting: $url"
    
    # Call Jina Reader API with retry logic
    local max_retries=3
    local retry_count=0
    local retry_delay=2
    
    while [ $retry_count -lt $max_retries ]; do
        RESPONSE=$(curl -s -X GET "https://r.jina.ai/${url}" \
          -H "Authorization: Bearer ${JINA_API_KEY}" \
          -H "Accept: application/json" \
          -H "X-Return-Format: json" \
          -H "X-With-Content: true" \
          -H "X-With-Links: true" \
          --max-time 30)
        
        # Check if response is valid
        if echo "$RESPONSE" | jq empty 2>/dev/null; then
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                echo "  Retry $retry_count/$max_retries after ${retry_delay}s..."
                sleep $retry_delay
                retry_delay=$((retry_delay * 2))
            fi
        fi
    done
    
    echo "$RESPONSE"
}

# Handle batch mode
if [ "$BATCH_MODE" = true ]; then
    if [ ! -f "$BATCH_FILE" ]; then
        echo "Error: Batch file not found: $BATCH_FILE"
        exit 1
    fi
    
    echo "Batch mode: Processing URLs from $BATCH_FILE"
    echo "Keywords: ${KEYWORDS[@]}"
    echo "Output directory: $OUTPUT_DIR"
    
    # Create batch summary
    BATCH_SUMMARY="$OUTPUT_DIR/batch_summary.json"
    echo '{"batch_file": "'"$BATCH_FILE"'", "urls": [], "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > "$BATCH_SUMMARY"
    
    # Process each URL
    url_count=0
    while IFS= read -r url || [ -n "$url" ]; do
        [ -z "$url" ] && continue
        [ "${url:0:1}" = "#" ] && continue  # Skip comments
        
        url_count=$((url_count + 1))
        echo "\n[$url_count] Processing: $url"
        
        # Create subdirectory for this URL
        domain=$(echo "$url" | awk -F/ '{print $3}' | tr '.' '_')
        url_dir="$OUTPUT_DIR/$domain-$url_count"
        mkdir -p "$url_dir"
        
        # Extract content
        RESPONSE=$(extract_url "$url")
        
        # Process response (reuse existing logic)
        # ... [existing processing code will go here]
        
    done < "$BATCH_FILE"
    
    echo "\nBatch processing complete: $url_count URLs processed"
    exit 0
fi

# Single URL mode
echo "Extracting content from: $URL"
echo "Keywords: ${KEYWORDS[@]}"
echo "Output directory: $OUTPUT_DIR"

RESPONSE=$(extract_url "$URL")

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo "Error: Invalid JSON response from Jina API"
    echo "$RESPONSE" | head -n 5
    exit 1
fi

# Check if response has data wrapper (new API format)
if echo "$RESPONSE" | jq -e '.data' >/dev/null 2>&1; then
    # Extract from data object
    TITLE=$(echo "$RESPONSE" | jq -r '.data.title // "No title"')
    CONTENT=$(echo "$RESPONSE" | jq -r '.data.content // "No content"')
    DESCRIPTION=$(echo "$RESPONSE" | jq -r '.data.description // ""')
    PUBLISHED=$(echo "$RESPONSE" | jq -r '.data.publishedTime // ""')
    LINKS_JSON=$(echo "$RESPONSE" | jq -r '.data.links // []')
else
    # Extract directly (old API format)
    TITLE=$(echo "$RESPONSE" | jq -r '.title // "No title"')
    CONTENT=$(echo "$RESPONSE" | jq -r '.content // "No content"')
    DESCRIPTION=$(echo "$RESPONSE" | jq -r '.description // ""')
    PUBLISHED=$(echo "$RESPONSE" | jq -r '.publishedTime // ""')
    LINKS_JSON=$(echo "$RESPONSE" | jq -r '.links // []')
fi

# Save content
cat > "$OUTPUT_DIR/content.md" << EOF
# $TITLE
URL: $URL
Extracted: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Description
$DESCRIPTION

## Content
$CONTENT

## Metadata
- Published: $PUBLISHED
EOF

echo "✓ Content saved to: $OUTPUT_DIR/content.md"

# Extract and filter URLs
if [ -n "$LINKS_JSON" ] && [ "$LINKS_JSON" != "[]" ]; then
    ALL_URLS=$(echo "$LINKS_JSON" | jq -r '.[]' 2>/dev/null | sort -u)
else
    # Try to extract URLs from content using better regex
    echo "No links in API response, extracting URLs from content..."
    ALL_URLS=$(echo "$CONTENT" | grep -oE 'https?://[^[:space:])"\]]+' | sed 's/[),]$//' | sort -u)
fi
TOTAL_URLS=$(echo "$ALL_URLS" | grep -c . || echo 0)

echo "Found $TOTAL_URLS total URLs"

# Function to calculate relevance score
calculate_relevance() {
    local url="$1"
    local score=0
    
    # Check each keyword
    for keyword in "${KEYWORDS[@]}"; do
        if [[ "${url,,}" == *"${keyword,,}"* ]]; then
            score=$((score + 10))
        fi
    done
    
    # Boost for quality indicators in URL
    for indicator in "docs" "documentation" "guide" "tutorial" "api" "reference"; do
        if [[ "${url,,}" == *"$indicator"* ]]; then
            score=$((score + 5))
        fi
    done
    
    echo $score
}

# Filter and score URLs
declare -A URL_SCORES
RELEVANT_URLS=()

if [ ${#KEYWORDS[@]} -gt 0 ]; then
    while IFS= read -r url; do
        [ -z "$url" ] && continue
        
        score=$(calculate_relevance "$url")
        if [ $score -gt 0 ]; then
            URL_SCORES["$url"]=$score
            RELEVANT_URLS+=("$url")
        fi
    done <<< "$ALL_URLS"
    
    # Sort by relevance score
    IFS=$'\n' RELEVANT_URLS=($(for url in "${RELEVANT_URLS[@]}"; do
        echo "${URL_SCORES[$url]} $url"
    done | sort -rn | cut -d' ' -f2-))
else
    # No keywords provided, consider all URLs relevant
    mapfile -t RELEVANT_URLS <<< "$ALL_URLS"
fi

# Create URLs JSON file
{
    echo "{"
    echo "  \"source_url\": \"$URL\","
    echo "  \"extraction_time\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
    echo "  \"keywords\": $(printf '%s\n' "${KEYWORDS[@]}" | jq -R . | jq -s .),"
    echo "  \"total_urls\": $TOTAL_URLS,"
    echo "  \"relevant_urls\": ["
    
    first=true
    for url in "${RELEVANT_URLS[@]}"; do
        [ -z "$url" ] && continue
        
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        
        # Find matching keyword
        matching_keyword=""
        for keyword in "${KEYWORDS[@]}"; do
            if [[ "${url,,}" == *"${keyword,,}"* ]]; then
                matching_keyword="$keyword"
                break
            fi
        done
        
        echo -n "    {"
        echo -n "\"url\": $(echo "$url" | jq -R .), "
        echo -n "\"matched_keyword\": \"$matching_keyword\""
        echo -n "}"
    done
    
    echo ""
    echo "  ],"
    echo "  \"all_urls\": $(echo "$ALL_URLS" | jq -R . | jq -s .)"
    echo "}"
} > "$OUTPUT_DIR/urls.json"

echo "✓ URLs saved to: $OUTPUT_DIR/urls.json"
echo "✓ Found ${#RELEVANT_URLS[@]} relevant URLs (out of $TOTAL_URLS total)"

# Create summary
cat > "$OUTPUT_DIR/summary.txt" << EOF
Extraction Summary
==================
Source URL: $URL
Extraction Time: $(date)
Total URLs Found: $TOTAL_URLS
Relevant URLs: ${#RELEVANT_URLS[@]}
Keywords Used: ${KEYWORDS[@]}

Top 10 Relevant URLs:
EOF

# Add top 10 relevant URLs to summary
count=0
for url in "${RELEVANT_URLS[@]}"; do
    [ -z "$url" ] && continue
    echo "$((++count)). $url" >> "$OUTPUT_DIR/summary.txt"
    [ $count -ge 10 ] && break
done

echo "✓ Summary saved to: $OUTPUT_DIR/summary.txt"

# Handle follow-links option
if [ $FOLLOW_LINKS -gt 0 ] && [ ${#RELEVANT_URLS[@]} -gt 0 ]; then
    echo ""
    echo "Following links (depth: $FOLLOW_LINKS)..."
    
    # Create subdirectory for followed links
    FOLLOW_DIR="$OUTPUT_DIR/followed-links"
    mkdir -p "$FOLLOW_DIR"
    
    # Use the Python script for recursive following
    SCRIPT_DIR="$(dirname "$0")/scripts"
    if [ -f "$SCRIPT_DIR/jina_recursive_search.py" ]; then
        python3 "$SCRIPT_DIR/jina_recursive_search.py" \
            --topic "$URL" \
            --depth "$FOLLOW_LINKS" \
            --output "$FOLLOW_DIR" \
            --focus "${KEYWORDS[@]}"
    else
        echo "Warning: Recursive search script not found. Install with:"
        echo "  pip install -r backend/requirements.txt"
    fi
fi

echo ""
echo "Extraction completed in $SECONDS seconds"
echo "Results saved to: $OUTPUT_DIR/"

# Generate content quality score
if [ -f "$OUTPUT_DIR/content.md" ]; then
    content_size=$(wc -c < "$OUTPUT_DIR/content.md")
    content_lines=$(wc -l < "$OUTPUT_DIR/content.md")
    quality_score=50
    
    # Size bonus
    if [ $content_size -gt 5000 ]; then
        quality_score=$((quality_score + 20))
    elif [ $content_size -gt 1000 ]; then
        quality_score=$((quality_score + 10))
    fi
    
    # Keyword match bonus
    if [ ${#KEYWORDS[@]} -gt 0 ]; then
        keyword_matches=0
        for keyword in "${KEYWORDS[@]}"; do
            if grep -qi "$keyword" "$OUTPUT_DIR/content.md"; then
                keyword_matches=$((keyword_matches + 1))
            fi
        done
        if [ $keyword_matches -gt 0 ]; then
            quality_score=$((quality_score + (keyword_matches * 10)))
        fi
    fi
    
    # Cap at 100
    if [ $quality_score -gt 100 ]; then
        quality_score=100
    fi
    
    echo "Content quality score: $quality_score/100"
fi