# Embedding Data Structure & Focus Areas

## Overview

This document details the exact data structure used for knowledge extraction and embedding generation, based on the actual implementation in the SalesAgenttraining system.

## Focus Areas (M1-M9)

The system processes content through 9 specialized focus areas, each stored in separate directories:

### M1: Objection Mindset (embedding_data4)
**Focus**: "Objections = info requests, not rejections"
- Reframes objections as opportunities for clarification
- Builds resilience against rejection
- Emphasizes curiosity over defensiveness

### M2: Objection Discovery (embedding_data5)
**Focus**: "Clarifying questions, isolation, root cause"
- Techniques for understanding the real objection
- Drilling down to core concerns
- Separating symptoms from root issues

### M3: Frameworks (embedding_data6)
**Focus**: "Feel-Felt-Found, LAARC, AAA, Clarify-Isolate-Overcome"
- **Feel-Felt-Found**: Empathy-based objection handling
- **LAARC**: Listen, Acknowledge, Assess, Respond, Close
- **AAA**: Acknowledge, Align, Advance
- **Clarify-Isolate-Overcome**: Systematic objection resolution

### M4: Price Objections (embedding_data7)
**Focus**: "Reframe to ROI, 'Compared to what?', breakdown strategy"
- Shifting from cost to value conversation
- Contextualizing price concerns
- Breaking down total cost into manageable pieces

### M5: "Think About It" Handling (embedding_data8)
**Focus**: "'What specifically?', Conditional closing"
- Uncovering hidden concerns
- Creating urgency without pressure
- Conditional commitments

### M6: "Not Interested" Response (embedding_data9)
**Focus**: "Probe softly, diagnose if disinterest or timing"
- Gentle exploration techniques
- Differentiating between timing and fit issues
- Graceful exit strategies

### M7: Competitive Objections (embedding_data10)
**Focus**: "Unique value framing without attacking others"
- Positioning against competitors respectfully
- Highlighting unique differentiators
- Building trust through professionalism

### M8: Time & Budget Constraints (embedding_data11)
**Focus**: "Offer micro-commitments, payment options, phased rollouts"
- Breaking down large commitments
- Creative financing solutions
- Pilot program strategies

### M9: Advanced Layering (embedding_data12)
**Focus**: "Objection prevention via discovery, story-loop-back closes"
- Preemptive objection handling
- Narrative-based selling
- Connecting discovery insights to closing

## JSON Data Structure

### Base Structure (Per Video/Source)
```json
{
  "source_video": "1LDRu3zYfdI",
  "focus_area": "Objections = info requests, not rejections",
  "entries": [...]
}
```

### Entry Types & Examples

#### 1. Technique Entry
```json
{
  "type": "technique",
  "content": "Build sales processes by repeating one simple step again and again until it becomes comfortable and automatic.",
  "speaker_perspective": "sales agent",
  "notes": "Focuses on consistency and process repetition."
}
```

#### 2. Mindset Entry
```json
{
  "type": "mindset",
  "content": "Rejection is just redirection.",
  "speaker_perspective": "sales agent",
  "notes": "Core mindset for resilience against sales rejection."
}
```

#### 3. Sales Phrase Entry
```json
{
  "type": "sales_phrase",
  "content": "I completely understand how you feel. Many of our best clients felt the same way before they saw the results.",
  "speaker_perspective": "sales agent",
  "notes": "Feel-Felt-Found framework application"
}
```

#### 4. Example Entry
```json
{
  "type": "example",
  "content": "Client said 'too expensive' but after asking 'compared to what?', they revealed they were comparing to a DIY solution, not a competitor.",
  "speaker_perspective": "sales agent",
  "notes": "Price objection reframing in action"
}
```

## Content Guidelines

### Entry Requirements
- **Concise**: Maximum 40 words per content field
- **Standalone**: Each entry should be independently valuable
- **Actionable**: Provides clear guidance or insight
- **Contextual**: Notes field adds tactical application details

### Quality Criteria
1. **Relevance**: Directly relates to the focus area
2. **Specificity**: Concrete rather than abstract
3. **Practicality**: Can be immediately applied
4. **Clarity**: Unambiguous and well-articulated

## Embedding Generation Process

### Step 1: Content Extraction
```python
# For each transcript and focus area
for focus_num, (focus_description, dir_suffix) in focus_areas.items():
    embedding_json = extract_embedding_json(
        transcript_content,
        source_filename,
        focus_description
    )
```

### Step 2: Structured Output
Each video generates 9 JSON files (one per focus area):
```
embedding_data4/1LDRu3zYfdI.json  # M1: Objection Mindset
embedding_data5/1LDRu3zYfdI.json  # M2: Objection Discovery
embedding_data6/1LDRu3zYfdI.json  # M3: Frameworks
...
embedding_data12/1LDRu3zYfdI.json # M9: Advanced Layering
```

### Step 3: Vector Embedding
Each entry is converted to a vector embedding with metadata:
```typescript
{
  id: "uuid-v4",
  values: [0.123, -0.456, ...], // 1536-dimensional vector
  metadata: {
    workflowId: "workflow-123",
    sourceId: "1LDRu3zYfdI",
    focusArea: 1,
    entryType: "technique",
    content: "Build sales processes by repeating...",
    notes: "Focuses on consistency and process repetition.",
    timestamp: 1710123456789
  }
}
```

## Storage Organization

### Directory Structure
```
data/
├── transcripts/           # Raw YouTube transcripts
│   ├── 1LDRu3zYfdI.json
│   └── ...
├── embedding_data4/       # M1: Objection Mindset
│   ├── 1LDRu3zYfdI.json
│   └── ...
├── embedding_data5/       # M2: Objection Discovery
│   ├── 1LDRu3zYfdI.json
│   └── ...
└── ...                    # Through embedding_data12
```

### Convex Storage Schema
```typescript
// Each knowledge entry in Convex
{
  _id: "jx7...",
  workflowId: "jh9...",
  sourceId: "1LDRu3zYfdI",
  sourceType: "youtube",
  focusArea: 1,
  entries: [
    {
      type: "technique",
      content: "...",
      speakerPerspective: "sales agent",
      notes: "..."
    }
  ],
  vectorIds: ["vec_123", "vec_124", ...],
  createdAt: "2024-03-15T10:30:00Z"
}
```

## Usage in RAG Workflows

### Query Processing
1. User query → Embedding generation
2. Vector similarity search across focus areas
3. Retrieve relevant entries with metadata
4. Contextualize results based on focus area

### Response Generation
```typescript
// Example query: "How do I handle price objections?"
const relevantEntries = await searchVectors({
  query: "handle price objections",
  focusAreas: [4, 7, 8], // M4: Price, M7: Competitive, M8: Budget
  limit: 10,
  threshold: 0.8
});

// Results prioritized by:
// 1. Vector similarity score
// 2. Focus area relevance
// 3. Entry type (technique > example > phrase > mindset)
```

## Best Practices

### Content Processing
1. **Deduplication**: Check for similar entries across videos
2. **Quality Filtering**: Minimum relevance score of 0.7
3. **Balanced Extraction**: 3-10 entries per focus area per video
4. **Context Preservation**: Maintain source attribution

### Vector Management
1. **Batch Operations**: Process 50 entries at once
2. **Metadata Indexing**: Enable fast filtering by focus area
3. **Version Control**: Track embedding model versions
4. **Cleanup**: Remove orphaned vectors on workflow deletion

## Integration Points

### Frontend Display
- Group entries by focus area for browsing
- Show entry type badges for quick identification
- Highlight high-relevance entries
- Enable focus area filtering

### Agent Usage
- Agents can query specific focus areas
- Combine multiple focus areas for comprehensive responses
- Use entry types to vary response style
- Apply notes for tactical implementation

This structure ensures consistent, high-quality knowledge extraction that can be effectively used for training sales agents and providing contextual assistance.