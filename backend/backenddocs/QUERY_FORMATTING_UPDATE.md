# Query Formatting Update for Hunter Search

## Problem
The Jina AI search was receiving poorly formatted queries that were just concatenated keywords, like:
```
"Roofing and Construction roofing contractor roof repair commercial roofing residential roofing guttering slate roof tile roof roofing startup small business Belfast, Northern Ireland, UK"
```

This resulted in poor search results as Jina AI couldn't understand the intent properly.

## Solution
Added AI-powered query formatting that converts keyword strings into natural language queries before sending to Jina AI.

### Changes Made

1. **Added Query Formatting Function** (`format_query_with_deepseek`):
   - Uses DeepSeek or OpenAI to convert keywords into 2-5 natural language queries
   - Includes caching to avoid repeated API calls for the same keywords
   - Has a fallback method if AI APIs are unavailable

2. **Modified Search Flow**:
   - Keywords are now formatted before being sent to Jina AI
   - Complex queries (>6 words) trigger the formatting process
   - Multiple formatted queries are searched in parallel
   - Results are aggregated and deduplicated

3. **Example Transformation**:
   - Input: "Roofing and Construction roofing contractor roof repair commercial roofing residential roofing guttering slate roof tile roof roofing startup small business Belfast, Northern Ireland, UK"
   - Output:
     - "roofing contractors in Belfast UK"
     - "commercial roof repair services Belfast"
     - "residential roofing companies Northern Ireland"
     - "Belfast roofing startups and small businesses"

### Configuration
Requires one of these environment variables:
- `DEEPSEEK_API_KEY` (preferred, more cost-effective)
- `OPENAI_API_KEY` (fallback)

### Benefits
1. **Better Search Results**: Natural language queries yield more relevant results
2. **Multiple Perspectives**: Each search covers different aspects of the requirements
3. **Cached Queries**: Reduces API calls and improves performance
4. **Fallback Support**: Works even without AI APIs (with reduced effectiveness)

### Testing
Run `python test_query_formatting.py` to test the formatting functionality.