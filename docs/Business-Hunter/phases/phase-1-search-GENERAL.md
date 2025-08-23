# Phase 1: General Business Search Implementation

## Overview

Phase 1 implements a **COMPLETELY CONFIGURABLE** business discovery engine that can search for ANY type of business across ANY industry. Users define their own search criteria, and the system automatically discovers relevant businesses based on those parameters.

## Core Search Engine Design

### Universal Business Search Parameters

```typescript
interface BusinessSearchConfig {
    // Basic Configuration
    huntName: string;
    industry: string;              // "Technology", "Healthcare", "Manufacturing", etc.
    businessTypes: string[];       // ["SaaS", "E-commerce", "Consulting", "Agency"]
    
    // Location Targeting
    locations: string[];           // ["San Francisco, CA", "Remote", "United States"]
    includeRemote: boolean;
    geographicRadius?: number;     // Miles from primary location
    
    // Business Characteristics
    companySize: string;           // "Startup", "SMB", "Enterprise", "Any"
    revenueRange?: string;         // "$1M-$10M", "$10M+", etc.
    employeeCount?: string;        // "1-50", "51-200", "200+", etc.
    
    // Search Keywords & Criteria
    primaryKeywords: string[];     // Main search terms
    secondaryKeywords: string[];   // Additional relevant terms
    excludeKeywords: string[];     // Terms to avoid
    
    // Data Sources
    includeLinkedIn: boolean;
    includeCrunchbase: boolean;
    includeGoogleMaps: boolean;
    includeYellowPages: boolean;
    includeIndustryDirectories: boolean;
    
    // Search Depth & Limits
    maxResults: number;            // Total businesses to find
    searchDepth: number;           // How deep to search (1-5)
    qualityThreshold: number;      // Minimum match score (0-100)
}
```

### Universal Query Generation

```python
class UniversalQueryGenerator:
    def __init__(self, config: BusinessSearchConfig):
        self.config = config
        
    def generate_search_queries(self) -> List[str]:
        """Generate search queries for ANY business type"""
        queries = []
        
        # Industry + Location queries
        for industry in [self.config.industry] + self.config.businessTypes:
            for location in self.config.locations:
                queries.append(f"{industry} companies in {location}")
                queries.append(f"{industry} businesses {location}")
        
        # Keyword-based queries
        for primary_kw in self.config.primaryKeywords:
            for location in self.config.locations:
                queries.append(f"{primary_kw} {self.config.industry} {location}")
        
        # Company size specific queries
        if self.config.companySize != "Any":
            queries.append(f"{self.config.companySize} {self.config.industry} companies")
        
        # Secondary keyword combinations
        for primary in self.config.primaryKeywords:
            for secondary in self.config.secondaryKeywords:
                queries.append(f"{primary} {secondary} {self.config.industry}")
        
        # Revenue/employee based queries (if specified)
        if self.config.revenueRange:
            queries.append(f"{self.config.industry} companies revenue {self.config.revenueRange}")
        
        return queries
    
    def generate_exclusion_terms(self) -> List[str]:
        """Generate terms to exclude from search"""
        exclusions = self.config.excludeKeywords.copy()
        
        # Add generic exclusions
        exclusions.extend([
            "job", "career", "hiring", "employment",
            "wikipedia", "linkedin.com/in/", "facebook.com",
            "news", "article", "blog"
        ])
        
        return exclusions
```

### Multi-Source Business Discovery

```python
class UniversalBusinessSearchEngine:
    def __init__(self):
        self.search_sources = {
            'google': GoogleBusinessSearch(),
            'bing': BingBusinessSearch(),
            'linkedin': LinkedInCompanySearch(),
            'crunchbase': CrunchbaseSearch(),
            'maps': GoogleMapsBusinessSearch(),
            'yellowpages': YellowPagesSearch(),
            'directories': IndustryDirectorySearch()
        }
    
    async def discover_businesses(self, config: BusinessSearchConfig) -> List[BusinessResult]:
        """Discover businesses based on user configuration"""
        all_results = []
        query_generator = UniversalQueryGenerator(config)
        
        # Get all search queries
        search_queries = query_generator.generate_search_queries()
        exclusion_terms = query_generator.generate_exclusion_terms()
        
        # Execute searches across enabled sources
        enabled_sources = self._get_enabled_sources(config)
        
        for source_name, source in enabled_sources.items():
            source_results = await self._search_with_source(
                source, search_queries, exclusion_terms, config
            )
            
            # Tag results with source
            for result in source_results:
                result.discovery_source = source_name
            
            all_results.extend(source_results)
            
            # Check if we've hit our target
            if len(all_results) >= config.maxResults:
                break
        
        # Deduplicate and score results
        unique_results = self._deduplicate_businesses(all_results)
        scored_results = self._score_business_relevance(unique_results, config)
        
        # Filter by quality threshold
        filtered_results = [
            r for r in scored_results 
            if r.relevance_score >= config.qualityThreshold
        ]
        
        return filtered_results[:config.maxResults]
```

### Configurable Business Scoring

```python
class UniversalBusinessScorer:
    def score_business_match(self, business: BusinessResult, config: BusinessSearchConfig) -> float:
        """Score how well a business matches search criteria"""
        score = 0.0
        max_score = 0.0
        
        # Industry match (30% weight)
        if self._matches_industry(business, config):
            score += 30
        max_score += 30
        
        # Location match (25% weight)
        location_score = self._score_location_match(business, config)
        score += location_score * 25
        max_score += 25
        
        # Keywords match (25% weight)
        keyword_score = self._score_keyword_match(business, config)
        score += keyword_score * 25
        max_score += 25
        
        # Company size match (10% weight)
        if self._matches_company_size(business, config):
            score += 10
        max_score += 10
        
        # Business type match (10% weight)
        if self._matches_business_type(business, config):
            score += 10
        max_score += 10
        
        return (score / max_score) * 100 if max_score > 0 else 0
    
    def _matches_industry(self, business: BusinessResult, config: BusinessSearchConfig) -> bool:
        """Check if business matches target industry"""
        industry_terms = [config.industry.lower()] + [bt.lower() for bt in config.businessTypes]
        business_description = (business.description or "").lower()
        
        return any(term in business_description for term in industry_terms)
    
    def _score_keyword_match(self, business: BusinessResult, config: BusinessSearchConfig) -> float:
        """Score keyword relevance"""
        all_keywords = config.primaryKeywords + config.secondaryKeywords
        business_text = f"{business.name} {business.description}".lower()
        
        matches = sum(1 for kw in all_keywords if kw.lower() in business_text)
        return matches / len(all_keywords) if all_keywords else 0
```

## Frontend Configuration Interface

### Dynamic Hunt Configuration

```typescript
const UniversalHuntConfigModal: React.FC = () => {
    const [config, setConfig] = useState<BusinessSearchConfig>({
        huntName: '',
        industry: '',
        businessTypes: [],
        locations: [],
        primaryKeywords: [],
        // ... other defaults
    });
    
    const industryOptions = [
        'Technology', 'Healthcare', 'Finance', 'Manufacturing',
        'Retail', 'Real Estate', 'Education', 'Consulting',
        'Legal Services', 'Marketing', 'Construction', 'Other'
    ];
    
    const businessTypesByIndustry = {
        'Technology': ['SaaS', 'Software Development', 'AI/ML', 'Cybersecurity', 'Mobile Apps'],
        'Healthcare': ['Medical Practice', 'Telehealth', 'Medical Devices', 'Pharmaceuticals'],
        'Finance': ['Banking', 'Insurance', 'Investment', 'Fintech', 'Accounting'],
        // ... other mappings
    };
    
    return (
        <Modal>
            <form onSubmit={handleSubmit}>
                {/* Industry Selection */}
                <Select
                    label="Industry"
                    options={industryOptions}
                    onChange={(industry) => setConfig({...config, industry})}
                />
                
                {/* Dynamic Business Types */}
                <MultiSelect
                    label="Business Types"
                    options={businessTypesByIndustry[config.industry] || []}
                    onChange={(types) => setConfig({...config, businessTypes: types})}
                />
                
                {/* Location Targeting */}
                <LocationPicker
                    label="Target Locations"
                    onChange={(locations) => setConfig({...config, locations})}
                />
                
                {/* Keywords Configuration */}
                <KeywordInput
                    label="Primary Keywords"
                    placeholder="e.g., cloud, enterprise, B2B"
                    onChange={(keywords) => setConfig({...config, primaryKeywords: keywords})}
                />
                
                {/* Data Source Selection */}
                <CheckboxGroup label="Search Sources">
                    <Checkbox 
                        label="LinkedIn Companies" 
                        checked={config.includeLinkedIn}
                        onChange={(checked) => setConfig({...config, includeLinkedIn: checked})}
                    />
                    <Checkbox 
                        label="Google Maps" 
                        checked={config.includeGoogleMaps}
                        onChange={(checked) => setConfig({...config, includeGoogleMaps: checked})}
                    />
                    {/* More source options */}
                </CheckboxGroup>
                
                {/* Advanced Options */}
                <AdvancedOptions>
                    <RangeSlider
                        label="Search Depth"
                        min={1} max={5}
                        value={config.searchDepth}
                        onChange={(depth) => setConfig({...config, searchDepth: depth})}
                    />
                    <NumberInput
                        label="Max Results"
                        value={config.maxResults}
                        onChange={(max) => setConfig({...config, maxResults: max})}
                    />
                </AdvancedOptions>
            </form>
        </Modal>
    );
};
```

## Example Use Cases

### SaaS Company Hunt
```javascript
const saasHuntConfig = {
    huntName: "Bay Area SaaS Companies",
    industry: "Technology",
    businessTypes: ["SaaS", "Software Development"],
    locations: ["San Francisco, CA", "San Jose, CA"],
    primaryKeywords: ["cloud", "enterprise", "B2B", "software"],
    secondaryKeywords: ["API", "platform", "automation"],
    maxResults: 500,
    searchDepth: 3
};
```

### Local Service Businesses
```javascript
const localServicesConfig = {
    huntName: "NYC Marketing Agencies",
    industry: "Marketing",
    businessTypes: ["Digital Agency", "Advertising", "PR"],
    locations: ["New York, NY"],
    primaryKeywords: ["marketing", "advertising", "digital"],
    secondaryKeywords: ["social media", "SEO", "PPC"],
    maxResults: 200,
    includeGoogleMaps: true
};
```

### Manufacturing Companies
```javascript
const manufacturingConfig = {
    huntName: "US Manufacturing Companies",
    industry: "Manufacturing",
    businessTypes: ["Automotive", "Electronics", "Machinery"],
    locations: ["United States"],
    primaryKeywords: ["manufacturing", "production", "factory"],
    companySize: "Enterprise",
    employeeCount: "200+",
    maxResults: 1000
};
```

## Implementation Benefits

### Complete Flexibility
- **ANY Industry**: Technology, healthcare, manufacturing, retail, services
- **ANY Business Type**: From startups to enterprises, local to global
- **ANY Location**: City, state, country, or worldwide searches
- **ANY Criteria**: Custom keywords, company size, revenue, employee count

### Scalable Architecture
- Modular search sources that can be enabled/disabled
- Configurable scoring algorithms
- Custom validation rules per hunt type
- Real-time progress monitoring for any search

### User-Driven Configuration
- Point-and-click hunt setup
- Industry-specific templates
- Save and reuse configurations
- Custom search parameter validation

This general-purpose approach allows users to hunt for literally ANY type of business using the same powerful discovery engine, just with different configuration parameters.