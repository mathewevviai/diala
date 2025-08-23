# Jina2Docs Command

## Overview
The `/Jina2Docs` command allows you to extract content from any URL using the Jina Reader API. It fetches the full content of a webpage, extracts all linked URLs, and filters them based on keywords you provide. Optimized for speed, it typically completes in under 10 seconds.

## Usage
```
/Jina2Docs $ARGUMENTS
```

### Arguments Format
The command accepts arguments in these formats:
1. **Basic**: `<URL> [keyword1] [keyword2] ...`
2. **With output directory**: `<URL> --output <directory> [keywords...]`
3. **Batch processing**: `--batch <file.txt> [keywords...]`
4. **Follow links**: `<URL> --follow-links <depth> [keywords...]`

### Examples

**Basic extraction with keywords:**
```
/Jina2Docs https://platform.openai.com/docs/models/whisper-1 whisper audio transcription
```

**Extract to custom directory:**
```
/Jina2Docs https://docs.jina.ai/api-reference --output docs/api-docs api endpoint
```

**Batch process multiple URLs:**
```
/Jina2Docs --batch urls.txt machine learning ai
```

**Follow links recursively:**
```
/Jina2Docs https://example.com/blog --follow-links 2 tutorial guide
```

**Extract all content (no keyword filtering):**
```
/Jina2Docs https://techblog.com/archive
```

## Features
- **Fast Execution**: Typically completes in under 10 seconds
- **Full Content Extraction**: Gets the complete text content of the webpage
- **URL Discovery**: Extracts all linked URLs from the page
- **Smart Filtering**: Advanced keyword matching with relevance scoring
- **Batch Processing**: Process multiple URLs in parallel
- **Recursive Extraction**: Follow links to specified depth
- **Structured Output**: Multiple output formats (Markdown, JSON, CSV)
- **Metadata Capture**: Preserves page metadata and extraction context
- **Error Recovery**: Automatic retry with exponential backoff
- **Progress Tracking**: Real-time updates for long operations

## How It Works

### 1. API Authentication
The command reads the JINA_API_KEY from the backend .env file:
```bash
JINA_API_KEY=$(grep "^JINA_API_KEY=" backend/.env | cut -d'=' -f2)
```

### 2. Direct Curl Execution
```bash
curl -s -X GET "https://r.jina.ai/${URL}" \
  -H "Authorization: Bearer ${JINA_API_KEY}" \
  -H "Accept: application/json" \
  -H "X-Return-Format: json" \
  -H "X-With-Content: true" \
  -H "X-With-Links: true"
```
- Uses `-s` for silent mode (no progress bars)
- Processes response directly with `jq` for speed

### 3. Response Processing
The Jina Reader API returns:
```json
{
  "title": "Page Title",
  "content": "Full page content...",
  "url": "https://example.com",
  "links": ["https://example.com/link1", "https://example.com/link2"],
  "metadata": {
    "description": "Page description",
    "publishedTime": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Keyword-Based URL Filtering
URLs are filtered based on provided keywords:
- **Case-insensitive matching**: Keywords are matched regardless of case
- **Partial matching**: URLs containing any keyword are included
- **No keywords = all URLs**: If no keywords provided, all URLs are returned
- **Fast filtering**: Uses bash string operations for speed

### 5. Output Structure
Results are saved to `docs/jina-extracts/[timestamp]/`:

**content.md**
```markdown
# [Page Title]
URL: [Original URL]
Extracted: [Timestamp]

## Content
[Full page content]

## Metadata
- Published: [Date]
- Description: [Meta description]
```

**urls.json**
```json
{
  "source_url": "https://example.com",
  "extraction_time": "2024-01-20T10:30:00Z",
  "keywords": ["api", "docs"],
  "total_urls": 25,
  "relevant_urls": [
    {
      "url": "https://example.com/api-docs",
      "matched_keyword": "api"
    }
  ],
  "all_urls": ["..."]
}
```

**summary.txt**
```
Extraction Summary
==================
Source URL: https://example.com
Extraction Time: Mon Jan 20 10:30:00 UTC 2024
Total URLs Found: 25
Relevant URLs: 8
Keywords Used: api docs

Top 10 Relevant URLs:
1. https://example.com/api-docs
2. https://example.com/api/reference
...
```

## Implementation Details

### Helper Script Location
The command is implemented in: `.claude/commands/jina2docs.sh`

### Error Handling
- Missing API key: Prompts to set JINA_API_KEY in backend/.env
- Invalid JSON: Validates response with jq before processing
- Missing .env file: Checks for backend/.env existence
- Empty responses: Handles missing fields gracefully

### Performance
- **Execution Time**: Typically completes in 5-10 seconds
- **Dependencies**: Only requires curl and jq (standard tools)
- **Memory Usage**: Minimal - streams data directly
- **Network Efficiency**: Single API call per URL

## Examples

### Extract OpenAI Whisper Documentation
```
/Jina2Docs https://platform.openai.com/docs/models/whisper-1 whisper audio transcription speech-to-text
```

### Extract API Documentation with Filtering
```
/Jina2Docs https://docs.jina.ai/api-reference api endpoint authentication rate-limit
```

### Extract Blog Post with ML Keywords
```
/Jina2Docs https://example.com/blog/building-rag-systems rag vector embedding llm
```

### Extract All URLs (No Filtering)
```
/Jina2Docs https://techstartup.com/about
```

## Related Commands
- `/search:` - Search using Jina Search API
- `/extract:` - Batch extraction from multiple URLs
- `/analyze:` - Analyze extracted content for specific patterns

## Troubleshooting

### "API Key not found"
Ensure JINA_API_KEY is set in `backend/.env`

### "Rate limit exceeded"
Wait 60 seconds or reduce request frequency

### "Invalid JSON response"
Check if the URL is accessible and returns valid content

### "No relevant URLs found"
Adjust search objective or expand relevance keywords

---

## AI Usage Instructions (For Claude)

When a user invokes `/Jina2Docs` in conversation, follow these guidelines to properly execute and handle the command.

### Command Processing Workflow

1. **Parse Arguments**:
   ```python
   # Parse $ARGUMENTS to extract:
   - Primary URL(s)
   - Keywords for filtering
   - Options (--output, --batch, --follow-links)
   - Output format preferences
   ```

2. **Validate Input**:
   - Ensure URL is properly formatted
   - Check if batch file exists (if --batch used)
   - Verify output directory permissions
   - Validate depth parameter (1-5 recommended)

3. **Execute Extraction**:
   ```bash
   # For basic extraction
   ./jina2docs.sh "$URL" ${keywords[@]}
   
   # For batch processing
   ./jina2docs.sh --batch "$batch_file" ${keywords[@]}
   
   # For recursive extraction
   ./jina2docs.sh "$URL" --follow-links $depth ${keywords[@]}
   ```

4. **Process Results**:
   - Parse generated files (content.md, urls.json, summary.txt)
   - Identify key findings
   - Prepare follow-up actions if requested

### Understanding User Intent

Parse natural language requests to extract:
1. **Target URL**: The webpage to extract content from
2. **Keywords**: Terms to filter relevant URLs (optional)
3. **Output Directory**: Where to save results (optional, defaults to `docs/jina-extracts/[timestamp]`)
4. **Follow-up Actions**: Whether to fetch additional URLs, organize by topic, etc.

### Natural Language Request Patterns

Users may phrase requests in various ways:

**Basic extraction:**
- "Use /Jina2Docs to get content from [URL]"
- "Extract all content from [URL] about [topic]"
- "Find all [keyword]-related URLs from [URL]"
- "Get the documentation from [URL]"
- "Scrape [URL] for information about [topic]"

**Advanced extraction:**
- "Extract [URL] and all linked pages about [topic]"
- "Get all API documentation from [URL] and organize by endpoint"
- "Follow all tutorial links from [URL] up to 3 levels deep"
- "Batch process these URLs: [url1], [url2], [url3]"
- "Extract content from [URL] and save to my project docs"

**With custom output:**
- "Extract API docs from [URL] and save to docs/api/"
- "Get all authentication content from [URL] and organize in docs/auth/"
- "Find whisper-related content and save each URL to a separate file"

**Multi-step requests:**
- "Extract content from [URL], then fetch all relevant URLs"
- "Get all API documentation URLs, then extract content from each"
- "Find all tutorial links and organize by topic"

### Execution Workflow

1. **Parse the request:**
   ```python
   # Example parsing logic
   - Extract URL from user message
   - Identify keywords/topics mentioned
   - Determine if custom output directory specified
   - Check for follow-up action requests
   ```

2. **Execute the command:**
   ```bash
   # Basic execution
   /home/bozo/projects/projectBozo/diala/.claude/commands/jina2docs.sh <URL> [keywords...]
   
   # Example with keywords
   /home/bozo/projects/projectBozo/diala/.claude/commands/jina2docs.sh https://docs.example.com api authentication oauth
   ```

3. **Process results:**
   - Read the generated files (content.md, urls.json, summary.txt)
   - Analyze relevant URLs found
   - Determine if follow-up extraction needed

4. **Organize output (if requested):**
   ```bash
   # Move to custom directory
   mv docs/jina-extracts/[timestamp]/* docs/custom-folder/
   
   # Or create topic-based organization
   mkdir -p docs/api/authentication
   cp docs/jina-extracts/[timestamp]/content.md docs/api/authentication/
   ```

### Response Templates

**Successful extraction:**
```
I've extracted content from [URL] and found [N] total URLs, with [M] matching your keywords "[keywords]".

Key findings:
- Content saved to: [path]/content.md ([size] KB)
- [M] relevant URLs found matching [keywords]
- Extraction completed in [X] seconds
- Content quality score: [score]/100

Top relevant URLs:
1. [URL1] - matches "[keyword]" (relevance: [score]%)
2. [URL2] - matches "[keyword]" (relevance: [score]%)
[...]

Would you like me to:
1. Extract content from these URLs as well?
2. Organize the content by topic?
3. Generate a summary of the findings?
```

**Batch processing result:**
```
Batch extraction completed for [N] URLs:

✓ Successfully processed: [X] URLs
✗ Failed: [Y] URLs
⏱ Total time: [T] seconds

Content organized in:
- [output_dir]/
  ├── summary.json (overview of all extractions)
  ├── [domain1]/
  │   ├── content.md
  │   └── metadata.json
  ├── [domain2]/
  │   ├── content.md
  │   └── metadata.json
  └── failed.log (details of failed extractions)

Key insights:
- Most relevant content found in: [top_url]
- Common topics: [topic1], [topic2], [topic3]
- Total content size: [size] MB
```

**No results found:**
```
I've extracted content from [URL] but found no URLs matching your keywords "[keywords]".

The content has been saved to [path]/content.md. You might want to:
1. Try broader keywords
2. Check if the page contains the expected links
3. Extract without keyword filtering to see all available URLs
```

**Multiple URL processing:**
```
I'll extract content from multiple sources as requested:

1. Extracting from [URL1]... ✓ Found [N] relevant URLs
2. Extracting from [URL2]... ✓ Found [M] relevant URLs
3. Extracting from [URL3]... ✓ Found [P] relevant URLs

All content has been organized in:
- docs/[topic1]/ - [N] files
- docs/[topic2]/ - [M] files
- docs/[topic3]/ - [P] files

Total: [X] URLs processed, [Y] relevant links found
```

### Advanced Usage Patterns

**1. Topic-Based Research Workflow:**
```bash
# Start with a seed URL and expand research
/Jina2Docs https://docs.example.com/overview --follow-links 3 --output research/topic

# Then organize by subtopic
for topic in authentication api database; do
    grep -l "$topic" research/topic/*/content.md | 
    xargs -I {} cp {} research/topic/organized/$topic/
done
```

**2. API Documentation Extraction:**
```bash
# Extract all API endpoints and organize
/Jina2Docs https://api.example.com/docs --output docs/api \
  endpoint method request response authentication

# Generate endpoint summary
jq -r '.relevant_urls[] | select(.url | contains("/endpoints/"))' \
  docs/api/urls.json > docs/api/endpoints.txt
```

**3. Competitive Analysis:**
```bash
# Extract competitor information
competitors=("https://competitor1.com" "https://competitor2.com")
for url in "${competitors[@]}"; do
    /Jina2Docs "$url" --output "analysis/$(basename $url)" \
      pricing features "case study" testimonial
done
```

**4. Knowledge Base Building:**
```bash
# Build comprehensive knowledge base
/Jina2Docs https://wiki.example.com --follow-links 4 \
  --output kb/raw tutorial guide reference

# Process and index
python scripts/index_kb.py kb/raw kb/indexed
```

**Recursive extraction:**
```bash
# Extract, then fetch all found URLs
INITIAL_URLS=$(./jina2docs.sh "$URL" "$keywords" | jq -r '.relevant_urls[].url')

for next_url in $INITIAL_URLS; do
    ./jina2docs.sh "$next_url" "$keywords"
done
```

### Best Practices for AI

1. **Always show extraction progress** - Users appreciate knowing the command is working
2. **Summarize key findings** - Don't just dump file paths, highlight what was found
3. **Offer follow-up actions** - Suggest extracting found URLs or different keywords
4. **Handle errors gracefully** - Explain what went wrong and how to fix it
5. **Preserve user intent** - If they want specific organization, implement it
6. **Optimize for large extractions** - Use batch processing and parallel execution
7. **Validate content quality** - Check for actual content vs. error pages
8. **Respect rate limits** - Implement delays for multiple requests
9. **Save incrementally** - Don't wait until the end to save results
10. **Provide context** - Include metadata about when/how content was extracted

### Error Handling

**Common errors and solutions:**

1. **Rate limit exceeded**:
   - Wait 60 seconds before retrying
   - Reduce parallel requests
   - Use exponential backoff

2. **Invalid URL**:
   - Check URL format
   - Ensure protocol (http/https) is included
   - Handle redirects appropriately

3. **Empty content**:
   - Check if page requires authentication
   - Verify the page isn't JavaScript-rendered
   - Try alternative extraction methods

4. **Network timeout**:
   - Retry with longer timeout
   - Check network connectivity
   - Try extracting in smaller batches

### Example Implementation

When user says: "Find all Whisper API documentation from OpenAI and organize by endpoint type"

Claude should:

1. **Parse the request**:
   ```python
   url = "https://platform.openai.com/docs/models/whisper-1"
   keywords = ["whisper", "api", "endpoint", "transcription", "translation"]
   organization = "by endpoint type"
   output_dir = "docs/whisper-api"
   ```

2. **Execute initial extraction**:
   ```bash
   ./jina2docs.sh "$url" --output "$output_dir" "${keywords[@]}"
   ```

3. **Analyze results**:
   ```bash
   # Read URLs and categorize
   jq -r '.relevant_urls[] | {url: .url, keyword: .matched_keyword}' \
     "$output_dir/urls.json" > "$output_dir/categorized.json"
   ```

4. **Organize by endpoint type**:
   ```bash
   # Create directory structure
   mkdir -p "$output_dir"/{transcription,translation,common}
   
   # Extract and organize each relevant URL
   while read -r url keyword; do
       case "$keyword" in
           *transcription*)
               ./jina2docs.sh "$url" --output "$output_dir/transcription"
               ;;
           *translation*)
               ./jina2docs.sh "$url" --output "$output_dir/translation"
               ;;
           *)
               ./jina2docs.sh "$url" --output "$output_dir/common"
               ;;
       esac
   done < <(jq -r '.relevant_urls[] | "\(.url) \(.matched_keyword)"' urls.json)
   ```

5. **Generate comprehensive report**:
   ```markdown
   ## Whisper API Documentation Summary
   
   ### Extraction Statistics
   - Total pages processed: 15
   - Transcription endpoints: 8
   - Translation endpoints: 5
   - Common/shared docs: 2
   - Total extraction time: 45 seconds
   
   ### Key Findings
   
   #### Transcription API
   - Base endpoint: `/v1/audio/transcriptions`
   - Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
   - Max file size: 25MB
   - [Full documentation](docs/whisper-api/transcription/overview.md)
   
   #### Translation API  
   - Base endpoint: `/v1/audio/translations`
   - Currently supports translation to English only
   - Same format support as transcription
   - [Full documentation](docs/whisper-api/translation/overview.md)
   
   ### Recommended Next Steps
   1. Review authentication requirements in [common/auth.md]
   2. Check rate limits in [common/limits.md]
   3. Explore example implementations in extracted code samples
   ```

### Performance Optimization

For large-scale extractions:

1. **Parallel Processing**:
   ```bash
   # Process URLs in parallel (max 5 concurrent)
   cat urls.txt | xargs -P 5 -I {} ./jina2docs.sh {}
   ```

2. **Incremental Saves**:
   ```bash
   # Save results as they complete
   ./jina2docs.sh --incremental --checkpoint-dir ./checkpoints
   ```

3. **Resume Capability**:
   ```bash
   # Resume from last checkpoint
   ./jina2docs.sh --resume-from ./checkpoints/last
   ```