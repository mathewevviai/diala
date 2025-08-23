# Phase 1: Search Implementation

## Overview

Phase 1 implements the automated business discovery engine that searches across multiple data sources to find potential FCA-approved finance companies with broker/affiliate programs. This phase forms the foundation of the entire Business Hunter pipeline.

## Current Implementation Analysis

### Key Components from LeadGen

**File**: `migrate/LeadGen/phases/phase1_search.py`

**Core Functionality**:
- Multi-query search strategy with domain exclusions
- Configurable search depth and iteration limits
- Target-based result collection (1000 results default)
- Domain deduplication and result normalization
- Progress tracking with detailed logging

**Key Configuration**:
```python
TARGET_RESULTS = 1000  # Stop when this many results found
MAX_SEARCH_ITERATIONS = 20  # Per base query
MAX_PAGES_PER_QUERY = 5  # Results pages to check
MIN_PAGES_PER_QUERY = 2  # Minimum before stopping
MAX_EXCLUSIONS = 7  # Domain exclusions per query
```

**Search Strategies**:
1. Base query execution
2. Domain exclusion iterations
3. Result deduplication
4. Progress-based termination

## Business Hunter Integration

### Backend API Implementation

#### Search Workflow Model
```python
class SearchWorkflow(BaseModel):
    id: str
    name: str
    status: SearchStatus
    parameters: SearchParameters
    results: SearchResults
    created_at: datetime
    updated_at: datetime

class SearchParameters(BaseModel):
    location: str
    business_type: str
    keywords: List[str]
    include_linkedin: bool
    search_depth: int
    max_results: int = 1000
    custom_queries: Optional[List[str]]

class SearchResults(BaseModel):
    pages_found: int
    domains_discovered: int
    unique_businesses: int
    search_iterations: int
    completion_percentage: float
```

#### API Endpoints

**Create Search Workflow**
```http
POST /api/v1/business-hunter/workflows
Content-Type: application/json

{
    "name": "SaaS Companies Bay Area",
    "parameters": {
        "location": "San Francisco, CA",
        "business_type": "Software / SaaS",
        "keywords": ["B2B", "Enterprise", "Cloud"],
        "include_linkedin": true,
        "search_depth": 3,
        "max_results": 1000
    }
}
```

**Start Search Phase**
```http
POST /api/v1/business-hunter/workflows/{workflow_id}/phases/search
```

**Get Search Progress**
```http
GET /api/v1/business-hunter/workflows/{workflow_id}/progress
```

### Search Engine Implementation

#### Query Generation Strategy
```python
class SearchQueryGenerator:
    def __init__(self, parameters: SearchParameters):
        self.parameters = parameters
        self.base_queries = self._generate_base_queries()
        self.excluded_domains = set()
    
    def _generate_base_queries(self) -> List[str]:
        """Generate base search queries from parameters"""
        queries = []
        
        # Location-based queries
        if self.parameters.location:
            for keyword in self.parameters.keywords:
                queries.append(f"{keyword} {self.parameters.business_type} {self.parameters.location}")
        
        # Business type queries
        for keyword in self.parameters.keywords:
            queries.append(f"FCA approved {keyword} {self.parameters.business_type}")
        
        # Broker/affiliate specific queries
        queries.extend([
            f"{self.parameters.business_type} broker affiliate program",
            f"{self.parameters.business_type} partner program FCA",
            f"IAR introducer appointed representative {self.parameters.business_type}"
        ])
        
        return queries
    
    def generate_iterations(self, base_query: str) -> Iterator[str]:
        """Generate query iterations with domain exclusions"""
        yield base_query
        
        excluded_batches = [
            list(self.excluded_domains)[i:i+MAX_EXCLUSIONS] 
            for i in range(0, len(self.excluded_domains), MAX_EXCLUSIONS)
        ]
        
        for batch in excluded_batches:
            exclusions = " ".join([f"-site:{domain}" for domain in batch])
            yield f"{base_query} {exclusions}"
```

#### Multi-Source Search Implementation
```python
class BusinessSearchEngine:
    def __init__(self):
        self.search_providers = [
            GoogleSearchProvider(),
            BingSearchProvider(),
            SpecializedDirectoryProvider()
        ]
    
    async def execute_search(self, workflow_id: str, parameters: SearchParameters):
        """Execute multi-phase search process"""
        workflow = await self.get_workflow(workflow_id)
        query_generator = SearchQueryGenerator(parameters)
        
        total_results = []
        excluded_domains = set()
        
        for provider in self.search_providers:
            provider_results = await self._search_with_provider(
                provider, query_generator, excluded_domains
            )
            total_results.extend(provider_results)
            
            # Update excluded domains from results
            excluded_domains.update(
                extract_domain(result.url) for result in provider_results
            )
            
            # Check if target reached
            if len(total_results) >= parameters.max_results:
                break
        
        # Save results and update workflow
        await self._save_search_results(workflow_id, total_results)
        await self._update_workflow_status(workflow_id, "search_completed")
        
        return total_results
```

### Frontend Integration

#### Search Configuration Modal
```typescript
interface SearchConfiguration {
    name: string;
    location: string;
    businessType: string;
    keywords: string[];
    includeLinkedIn: boolean;
    searchDepth: number;
    maxResults: number;
    customQueries?: string[];
}

const SearchConfigurationModal: React.FC<{
    isOpen: boolean;
    onSave: (config: SearchConfiguration) => void;
    onClose: () => void;
}> = ({ isOpen, onSave, onClose }) => {
    // Form handling implementation
    const handleSubmit = async (formData: SearchConfiguration) => {
        await createSearchWorkflow(formData);
        onSave(formData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* Configuration form components */}
        </Modal>
    );
};
```

#### Real-time Progress Monitoring
```typescript
const SearchProgressMonitor: React.FC<{ workflowId: string }> = ({ workflowId }) => {
    const [progress, setProgress] = useState<SearchProgress>();
    
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/workflows/${workflowId}`);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            if (update.phase === 'search') {
                setProgress(update.progress);
            }
        };
        
        return () => ws.close();
    }, [workflowId]);
    
    return (
        <div className="search-progress">
            <ProgressBar value={progress?.completion_percentage || 0} />
            <div className="stats">
                <span>Pages Found: {progress?.pages_found || 0}</span>
                <span>Domains: {progress?.domains_discovered || 0}</span>
                <span>Iteration: {progress?.current_iteration || 0}</span>
            </div>
        </div>
    );
};
```

## Advanced Features

### Intelligent Query Optimization
```python
class QueryOptimizer:
    def optimize_queries(self, initial_results: List[SearchResult]) -> List[str]:
        """Analyze initial results to generate better queries"""
        # Extract common terms from successful results
        successful_domains = [r.domain for r in initial_results if r.relevance_score > 0.7]
        
        # Analyze content patterns
        content_analysis = self._analyze_content_patterns(successful_domains)
        
        # Generate optimized queries
        optimized_queries = self._generate_optimized_queries(content_analysis)
        
        return optimized_queries
```

### Geographic Targeting
```python
class GeographicSearchExtender:
    def expand_location_search(self, base_location: str) -> List[str]:
        """Expand location search to nearby areas"""
        locations = [base_location]
        
        # Add nearby cities/regions
        if "San Francisco" in base_location:
            locations.extend([
                "San Jose, CA", "Oakland, CA", "Berkeley, CA",
                "Bay Area, CA", "Silicon Valley, CA"
            ])
        
        return locations
```

### Search Quality Scoring
```python
class SearchQualityScorer:
    def score_result(self, result: SearchResult, parameters: SearchParameters) -> float:
        """Score search result relevance"""
        score = 0.0
        
        # Location relevance
        if parameters.location.lower() in result.content.lower():
            score += 0.3
        
        # Business type relevance
        if parameters.business_type.lower() in result.content.lower():
            score += 0.3
        
        # Keyword relevance
        keyword_matches = sum(
            1 for keyword in parameters.keywords 
            if keyword.lower() in result.content.lower()
        )
        score += (keyword_matches / len(parameters.keywords)) * 0.4
        
        return min(score, 1.0)
```

## Performance Optimization

### Concurrent Search Execution
```python
async def parallel_search_execution(queries: List[str], providers: List[SearchProvider]):
    """Execute searches in parallel across providers"""
    tasks = []
    
    for query in queries:
        for provider in providers:
            task = asyncio.create_task(provider.search(query))
            tasks.append(task)
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filter successful results
    successful_results = [r for r in results if not isinstance(r, Exception)]
    
    return successful_results
```

### Caching Strategy
```python
class SearchResultCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.cache_ttl = 3600  # 1 hour
    
    async def get_cached_results(self, query_hash: str) -> Optional[List[SearchResult]]:
        """Retrieve cached search results"""
        cached = await self.redis.get(f"search:{query_hash}")
        return json.loads(cached) if cached else None
    
    async def cache_results(self, query_hash: str, results: List[SearchResult]):
        """Cache search results"""
        await self.redis.setex(
            f"search:{query_hash}", 
            self.cache_ttl, 
            json.dumps(results)
        )
```

## Error Handling & Recovery

### Retry Mechanisms
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def robust_search_request(provider: SearchProvider, query: str):
    """Execute search with retry logic"""
    try:
        return await provider.search(query)
    except RateLimitError:
        await asyncio.sleep(60)  # Wait on rate limit
        raise
    except TemporaryError:
        raise  # Retry
    except PermanentError:
        return []  # Skip this query
```

### Graceful Degradation
```python
class SearchFallbackManager:
    def handle_provider_failure(self, failed_provider: SearchProvider):
        """Handle search provider failures gracefully"""
        # Remove failed provider
        self.active_providers.remove(failed_provider)
        
        # Adjust search parameters for remaining providers
        if len(self.active_providers) < 2:
            self.increase_queries_per_provider()
        
        # Notify monitoring system
        self.logger.warning(f"Provider {failed_provider.name} failed, continuing with {len(self.active_providers)} providers")
```

## Monitoring & Analytics

### Search Metrics Collection
```python
class SearchMetricsCollector:
    def collect_phase_metrics(self, workflow_id: str, results: List[SearchResult]):
        """Collect search phase performance metrics"""
        metrics = {
            "workflow_id": workflow_id,
            "total_queries": len(self.executed_queries),
            "successful_queries": len([q for q in self.executed_queries if q.success]),
            "total_results": len(results),
            "unique_domains": len(set(r.domain for r in results)),
            "average_relevance": np.mean([r.relevance_score for r in results]),
            "execution_time": self.end_time - self.start_time,
            "cost_per_result": self.total_cost / len(results) if results else 0
        }
        
        self.metrics_client.record_metrics("search_phase", metrics)
```

This implementation provides a robust, scalable foundation for the Business Hunter search phase with real-time monitoring, intelligent optimization, and comprehensive error handling.