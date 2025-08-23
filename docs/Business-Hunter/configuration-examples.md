# Business Hunter Configuration Examples

## Overview

The Business Hunter is a **COMPLETELY GENERAL** system that can be configured to find ANY type of business. Below are examples showing how the same system can be used for wildly different business discovery scenarios.

## Example Configurations

### 1. Technology Companies

#### SaaS Startups in Silicon Valley
```javascript
{
    huntName: "Silicon Valley SaaS Startups",
    industry: "Technology",
    businessTypes: ["SaaS", "Software", "Cloud Services"],
    locations: ["San Francisco, CA", "Palo Alto, CA", "San Jose, CA"],
    companySize: "Startup",
    employeeCount: "1-100",
    primaryKeywords: ["cloud", "SaaS", "software", "API"],
    secondaryKeywords: ["enterprise", "B2B", "platform", "automation"],
    includeLinkedIn: true,
    includeCrunchbase: true,
    maxResults: 500
}
```

#### AI/ML Companies Globally
```javascript
{
    huntName: "Global AI Companies",
    industry: "Technology",
    businessTypes: ["Artificial Intelligence", "Machine Learning", "Data Science"],
    locations: ["United States", "United Kingdom", "Canada", "Israel"],
    primaryKeywords: ["AI", "machine learning", "artificial intelligence", "ML"],
    secondaryKeywords: ["deep learning", "neural networks", "computer vision", "NLP"],
    companySize: "Any",
    maxResults: 1000
}
```

### 2. Healthcare & Medical

#### Medical Practices in Texas
```javascript
{
    huntName: "Texas Medical Practices",
    industry: "Healthcare",
    businessTypes: ["Medical Practice", "Clinic", "Specialty Care"],
    locations: ["Houston, TX", "Dallas, TX", "Austin, TX"],
    primaryKeywords: ["medical", "doctor", "physician", "clinic"],
    secondaryKeywords: ["family medicine", "cardiology", "dermatology"],
    includeGoogleMaps: true,
    includeYellowPages: true,
    maxResults: 800
}
```

#### Telehealth Companies
```javascript
{
    huntName: "Telehealth Platforms",
    industry: "Healthcare",
    businessTypes: ["Telehealth", "Digital Health", "Health Tech"],
    locations: ["Remote", "United States"],
    primaryKeywords: ["telehealth", "telemedicine", "virtual care"],
    secondaryKeywords: ["remote consultation", "digital health", "health app"],
    includeLinkedIn: true,
    maxResults: 300
}
```

### 3. Financial Services

#### FinTech Startups
```javascript
{
    huntName: "FinTech Innovation",
    industry: "Financial Services",
    businessTypes: ["FinTech", "Payments", "Digital Banking"],
    locations: ["New York, NY", "San Francisco, CA", "London, UK"],
    companySize: "Startup",
    primaryKeywords: ["fintech", "payments", "banking", "finance"],
    secondaryKeywords: ["blockchain", "cryptocurrency", "digital wallet"],
    revenueRange: "$1M-$50M",
    maxResults: 400
}
```

#### Traditional Banks & Credit Unions
```javascript
{
    huntName: "Regional Banks",
    industry: "Financial Services",
    businessTypes: ["Bank", "Credit Union", "Community Bank"],
    locations: ["Midwest United States"],
    companySize: "SMB",
    primaryKeywords: ["bank", "credit union", "financial institution"],
    secondaryKeywords: ["commercial lending", "business banking"],
    includeGoogleMaps: true,
    maxResults: 600
}
```

### 4. Manufacturing & Industrial

#### Automotive Suppliers
```javascript
{
    huntName: "Auto Parts Manufacturers",
    industry: "Manufacturing",
    businessTypes: ["Automotive", "Parts Manufacturing", "Supplier"],
    locations: ["Michigan", "Ohio", "Tennessee"],
    primaryKeywords: ["automotive", "parts", "manufacturing", "supplier"],
    secondaryKeywords: ["OEM", "tier 1", "automotive supplier"],
    companySize: "Enterprise",
    employeeCount: "200+",
    maxResults: 500
}
```

#### Food & Beverage Manufacturers
```javascript
{
    huntName: "Food Manufacturing",
    industry: "Manufacturing",
    businessTypes: ["Food Manufacturing", "Beverage", "Food Processing"],
    locations: ["California", "Texas", "Florida"],
    primaryKeywords: ["food", "manufacturing", "processing", "beverage"],
    secondaryKeywords: ["organic", "natural", "packaged foods"],
    maxResults: 700
}
```

### 5. Professional Services

#### Marketing Agencies
```javascript
{
    huntName: "Digital Marketing Agencies",
    industry: "Marketing",
    businessTypes: ["Digital Agency", "Marketing Agency", "Advertising"],
    locations: ["New York, NY", "Los Angeles, CA", "Chicago, IL"],
    primaryKeywords: ["marketing", "digital", "agency", "advertising"],
    secondaryKeywords: ["SEO", "PPC", "social media", "content marketing"],
    companySize: "SMB",
    employeeCount: "10-100",
    maxResults: 400
}
```

#### Law Firms
```javascript
{
    huntName: "Corporate Law Firms",
    industry: "Legal Services",
    businessTypes: ["Law Firm", "Legal Services", "Corporate Law"],
    locations: ["New York, NY", "Washington, DC", "San Francisco, CA"],
    primaryKeywords: ["law firm", "attorney", "legal", "lawyer"],
    secondaryKeywords: ["corporate law", "M&A", "securities", "litigation"],
    companySize: "Enterprise",
    maxResults: 300
}
```

### 6. Retail & E-commerce

#### E-commerce Stores
```javascript
{
    huntName: "Fashion E-commerce",
    industry: "Retail",
    businessTypes: ["E-commerce", "Online Store", "Fashion"],
    locations: ["United States", "Canada"],
    primaryKeywords: ["e-commerce", "online store", "fashion", "clothing"],
    secondaryKeywords: ["apparel", "accessories", "jewelry", "shoes"],
    includeLinkedIn: false,
    includeGoogleMaps: false,
    maxResults: 800
}
```

#### Local Retail Stores
```javascript
{
    huntName: "Boston Retail Stores",
    industry: "Retail",
    businessTypes: ["Retail Store", "Boutique", "Specialty Store"],
    locations: ["Boston, MA"],
    geographicRadius: 25,
    primaryKeywords: ["retail", "store", "shop", "boutique"],
    includeGoogleMaps: true,
    includeYellowPages: true,
    maxResults: 500
}
```

### 7. Real Estate

#### Commercial Real Estate
```javascript
{
    huntName: "Commercial Real Estate Firms",
    industry: "Real Estate",
    businessTypes: ["Commercial Real Estate", "Property Management", "Real Estate Investment"],
    locations: ["New York, NY", "Los Angeles, CA", "Miami, FL"],
    primaryKeywords: ["commercial real estate", "property", "investment"],
    secondaryKeywords: ["office buildings", "retail space", "industrial"],
    companySize: "SMB",
    maxResults: 400
}
```

### 8. Construction & Contracting

#### General Contractors
```javascript
{
    huntName: "Southeast Contractors",
    industry: "Construction",
    businessTypes: ["General Contractor", "Construction", "Building"],
    locations: ["Atlanta, GA", "Charlotte, NC", "Nashville, TN"],
    primaryKeywords: ["contractor", "construction", "building", "general contractor"],
    secondaryKeywords: ["commercial construction", "residential", "renovation"],
    includeGoogleMaps: true,
    maxResults: 600
}
```

## Configuration Patterns

### Industry-Specific Templates
The system can provide pre-built templates for common industries:

```javascript
const industryTemplates = {
    "Technology": {
        defaultBusinessTypes: ["SaaS", "Software", "Tech Services"],
        commonKeywords: ["software", "technology", "digital", "platform"],
        recommendedSources: ["linkedin", "crunchbase", "google"]
    },
    "Healthcare": {
        defaultBusinessTypes: ["Medical Practice", "Healthcare Services", "Health Tech"],
        commonKeywords: ["medical", "health", "healthcare", "clinical"],
        recommendedSources: ["google", "yellowpages", "maps"]
    },
    // ... more templates
};
```

### Location-Based Optimization
```javascript
const locationOptimization = {
    "startups": ["San Francisco", "New York", "Austin", "Seattle"],
    "manufacturing": ["Michigan", "Ohio", "North Carolina", "Tennessee"],
    "finance": ["New York", "Charlotte", "Chicago", "Boston"],
    "tech": ["Silicon Valley", "Seattle", "Austin", "Denver"]
};
```

### Flexible Validation Rules
```javascript
const validationRules = {
    "minimum_website_quality": 70,
    "required_contact_info": ["email", "phone"],
    "exclude_competitors": true,
    "minimum_company_age": "1 year",
    "custom_filters": [
        {field: "employee_count", operator: ">=", value: 10},
        {field: "revenue", operator: "between", value: ["1M", "100M"]}
    ]
};
```

## Key Benefits of General Approach

1. **Complete Flexibility**: One system handles ANY industry or business type
2. **Scalable Configuration**: Easy to add new industries, sources, or criteria
3. **Reusable Templates**: Save successful configurations for future hunts
4. **Custom Validation**: Define success criteria specific to each hunt type
5. **Multi-Source Discovery**: Combine different data sources based on business type
6. **Intelligent Scoring**: Configurable relevance scoring for different use cases

This general-purpose approach means users can literally hunt for ANY type of business using the same powerful discovery engine, just with different configuration parameters.