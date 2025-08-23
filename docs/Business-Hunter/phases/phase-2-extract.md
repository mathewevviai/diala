# Phase 2: Universal Link Extraction

## Overview

Phase 2 processes the raw search results from Phase 1 and extracts clean, validated business website links. This phase works for ANY type of business discovery by intelligently parsing search results and identifying the primary business websites regardless of industry.

## Current LeadGen Implementation Analysis

### Key Components from LeadGen
**File**: `migrate/LeadGen/phases/phase2_extract_links.py`

**Core Functionality**:
- URL extraction from search result snippets
- Domain normalization and deduplication
- Link validation and filtering
- Configurable link limits and processing controls

## Universal Link Extraction Design

### Link Extraction Engine
```python
class UniversalLinkExtractor:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.domain_filters = self._setup_domain_filters()
        self.link_validators = self._setup_link_validators()
    
    def extract_business_links(self, search_results: List[SearchResult]) -> List[BusinessLink]:
        """Extract business links from ANY type of search results"""
        extracted_links = []
        seen_domains = set()
        
        for result in search_results:
            # Extract all URLs from the search result
            urls = self._extract_urls_from_result(result)
            
            for url in urls:
                # Normalize and validate the URL
                normalized_url = self._normalize_url(url)
                domain = self._extract_domain(normalized_url)
                
                # Skip if already processed
                if domain in seen_domains:
                    continue
                
                # Apply domain filters
                if self._should_include_domain(domain, result):
                    business_link = BusinessLink(
                        domain=domain,
                        primary_url=normalized_url,
                        discovered_urls=[url],
                        source_result=result,
                        discovery_metadata=self._get_discovery_metadata(result)
                    )
                    extracted_links.append(business_link)
                    seen_domains.add(domain)
        
        return self._rank_and_filter_links(extracted_links)
```

### Intelligent Domain Filtering
```python
class UniversalDomainFilter:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.generic_exclusions = [
            'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
            'youtube.com', 'wikipedia.org', 'indeed.com', 'glassdoor.com',
            'yelp.com', 'bbb.org', 'crunchbase.com'
        ]
        self.industry_specific_exclusions = self._get_industry_exclusions()
    
    def should_include_domain(self, domain: str, search_result: SearchResult) -> bool:
        """Determine if domain should be included based on hunt configuration"""
        
        # Skip generic social/directory sites
        if any(exclusion in domain for exclusion in self.generic_exclusions):
            return False
        
        # Skip industry-specific exclusions
        if any(exclusion in domain for exclusion in self.industry_specific_exclusions):
            return False
        
        # Apply business-type specific filters
        if not self._matches_business_criteria(domain, search_result):
            return False
        
        # Check domain quality indicators
        if not self._has_quality_indicators(domain, search_result):
            return False
        
        return True
    
    def _get_industry_exclusions(self) -> List[str]:
        """Get industry-specific domains to exclude"""
        industry = self.hunt_config.industry.lower()
        
        exclusions = {
            'technology': ['techcrunch.com', 'venturebeat.com', 'github.com'],
            'healthcare': ['webmd.com', 'mayoclinic.org', 'nih.gov'],
            'finance': ['sec.gov', 'federalreserve.gov', 'investopedia.com'],
            'retail': ['amazon.com', 'ebay.com', 'walmart.com'],
            'manufacturing': ['thomasnet.com', 'manufacturing.net'],
            'legal': ['findlaw.com', 'justia.com', 'martindale.com']
        }
        
        return exclusions.get(industry, [])
    
    def _matches_business_criteria(self, domain: str, result: SearchResult) -> bool:
        """Check if domain matches business criteria"""
        # Look for business indicators in URL structure
        business_indicators = [
            '/about', '/company', '/contact', '/services', '/products',
            '/team', '/careers', '/investors'
        ]
        
        # Check if any discovered URLs have business structure
        has_business_structure = any(
            indicator in url.lower() 
            for url in result.discovered_urls 
            for indicator in business_indicators
        )
        
        # Check for commercial TLD patterns
        commercial_tlds = ['.com', '.co', '.biz', '.net', '.io']
        has_commercial_tld = any(domain.endswith(tld) for tld in commercial_tlds)
        
        return has_business_structure or has_commercial_tld
```

### Link Quality Assessment
```python
class LinkQualityAssessor:
    def assess_link_quality(self, business_link: BusinessLink) -> LinkQualityScore:
        """Assess the quality of a business link for ANY industry"""
        score = 0.0
        max_score = 100.0
        
        # Domain authority indicators (25% weight)
        domain_score = self._assess_domain_authority(business_link.domain)
        score += domain_score * 0.25
        
        # Content relevance (30% weight)
        relevance_score = self._assess_content_relevance(business_link)
        score += relevance_score * 0.30
        
        # Business website indicators (25% weight)
        business_score = self._assess_business_indicators(business_link)
        score += business_score * 0.25
        
        # Technical quality (20% weight)
        technical_score = self._assess_technical_quality(business_link)
        score += technical_score * 0.20
        
        return LinkQualityScore(
            overall_score=score,
            domain_authority=domain_score,
            content_relevance=relevance_score,
            business_indicators=business_score,
            technical_quality=technical_score
        )
    
    def _assess_business_indicators(self, link: BusinessLink) -> float:
        """Look for indicators that this is a real business website"""
        indicators = {
            'contact_page': 20,      # /contact, /contact-us
            'about_page': 15,        # /about, /about-us, /company
            'services_page': 15,     # /services, /products, /solutions
            'team_page': 10,         # /team, /staff, /leadership
            'careers_page': 10,      # /careers, /jobs
            'privacy_policy': 10,    # /privacy, /privacy-policy
            'terms_of_service': 10,  # /terms, /tos
            'commercial_email': 10   # info@, contact@, sales@
        }
        
        score = 0
        for url in link.discovered_urls:
            url_lower = url.lower()
            for indicator, points in indicators.items():
                if self._url_contains_indicator(url_lower, indicator):
                    score += points
                    break  # Don't double-count
        
        return min(score, 100)  # Cap at 100
```

### Industry-Agnostic URL Processing
```python
class UniversalURLProcessor:
    def process_search_result_urls(self, search_result: SearchResult) -> List[str]:
        """Extract and process URLs from ANY type of search result"""
        urls = []
        
        # Extract from result URL
        if search_result.url:
            urls.append(search_result.url)
        
        # Extract from snippet/description
        snippet_urls = self._extract_urls_from_text(search_result.snippet)
        urls.extend(snippet_urls)
        
        # Extract from structured data if available
        if hasattr(search_result, 'structured_data'):
            structured_urls = self._extract_from_structured_data(search_result.structured_data)
            urls.extend(structured_urls)
        
        # Clean and normalize all URLs
        clean_urls = []
        for url in urls:
            cleaned = self._clean_and_normalize_url(url)
            if cleaned and self._is_valid_business_url(cleaned):
                clean_urls.append(cleaned)
        
        return list(set(clean_urls))  # Remove duplicates
    
    def _clean_and_normalize_url(self, url: str) -> Optional[str]:
        """Clean and normalize URL for ANY business type"""
        if not url:
            return None
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        try:
            parsed = urlparse(url)
            
            # Remove common tracking parameters
            query_params = parse_qs(parsed.query)
            cleaned_params = {
                k: v for k, v in query_params.items()
                if k not in ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid']
            }
            
            # Rebuild URL
            clean_url = urlunparse((
                parsed.scheme,
                parsed.netloc.lower(),
                parsed.path,
                parsed.params,
                urlencode(cleaned_params, doseq=True),
                ''  # Remove fragment
            ))
            
            return clean_url
            
        except Exception:
            return None
    
    def _is_valid_business_url(self, url: str) -> bool:
        """Check if URL looks like a business website"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Basic validation
            if not domain or '.' not in domain:
                return False
            
            # Skip obvious non-business domains
            non_business_patterns = [
                'gov', 'edu', 'mil',  # Government/education
                'blog', 'wordpress', 'blogspot',  # Blog platforms
                'github', 'gitlab',  # Code repositories
                'pdf', 'doc', 'docx'  # File extensions in domain
            ]
            
            if any(pattern in domain for pattern in non_business_patterns):
                return False
            
            # Skip URLs that are clearly not business homepages
            path = parsed.path.lower()
            non_business_paths = [
                '/search', '/results', '/directory', '/listing',
                '/profile', '/user/', '/users/', '/member/',
                '/article/', '/blog/', '/news/', '/press/'
            ]
            
            if any(path.startswith(bad_path) for bad_path in non_business_paths):
                return False
            
            return True
            
        except Exception:
            return False
```

## Backend API Integration

### Link Extraction Endpoints
```python
@router.post("/hunts/{hunt_id}/phases/extract-links")
async def start_link_extraction(hunt_id: str, options: LinkExtractionOptions = None):
    """Start link extraction phase for any hunt type"""
    hunt = await get_hunt(hunt_id)
    search_results = await get_search_results(hunt_id)
    
    # Configure extraction based on hunt type
    extractor = UniversalLinkExtractor(hunt.configuration)
    
    # Start background task
    task = await start_extraction_task.delay(hunt_id, search_results, options)
    
    return {
        "task_id": task.id,
        "status": "started",
        "estimated_completion": calculate_extraction_time(len(search_results))
    }

@router.get("/hunts/{hunt_id}/phases/extract-links/progress")
async def get_extraction_progress(hunt_id: str):
    """Get real-time progress of link extraction"""
    progress = await redis.get(f"hunt:{hunt_id}:extraction_progress")
    return json.loads(progress) if progress else {"status": "not_started"}
```

### Real-time Progress Tracking
```python
class ExtractionProgressTracker:
    def __init__(self, hunt_id: str, total_results: int):
        self.hunt_id = hunt_id
        self.total_results = total_results
        self.processed = 0
        self.links_found = 0
        self.errors = 0
    
    async def update_progress(self, processed_count: int, links_found: int, errors: int):
        """Update extraction progress in real-time"""
        self.processed = processed_count
        self.links_found = links_found
        self.errors = errors
        
        progress_data = {
            "phase": "link_extraction",
            "total_results": self.total_results,
            "processed": self.processed,
            "links_found": self.links_found,
            "errors": self.errors,
            "completion_percentage": (self.processed / self.total_results) * 100,
            "current_status": f"Extracted {self.links_found} business links from {self.processed} results",
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Update Redis for real-time monitoring
        await redis.set(
            f"hunt:{self.hunt_id}:extraction_progress",
            json.dumps(progress_data),
            ex=3600
        )
        
        # Broadcast via WebSocket
        await websocket_manager.broadcast_to_hunt(self.hunt_id, progress_data)
```

## Frontend Integration

### Link Extraction Monitoring
```typescript
const LinkExtractionMonitor: React.FC<{ huntId: string }> = ({ huntId }) => {
    const [progress, setProgress] = useState<ExtractionProgress>();
    
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/hunts/${huntId}`);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            if (update.phase === 'link_extraction') {
                setProgress(update);
            }
        };
        
        return () => ws.close();
    }, [huntId]);
    
    return (
        <div className="extraction-monitor">
            <div className="progress-header">
                <h3>Extracting Business Links</h3>
                <span>{progress?.completion_percentage.toFixed(1) || 0}% Complete</span>
            </div>
            
            <ProgressBar value={progress?.completion_percentage || 0} />
            
            <div className="extraction-stats">
                <StatItem 
                    label="Results Processed" 
                    value={progress?.processed || 0}
                    total={progress?.total_results || 0}
                />
                <StatItem 
                    label="Business Links Found" 
                    value={progress?.links_found || 0}
                />
                <StatItem 
                    label="Errors" 
                    value={progress?.errors || 0}
                    isError={true}
                />
            </div>
            
            <div className="current-status">
                {progress?.current_status || "Preparing to extract links..."}
            </div>
        </div>
    );
};
```

## Configurable Extraction Rules

### Hunt-Specific Link Rules
```python
class HuntSpecificLinkRules:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.rules = self._build_extraction_rules()
    
    def _build_extraction_rules(self) -> Dict[str, Any]:
        """Build extraction rules based on hunt configuration"""
        rules = {
            "max_links_per_domain": 1,  # Usually want one primary URL per business
            "preferred_url_patterns": [],
            "exclude_url_patterns": [],
            "domain_quality_threshold": 50,
            "include_subdomains": False
        }
        
        # Industry-specific rules
        industry = self.hunt_config.industry.lower()
        
        if industry == "technology":
            rules["preferred_url_patterns"].extend([
                r".*\.(com|io|co)$",  # Prefer commercial TLDs
                r".*/about.*", r".*/company.*"
            ])
            rules["exclude_url_patterns"].extend([
                r".*/blog/.*", r".*/news/.*"  # Skip blog/news pages
            ])
        
        elif industry == "healthcare":
            rules["preferred_url_patterns"].extend([
                r".*\.(com|org)$",
                r".*/practice.*", r".*/clinic.*"
            ])
            rules["exclude_url_patterns"].extend([
                r".*/patient-portal.*", r".*/appointments.*"
            ])
        
        elif industry == "legal":
            rules["preferred_url_patterns"].extend([
                r".*law.*", r".*legal.*", r".*attorney.*"
            ])
        
        # Business size specific rules
        if self.hunt_config.companySize == "Enterprise":
            rules["domain_quality_threshold"] = 70  # Higher standards
            rules["preferred_url_patterns"].append(r".*/investors.*")
        
        return rules
```

## Error Handling & Recovery

### Robust Link Processing
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def extract_links_with_retry(search_results: List[SearchResult]) -> List[BusinessLink]:
    """Extract links with automatic retry on failures"""
    try:
        extractor = UniversalLinkExtractor()
        return await extractor.extract_business_links(search_results)
    except NetworkError:
        logger.warning("Network error during link extraction, retrying...")
        raise
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return []  # Return empty list for validation errors
    except Exception as e:
        logger.error(f"Unexpected error during link extraction: {e}")
        raise
```

## Quality Metrics & Analytics

### Extraction Quality Tracking
```python
class ExtractionQualityMetrics:
    def calculate_extraction_metrics(self, search_results: List[SearchResult], 
                                   extracted_links: List[BusinessLink]) -> Dict[str, float]:
        """Calculate quality metrics for link extraction phase"""
        total_results = len(search_results)
        total_links = len(extracted_links)
        
        # Basic extraction metrics
        extraction_rate = total_links / total_results if total_results > 0 else 0
        
        # Quality distribution
        high_quality_links = len([l for l in extracted_links if l.quality_score >= 80])
        medium_quality_links = len([l for l in extracted_links if 60 <= l.quality_score < 80])
        low_quality_links = len([l for l in extracted_links if l.quality_score < 60])
        
        # Domain diversity
        unique_domains = len(set(link.domain for link in extracted_links))
        domain_diversity = unique_domains / total_links if total_links > 0 else 0
        
        return {
            "extraction_rate": extraction_rate,
            "total_links_extracted": total_links,
            "high_quality_percentage": (high_quality_links / total_links) * 100 if total_links > 0 else 0,
            "medium_quality_percentage": (medium_quality_links / total_links) * 100 if total_links > 0 else 0,
            "low_quality_percentage": (low_quality_links / total_links) * 100 if total_links > 0 else 0,
            "domain_diversity": domain_diversity,
            "average_quality_score": np.mean([l.quality_score for l in extracted_links]) if extracted_links else 0
        }
```

This universal link extraction phase ensures that business websites are accurately identified and validated regardless of the industry or business type being hunted.