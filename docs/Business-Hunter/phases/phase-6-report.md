# Phase 6: Universal Results Compilation & Export

## Overview

Phase 6 compiles the validated businesses from Phase 5 into final, exportable results. This phase formats the data for various output types, generates comprehensive reports, and provides analytics for ANY type of business hunt workflow.

## Universal Results Compilation Design

### Comprehensive Results Compiler
```python
class UniversalResultsCompiler:
    def __init__(self, hunt_config):
        self.hunt_config = hunt_config
        self.export_formatters = self._setup_export_formatters()
        self.analytics_engine = HuntAnalyticsEngine()
        self.report_generator = ComprehensiveReportGenerator()
    
    async def compile_final_results(self, validated_businesses: List[ValidatedBusiness]) -> FinalResults:
        """Compile final results for ANY type of business hunt"""
        
        # Filter and rank businesses
        qualified_businesses = self._filter_qualified_businesses(validated_businesses)
        ranked_businesses = self._rank_businesses(qualified_businesses)
        
        # Generate comprehensive analytics
        hunt_analytics = await self.analytics_engine.generate_analytics(
            hunt_config=self.hunt_config,
            all_businesses=validated_businesses,
            qualified_businesses=qualified_businesses
        )
        
        # Create detailed reports
        hunt_report = await self.report_generator.generate_hunt_report(
            hunt_config=self.hunt_config,
            businesses=ranked_businesses,
            analytics=hunt_analytics
        )
        
        # Prepare export formats
        export_formats = await self._prepare_export_formats(ranked_businesses)
        
        final_results = FinalResults(
            hunt_id=self.hunt_config.hunt_id,
            hunt_name=self.hunt_config.huntName,
            total_businesses_found=len(validated_businesses),
            qualified_businesses_count=len(qualified_businesses),
            high_quality_matches=len([b for b in qualified_businesses if b.match_quality == "High"]),
            businesses=ranked_businesses,
            analytics=hunt_analytics,
            detailed_report=hunt_report,
            export_formats=export_formats,
            completion_metadata=self._get_completion_metadata()
        )
        
        # Save final results
        await self._save_final_results(final_results)
        
        return final_results
    
    def _filter_qualified_businesses(self, businesses: List[ValidatedBusiness]) -> List[ValidatedBusiness]:
        """Filter businesses based on hunt-specific criteria"""
        qualified = []
        
        for business in businesses:
            # Apply minimum score threshold
            min_score = getattr(self.hunt_config, 'minimumScore', 60)
            if business.relevance_score < min_score:
                continue
            
            # Apply validation status filter
            if business.validation_result.overall_score < 70:  # 70% validation threshold
                continue
            
            # Apply custom filters if defined
            if hasattr(self.hunt_config, 'customFilters'):
                if not self._passes_custom_filters(business, self.hunt_config.customFilters):
                    continue
            
            qualified.append(business)
        
        return qualified
    
    def _rank_businesses(self, businesses: List[ValidatedBusiness]) -> List[RankedBusiness]:
        """Rank businesses by multiple criteria"""
        ranked_businesses = []
        
        # Calculate composite ranking score
        for business in businesses:
            ranking_score = self._calculate_ranking_score(business)
            
            ranked_business = RankedBusiness(
                business_id=business.business_id,
                business_data=business.business_data,
                relevance_score=business.relevance_score,
                validation_result=business.validation_result,
                ai_assessment=business.ai_assessment,
                ranking_score=ranking_score,
                rank_position=0,  # Will be set after sorting
                ranking_factors=self._get_ranking_factors(business)
            )
            ranked_businesses.append(ranked_business)
        
        # Sort by ranking score
        ranked_businesses.sort(key=lambda x: x.ranking_score, reverse=True)
        
        # Assign rank positions
        for i, business in enumerate(ranked_businesses):
            business.rank_position = i + 1
        
        return ranked_businesses
    
    def _calculate_ranking_score(self, business: ValidatedBusiness) -> float:
        """Calculate composite ranking score based on multiple factors"""
        factors = {
            'relevance_score': business.relevance_score * 0.40,  # 40% weight
            'data_quality': business.business_data.data_quality_score * 0.20,  # 20% weight
            'contact_completeness': self._calculate_contact_completeness(business) * 0.15,  # 15% weight
            'business_maturity': self._assess_business_maturity(business) * 0.10,  # 10% weight
            'online_presence': self._assess_online_presence(business) * 0.10,  # 10% weight
            'ai_confidence': business.ai_assessment.relevance_score * 0.05 if business.ai_assessment else 0  # 5% weight
        }
        
        return sum(factors.values())
```

### Multi-Format Export Engine
```python
class MultiFormatExportEngine:
    def __init__(self):
        self.formatters = {
            'csv': CSVExporter(),
            'excel': ExcelExporter(),
            'json': JSONExporter(),
            'crm': CRMExporter(),
            'api': APIExporter(),
            'pdf': PDFReportExporter()
        }
    
    async def prepare_export_formats(self, businesses: List[RankedBusiness]) -> Dict[str, ExportFormat]:
        """Prepare data in multiple export formats for ANY business type"""
        export_formats = {}
        
        # CSV Export (Universal business data)
        csv_data = await self.formatters['csv'].export(businesses)
        export_formats['csv'] = ExportFormat(
            format_type='csv',
            filename=f"business_hunt_results_{datetime.now().strftime('%Y%m%d')}.csv",
            data=csv_data,
            download_url=f"/api/exports/csv/{csv_data.file_id}",
            description="Spreadsheet format for general analysis"
        )
        
        # Excel Export with multiple sheets
        excel_data = await self.formatters['excel'].export_detailed(businesses)
        export_formats['excel'] = ExportFormat(
            format_type='excel',
            filename=f"business_hunt_detailed_{datetime.now().strftime('%Y%m%d')}.xlsx",
            data=excel_data,
            download_url=f"/api/exports/excel/{excel_data.file_id}",
            description="Detailed Excel workbook with analytics and charts"
        )
        
        # JSON Export (Developer-friendly)
        json_data = await self.formatters['json'].export(businesses)
        export_formats['json'] = ExportFormat(
            format_type='json',
            filename=f"business_hunt_data_{datetime.now().strftime('%Y%m%d')}.json",
            data=json_data,
            download_url=f"/api/exports/json/{json_data.file_id}",
            description="Structured data format for developers and APIs"
        )
        
        # CRM Import Formats
        crm_formats = await self.formatters['crm'].export_multiple_formats(businesses)
        for crm_type, crm_data in crm_formats.items():
            export_formats[f'crm_{crm_type}'] = ExportFormat(
                format_type=f'crm_{crm_type}',
                filename=f"crm_import_{crm_type}_{datetime.now().strftime('%Y%m%d')}.csv",
                data=crm_data,
                download_url=f"/api/exports/crm/{crm_type}/{crm_data.file_id}",
                description=f"Ready-to-import format for {crm_type.title()}"
            )
        
        return export_formats

class CSVExporter:
    def export(self, businesses: List[RankedBusiness]) -> CSVExportData:
        """Export businesses to CSV format"""
        headers = [
            'Rank', 'Company Name', 'Industry', 'Business Type',
            'Website', 'Email', 'Phone', 'Address',
            'City', 'State', 'Country',
            'Relevance Score', 'Data Quality', 'Match Quality',
            'Services', 'Key People', 'Social Media',
            'Discovery Date', 'Validation Status'
        ]
        
        rows = []
        for business in businesses:
            data = business.business_data
            row = [
                business.rank_position,
                data.company_name or '',
                data.industry or '',
                data.business_type or '',
                data.website_url or '',
                data.primary_email or '',
                data.primary_phone or '',
                data.headquarters_address or '',
                data.city or '',
                data.state_province or '',
                data.country or '',
                f"{business.relevance_score:.1f}%",
                f"{data.data_quality_score:.1f}%",
                business.ai_assessment.recommendation if business.ai_assessment else '',
                '; '.join(data.services_offered[:3]) if data.services_offered else '',
                '; '.join([p.get('name', '') for p in data.key_people[:2]]) if data.key_people else '',
                '; '.join([f"{k}: {v}" for k, v in data.social_media_links.items()][:2]) if data.social_media_links else '',
                datetime.utcnow().strftime('%Y-%m-%d'),
                'Validated' if business.validation_result.passed else 'Needs Review'
            ]
            rows.append(row)
        
        return CSVExportData(
            headers=headers,
            rows=rows,
            total_records=len(rows)
        )

class ExcelExporter:
    def export_detailed(self, businesses: List[RankedBusiness]) -> ExcelExportData:
        """Export to Excel with multiple sheets and analytics"""
        workbook_data = {
            'Summary': self._create_summary_sheet(businesses),
            'Businesses': self._create_businesses_sheet(businesses),
            'Analytics': self._create_analytics_sheet(businesses),
            'Contact_Info': self._create_contact_sheet(businesses),
            'Validation_Details': self._create_validation_sheet(businesses)
        }
        
        return ExcelExportData(
            sheets=workbook_data,
            charts=self._create_charts_data(businesses),
            formatting=self._get_excel_formatting()
        )
    
    def _create_businesses_sheet(self, businesses: List[RankedBusiness]) -> Dict[str, Any]:
        """Create main businesses sheet with comprehensive data"""
        headers = [
            'Rank', 'Company Name', 'Industry', 'Business Type', 'Website',
            'Primary Email', 'Secondary Emails', 'Primary Phone', 'Secondary Phones',
            'Address', 'City', 'State/Province', 'Country', 'Postal Code',
            'Services Offered', 'Products Offered', 'Specialties',
            'Key People', 'Leadership Team', 'Employee Count', 'Company Size',
            'Founded Year', 'Revenue Range', 'LinkedIn URL',
            'Social Media Links', 'Relevance Score', 'Data Quality Score',
            'Match Quality', 'AI Assessment', 'Validation Status',
            'Discovery Source', 'Last Updated'
        ]
        
        rows = []
        for business in businesses:
            data = business.business_data
            row = [
                business.rank_position,
                data.company_name,
                data.industry,
                data.business_type,
                data.website_url,
                data.primary_email,
                '; '.join(data.secondary_emails) if data.secondary_emails else '',
                data.primary_phone,
                '; '.join(data.secondary_phones) if data.secondary_phones else '',
                data.headquarters_address,
                data.city,
                data.state_province,
                data.country,
                data.postal_code,
                '; '.join(data.services_offered) if data.services_offered else '',
                '; '.join(data.products_offered) if data.products_offered else '',
                '; '.join(data.specialties) if data.specialties else '',
                '; '.join([f"{p.get('name', '')} ({p.get('title', '')})" for p in data.key_people]) if data.key_people else '',
                '; '.join([f"{p.get('name', '')} ({p.get('title', '')})" for p in data.leadership_team]) if data.leadership_team else '',
                data.employee_count,
                data.company_size,
                data.founded_year,
                data.revenue_range,
                data.linkedin_company_url,
                '; '.join([f"{k}: {v}" for k, v in data.social_media_links.items()]) if data.social_media_links else '',
                business.relevance_score,
                data.data_quality_score,
                business.ai_assessment.recommendation if business.ai_assessment else '',
                business.ai_assessment.overall_assessment if business.ai_assessment else '',
                'Validated' if business.validation_result.passed else 'Needs Review',
                'Business Hunter',
                data.last_updated.strftime('%Y-%m-%d %H:%M:%S') if data.last_updated else ''
            ]
            rows.append(row)
        
        return {
            'headers': headers,
            'rows': rows,
            'formatting': {
                'freeze_panes': (1, 2),  # Freeze header row and first two columns
                'column_widths': {
                    'A': 8, 'B': 25, 'C': 15, 'D': 15, 'E': 30,
                    'F': 25, 'G': 30, 'H': 20, 'I': 30, 'J': 40
                }
            }
        }
```

### Advanced Analytics Engine
```python
class HuntAnalyticsEngine:
    def generate_analytics(self, hunt_config, all_businesses: List[ValidatedBusiness], 
                         qualified_businesses: List[ValidatedBusiness]) -> HuntAnalytics:
        """Generate comprehensive analytics for ANY hunt type"""
        
        analytics = HuntAnalytics(
            hunt_overview=self._generate_hunt_overview(hunt_config, all_businesses, qualified_businesses),
            quality_metrics=self._generate_quality_metrics(all_businesses),
            geographic_distribution=self._analyze_geographic_distribution(qualified_businesses),
            industry_breakdown=self._analyze_industry_breakdown(qualified_businesses),
            business_type_analysis=self._analyze_business_types(qualified_businesses),
            scoring_distribution=self._analyze_scoring_distribution(all_businesses),
            data_completeness_analysis=self._analyze_data_completeness(qualified_businesses),
            top_performers=self._identify_top_performers(qualified_businesses),
            recommendations=self._generate_recommendations(hunt_config, all_businesses, qualified_businesses)
        )
        
        return analytics
    
    def _generate_hunt_overview(self, hunt_config, all_businesses, qualified_businesses) -> HuntOverview:
        """Generate high-level hunt overview statistics"""
        total_found = len(all_businesses)
        qualified_count = len(qualified_businesses)
        success_rate = (qualified_count / total_found * 100) if total_found > 0 else 0
        
        quality_distribution = {
            'high': len([b for b in qualified_businesses if b.relevance_score >= 80]),
            'medium': len([b for b in qualified_businesses if 60 <= b.relevance_score < 80]),
            'low': len([b for b in qualified_businesses if b.relevance_score < 60])
        }
        
        return HuntOverview(
            hunt_name=hunt_config.huntName,
            target_industry=hunt_config.industry,
            target_locations=hunt_config.locations,
            total_businesses_discovered=total_found,
            qualified_businesses=qualified_count,
            hunt_success_rate=success_rate,
            quality_distribution=quality_distribution,
            average_relevance_score=np.mean([b.relevance_score for b in qualified_businesses]) if qualified_businesses else 0,
            average_data_quality=np.mean([b.business_data.data_quality_score for b in qualified_businesses]) if qualified_businesses else 0,
            completion_time=self._calculate_hunt_duration(hunt_config),
            hunt_efficiency=self._calculate_hunt_efficiency(all_businesses, qualified_businesses)
        )
    
    def _analyze_geographic_distribution(self, businesses: List[ValidatedBusiness]) -> GeographicAnalysis:
        """Analyze geographic distribution of discovered businesses"""
        location_counts = {}
        city_counts = {}
        country_counts = {}
        
        for business in businesses:
            data = business.business_data
            
            # Country analysis
            if data.country:
                country_counts[data.country] = country_counts.get(data.country, 0) + 1
            
            # City analysis
            if data.city and data.country:
                city_key = f"{data.city}, {data.country}"
                city_counts[city_key] = city_counts.get(city_key, 0) + 1
        
        return GeographicAnalysis(
            top_countries=sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            top_cities=sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:15],
            geographic_spread=len(country_counts),
            location_diversity_score=self._calculate_location_diversity(city_counts)
        )
    
    def _analyze_scoring_distribution(self, businesses: List[ValidatedBusiness]) -> ScoringAnalysis:
        """Analyze the distribution of relevance scores"""
        scores = [b.relevance_score for b in businesses]
        
        if not scores:
            return ScoringAnalysis()
        
        return ScoringAnalysis(
            mean_score=np.mean(scores),
            median_score=np.median(scores),
            std_deviation=np.std(scores),
            score_ranges={
                '90-100': len([s for s in scores if s >= 90]),
                '80-89': len([s for s in scores if 80 <= s < 90]),
                '70-79': len([s for s in scores if 70 <= s < 80]),
                '60-69': len([s for s in scores if 60 <= s < 70]),
                '50-59': len([s for s in scores if 50 <= s < 60]),
                'Below 50': len([s for s in scores if s < 50])
            },
            percentiles={
                'p25': np.percentile(scores, 25),
                'p50': np.percentile(scores, 50),
                'p75': np.percentile(scores, 75),
                'p90': np.percentile(scores, 90),
                'p95': np.percentile(scores, 95)
            }
        )
```

### Comprehensive Report Generator
```python
class ComprehensiveReportGenerator:
    def generate_hunt_report(self, hunt_config, businesses: List[RankedBusiness], 
                           analytics: HuntAnalytics) -> HuntReport:
        """Generate comprehensive hunt report for ANY business type"""
        
        report_sections = {
            'executive_summary': self._generate_executive_summary(hunt_config, analytics),
            'methodology': self._generate_methodology_section(hunt_config),
            'key_findings': self._generate_key_findings(analytics, businesses),
            'business_profiles': self._generate_top_business_profiles(businesses[:10]),
            'geographic_insights': self._generate_geographic_insights(analytics.geographic_distribution),
            'quality_assessment': self._generate_quality_assessment(analytics.quality_metrics),
            'recommendations': self._generate_action_recommendations(analytics.recommendations),
            'appendices': self._generate_appendices(businesses, analytics)
        }
        
        return HuntReport(
            report_id=f"hunt_report_{hunt_config.hunt_id}_{datetime.now().strftime('%Y%m%d')}",
            hunt_name=hunt_config.huntName,
            generated_date=datetime.utcnow(),
            sections=report_sections,
            total_pages=self._calculate_report_pages(report_sections),
            export_formats=['pdf', 'html', 'markdown']
        )
    
    def _generate_executive_summary(self, hunt_config, analytics: HuntAnalytics) -> str:
        """Generate executive summary for ANY hunt type"""
        overview = analytics.hunt_overview
        
        summary = f"""
# Executive Summary

## Hunt Overview
**Hunt Name:** {overview.hunt_name}
**Target Industry:** {overview.target_industry}
**Target Locations:** {', '.join(overview.target_locations)}

## Key Results
- **Total Businesses Discovered:** {overview.total_businesses_discovered:,}
- **Qualified Matches:** {overview.qualified_businesses:,}
- **Hunt Success Rate:** {overview.hunt_success_rate:.1f}%
- **Average Relevance Score:** {overview.average_relevance_score:.1f}/100
- **Average Data Quality:** {overview.average_data_quality:.1f}/100

## Quality Distribution
- **High Quality (80%+):** {overview.quality_distribution['high']} businesses
- **Medium Quality (60-79%):** {overview.quality_distribution['medium']} businesses
- **Lower Quality (<60%):** {overview.quality_distribution['low']} businesses

## Geographic Spread
Businesses discovered across {analytics.geographic_distribution.geographic_spread} countries, 
with highest concentrations in {', '.join([country for country, count in analytics.geographic_distribution.top_countries[:3]])}.

## Recommendations
{analytics.recommendations.primary_recommendation}

This hunt successfully identified {overview.qualified_businesses} qualified {overview.target_industry.lower()} 
businesses meeting the specified criteria, with {overview.quality_distribution['high']} high-quality matches 
ready for immediate outreach.
        """
        
        return summary.strip()
```

## Backend API Integration

### Results Compilation Endpoints
```python
@router.post("/hunts/{hunt_id}/phases/compile-results")
async def start_results_compilation(hunt_id: str, compilation_options: CompilationOptions = None):
    """Start final results compilation for any hunt type"""
    hunt = await get_hunt(hunt_id)
    validated_businesses = await get_validated_businesses(hunt_id)
    
    # Configure compiler based on hunt type
    compiler = UniversalResultsCompiler(hunt.configuration)
    
    if compilation_options:
        compiler.configure_options(compilation_options)
    
    # Start background compilation task
    task = await start_compilation_task.delay(hunt_id, validated_businesses, compilation_options)
    
    return {
        "task_id": task.id,
        "status": "started",
        "businesses_to_compile": len(validated_businesses),
        "estimated_completion": calculate_compilation_time(len(validated_businesses))
    }

@router.get("/hunts/{hunt_id}/final-results")
async def get_final_results(hunt_id: str):
    """Get final compiled results"""
    results = await get_final_hunt_results(hunt_id)
    return results

@router.get("/hunts/{hunt_id}/exports/{format_type}")
async def download_export(hunt_id: str, format_type: str):
    """Download export in specified format"""
    export_data = await get_export_data(hunt_id, format_type)
    
    if not export_data:
        raise HTTPException(404, detail="Export not found")
    
    return StreamingResponse(
        io.BytesIO(export_data.content),
        media_type=export_data.media_type,
        headers={"Content-Disposition": f"attachment; filename={export_data.filename}"}
    )

@router.get("/hunts/{hunt_id}/analytics")
async def get_hunt_analytics(hunt_id: str):
    """Get comprehensive hunt analytics"""
    analytics = await get_hunt_analytics(hunt_id)
    return analytics
```

## Frontend Integration

### Results Dashboard
```typescript
const FinalResultsDashboard: React.FC<{ huntId: string }> = ({ huntId }) => {
    const [results, setResults] = useState<FinalResults>();
    const [selectedExportFormat, setSelectedExportFormat] = useState<string>('csv');
    const [isExporting, setIsExporting] = useState(false);
    
    useEffect(() => {
        const fetchResults = async () => {
            const response = await fetch(`/api/hunts/${huntId}/final-results`);
            const data = await response.json();
            setResults(data);
        };
        
        fetchResults();
    }, [huntId]);
    
    const handleExport = async (format: string) => {
        setIsExporting(true);
        try {
            const response = await fetch(`/api/hunts/${huntId}/exports/${format}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `business_hunt_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };
    
    if (!results) return <div>Loading results...</div>;
    
    return (
        <div className="final-results-dashboard">
            <div className="results-header">
                <h2>{results.hunt_name} - Final Results</h2>
                <div className="results-summary">
                    <Badge variant="success">
                        {results.qualified_businesses_count} Qualified Businesses
                    </Badge>
                    <Badge variant="info">
                        {results.high_quality_matches} High Quality Matches
                    </Badge>
                </div>
            </div>
            
            <div className="results-overview">
                <div className="overview-cards">
                    <StatCard
                        title="Total Discovered"
                        value={results.total_businesses_found}
                        description="Businesses found during hunt"
                    />
                    <StatCard
                        title="Qualified Matches"
                        value={results.qualified_businesses_count}
                        percentage={(results.qualified_businesses_count / results.total_businesses_found) * 100}
                        description="Businesses meeting criteria"
                    />
                    <StatCard
                        title="High Quality"
                        value={results.high_quality_matches}
                        percentage={(results.high_quality_matches / results.qualified_businesses_count) * 100}
                        description="Top-tier business matches"
                    />
                    <StatCard
                        title="Avg Relevance Score"
                        value={`${results.analytics.hunt_overview.average_relevance_score.toFixed(1)}%`}
                        description="Average match quality"
                    />
                </div>
            </div>
            
            <div className="export-section">
                <h3>Export Results</h3>
                <div className="export-options">
                    {Object.entries(results.export_formats).map(([format, exportData]) => (
                        <div key={format} className="export-option">
                            <div className="export-info">
                                <span className="format-name">{format.toUpperCase()}</span>
                                <span className="format-description">{exportData.description}</span>
                            </div>
                            <Button
                                onClick={() => handleExport(format)}
                                disabled={isExporting}
                                variant="outline"
                            >
                                {isExporting ? 'Exporting...' : 'Download'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            
            <BusinessResultsTable businesses={results.businesses.slice(0, 50)} />
            <AnalyticsCharts analytics={results.analytics} />
        </div>
    );
};

const BusinessResultsTable: React.FC<{ businesses: RankedBusiness[] }> = ({ businesses }) => {
    return (
        <div className="business-results-table">
            <h3>Top Business Matches</h3>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Company</th>
                            <th>Industry</th>
                            <th>Location</th>
                            <th>Contact</th>
                            <th>Relevance</th>
                            <th>Quality</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {businesses.map((business) => (
                            <tr key={business.business_id}>
                                <td>#{business.rank_position}</td>
                                <td>
                                    <div>
                                        <strong>{business.business_data.company_name}</strong>
                                        <br />
                                        <small>{business.business_data.business_type}</small>
                                    </div>
                                </td>
                                <td>{business.business_data.industry}</td>
                                <td>{business.business_data.city}, {business.business_data.country}</td>
                                <td>
                                    <div>
                                        {business.business_data.primary_email && (
                                            <div>📧 {business.business_data.primary_email}</div>
                                        )}
                                        {business.business_data.primary_phone && (
                                            <div>📞 {business.business_data.primary_phone}</div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <Badge variant={business.relevance_score >= 80 ? "success" : "warning"}>
                                        {business.relevance_score.toFixed(0)}%
                                    </Badge>
                                </td>
                                <td>
                                    <Badge variant={business.business_data.data_quality_score >= 80 ? "success" : "warning"}>
                                        {business.business_data.data_quality_score.toFixed(0)}%
                                    </Badge>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <Button size="sm" variant="outline">View</Button>
                                        <Button size="sm" variant="outline">Contact</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
```

This final phase ensures that discovered businesses are compiled into professional, exportable results with comprehensive analytics and multiple format options, suitable for ANY type of business discovery workflow.