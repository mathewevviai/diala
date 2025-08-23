# Phase 5: Universal Business Validation & Scoring

## Overview

Phase 5 validates the organized business data from Phase 4 and applies configurable scoring criteria to determine the best matches for ANY type of hunt. This phase uses custom validation rules and AI-powered relevance scoring to ensure only high-quality, relevant businesses make it to the final results.

## Universal Validation Design

### Configurable Business Validator
```python
class UniversalBusinessValidator:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.validation_rules = self._build_validation_rules()
        self.scoring_engine = UniversalScoringEngine(hunt_config)
        self.ai_validator = AIRelevanceValidator()
    
    async def validate_businesses(self, organized_businesses: List[OrganizedBusiness]) -> List[ValidatedBusiness]:
        """Validate and score businesses for ANY hunt type"""
        validated_businesses = []
        
        for business in organized_businesses:
            try:
                # Apply validation rules
                validation_result = await self._validate_business(business)
                
                # Calculate relevance score
                relevance_score = await self.scoring_engine.calculate_relevance_score(business)
                
                # AI-powered relevance assessment
                ai_assessment = await self.ai_validator.assess_relevance(business, self.hunt_config)
                
                # Combine scores and validation
                final_score = self._combine_scores(relevance_score, ai_assessment)
                
                validated_business = ValidatedBusiness(
                    business_id=business.id,
                    business_data=business.business_record,
                    validation_result=validation_result,
                    relevance_score=final_score,
                    ai_assessment=ai_assessment,
                    match_quality=self._determine_match_quality(final_score, validation_result),
                    validation_metadata=self._get_validation_metadata()
                )
                
                # Only include if passes minimum thresholds
                if self._passes_minimum_criteria(validated_business):
                    validated_businesses.append(validated_business)
                
            except Exception as e:
                logger.error(f"Validation failed for {business.domain}: {e}")
                continue
        
        return self._rank_and_filter_results(validated_businesses)
```

### Dynamic Validation Rules Engine
```python
class DynamicValidationRules:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.rules = self._build_rules_from_config()
    
    def _build_rules_from_config(self) -> Dict[str, ValidationRule]:
        """Build validation rules based on hunt configuration"""
        rules = {}
        
        # Industry-specific rules
        industry = self.hunt_config.industry.lower()
        rules.update(self._get_industry_rules(industry))
        
        # Business type rules
        for business_type in self.hunt_config.businessTypes:
            rules.update(self._get_business_type_rules(business_type))
        
        # Location rules
        if self.hunt_config.locations:
            rules.update(self._get_location_rules(self.hunt_config.locations))
        
        # Company size rules
        if hasattr(self.hunt_config, 'companySize'):
            rules.update(self._get_company_size_rules(self.hunt_config.companySize))
        
        # Custom criteria rules
        if hasattr(self.hunt_config, 'customCriteria'):
            rules.update(self._get_custom_rules(self.hunt_config.customCriteria))
        
        return rules
    
    def _get_industry_rules(self, industry: str) -> Dict[str, ValidationRule]:
        """Get industry-specific validation rules"""
        industry_rules = {
            'technology': {
                'required_fields': ['website_url', 'business_description'],
                'preferred_keywords': ['software', 'platform', 'API', 'cloud'],
                'business_indicators': ['product demos', 'technical documentation'],
                'quality_thresholds': {'content_quality': 0.8, 'contact_completeness': 0.7}
            },
            'healthcare': {
                'required_fields': ['primary_phone', 'headquarters_address'],
                'preferred_keywords': ['medical', 'health', 'patient', 'clinical'],
                'required_certifications': ['medical license', 'healthcare provider'],
                'quality_thresholds': {'data_quality': 0.85, 'location_accuracy': 0.9}
            },
            'finance': {
                'required_fields': ['headquarters_address', 'primary_email'],
                'preferred_keywords': ['financial', 'investment', 'banking', 'finance'],
                'compliance_indicators': ['SEC registration', 'licensed'],
                'quality_thresholds': {'data_quality': 0.9, 'contact_completeness': 0.8}
            },
            'manufacturing': {
                'required_fields': ['headquarters_address', 'primary_phone'],
                'preferred_keywords': ['manufacturing', 'production', 'facility'],
                'business_indicators': ['production capacity', 'quality standards'],
                'quality_thresholds': {'location_accuracy': 0.9, 'business_clarity': 0.8}
            }
        }
        
        return industry_rules.get(industry, {})
    
    def _get_business_type_rules(self, business_type: str) -> Dict[str, ValidationRule]:
        """Get business type specific rules"""
        type_rules = {
            'SaaS': {
                'required_elements': ['product pricing', 'feature list'],
                'preferred_pages': ['/pricing', '/features', '/demo'],
                'tech_indicators': ['API documentation', 'integrations']
            },
            'E-commerce': {
                'required_elements': ['product catalog', 'shopping cart'],
                'preferred_pages': ['/shop', '/products', '/cart'],
                'business_indicators': ['payment processing', 'shipping info']
            },
            'Agency': {
                'required_elements': ['portfolio', 'team information'],
                'preferred_pages': ['/portfolio', '/team', '/case-studies'],
                'service_indicators': ['client testimonials', 'project examples']
            }
        }
        
        return type_rules.get(business_type, {})
```

### AI-Powered Relevance Scoring
```python
class AIRelevanceValidator:
    def __init__(self):
        self.openai_client = OpenAI()
        self.relevance_prompts = self._load_relevance_prompts()
    
    async def assess_relevance(self, business: OrganizedBusiness, hunt_config) -> AIAssessment:
        """Use AI to assess business relevance to hunt criteria"""
        
        # Build context for AI assessment
        business_context = self._build_business_context(business)
        hunt_context = self._build_hunt_context(hunt_config)
        
        relevance_prompt = f"""
        Assess how well this business matches the hunt criteria:
        
        HUNT CRITERIA:
        - Industry: {hunt_config.industry}
        - Business Types: {', '.join(hunt_config.businessTypes)}
        - Target Locations: {', '.join(hunt_config.locations)}
        - Keywords: {', '.join(hunt_config.primaryKeywords)}
        
        BUSINESS INFORMATION:
        - Company: {business.business_record.company_name}
        - Industry: {business.business_record.industry}
        - Type: {business.business_record.business_type}
        - Description: {business.business_record.business_description}
        - Location: {business.business_record.city}, {business.business_record.country}
        - Services: {', '.join(business.business_record.services_offered[:5])}
        
        Rate the relevance on a scale of 0-100 and provide reasoning:
        {{
            "relevance_score": 85,
            "industry_match": 95,
            "location_match": 80,
            "business_type_match": 90,
            "keyword_relevance": 75,
            "overall_assessment": "Strong match - technology company in target location offering relevant services",
            "strengths": ["Perfect industry match", "Located in target area", "Clear service offering"],
            "concerns": ["Limited online presence", "Small team size"],
            "recommendation": "Include - high quality lead"
        }}
        """
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": relevance_prompt}],
                temperature=0.1
            )
            
            assessment_data = json.loads(response.choices[0].message.content)
            return AIAssessment(**assessment_data)
            
        except Exception as e:
            logger.error(f"AI relevance assessment failed: {e}")
            return AIAssessment(
                relevance_score=50,
                overall_assessment="Could not assess with AI",
                recommendation="Review manually"
            )
```

### Multi-Factor Scoring Engine
```python
class UniversalScoringEngine:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.scoring_weights = self._configure_scoring_weights()
    
    async def calculate_relevance_score(self, business: OrganizedBusiness) -> RelevanceScore:
        """Calculate comprehensive relevance score for ANY business type"""
        
        score_components = {
            'industry_match': self._score_industry_match(business),
            'business_type_match': self._score_business_type_match(business),
            'location_match': self._score_location_match(business),
            'keyword_relevance': self._score_keyword_relevance(business),
            'data_quality': self._score_data_quality(business),
            'contact_completeness': self._score_contact_completeness(business),
            'business_maturity': self._score_business_maturity(business),
            'online_presence': self._score_online_presence(business)
        }
        
        # Calculate weighted overall score
        overall_score = sum(
            score_components[component] * self.scoring_weights[component]
            for component in score_components.keys()
        )
        
        return RelevanceScore(
            overall_score=overall_score,
            component_scores=score_components,
            score_breakdown=self._generate_score_breakdown(score_components),
            confidence_level=self._calculate_confidence(score_components)
        )
    
    def _score_industry_match(self, business: OrganizedBusiness) -> float:
        """Score how well business industry matches hunt criteria"""
        target_industry = self.hunt_config.industry.lower()
        business_industry = business.business_record.industry.lower()
        
        # Exact match
        if business_industry == target_industry:
            return 100.0
        
        # Related industry mapping
        industry_relations = {
            'technology': ['software', 'tech', 'it services', 'saas'],
            'healthcare': ['medical', 'health', 'pharmaceutical', 'biotech'],
            'finance': ['financial services', 'banking', 'fintech', 'investment'],
            'manufacturing': ['industrial', 'production', 'automotive', 'aerospace']
        }
        
        related_industries = industry_relations.get(target_industry, [])
        if any(related in business_industry for related in related_industries):
            return 80.0
        
        # Use AI for semantic similarity
        return self._calculate_semantic_similarity(target_industry, business_industry)
    
    def _score_location_match(self, business: OrganizedBusiness) -> float:
        """Score location match with flexible geographic matching"""
        if not self.hunt_config.locations:
            return 100.0  # No location requirement
        
        business_location = f"{business.business_record.city}, {business.business_record.state_province}, {business.business_record.country}"
        
        for target_location in self.hunt_config.locations:
            location_score = self._calculate_location_score(business_location, target_location)
            if location_score > 0:
                return location_score
        
        return 0.0
    
    def _calculate_location_score(self, business_location: str, target_location: str) -> float:
        """Calculate location match score with geographic intelligence"""
        business_parts = [part.strip().lower() for part in business_location.split(',')]
        target_parts = [part.strip().lower() for part in target_location.split(',')]
        
        # Exact location match
        if any(target_part in business_parts for target_part in target_parts):
            return 100.0
        
        # State/Province match
        if len(target_parts) >= 2 and len(business_parts) >= 2:
            if target_parts[-2] in business_parts:  # State/province match
                return 80.0
        
        # Country match
        if target_parts[-1] in business_parts:
            return 60.0
        
        # Regional matching (can be expanded)
        regional_matches = {
            'bay area': ['san francisco', 'san jose', 'oakland', 'palo alto'],
            'los angeles': ['la', 'hollywood', 'beverly hills', 'santa monica'],
            'new york': ['nyc', 'manhattan', 'brooklyn', 'queens']
        }
        
        for region, cities in regional_matches.items():
            if region in target_location.lower():
                if any(city in business_location.lower() for city in cities):
                    return 90.0
        
        return 0.0
```

### Business Quality Assessment
```python
class BusinessQualityAssessor:
    def assess_business_quality(self, business: OrganizedBusiness) -> QualityAssessment:
        """Comprehensive quality assessment for ANY business type"""
        
        quality_factors = {
            'data_completeness': self._assess_data_completeness(business),
            'contact_quality': self._assess_contact_quality(business),
            'website_quality': self._assess_website_quality(business),
            'business_legitimacy': self._assess_business_legitimacy(business),
            'information_consistency': self._assess_information_consistency(business),
            'professional_presence': self._assess_professional_presence(business)
        }
        
        # Calculate overall quality score
        overall_quality = sum(quality_factors.values()) / len(quality_factors)
        
        return QualityAssessment(
            overall_quality=overall_quality,
            quality_factors=quality_factors,
            quality_grade=self._determine_quality_grade(overall_quality),
            improvement_suggestions=self._generate_improvement_suggestions(quality_factors)
        )
    
    def _assess_data_completeness(self, business: OrganizedBusiness) -> float:
        """Assess completeness of business data"""
        required_fields = [
            'company_name', 'business_description', 'industry',
            'business_type', 'website_url'
        ]
        
        optional_fields = [
            'primary_email', 'primary_phone', 'headquarters_address',
            'services_offered', 'key_people', 'social_media_links'
        ]
        
        record = business.business_record
        
        # Count completed required fields
        required_complete = sum(1 for field in required_fields if getattr(record, field, None))
        required_score = (required_complete / len(required_fields)) * 70  # 70% weight
        
        # Count completed optional fields
        optional_complete = sum(1 for field in optional_fields if getattr(record, field, None))
        optional_score = (optional_complete / len(optional_fields)) * 30  # 30% weight
        
        return required_score + optional_score
    
    def _assess_business_legitimacy(self, business: OrganizedBusiness) -> float:
        """Assess if business appears legitimate and professional"""
        legitimacy_indicators = {
            'has_professional_email': 20,  # @company domain email
            'has_physical_address': 15,    # Real address listed
            'has_phone_number': 15,        # Phone contact available
            'has_about_page': 10,          # Company information
            'has_team_info': 10,           # Team/leadership info
            'has_privacy_policy': 10,      # Legal compliance
            'has_terms_of_service': 10,    # Legal compliance
            'has_social_presence': 10      # Professional social media
        }
        
        score = 0
        record = business.business_record
        
        # Check professional email
        if record.primary_email and record.website_url:
            domain = urlparse(record.website_url).netloc.lower()
            if domain in record.primary_email:
                score += legitimacy_indicators['has_professional_email']
        
        # Check physical address
        if record.headquarters_address and len(record.headquarters_address) > 10:
            score += legitimacy_indicators['has_physical_address']
        
        # Check phone number
        if record.primary_phone:
            score += legitimacy_indicators['has_phone_number']
        
        # Check social presence
        if record.social_media_links:
            score += legitimacy_indicators['has_social_presence']
        
        return min(score, 100)  # Cap at 100
```

## Backend API Integration

### Validation Endpoints
```python
@router.post("/hunts/{hunt_id}/phases/validate")
async def start_business_validation(hunt_id: str, validation_options: ValidationOptions = None):
    """Start validation phase for any hunt type"""
    hunt = await get_hunt(hunt_id)
    organized_businesses = await get_organized_businesses(hunt_id)
    
    # Configure validator based on hunt type
    validator = UniversalBusinessValidator(hunt.configuration)
    
    if validation_options:
        validator.configure_options(validation_options)
    
    # Start background validation task
    task = await start_validation_task.delay(hunt_id, organized_businesses, validation_options)
    
    return {
        "task_id": task.id,
        "status": "started",
        "businesses_to_validate": len(organized_businesses),
        "estimated_completion": calculate_validation_time(len(organized_businesses))
    }

@router.get("/hunts/{hunt_id}/phases/validate/progress")
async def get_validation_progress(hunt_id: str):
    """Get real-time validation progress"""
    progress = await redis.get(f"hunt:{hunt_id}:validation_progress")
    return json.loads(progress) if progress else {"status": "not_started"}

@router.get("/hunts/{hunt_id}/validated-businesses")
async def get_validated_businesses(hunt_id: str, min_score: float = 0, limit: int = 50):
    """Get validated businesses above minimum score threshold"""
    businesses = await get_validated_businesses_filtered(hunt_id, min_score, limit)
    return businesses
```

### Configurable Validation Rules API
```python
@router.post("/hunts/{hunt_id}/validation-rules")
async def configure_validation_rules(hunt_id: str, rules: CustomValidationRules):
    """Configure custom validation rules for hunt"""
    hunt = await get_hunt(hunt_id)
    
    # Validate rules configuration
    validation_result = validate_rules_configuration(rules)
    if not validation_result.is_valid:
        raise HTTPException(400, detail=validation_result.errors)
    
    # Save custom rules
    await save_hunt_validation_rules(hunt_id, rules)
    
    return {"status": "rules_configured", "rules": rules}

@router.get("/validation-templates")
async def get_validation_templates():
    """Get pre-built validation templates for different industries"""
    templates = {
        "technology": TechnologyValidationTemplate(),
        "healthcare": HealthcareValidationTemplate(),
        "finance": FinanceValidationTemplate(),
        "manufacturing": ManufacturingValidationTemplate()
    }
    return templates
```

## Frontend Integration

### Validation Monitoring Dashboard
```typescript
const ValidationMonitor: React.FC<{ huntId: string }> = ({ huntId }) => {
    const [progress, setProgress] = useState<ValidationProgress>();
    const [validatedBusinesses, setValidatedBusinesses] = useState<ValidatedBusiness[]>([]);
    const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution>();
    
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/hunts/${huntId}`);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            if (update.phase === 'validation') {
                setProgress(update);
                
                if (update.latest_validated) {
                    setValidatedBusinesses(prev => 
                        [update.latest_validated, ...prev.slice(0, 19)]
                    );
                }
                
                if (update.score_distribution) {
                    setScoreDistribution(update.score_distribution);
                }
            }
        };
        
        return () => ws.close();
    }, [huntId]);
    
    return (
        <div className="validation-monitor">
            <div className="validation-header">
                <h3>Validating & Scoring Businesses</h3>
                <div className="quality-metrics">
                    <Badge variant="success">
                        High Quality: {progress?.high_quality_count || 0}
                    </Badge>
                    <Badge variant="warning">
                        Medium Quality: {progress?.medium_quality_count || 0}
                    </Badge>
                    <Badge variant="info">
                        Avg Score: {progress?.average_score?.toFixed(1) || 0}
                    </Badge>
                </div>
            </div>
            
            <ProgressBar 
                value={progress?.completion_percentage || 0}
                label={`${progress?.validated || 0} of ${progress?.total_businesses || 0} businesses validated`}
            />
            
            <div className="validation-metrics">
                <div className="metrics-grid">
                    <StatCard
                        title="Businesses Validated"
                        value={progress?.validated || 0}
                        total={progress?.total_businesses || 0}
                    />
                    <StatCard
                        title="High Quality Matches"
                        value={progress?.high_quality_count || 0}
                        percentage={(progress?.high_quality_count || 0) / (progress?.validated || 1) * 100}
                    />
                    <StatCard
                        title="Average Relevance Score"
                        value={`${progress?.average_score?.toFixed(1) || 0}%`}
                    />
                    <StatCard
                        title="Validation Success Rate"
                        value={`${progress?.success_rate?.toFixed(1) || 0}%`}
                    />
                </div>
            </div>
            
            <ScoreDistributionChart distribution={scoreDistribution} />
            <RecentValidatedBusinesses businesses={validatedBusinesses} />
        </div>
    );
};

const RecentValidatedBusinesses: React.FC<{ businesses: ValidatedBusiness[] }> = ({ businesses }) => {
    return (
        <div className="recent-validated">
            <h4>Recently Validated</h4>
            <div className="businesses-list">
                {businesses.map((business, index) => (
                    <div key={index} className="validated-business-item">
                        <div className="business-header">
                            <span className="company-name">{business.business_data.company_name}</span>
                            <div className="score-badges">
                                <Badge variant={business.relevance_score >= 80 ? "success" : business.relevance_score >= 60 ? "warning" : "error"}>
                                    {business.relevance_score?.toFixed(0)}% Relevance
                                </Badge>
                                <Badge variant={business.match_quality === "High" ? "success" : business.match_quality === "Medium" ? "warning" : "error"}>
                                    {business.match_quality} Quality
                                </Badge>
                            </div>
                        </div>
                        <div className="business-details">
                            <span>Industry: {business.business_data.industry}</span>
                            <span>Type: {business.business_data.business_type}</span>
                            <span>Location: {business.business_data.city}, {business.business_data.country}</span>
                            <span>AI Assessment: {business.ai_assessment?.recommendation || "N/A"}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

## Advanced Validation Features

### Machine Learning Score Optimization
```python
class MLScoringOptimizer:
    def __init__(self):
        self.model = self._load_or_train_scoring_model()
        self.feature_extractor = BusinessFeatureExtractor()
    
    async def optimize_scoring(self, businesses: List[ValidatedBusiness], 
                             user_feedback: List[UserFeedback]) -> OptimizedScoring:
        """Use ML to optimize scoring based on user feedback"""
        
        # Extract features from businesses
        features = []
        labels = []
        
        for business in businesses:
            business_features = self.feature_extractor.extract_features(business)
            features.append(business_features)
            
            # Get user feedback for this business
            feedback = next((f for f in user_feedback if f.business_id == business.business_id), None)
            if feedback:
                labels.append(feedback.relevance_rating)
        
        # Retrain model with new data
        if len(features) >= 10:  # Minimum samples for retraining
            self.model.fit(features, labels)
            
        # Generate optimized scores
        optimized_scores = self.model.predict([self.feature_extractor.extract_features(b) for b in businesses])
        
        return OptimizedScoring(
            businesses=businesses,
            optimized_scores=optimized_scores,
            model_confidence=self.model.predict_proba(features).max(axis=1).mean()
        )
```

This universal validation phase ensures that businesses are thoroughly assessed for quality and relevance regardless of the industry or hunt type, providing consistent and reliable results for ANY business discovery workflow.