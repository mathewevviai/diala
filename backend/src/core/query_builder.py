"""
Generic Search Query Builder

This module creates dynamic search queries based on user input criteria,
replacing the hardcoded FCA/IAR specific queries in phase1_search.py.
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def build_search_queries(search_config: Dict[str, Any]) -> List[str]:
    """
    Build dynamic search queries based on user's search configuration.
    
    NOTE: For Jina AI compatibility, we now generate simple keyword-based queries
    without complex boolean operators or site exclusions.
    
    Args:
        search_config (dict): User's search configuration containing:
            - industry: Target industry
            - location: Target location
            - companySize: Company size filter
            - keywords: User-specified keywords
            - validationCriteria: Custom validation requirements
            - selectedSources: Data sources to search
    
    Returns:
        list: List of search query strings
    """
    industry = search_config.get('industry', '').strip()
    location = search_config.get('location', '').strip()
    company_size = search_config.get('companySize', '').strip()
    keywords = search_config.get('keywords', '').strip()
    validation_criteria = search_config.get('validationCriteria', {})
    
    # Log input for debugging
    logger.info(f"=== QUERY BUILDER INPUT ===")
    logger.info(f"Industry: '{industry}'")
    logger.info(f"Location: '{location}'")
    logger.info(f"Company Size: '{company_size}'")
    logger.info(f"Keywords: '{keywords}'")
    logger.info(f"Validation Criteria: {validation_criteria}")
    
    # Validate input - check if location is actually a location
    if location and location.lower() == industry.lower():
        logger.warning(f"Location '{location}' appears to be the same as industry. This may produce poor results.")
        # Try to clean it up - if location is not a real location, skip it
        if not any(geo_term in location.lower() for geo_term in ['city', 'state', 'country', ',', 'usa', 'uk', 'canada']):
            logger.warning(f"Location '{location}' doesn't appear to be a geographic location. Ignoring it.")
            location = ""
    
    # Extract validation keywords
    required_keywords = validation_criteria.get('mustHaveSpecificKeywords', [])
    custom_rules = validation_criteria.get('customValidationRules', '').strip()
    
    logger.info(f"Building queries for industry: {industry}, location: {location}")
    logger.info(f"Required keywords: {required_keywords}")
    
    # Generate simple keyword-based queries for Jina AI
    queries = []
    
    # Build base keyword components
    base_keywords = []
    
    # Add industry
    if industry:
        base_keywords.append(industry)
    
    # Add user keywords
    if keywords:
        keyword_list = [kw.strip() for kw in keywords.split(',') if kw.strip()]
        base_keywords.extend(keyword_list)
    
    # Add required keywords from validation
    for req_keyword in required_keywords:
        if req_keyword.strip() and req_keyword.strip() not in base_keywords:
            base_keywords.append(req_keyword.strip())
    
    # Query 1: Industry + location + business focus
    if base_keywords:
        query_parts = base_keywords.copy()
        if location:
            query_parts.append(location)
        query_parts.extend(["companies", "business", "contact"])
        
        query = " ".join(query_parts)
        queries.append(query)
        logger.info(f"Generated Query 1: '{query}'")
    
    # Query 2: Industry + services/solutions
    if base_keywords:
        query_parts = base_keywords.copy()
        query_parts.extend(["services", "solutions", "providers"])
        if location:
            query_parts.append(location)
        
        query = " ".join(query_parts)
        queries.append(query)
    
    # Query 3: Partnership/affiliate focus (if detected)
    partnership_keywords = ['partner', 'affiliate', 'reseller', 'distributor', 'agent', 'introducer']
    has_partnership_focus = any(keyword.lower() in ' '.join(required_keywords + [keywords]).lower() for keyword in partnership_keywords)
    
    if has_partnership_focus or any(kw in base_keywords for kw in partnership_keywords):
        query_parts = base_keywords.copy()
        query_parts.extend(["partner program", "affiliate", "introducer"])
        if location:
            query_parts.append(location)
        
        query = " ".join(query_parts)
        queries.append(query)
    
    # Query 4: Contact information focus (if required by validation)
    if validation_criteria.get('mustHaveContactInfo', False) and base_keywords:
        query_parts = base_keywords.copy()
        query_parts.extend(["contact information", "email", "phone"])
        if location:
            query_parts.append(location)
        
        query = " ".join(query_parts)
        queries.append(query)
    
    # Query 5: Company size specific (if specified)
    if company_size and company_size != "Any" and base_keywords:
        query_parts = base_keywords.copy()
        
        if "1-10" in company_size:
            query_parts.extend(["startup", "small business"])
        elif "11-50" in company_size:
            query_parts.extend(["growing company", "SME"])
        elif "51-200" in company_size:
            query_parts.extend(["medium enterprise"])
        elif "201-1000" in company_size:
            query_parts.extend(["large company", "enterprise"])
        elif "1000+" in company_size:
            query_parts.extend(["Fortune 500", "corporation"])
        
        if location:
            query_parts.append(location)
        
        query = " ".join(query_parts)
        queries.append(query)
    
    # Query 6: Custom rules based query
    if custom_rules:
        # Extract key terms from custom rules
        custom_terms = []
        rules_lower = custom_rules.lower()
        
        if 'enterprise' in rules_lower:
            custom_terms.append("enterprise solutions")
        if 'case stud' in rules_lower:
            custom_terms.append("case studies")
        if 'international' in rules_lower or 'global' in rules_lower:
            custom_terms.append("international")
        if 'certif' in rules_lower:
            custom_terms.append("certified")
        
        if custom_terms and base_keywords:
            query_parts = base_keywords.copy()
            query_parts.extend(custom_terms)
            if location:
                query_parts.append(location)
            
            query = " ".join(query_parts)
            queries.append(query)
    
    # Add industry-specific queries
    if industry and industry.lower() not in ['other', 'general']:
        # Query for industry-specific businesses
        industry_query_parts = [industry]
        if industry.lower() in ['roofers', 'roofing']:
            industry_query_parts.extend(["roofing contractors", "roof repair", "roof installation"])
        elif industry.lower() in ['plumbers', 'plumbing']:
            industry_query_parts.extend(["plumbing services", "plumbing contractors", "plumbing repair"])
        else:
            industry_query_parts.extend(["contractors", "services", "professionals"])
        
        if location:
            industry_query_parts.append(location)
        
        industry_query = " ".join(industry_query_parts)
        queries.append(industry_query)
        logger.info(f"Generated Industry-Specific Query: '{industry_query}'")
    
    # Fallback query if no specific queries were generated
    if not queries:
        if industry:
            fallback_parts = [industry, "companies", "business directory"]
            if location:
                fallback_parts.append(location)
            queries.append(" ".join(fallback_parts))
        else:
            queries.append("business companies contact information")
    
    # Remove duplicate queries while preserving order
    seen = set()
    unique_queries = []
    for query in queries:
        if query not in seen:
            seen.add(query)
            unique_queries.append(query)
    
    # Log generated queries for debugging
    logger.info(f"Generated {len(unique_queries)} simple queries for Jina AI:")
    for i, query in enumerate(unique_queries, 1):
        logger.info(f"Query {i}: {query}")
    
    return unique_queries


def build_validation_queries(validation_criteria: Dict[str, Any]) -> List[str]:
    """
    Build specific validation queries based on validation criteria.
    
    Args:
        validation_criteria (dict): Validation criteria containing:
            - mustHaveWebsite: Boolean
            - mustHaveContactInfo: Boolean
            - mustHaveSpecificKeywords: List of keywords
            - mustBeInIndustry: Boolean
            - customValidationRules: Custom requirements
    
    Returns:
        list: List of validation-focused query strings
    """
    queries = []
    
    # Website validation query
    if validation_criteria.get('mustHaveWebsite', False):
        queries.append('"website" OR "www." OR "http" OR "online" OR "web presence"')
    
    # Contact info validation query
    if validation_criteria.get('mustHaveContactInfo', False):
        queries.append('"phone" OR "email" OR "contact" OR "reach us" OR "get in touch"')
    
    # Specific keywords validation
    required_keywords = validation_criteria.get('mustHaveSpecificKeywords', [])
    if required_keywords:
        keyword_query = ' OR '.join([f'"{keyword.strip()}"' for keyword in required_keywords if keyword.strip()])
        if keyword_query:
            queries.append(f'({keyword_query})')
    
    # Custom validation rules (extract keywords from custom rules)
    custom_rules = validation_criteria.get('customValidationRules', '').strip()
    if custom_rules:
        # Simple keyword extraction from custom rules
        # Look for common business terms
        custom_terms = []
        rules_lower = custom_rules.lower()
        
        if 'enterprise' in rules_lower:
            custom_terms.append('"enterprise"')
        if 'case studies' in rules_lower or 'case study' in rules_lower:
            custom_terms.append('"case studies" OR "case study"')
        if 'international' in rules_lower:
            custom_terms.append('"international" OR "global"')
        if 'certification' in rules_lower or 'certified' in rules_lower:
            custom_terms.append('"certified" OR "certification"')
        if 'experience' in rules_lower:
            custom_terms.append('"experience" OR "years" OR "established"')
        
        if custom_terms:
            queries.append(' OR '.join(custom_terms))
    
    logger.info(f"Generated {len(queries)} validation queries: {queries}")
    return queries


def combine_search_and_validation_queries(search_config: Dict[str, Any]) -> List[str]:
    """
    Combine search queries with validation queries for comprehensive results.
    
    NOTE: For Jina AI compatibility, we no longer combine queries with boolean operators.
    Instead, we return simple keyword-based queries that incorporate validation criteria.
    
    Args:
        search_config (dict): Complete search configuration
    
    Returns:
        list: List of simple query strings compatible with Jina AI
    """
    # Just return the simple search queries without complex boolean operators
    search_queries = build_search_queries(search_config)
    
    logger.info(f"Returning {len(search_queries)} simple queries for Jina AI")
    
    # Debug: Log each query to check for boolean operators
    for i, query in enumerate(search_queries):
        logger.info(f"Query {i+1} (length {len(query)}): '{query}'")
        if ' AND ' in query or ' OR ' in query:
            logger.error(f"WARNING: Query {i+1} contains boolean operators!")
    
    return search_queries


# Example usage for testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test configuration
    test_config = {
        'industry': 'Technology',
        'location': 'San Francisco',
        'companySize': '51-200',
        'keywords': 'API, integration, software',
        'validationCriteria': {
            'mustHaveWebsite': True,
            'mustHaveContactInfo': True,
            'mustHaveSpecificKeywords': ['API', 'developer', 'platform'],
            'mustBeInIndustry': True,
            'customValidationRules': 'Must offer enterprise solutions and have case studies'
        }
    }
    
    queries = combine_search_and_validation_queries(test_config)
    print(f"\nGenerated {len(queries)} queries:")
    for i, query in enumerate(queries, 1):
        print(f"\n{i}. {query}")