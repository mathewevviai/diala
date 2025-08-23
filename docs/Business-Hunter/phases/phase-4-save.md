# Phase 4: Universal Data Organization & Storage

## Overview

Phase 4 processes the raw extracted content from Phase 3 and organizes it into standardized business records. This phase works for ANY type of business by intelligently parsing and structuring data regardless of the original format or industry.

## Universal Data Organization Design

### Business Data Organizer
```python
class UniversalBusinessOrganizer:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.data_mappers = self._setup_data_mappers()
        self.field_standardizers = self._setup_field_standardizers()
        self.validation_rules = self._setup_validation_rules()
    
    async def organize_business_data(self, extracted_content: List[BusinessContent]) -> List[OrganizedBusiness]:
        """Organize extracted content into standardized business records"""
        organized_businesses = []
        
        for content in extracted_content:
            try:
                # Map content to standard business fields
                business_record = await self._map_to_business_record(content)
                
                # Standardize field formats
                standardized_record = await self._standardize_fields(business_record)
                
                # Validate data quality
                validation_result = await self._validate_business_data(standardized_record)
                
                # Calculate completeness score
                completeness_score = self._calculate_completeness(standardized_record)
                
                organized_business = OrganizedBusiness(
                    domain=content.domain,
                    business_record=standardized_record,
                    validation_result=validation_result,
                    completeness_score=completeness_score,
                    source_content_id=content.id,
                    organization_metadata=self._get_organization_metadata()
                )
                
                organized_businesses.append(organized_business)
                
            except Exception as e:
                logger.error(f"Failed to organize data for {content.domain}: {e}")
                # Create minimal record for failed organizations
                minimal_record = self._create_minimal_record(content)
                organized_businesses.append(minimal_record)
        
        return organized_businesses
```

### Universal Business Record Schema
```python
@dataclass
class UniversalBusinessRecord:
    """Standardized business record that works for ANY industry"""
    
    # Core Company Information
    company_name: str
    business_description: str
    industry: str
    business_type: str
    company_size: Optional[str] = None
    founded_year: Optional[int] = None
    
    # Contact Information
    primary_email: Optional[str] = None
    secondary_emails: List[str] = field(default_factory=list)
    primary_phone: Optional[str] = None
    secondary_phones: List[str] = field(default_factory=list)
    website_url: str = ""
    
    # Location Information
    headquarters_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    additional_locations: List[Dict[str, str]] = field(default_factory=list)
    
    # Business Details
    services_offered: List[str] = field(default_factory=list)
    products_offered: List[str] = field(default_factory=list)
    target_industries: List[str] = field(default_factory=list)
    specialties: List[str] = field(default_factory=list)
    key_differentiators: List[str] = field(default_factory=list)
    
    # People & Leadership
    key_people: List[Dict[str, str]] = field(default_factory=list)  # name, title, bio
    leadership_team: List[Dict[str, str]] = field(default_factory=list)
    
    # Digital Presence
    social_media_links: Dict[str, str] = field(default_factory=dict)
    linkedin_company_url: Optional[str] = None
    other_urls: List[str] = field(default_factory=list)
    
    # Business Metrics (if available)
    employee_count: Optional[str] = None
    revenue_range: Optional[str] = None
    funding_info: Optional[Dict[str, str]] = None
    
    # Industry-Specific Fields (flexible JSON storage)
    industry_specific_data: Dict[str, Any] = field(default_factory=dict)
    
    # Quality & Metadata
    data_completeness_score: float = 0.0
    data_quality_score: float = 0.0
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage/export"""
        return asdict(self)
    
    def get_primary_contact(self) -> Dict[str, str]:
        """Get primary contact information"""
        return {
            "email": self.primary_email or "",
            "phone": self.primary_phone or "",
            "website": self.website_url or ""
        }
```

### Smart Data Mapping Engine
```python
class SmartDataMapper:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.field_mappers = self._create_field_mappers()
        self.ai_mapper = OpenAIFieldMapper()
    
    async def map_to_business_record(self, content: BusinessContent) -> UniversalBusinessRecord:
        """Map extracted content to standardized business record"""
        
        # Initialize empty record
        record = UniversalBusinessRecord(
            company_name="",
            business_description="",
            industry="",
            business_type="",
            website_url=content.url
        )
        
        # Map core company information
        record.company_name = await self._map_company_name(content)
        record.business_description = await self._map_description(content)
        record.industry = await self._map_industry(content)
        record.business_type = await self._map_business_type(content)
        
        # Map contact information
        record.primary_email = await self._map_primary_email(content)
        record.secondary_emails = await self._map_secondary_emails(content)
        record.primary_phone = await self._map_primary_phone(content)
        record.secondary_phones = await self._map_secondary_phones(content)
        
        # Map location information
        location_data = await self._map_location_data(content)
        record.headquarters_address = location_data.get('address')
        record.city = location_data.get('city')
        record.state_province = location_data.get('state')
        record.country = location_data.get('country')
        record.postal_code = location_data.get('postal_code')
        
        # Map business details
        record.services_offered = await self._map_services(content)
        record.products_offered = await self._map_products(content)
        record.specialties = await self._map_specialties(content)
        
        # Map people information
        record.key_people = await self._map_key_people(content)
        record.leadership_team = await self._map_leadership(content)
        
        # Map social media and digital presence
        record.social_media_links = await self._map_social_media(content)
        record.linkedin_company_url = await self._map_linkedin_url(content)
        
        # Map business metrics
        record.employee_count = await self._map_employee_count(content)
        record.company_size = await self._map_company_size(content)
        record.founded_year = await self._map_founded_year(content)
        
        # Map industry-specific data
        record.industry_specific_data = await self._map_industry_specific(content)
        
        return record
    
    async def _map_company_name(self, content: BusinessContent) -> str:
        """Extract company name using multiple strategies"""
        strategies = [
            self._extract_from_title_tag,
            self._extract_from_header_text,
            self._extract_from_footer,
            self._extract_from_contact_info,
            self._extract_with_ai
        ]
        
        for strategy in strategies:
            try:
                name = await strategy(content)
                if name and self._is_valid_company_name(name):
                    return self._clean_company_name(name)
            except Exception as e:
                logger.warning(f"Company name extraction strategy failed: {e}")
                continue
        
        # Fallback to domain name
        return content.domain.replace('.com', '').replace('.', ' ').title()
    
    async def _map_industry(self, content: BusinessContent) -> str:
        """Determine industry using AI and keyword analysis"""
        # First try to use hunt configuration
        if hasattr(self.hunt_config, 'industry') and self.hunt_config.industry:
            return self.hunt_config.industry
        
        # Use AI to determine industry from content
        industry_prompt = f"""
        Based on this business website content, determine the primary industry:
        
        Company: {content.business_info.get('company_name', 'Unknown')}
        Description: {content.business_info.get('description', '')}
        Services: {content.services_info.get('primary_services', [])}
        
        Return one of these industries:
        Technology, Healthcare, Finance, Manufacturing, Retail, Real Estate, 
        Legal Services, Marketing, Consulting, Education, Construction, 
        Transportation, Food & Beverage, Entertainment, Non-Profit, Other
        
        Industry:
        """
        
        try:
            industry = await self.ai_mapper.extract_field(industry_prompt)
            return industry.strip()
        except Exception:
            return "Other"
```

### Field Standardization Engine
```python
class FieldStandardizer:
    def __init__(self):
        self.phone_standardizer = PhoneNumberStandardizer()
        self.email_validator = EmailValidator()
        self.address_parser = AddressParser()
        self.name_cleaner = NameCleaner()
    
    async def standardize_fields(self, record: UniversalBusinessRecord) -> UniversalBusinessRecord:
        """Standardize all fields in the business record"""
        
        # Standardize company name
        record.company_name = self._standardize_company_name(record.company_name)
        
        # Standardize contact information
        record.primary_email = self._standardize_email(record.primary_email)
        record.secondary_emails = [self._standardize_email(email) for email in record.secondary_emails if self._standardize_email(email)]
        
        record.primary_phone = await self._standardize_phone(record.primary_phone, record.country)
        record.secondary_phones = [
            await self._standardize_phone(phone, record.country) 
            for phone in record.secondary_phones
        ]
        record.secondary_phones = [phone for phone in record.secondary_phones if phone]
        
        # Standardize location information
        if record.headquarters_address:
            parsed_address = await self.address_parser.parse(record.headquarters_address)
            record.city = parsed_address.get('city') or record.city
            record.state_province = parsed_address.get('state') or record.state_province
            record.country = parsed_address.get('country') or record.country
            record.postal_code = parsed_address.get('postal_code') or record.postal_code
        
        # Standardize lists (remove duplicates, clean text)
        record.services_offered = self._standardize_list(record.services_offered)
        record.products_offered = self._standardize_list(record.products_offered)
        record.specialties = self._standardize_list(record.specialties)
        record.target_industries = self._standardize_list(record.target_industries)
        
        # Standardize people information
        record.key_people = [self._standardize_person(person) for person in record.key_people]
        record.leadership_team = [self._standardize_person(person) for person in record.leadership_team]
        
        # Standardize URLs
        record.website_url = self._standardize_url(record.website_url)
        record.linkedin_company_url = self._standardize_url(record.linkedin_company_url)
        record.other_urls = [self._standardize_url(url) for url in record.other_urls if self._standardize_url(url)]
        
        return record
    
    def _standardize_company_name(self, name: str) -> str:
        """Clean and standardize company name"""
        if not name:
            return ""
        
        # Remove common suffixes for cleaning
        suffixes_to_clean = [
            ' - Home', ' | Home', ' Home Page', ' | Official Site',
            ' Official Website', ' | Welcome', ' - Welcome'
        ]
        
        cleaned_name = name
        for suffix in suffixes_to_clean:
            if cleaned_name.endswith(suffix):
                cleaned_name = cleaned_name[:-len(suffix)]
        
        # Capitalize properly
        return cleaned_name.strip().title()
    
    async def _standardize_phone(self, phone: str, country: str = None) -> str:
        """Standardize phone number format"""
        if not phone:
            return ""
        
        try:
            return await self.phone_standardizer.standardize(phone, country)
        except Exception:
            # Return original if standardization fails
            return phone.strip()
    
    def _standardize_email(self, email: str) -> str:
        """Validate and standardize email"""
        if not email:
            return ""
        
        try:
            # Basic email validation and cleaning
            email = email.strip().lower()
            if self.email_validator.is_valid(email):
                return email
        except Exception:
            pass
        
        return ""
```

## Backend API Integration

### Data Organization Endpoints
```python
@router.post("/hunts/{hunt_id}/phases/organize-data")
async def start_data_organization(hunt_id: str, options: OrganizationOptions = None):
    """Start data organization phase for any hunt type"""
    hunt = await get_hunt(hunt_id)
    extracted_content = await get_extracted_content(hunt_id)
    
    # Configure organization based on hunt type
    organizer = UniversalBusinessOrganizer(hunt.configuration)
    
    if options:
        organizer.configure_options(options)
    
    # Start background task
    task = await start_organization_task.delay(hunt_id, extracted_content, options)
    
    return {
        "task_id": task.id,
        "status": "started",
        "content_to_organize": len(extracted_content),
        "estimated_completion": calculate_organization_time(len(extracted_content))
    }

@router.get("/hunts/{hunt_id}/phases/organize-data/progress")
async def get_organization_progress(hunt_id: str):
    """Get real-time progress of data organization"""
    progress = await redis.get(f"hunt:{hunt_id}:organization_progress")
    return json.loads(progress) if progress else {"status": "not_started"}

@router.get("/hunts/{hunt_id}/organized-businesses")
async def get_organized_businesses(hunt_id: str, limit: int = 50, offset: int = 0):
    """Get organized business records"""
    businesses = await get_organized_businesses_paginated(hunt_id, limit, offset)
    return businesses
```

### Database Schema
```sql
-- Organized business records table
CREATE TABLE organized_businesses (
    id UUID PRIMARY KEY,
    hunt_id UUID REFERENCES hunts(id),
    domain VARCHAR(255),
    
    -- Core company info
    company_name VARCHAR(500),
    business_description TEXT,
    industry VARCHAR(100),
    business_type VARCHAR(100),
    company_size VARCHAR(50),
    founded_year INTEGER,
    
    -- Contact information
    primary_email VARCHAR(255),
    secondary_emails JSONB,
    primary_phone VARCHAR(50),
    secondary_phones JSONB,
    website_url TEXT,
    
    -- Location
    headquarters_address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    additional_locations JSONB,
    
    -- Business details
    services_offered JSONB,
    products_offered JSONB,
    target_industries JSONB,
    specialties JSONB,
    key_differentiators JSONB,
    
    -- People
    key_people JSONB,
    leadership_team JSONB,
    
    -- Digital presence
    social_media_links JSONB,
    linkedin_company_url TEXT,
    other_urls JSONB,
    
    -- Business metrics
    employee_count VARCHAR(50),
    revenue_range VARCHAR(100),
    funding_info JSONB,
    
    -- Industry-specific data
    industry_specific_data JSONB,
    
    -- Quality metrics
    data_completeness_score FLOAT,
    data_quality_score FLOAT,
    validation_result JSONB,
    
    -- Metadata
    source_content_id UUID,
    organization_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_organized_businesses_hunt_id ON organized_businesses(hunt_id);
CREATE INDEX idx_organized_businesses_industry ON organized_businesses(industry);
CREATE INDEX idx_organized_businesses_business_type ON organized_businesses(business_type);
CREATE INDEX idx_organized_businesses_city ON organized_businesses(city);
CREATE INDEX idx_organized_businesses_country ON organized_businesses(country);
CREATE INDEX idx_organized_businesses_quality ON organized_businesses(data_quality_score);
```

## Frontend Integration

### Data Organization Monitor
```typescript
const DataOrganizationMonitor: React.FC<{ huntId: string }> = ({ huntId }) => {
    const [progress, setProgress] = useState<OrganizationProgress>();
    const [recentRecords, setRecentRecords] = useState<OrganizedBusiness[]>([]);
    
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/hunts/${huntId}`);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            if (update.phase === 'data_organization') {
                setProgress(update);
                
                if (update.latest_record) {
                    setRecentRecords(prev => 
                        [update.latest_record, ...prev.slice(0, 9)]
                    );
                }
            }
        };
        
        return () => ws.close();
    }, [huntId]);
    
    return (
        <div className="data-organization-monitor">
            <div className="organization-header">
                <h3>Organizing Business Data</h3>
                <div className="quality-metrics">
                    <Badge variant="info">
                        Avg Quality: {progress?.average_quality_score?.toFixed(1) || 0}%
                    </Badge>
                    <Badge variant="success">
                        Avg Completeness: {progress?.average_completeness_score?.toFixed(1) || 0}%
                    </Badge>
                </div>
            </div>
            
            <ProgressBar 
                value={progress?.completion_percentage || 0}
                label={`${progress?.processed || 0} of ${progress?.total_content || 0} records organized`}
            />
            
            <div className="organization-stats">
                <div className="stats-grid">
                    <StatCard
                        title="Records Processed"
                        value={progress?.processed || 0}
                        total={progress?.total_content || 0}
                    />
                    <StatCard
                        title="High Quality Records"
                        value={progress?.high_quality_count || 0}
                        percentage={(progress?.high_quality_count || 0) / (progress?.processed || 1) * 100}
                    />
                    <StatCard
                        title="Complete Records"
                        value={progress?.complete_records_count || 0}
                        percentage={(progress?.complete_records_count || 0) / (progress?.processed || 1) * 100}
                    />
                    <StatCard
                        title="Contact Info Found"
                        value={progress?.contact_info_found || 0}
                        percentage={(progress?.contact_info_found || 0) / (progress?.processed || 1) * 100}
                    />
                </div>
            </div>
            
            <RecentBusinessRecords records={recentRecords} />
        </div>
    );
};

const RecentBusinessRecords: React.FC<{ records: OrganizedBusiness[] }> = ({ records }) => {
    return (
        <div className="recent-records">
            <h4>Recently Organized</h4>
            <div className="records-list">
                {records.map((record, index) => (
                    <div key={index} className="business-record-item">
                        <div className="record-header">
                            <span className="company-name">{record.company_name}</span>
                            <div className="quality-badges">
                                <Badge variant={record.data_quality_score >= 80 ? "success" : record.data_quality_score >= 60 ? "warning" : "error"}>
                                    {record.data_quality_score?.toFixed(0)}% Quality
                                </Badge>
                                <Badge variant={record.data_completeness_score >= 80 ? "success" : "warning"}>
                                    {record.data_completeness_score?.toFixed(0)}% Complete
                                </Badge>
                            </div>
                        </div>
                        <div className="record-details">
                            <span>Industry: {record.industry}</span>
                            <span>Type: {record.business_type}</span>
                            <span>Location: {record.city}, {record.country}</span>
                            <span>Contact: {record.primary_email ? "✓" : "✗"} {record.primary_phone ? "✓" : "✗"}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

## Quality Assurance & Validation

### Comprehensive Data Validation
```python
class DataQualityValidator:
    def validate_business_record(self, record: UniversalBusinessRecord) -> ValidationResult:
        """Comprehensive validation of organized business record"""
        
        validation_results = {
            'required_fields': self._validate_required_fields(record),
            'data_formats': self._validate_data_formats(record),
            'business_logic': self._validate_business_logic(record),
            'consistency': self._validate_data_consistency(record),
            'completeness': self._calculate_completeness(record)
        }
        
        overall_score = self._calculate_overall_validation_score(validation_results)
        
        return ValidationResult(
            overall_score=overall_score,
            validation_details=validation_results,
            passed=overall_score >= 70,  # 70% threshold for passing
            issues=self._identify_issues(validation_results),
            recommendations=self._generate_recommendations(validation_results)
        )
    
    def _validate_required_fields(self, record: UniversalBusinessRecord) -> Dict[str, bool]:
        """Validate that required fields are present and valid"""
        required_validations = {
            'has_company_name': bool(record.company_name and len(record.company_name.strip()) > 0),
            'has_description': bool(record.business_description and len(record.business_description.strip()) > 10),
            'has_industry': bool(record.industry and record.industry != "Other"),
            'has_business_type': bool(record.business_type),
            'has_website': bool(record.website_url),
            'has_contact_method': bool(record.primary_email or record.primary_phone),
            'has_location': bool(record.city or record.headquarters_address)
        }
        
        return required_validations
```

This universal data organization phase ensures that business information from ANY industry is properly structured, validated, and stored in a consistent format for further processing and analysis.