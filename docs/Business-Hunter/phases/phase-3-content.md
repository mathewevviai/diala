# Phase 3: Universal Content Extraction

## Overview

Phase 3 scrapes website content from the business links discovered in Phase 2 and extracts structured business information. This phase works for ANY type of business by using AI-powered content analysis to understand and extract relevant information regardless of industry or website structure.

## Current LeadGen Implementation Analysis

### Key Components from LeadGen
**File**: `migrate/LeadGen/phases/phase3_extract_content.py`

**Core Functionality**:
- Jina AI Reader integration for content extraction
- Concurrent processing of multiple websites
- Content quality assessment and filtering
- Progress tracking with detailed logging

## Universal Content Extraction Design

### AI-Powered Content Extractor
```python
class UniversalContentExtractor:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.ai_reader = JinaAIReader()
        self.content_processors = self._setup_content_processors()
        self.extraction_templates = self._load_extraction_templates()
    
    async def extract_business_content(self, business_links: List[BusinessLink]) -> List[BusinessContent]:
        """Extract content from ANY type of business website"""
        extracted_content = []
        
        # Process websites concurrently
        semaphore = asyncio.Semaphore(10)  # Limit concurrent requests
        
        tasks = []
        for link in business_links:
            task = self._extract_single_website_content(semaphore, link)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter successful extractions
        for result in results:
            if isinstance(result, BusinessContent):
                extracted_content.append(result)
            elif isinstance(result, Exception):
                logger.error(f"Content extraction failed: {result}")
        
        return extracted_content
    
    async def _extract_single_website_content(self, semaphore: asyncio.Semaphore, 
                                            link: BusinessLink) -> BusinessContent:
        """Extract content from a single business website"""
        async with semaphore:
            try:
                # Get raw content using AI reader
                raw_content = await self.ai_reader.extract_content(link.primary_url)
                
                # Process content based on business type
                structured_content = await self._process_raw_content(raw_content, link)
                
                # Extract business information
                business_info = await self._extract_business_information(structured_content)
                
                # Assess content quality
                quality_score = self._assess_content_quality(structured_content, business_info)
                
                return BusinessContent(
                    domain=link.domain,
                    url=link.primary_url,
                    raw_content=raw_content,
                    structured_content=structured_content,
                    business_info=business_info,
                    quality_score=quality_score,
                    extraction_metadata=self._get_extraction_metadata()
                )
                
            except Exception as e:
                logger.error(f"Failed to extract content from {link.primary_url}: {e}")
                raise ContentExtractionError(f"Extraction failed for {link.domain}", link)
```

### Industry-Agnostic Content Processing
```python
class UniversalContentProcessor:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.ai_models = {
            'business_info': OpenAIExtractor('gpt-4'),
            'contact_info': ContactExtractor(),
            'services': ServicesExtractor(),
            'location': LocationExtractor()
        }
    
    async def process_raw_content(self, raw_content: str, link: BusinessLink) -> StructuredContent:
        """Process raw website content into structured business data"""
        
        # Clean and prepare content
        cleaned_content = self._clean_content(raw_content)
        
        # Extract different types of information concurrently
        extraction_tasks = {
            'company_info': self._extract_company_information(cleaned_content),
            'contact_info': self._extract_contact_information(cleaned_content),
            'services_products': self._extract_services_products(cleaned_content),
            'location_info': self._extract_location_information(cleaned_content),
            'business_details': self._extract_business_details(cleaned_content),
            'social_links': self._extract_social_links(cleaned_content),
            'key_people': self._extract_key_people(cleaned_content)
        }
        
        # Execute all extractions concurrently
        results = await asyncio.gather(*extraction_tasks.values(), return_exceptions=True)
        
        # Combine results
        structured_content = StructuredContent()
        for key, result in zip(extraction_tasks.keys(), results):
            if not isinstance(result, Exception):
                setattr(structured_content, key, result)
            else:
                logger.warning(f"Failed to extract {key} from {link.domain}: {result}")
        
        return structured_content
    
    async def _extract_company_information(self, content: str) -> CompanyInfo:
        """Extract company information using AI"""
        prompt = f"""
        Extract company information from this website content. Return as JSON:
        
        {{
            "company_name": "Official company name",
            "description": "Brief company description",
            "industry": "Primary industry",
            "business_type": "Type of business (e.g., SaaS, Consulting, Manufacturing)",
            "founded_year": "Year founded if mentioned",
            "company_size": "Employee count or size category",
            "headquarters": "Main office location",
            "specialties": ["List of specialties or focus areas"],
            "mission_statement": "Company mission if available"
        }}
        
        Website content:
        {content[:4000]}  # Limit content length for API
        """
        
        try:
            response = await self.ai_models['business_info'].extract(prompt)
            return CompanyInfo.parse_raw(response)
        except Exception as e:
            logger.error(f"AI extraction failed for company info: {e}")
            return CompanyInfo()  # Return empty object
    
    async def _extract_contact_information(self, content: str) -> ContactInfo:
        """Extract contact information using pattern matching and AI"""
        # Use regex patterns for common contact info
        contact_patterns = {
            'emails': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phones': r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})',
            'addresses': r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Blvd|Boulevard)',
        }
        
        extracted_contacts = {}
        for contact_type, pattern in contact_patterns.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            extracted_contacts[contact_type] = list(set(matches))  # Remove duplicates
        
        # Use AI to validate and enhance contact info
        ai_prompt = f"""
        From this content, extract and validate contact information:
        
        Content: {content[:2000]}
        
        Found patterns: {extracted_contacts}
        
        Return validated contact info as JSON:
        {{
            "primary_email": "Main business email",
            "secondary_emails": ["Additional emails"],
            "primary_phone": "Main business phone",
            "secondary_phones": ["Additional phones"],
            "address": "Full business address",
            "website": "Primary website URL",
            "contact_form_url": "Contact form URL if available"
        }}
        """
        
        try:
            ai_response = await self.ai_models['contact_info'].extract(ai_prompt)
            validated_contact = ContactInfo.parse_raw(ai_response)
            
            # Merge regex results with AI validation
            return self._merge_contact_information(extracted_contacts, validated_contact)
        except Exception:
            # Fallback to regex results if AI fails
            return ContactInfo.from_patterns(extracted_contacts)
    
    async def _extract_services_products(self, content: str) -> ServicesInfo:
        """Extract services and products offered"""
        # Look for service/product indicators
        service_keywords = [
            'services', 'products', 'solutions', 'offerings',
            'what we do', 'our services', 'capabilities'
        ]
        
        # Find sections that likely contain service information
        service_sections = []
        content_lower = content.lower()
        
        for keyword in service_keywords:
            if keyword in content_lower:
                # Extract surrounding context
                start_idx = content_lower.find(keyword)
                section = content[max(0, start_idx-200):start_idx+1000]
                service_sections.append(section)
        
        # Use AI to extract structured service information
        combined_sections = "\n\n".join(service_sections)
        
        ai_prompt = f"""
        Extract services and products from this business content:
        
        {combined_sections[:3000]}
        
        Return as JSON:
        {{
            "primary_services": ["Main services offered"],
            "products": ["Products sold or developed"],
            "industries_served": ["Target industries"],
            "service_categories": ["Categories of services"],
            "key_features": ["Key features or differentiators"],
            "pricing_model": "Pricing approach if mentioned"
        }}
        """
        
        try:
            response = await self.ai_models['services'].extract(ai_prompt)
            return ServicesInfo.parse_raw(response)
        except Exception:
            return ServicesInfo()
```

### Smart Content Quality Assessment
```python
class ContentQualityAssessor:
    def assess_content_quality(self, structured_content: StructuredContent, 
                             business_info: BusinessInfo) -> ContentQuality:
        """Assess quality of extracted content for ANY business type"""
        
        quality_factors = {
            'completeness': self._assess_completeness(structured_content),
            'accuracy': self._assess_accuracy(structured_content, business_info),
            'relevance': self._assess_relevance(structured_content),
            'contact_completeness': self._assess_contact_completeness(structured_content),
            'business_clarity': self._assess_business_clarity(business_info),
            'content_depth': self._assess_content_depth(structured_content)
        }
        
        # Calculate weighted overall score
        weights = {
            'completeness': 0.25,
            'accuracy': 0.20,
            'relevance': 0.20,
            'contact_completeness': 0.15,
            'business_clarity': 0.10,
            'content_depth': 0.10
        }
        
        overall_score = sum(
            quality_factors[factor] * weight 
            for factor, weight in weights.items()
        )
        
        return ContentQuality(
            overall_score=overall_score,
            factor_scores=quality_factors,
            quality_grade=self._get_quality_grade(overall_score),
            improvement_suggestions=self._get_improvement_suggestions(quality_factors)
        )
    
    def _assess_completeness(self, content: StructuredContent) -> float:
        """Assess how complete the extracted information is"""
        required_fields = [
            'company_info.company_name',
            'company_info.description',
            'contact_info.primary_email',
            'contact_info.primary_phone',
            'services_products.primary_services'
        ]
        
        completed_fields = 0
        for field_path in required_fields:
            if self._has_field_value(content, field_path):
                completed_fields += 1
        
        return (completed_fields / len(required_fields)) * 100
    
    def _assess_business_clarity(self, business_info: BusinessInfo) -> float:
        """Assess how clearly the business model is described"""
        clarity_score = 0
        
        # Check if we have clear business description
        if business_info.description and len(business_info.description) > 50:
            clarity_score += 25
        
        # Check if industry is identified
        if business_info.industry:
            clarity_score += 25
        
        # Check if business type is clear
        if business_info.business_type:
            clarity_score += 25
        
        # Check if specialties are defined
        if business_info.specialties and len(business_info.specialties) > 0:
            clarity_score += 25
        
        return clarity_score
```

## Backend API Integration

### Content Extraction Endpoints
```python
@router.post("/hunts/{hunt_id}/phases/extract-content")
async def start_content_extraction(hunt_id: str, options: ContentExtractionOptions = None):
    """Start content extraction phase for any hunt type"""
    hunt = await get_hunt(hunt_id)
    business_links = await get_business_links(hunt_id)
    
    # Configure extraction based on hunt type and options
    extractor = UniversalContentExtractor(hunt.configuration)
    
    if options:
        extractor.configure_options(options)
    
    # Start background task
    task = await start_content_extraction_task.delay(hunt_id, business_links, options)
    
    return {
        "task_id": task.id,
        "status": "started",
        "websites_to_process": len(business_links),
        "estimated_completion": calculate_extraction_time(len(business_links))
    }

@router.get("/hunts/{hunt_id}/phases/extract-content/progress")
async def get_content_extraction_progress(hunt_id: str):
    """Get real-time progress of content extraction"""
    progress = await redis.get(f"hunt:{hunt_id}:content_progress")
    return json.loads(progress) if progress else {"status": "not_started"}

@router.get("/hunts/{hunt_id}/content/{domain}")
async def get_extracted_content(hunt_id: str, domain: str):
    """Get extracted content for a specific business domain"""
    content = await get_business_content(hunt_id, domain)
    return content
```

### Real-time Content Processing Monitoring
```python
class ContentExtractionProgressTracker:
    def __init__(self, hunt_id: str, total_websites: int):
        self.hunt_id = hunt_id
        self.total_websites = total_websites
        self.processed = 0
        self.successful = 0
        self.failed = 0
        self.current_domain = None
    
    async def update_progress(self, processed: int, successful: int, failed: int, 
                            current_domain: str = None):
        """Update content extraction progress"""
        self.processed = processed
        self.successful = successful
        self.failed = failed
        self.current_domain = current_domain
        
        progress_data = {
            "phase": "content_extraction",
            "total_websites": self.total_websites,
            "processed": self.processed,
            "successful": self.successful,
            "failed": self.failed,
            "success_rate": (self.successful / self.processed) * 100 if self.processed > 0 else 0,
            "completion_percentage": (self.processed / self.total_websites) * 100,
            "current_domain": self.current_domain,
            "current_status": f"Processing {self.current_domain or 'websites'}... ({self.successful} successful, {self.failed} failed)",
            "estimated_remaining": self._estimate_remaining_time(),
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Update Redis
        await redis.set(
            f"hunt:{self.hunt_id}:content_progress",
            json.dumps(progress_data),
            ex=3600
        )
        
        # Broadcast via WebSocket
        await websocket_manager.broadcast_to_hunt(self.hunt_id, progress_data)
```

## Frontend Integration

### Content Extraction Monitoring Dashboard
```typescript
const ContentExtractionMonitor: React.FC<{ huntId: string }> = ({ huntId }) => {
    const [progress, setProgress] = useState<ContentExtractionProgress>();
    const [recentExtractions, setRecentExtractions] = useState<ExtractedContent[]>([]);
    
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/hunts/${huntId}`);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            if (update.phase === 'content_extraction') {
                setProgress(update);
                
                // Add to recent extractions if new content
                if (update.latest_extraction) {
                    setRecentExtractions(prev => 
                        [update.latest_extraction, ...prev.slice(0, 9)]
                    );
                }
            }
        };
        
        return () => ws.close();
    }, [huntId]);
    
    return (
        <div className="content-extraction-monitor">
            <div className="extraction-header">
                <h3>Extracting Business Content</h3>
                <div className="status-badges">
                    <Badge variant="success">{progress?.successful || 0} Successful</Badge>
                    <Badge variant="error">{progress?.failed || 0} Failed</Badge>
                    <Badge variant="neutral">{progress?.success_rate?.toFixed(1) || 0}% Success Rate</Badge>
                </div>
            </div>
            
            <ProgressBar 
                value={progress?.completion_percentage || 0}
                label={`${progress?.processed || 0} of ${progress?.total_websites || 0} websites processed`}
            />
            
            <div className="current-processing">
                <span className="processing-label">Currently Processing:</span>
                <span className="current-domain">{progress?.current_domain || "Preparing..."}</span>
            </div>
            
            <div className="extraction-stats-grid">
                <StatCard
                    title="Websites Processed"
                    value={progress?.processed || 0}
                    total={progress?.total_websites || 0}
                />
                <StatCard
                    title="Content Extracted"
                    value={progress?.successful || 0}
                    trend={progress?.success_rate ? `${progress.success_rate.toFixed(1)}% success` : undefined}
                />
                <StatCard
                    title="Extraction Errors"
                    value={progress?.failed || 0}
                    isError={true}
                />
                <StatCard
                    title="Est. Remaining"
                    value={progress?.estimated_remaining || "Calculating..."}
                />
            </div>
            
            <RecentExtractionsList extractions={recentExtractions} />
        </div>
    );
};

const RecentExtractionsList: React.FC<{ extractions: ExtractedContent[] }> = ({ extractions }) => {
    return (
        <div className="recent-extractions">
            <h4>Recently Extracted</h4>
            <div className="extractions-list">
                {extractions.map((extraction, index) => (
                    <div key={index} className="extraction-item">
                        <div className="extraction-header">
                            <span className="company-name">{extraction.business_info?.company_name || extraction.domain}</span>
                            <Badge variant={extraction.quality_score >= 80 ? "success" : extraction.quality_score >= 60 ? "warning" : "error"}>
                                {extraction.quality_score}% Quality
                            </Badge>
                        </div>
                        <div className="extraction-details">
                            <span>Industry: {extraction.business_info?.industry || "Unknown"}</span>
                            <span>Contact: {extraction.contact_info?.primary_email ? "✓" : "✗"}</span>
                            <span>Services: {extraction.services_info?.primary_services?.length || 0}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

## Advanced Content Processing Features

### Multi-Language Support
```python
class MultiLanguageContentProcessor:
    def __init__(self):
        self.language_detectors = {
            'primary': fasttext.load_model('language_detection.bin'),
            'backup': langdetect.detect
        }
        self.translators = {
            'google': GoogleTranslator(),
            'deepl': DeepLTranslator()
        }
    
    async def process_multilingual_content(self, content: str) -> ProcessedContent:
        """Process content that might be in any language"""
        # Detect language
        detected_language = await self._detect_language(content)
        
        # If not English, translate for processing
        if detected_language != 'en':
            translated_content = await self._translate_content(content, detected_language, 'en')
            # Process both original and translated
            return ProcessedContent(
                original_content=content,
                translated_content=translated_content,
                original_language=detected_language,
                processed_language='en'
            )
        else:
            return ProcessedContent(
                original_content=content,
                original_language='en'
            )
```

### Industry-Specific Content Extractors
```python
class IndustrySpecificExtractors:
    def get_extractor_for_industry(self, industry: str) -> ContentExtractor:
        """Get specialized extractor based on industry"""
        extractors = {
            'technology': TechCompanyExtractor(),
            'healthcare': HealthcareExtractor(),
            'finance': FinanceExtractor(),
            'legal': LegalServicesExtractor(),
            'manufacturing': ManufacturingExtractor(),
            'retail': RetailExtractor(),
            'real_estate': RealEstateExtractor()
        }
        
        return extractors.get(industry.lower(), GenericBusinessExtractor())

class TechCompanyExtractor(ContentExtractor):
    def extract_tech_specific_info(self, content: str) -> TechInfo:
        """Extract technology-specific information"""
        return TechInfo(
            technology_stack=self._extract_tech_stack(content),
            products=self._extract_software_products(content),
            api_documentation=self._find_api_docs(content),
            github_repos=self._find_github_links(content),
            pricing_tiers=self._extract_pricing_info(content)
        )

class HealthcareExtractor(ContentExtractor):
    def extract_healthcare_specific_info(self, content: str) -> HealthcareInfo:
        """Extract healthcare-specific information"""
        return HealthcareInfo(
            medical_specialties=self._extract_specialties(content),
            insurance_accepted=self._extract_insurance_info(content),
            certifications=self._extract_certifications(content),
            patient_portal=self._find_patient_portal(content),
            appointment_booking=self._find_booking_system(content)
        )
```

## Error Handling & Content Validation

### Robust Content Extraction
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=30)
)
async def extract_content_with_retry(url: str) -> str:
    """Extract content with retry logic and fallback methods"""
    extractors = [
        JinaAIReader(),
        ScrapingBeeExtractor(),
        PlaywrightExtractor(),
        BeautifulSoupExtractor()
    ]
    
    last_exception = None
    
    for extractor in extractors:
        try:
            content = await extractor.extract(url)
            if content and len(content.strip()) > 100:  # Minimum content threshold
                return content
        except Exception as e:
            last_exception = e
            logger.warning(f"Extractor {extractor.__class__.__name__} failed for {url}: {e}")
            continue
    
    # If all extractors fail, raise the last exception
    raise ContentExtractionError(f"All content extractors failed for {url}", last_exception)
```

This universal content extraction phase ensures that meaningful business information is extracted from ANY type of business website, regardless of industry, structure, or complexity.