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
    
    # Extract validation keywords
    required_keywords = validation_criteria.get('mustHaveSpecificKeywords', [])
    custom_rules = validation_criteria.get('customValidationRules', '').strip()
    
    logger.info(f"Building queries for industry: {industry}, location: {location}")
    logger.info(f"Required keywords: {required_keywords}")
    
    # Base query components
    base_queries = []
    
    # Build core search terms based on industry and requirements
    core_terms = []
    if industry:
        core_terms.append(f'"{industry}"')
    
    if keywords:
        # Split keywords and add them as search terms
        keyword_list = [kw.strip() for kw in keywords.split(',') if kw.strip()]
        for keyword in keyword_list:
            core_terms.append(f'"{keyword}"')
    
    # Add required keywords from validation criteria
    for req_keyword in required_keywords:
        if req_keyword.strip():
            core_terms.append(f'"{req_keyword.strip()}"')
    
    # Location targeting
    location_terms = []
    if location:
        location_terms.append(f'"{location}"')
    
    # Company size targeting
    size_terms = []
    if company_size and company_size != "Any":
        # Convert company size to search terms
        if "1-10" in company_size:
            size_terms.append('"startup" OR "small business" OR "SME"')
        elif "11-50" in company_size:
            size_terms.append('"growing company" OR "small to medium"')
        elif "51-200" in company_size:
            size_terms.append('"medium enterprise" OR "mid-size"')
        elif "201-1000" in company_size:
            size_terms.append('"large company" OR "enterprise"')
        elif "1000+" in company_size:
            size_terms.append('"Fortune 500" OR "multinational" OR "corporation"')
    
    # Build common exclusions to filter out irrelevant results
    exclusions = [
        '-site:wikipedia.org',
        '-site:linkedin.com/pub',
        '-site:facebook.com',
        '-site:twitter.com',
        '-site:instagram.com',
        '-site:youtube.com',
        '-"job" -"jobs" -"career" -"careers"',
        '-"resume" -"CV"',
        '-"news" -"article"',
        '-"blog" -"post"'
    ]
    
    # Business-focused search patterns
    business_patterns = [
        '"company" OR "business" OR "corporation" OR "enterprise"',
        '"services" OR "solutions" OR "products"',
        '"contact" OR "about" OR "team"',
        '"phone" OR "email" OR "address"'
    ]
    
    # Generate multiple query variations
    queries = []
    
    # Query 1: Core industry + location + business indicators
    if core_terms:
        query_parts = []
        query_parts.extend(core_terms)
        if location_terms:
            query_parts.extend(location_terms)
        query_parts.append('(' + ' OR '.join(business_patterns) + ')')
        if size_terms:
            query_parts.extend(size_terms)
        
        query = ' AND '.join(query_parts) + ' ' + ' '.join(exclusions)
        queries.append(query)
    
    # Query 2: Focus on contact information + industry
    if core_terms:
        query_parts = []
        query_parts.extend(core_terms)
        query_parts.append('"contact us" OR "get in touch" OR "phone" OR "email"')
        if location_terms:
            query_parts.extend(location_terms)
        
        query = ' AND '.join(query_parts) + ' ' + ' '.join(exclusions)
        queries.append(query)
    
    # Query 3: Services/solutions focus
    if core_terms:
        query_parts = []
        query_parts.extend(core_terms)
        query_parts.append('"services" OR "solutions" OR "consulting" OR "provider"')
        if location_terms:
            query_parts.extend(location_terms)
        
        query = ' AND '.join(query_parts) + ' ' + ' '.join(exclusions)
        queries.append(query)
    
    # Query 4: Partnership/collaboration focused (if relevant keywords detected)
    partnership_keywords = ['partner', 'affiliate', 'reseller', 'distributor', 'agent']
    has_partnership_focus = any(keyword in ' '.join(required_keywords + [keywords]).lower() for keyword in partnership_keywords)
    
    if has_partnership_focus and core_terms:
        query_parts = []
        query_parts.extend(core_terms)
        query_parts.append('"partner" OR "affiliate" OR "reseller" OR "distributor" OR "agent"')
        if location_terms:
            query_parts.extend(location_terms)
        
        query = ' AND '.join(query_parts) + ' ' + ' '.join(exclusions)
        queries.append(query)
    
    # Query 5: API/Integration focused (if technical keywords detected)
    tech_keywords = ['api', 'integration', 'platform', 'software', 'system']
    has_tech_focus = any(keyword in ' '.join(required_keywords + [keywords]).lower() for keyword in tech_keywords)
    
    if has_tech_focus and core_terms:
        query_parts = []
        query_parts.extend(core_terms)
        query_parts.append('"API" OR "integration" OR "platform" OR "developer"')
        if location_terms:
            query_parts.extend(location_terms)
        
        query = ' AND '.join(query_parts) + ' ' + ' '.join(exclusions)
        queries.append(query)
    
    # Fallback query if no specific queries were generated
    if not queries and industry:
        fallback_query = f'"{industry}" AND ("company" OR "business") AND ("contact" OR "about") {" ".join(exclusions)}'
        queries.append(fallback_query)
    
    # Log generated queries for debugging
    logger.info(f"Generated {len(queries)} search queries:")
    for i, query in enumerate(queries, 1):
        logger.info(f"Query {i}: {query}")
    
    return queries


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
    
    Args:
        search_config (dict): Complete search configuration
    
    Returns:
        list: List of combined query strings
    """
    search_queries = build_search_queries(search_config)
    validation_criteria = search_config.get('validationCriteria', {})
    validation_queries = build_validation_queries(validation_criteria)
    
    if not validation_queries:
        return search_queries
    
    # Combine each search query with validation requirements
    combined_queries = []
    validation_query_string = ' AND (' + ' OR '.join(validation_queries) + ')'
    
    for search_query in search_queries:
        combined_query = search_query + validation_query_string
        combined_queries.append(combined_query)
    
    logger.info(f"Combined {len(search_queries)} search queries with validation criteria")
    return combined_queries


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