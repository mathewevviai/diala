# JinaRecursiveSearch Command

## Overview
The `/JinaRecursiveSearch` command performs deep, recursive research on any topic using the Jina Search and Reader APIs. It automatically searches for a topic, extracts content from search results, discovers related links, and continues searching recursively to build a comprehensive knowledge base. This command leverages the same powerful infrastructure used in the Diala project's lead generation system.

## Usage
```
/JinaRecursiveSearch $ARGUMENTS
```

### Arguments Format
The command accepts these argument patterns:
1. **Basic research**: `<topic> [--depth <1-5>] [--max-results <number>]`
2. **Focused research**: `<topic> --focus <subtopic1,subtopic2> [--depth <number>]`
3. **Academic research**: `<topic> --academic --citations [--peer-reviewed]`
4. **Competitive analysis**: `<topic> --competitive --domains <domain1,domain2>`
5. **Technical documentation**: `<topic> --technical --include-code`

### Examples

**Basic topic research:**
```
/JinaRecursiveSearch "machine learning optimization techniques" --depth 3
```

**Focused subtopic research:**
```
/JinaRecursiveSearch "kubernetes" --focus "security,networking,storage" --depth 2
```

**Academic research with citations:**
```
/JinaRecursiveSearch "quantum computing applications" --academic --citations --depth 4
```

**Competitive analysis:**
```
/JinaRecursiveSearch "email marketing tools" --competitive --domains "mailchimp.com,sendinblue.com"
```

**Technical documentation gathering:**
```
/JinaRecursiveSearch "rust async programming" --technical --include-code --max-results 50
```

## Features
- **Recursive Search**: Automatically follows relevant links up to specified depth
- **Intelligent Filtering**: Uses relevance scoring to focus on high-quality content
- **Parallel Processing**: Searches and extracts multiple sources simultaneously
- **Topic Clustering**: Automatically organizes findings by subtopic
- **Duplicate Detection**: Avoids processing the same content multiple times
- **Progress Tracking**: Real-time updates on search progress
- **Structured Output**: Generates organized knowledge base with summaries
- **Citation Tracking**: Maintains source attribution for all content
- **Quality Scoring**: Rates content based on relevance and authority
- **Incremental Results**: Saves findings progressively for large searches

## How It Works

### 1. Initial Search Phase
```python
# Generate search queries based on topic
queries = generate_search_variations(topic, focus_areas)

# Search using Jina Search API
initial_results = await jina_client.search_multiple(queries)
```

### 2. Content Extraction
```python
# Extract content from search results
content_data = await jina_client.read_urls(result_urls)

# Score relevance
relevance_scores = calculate_relevance(content_data, topic)
```

### 3. Recursive Exploration
```python
# Extract URLs from content
discovered_urls = extract_relevant_urls(content_data)

# Filter by relevance
relevant_urls = filter_by_topic_relevance(discovered_urls, topic)

# Recurse if depth > 0
if current_depth < max_depth:
    recursive_results = await process_recursive(relevant_urls, depth - 1)
```

### 4. Knowledge Organization
```python
# Cluster by subtopic
clusters = cluster_content_by_topic(all_content)

# Generate summaries
summaries = generate_cluster_summaries(clusters)

# Create knowledge structure
knowledge_base = organize_findings(clusters, summaries)
```

## Output Structure

Results are saved to `docs/research/[topic]-[timestamp]/`:

```
research-output/
├── README.md                 # Overview and navigation
├── summary.json             # High-level findings and statistics
├── knowledge-graph.json     # Relationship mapping between topics
├── sources.json             # All sources with metadata
├── by-subtopic/             # Content organized by discovered subtopics
│   ├── subtopic1/
│   │   ├── README.md       # Subtopic overview
│   │   ├── content/        # Extracted content files
│   │   └── sources.json    # Sources for this subtopic
│   └── subtopic2/
├── by-relevance/            # Content sorted by relevance score
│   ├── high-relevance/
│   ├── medium-relevance/
│   └── low-relevance/
├── timeline/                # If temporal data found
│   └── chronological.md
└── raw/                     # Original extracted content
```

### Summary Report Format
```json
{
  "topic": "machine learning optimization",
  "search_timestamp": "2024-01-20T10:30:00Z",
  "statistics": {
    "total_searches": 45,
    "urls_processed": 156,
    "content_extracted": 134,
    "total_depth_reached": 3,
    "processing_time_seconds": 240
  },
  "key_findings": [
    {
      "finding": "Gradient descent variants",
      "relevance_score": 0.95,
      "source_count": 23,
      "summary": "..."
    }
  ],
  "subtopics_discovered": [
    "stochastic optimization",
    "hyperparameter tuning",
    "neural architecture search"
  ],
  "top_sources": [
    {
      "url": "https://example.com/ml-optimization",
      "title": "Complete Guide to ML Optimization",
      "relevance_score": 0.98,
      "citations": 45
    }
  ]
}
```

## AI Usage Instructions (For Claude)

When a user invokes `/JinaRecursiveSearch`, follow this structured workflow:

### 1. Parse User Intent
```python
# Extract from $ARGUMENTS:
- Primary topic/query
- Depth level (default: 2)
- Focus areas (if specified)
- Research type (basic, academic, competitive, technical)
- Output preferences
- Max results limit
```

### 2. Initialize Research Parameters
```python
config = {
    "topic": parsed_topic,
    "depth": min(parsed_depth, 5),  # Cap at 5 for performance
    "max_results_per_level": 20,
    "relevance_threshold": 0.6,
    "focus_keywords": extract_focus_keywords(topic, focus_areas),
    "exclude_domains": ["pinterest.com", "facebook.com"],  # Avoid social media
    "prefer_domains": identify_authoritative_domains(topic)
}
```

### 3. Execute Research Workflow
```bash
# Run the recursive search script
python scripts/jina_recursive_search.py \
  --topic "$topic" \
  --depth $depth \
  --output "$output_dir" \
  --config "$config_json"
```

### 4. Monitor Progress
Provide updates to the user:
```
🔍 Starting recursive search for "machine learning optimization"
📊 Depth: 3 levels | Max results: 100

Level 1: Searching... ✓ Found 25 relevant results
Level 1: Extracting content... ✓ 23/25 successful
Level 2: Following 67 relevant links...
Level 2: Extracting... ✓ 62/67 successful
Level 3: Following 134 relevant links...
Level 3: Extracting... ✓ 119/134 successful

📁 Organizing findings by subtopic...
✅ Research complete! Found 204 relevant sources.
```

### Natural Language Request Patterns

**Research requests:**
- "Research [topic] and find comprehensive information"
- "Do a deep dive into [topic] and organize findings"
- "Find everything about [topic], especially [subtopic]"
- "Gather technical documentation on [topic]"
- "Research competitors in [industry/topic]"

**Academic requests:**
- "Find academic papers on [topic]"
- "Research [topic] with citations and peer-reviewed sources"
- "Gather scholarly articles about [topic]"

**Competitive analysis:**
- "Research [company/product] and its competitors"
- "Analyze the [industry] landscape"
- "Find what [competitor] is doing in [area]"

### Response Templates

**Research initiated:**
```
I'll perform a recursive search on "[topic]" going [depth] levels deep.

This will:
1. Search for initial sources on [topic]
2. Extract content from relevant results
3. Follow promising links up to [depth] levels
4. Organize findings by relevance and subtopic

Estimated time: [estimate based on depth] minutes

Starting search now...
```

**Progress update:**
```
Research Progress Update:

🔍 Search Progress:
- Level 1: ✅ Complete (25 sources found)
- Level 2: ⏳ In progress (45/60 extracted)
- Level 3: ⏸️ Pending

📊 Current Statistics:
- Total URLs processed: 85
- Successful extractions: 70
- Unique subtopics found: 8
- High-relevance content: 23 articles

🏆 Top finding so far:
"[Article Title]" - Relevance: 95%
Key insight: [brief summary]

⏱️ Elapsed time: 3 minutes
📝 Preliminary results saved to: docs/research/[topic]/
```

**Final results:**
```
✅ Recursive search completed successfully!

📊 Final Statistics:
- Search depth reached: [depth]
- Total sources analyzed: [total]
- High-quality content found: [count]
- Processing time: [time]

🎯 Key Findings:

1. **[Main Finding Title]** (12 sources)
   - [Key insight 1]
   - [Key insight 2]
   - Most authoritative source: [URL]

2. **[Second Finding Title]** (8 sources)
   - [Key insight 1]
   - [Key insight 2]

📁 Results organized in: docs/research/[topic]-[timestamp]/
- README.md - Start here for overview
- by-subtopic/ - Content organized by topic
- summary.json - Detailed statistics and findings

Would you like me to:
1. Generate an executive summary?
2. Extract specific subtopics in more detail?
3. Create a presentation from the findings?
4. Continue searching deeper on specific areas?
```

### Advanced Patterns

**1. Iterative Refinement:**
```python
# Start broad, then narrow based on findings
initial_results = search(topic, depth=1)
refined_topics = identify_promising_subtopics(initial_results)

for subtopic in refined_topics[:3]:  # Top 3 subtopics
    deep_results = search(subtopic, depth=3)
    merge_findings(initial_results, deep_results)
```

**2. Cross-Reference Validation:**
```python
# Validate findings across multiple sources
for finding in key_findings:
    confirming_sources = search_for_confirmation(finding)
    finding.confidence = calculate_confidence(confirming_sources)
```

**3. Temporal Analysis:**
```python
# Track how topic has evolved over time
results_by_date = group_by_publication_date(all_results)
trends = analyze_temporal_patterns(results_by_date)
```

### Best Practices

1. **Start Specific**: Better to start with a focused query and expand than to start too broad
2. **Respect Rate Limits**: Include delays between API calls to avoid hitting limits
3. **Filter Early**: Apply relevance filtering at each level to avoid exponential growth
4. **Save Incrementally**: Don't wait until the end to save results
5. **Provide Context**: Always include source URLs and extraction timestamps
6. **Handle Failures Gracefully**: Some URLs will fail; log them but continue
7. **Deduplicate Content**: Check for duplicate content across different URLs
8. **Prioritize Quality**: Better to have fewer high-quality sources than many poor ones
9. **Monitor Resource Usage**: Large searches can consume significant time/API calls
10. **Summarize Findings**: Always provide digestible summaries, not just raw data

### Error Handling

**Common issues and solutions:**

1. **Rate limit exceeded**:
   ```python
   # Implement exponential backoff
   wait_time = 60 * (2 ** retry_count)
   await asyncio.sleep(wait_time)
   ```

2. **Memory issues with large searches**:
   ```python
   # Process in chunks and save incrementally
   chunk_size = 50
   for chunk in chunks(urls, chunk_size):
       results = await process_chunk(chunk)
       save_incremental(results)
   ```

3. **Timeout on deep recursion**:
   ```python
   # Set maximum time limit
   timeout = 300 * depth  # 5 minutes per level
   with asyncio.timeout(timeout):
       results = await recursive_search()
   ```

### Integration with Existing Tools

This command can be combined with other commands for powerful workflows:

```bash
# 1. Research a topic, then extract specific findings
/JinaRecursiveSearch "kubernetes security" --depth 3
/Jina2Docs docs/research/kubernetes-security/by-relevance/high-relevance/article1.md

# 2. Competitive research followed by detailed analysis
/JinaRecursiveSearch "email marketing" --competitive
/analyze docs/research/email-marketing/competitors/

# 3. Academic research with citation following
/JinaRecursiveSearch "machine learning bias" --academic --citations
/extract-citations docs/research/ml-bias/sources.json
```

## Implementation Requirements

This command requires:
1. Python 3.8+ with asyncio support
2. Access to Jina Search and Reader APIs (API keys in backend/.env)
3. Sufficient disk space for storing results (estimate 100MB per 1000 sources)
4. Network bandwidth for parallel requests
5. The helper script at `scripts/jina_recursive_search.py`

## Performance Considerations

- **Depth 1**: ~30 seconds, ~20-50 sources
- **Depth 2**: ~2-5 minutes, ~100-300 sources  
- **Depth 3**: ~10-20 minutes, ~500-1000 sources
- **Depth 4**: ~30-60 minutes, ~2000-5000 sources
- **Depth 5**: ~1-2 hours, ~5000-10000 sources

Adjust depth based on your needs and available time.