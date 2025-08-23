"""
Generic validation utilities for lead generation.

This module provides functions for validating website content against
user-defined criteria, replacing the hardcoded FCA-specific validation.
"""

import re
import logging
from urllib.parse import urlparse
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


def validate_website(text: str, url: str, validation_criteria: Dict[str, Any]) -> bool:
    """
    Check if a website meets user-defined validation criteria.
    
    Args:
        text (str): The website content text
        url (str): The website URL
        validation_criteria (dict): User-defined validation requirements
        
    Returns:
        bool: True if the website meets all required criteria, False otherwise
    """
    if not validation_criteria:
        # If no criteria specified, consider it valid
        return True
    
    # Check must have website
    if validation_criteria.get('mustHaveWebsite', False):
        if not has_active_website(text, url):
            logger.info(f"Failed validation: No active website detected for {url}")
            return False
    
    # Check must have contact info
    if validation_criteria.get('mustHaveContactInfo', False):
        if not has_contact_information(text):
            logger.info(f"Failed validation: No contact information found for {url}")
            return False
    
    # Check must be in industry
    if validation_criteria.get('mustBeInIndustry', False):
        industry = validation_criteria.get('industry', '')
        if industry and not is_in_industry(text, industry):
            logger.info(f"Failed validation: Not in target industry '{industry}' for {url}")
            return False
    
    # Check must have specific keywords
    required_keywords = validation_criteria.get('mustHaveSpecificKeywords', [])
    if required_keywords:
        if not has_required_keywords(text, required_keywords):
            logger.info(f"Failed validation: Missing required keywords for {url}")
            return False
    
    # Check custom validation rules
    custom_rules = validation_criteria.get('customValidationRules', '')
    if custom_rules:
        if not meets_custom_rules(text, custom_rules):
            logger.info(f"Failed validation: Does not meet custom rules for {url}")
            return False
    
    return True


def has_active_website(text: str, url: str) -> bool:
    """
    Check if the content indicates an active business website.
    
    Args:
        text (str): The website content text
        url (str): The website URL
        
    Returns:
        bool: True if website appears active, False otherwise
    """
    # Check if URL is accessible and not a placeholder
    if not url or url == "http://example.com" or "example" in url:
        return False
    
    # Check for indicators of active website
    active_patterns = [
        r'(?i)contact us',
        r'(?i)about us',
        r'(?i)our services',
        r'(?i)products',
        r'(?i)solutions',
        r'(?i)(?:copyright|©)\s*\d{4}',
        r'(?i)all rights reserved',
        r'(?i)privacy policy',
        r'(?i)terms (?:of|and|&) (?:service|conditions)',
        r'(?i)(?:phone|tel|telephone)[\s:]+[\+\d\s\-\(\)]+',
        r'(?i)(?:email|e-mail)[\s:]+[\w\.\-]+@[\w\.\-]+',
        r'(?i)(?:address|location)[\s:]+[\w\s,\.\-]+',
    ]
    
    # Count how many active patterns are found
    pattern_count = 0
    for pattern in active_patterns:
        if re.search(pattern, text):
            pattern_count += 1
    
    # Consider active if at least 3 patterns found
    if pattern_count >= 3:
        logger.info(f"Found {pattern_count} active website patterns")
        return True
    
    # Check if domain looks legitimate
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()
    
    # Check for suspicious domains
    suspicious_patterns = ['test', 'demo', 'example', 'localhost', '127.0.0.1']
    for pattern in suspicious_patterns:
        if pattern in domain:
            return False
    
    return pattern_count >= 2  # Be more lenient if domain looks good


def has_contact_information(text: str) -> bool:
    """
    Check if the website contains visible contact information.
    
    Args:
        text (str): The website content text
        
    Returns:
        bool: True if contact information is found, False otherwise
    """
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
    # Phone patterns (various formats)
    phone_patterns = [
        r'(?i)(?:phone|tel|telephone|call)[\s:]+[\+\d\s\-\(\)]+\d{4,}',
        r'\b\+?\d{1,3}[\s\-\.]?\(?\d{3,4}\)?[\s\-\.]?\d{3,4}[\s\-\.]?\d{3,4}\b',
        r'\b(?:0|\+44|\+1|\+61|\+64|\+353)[\s]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}\b',
    ]
    
    # Address patterns
    address_patterns = [
        r'(?i)(?:address|location|office|headquarters)[\s:]+.{10,100}',
        r'\b\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b',
        r'(?i)(?:suite|ste|floor|fl|unit|building|bldg)\s*#?\s*\d+',
    ]
    
    # Social media patterns
    social_patterns = [
        r'(?i)(?:linkedin|twitter|facebook|instagram)\.com/[\w\-]+',
        r'(?i)follow us (?:on|at)',
        r'(?i)connect with us',
    ]
    
    contact_score = 0
    
    # Check for email
    if re.search(email_pattern, text):
        contact_score += 2
        logger.info("Found email address")
    
    # Check for phone
    for pattern in phone_patterns:
        if re.search(pattern, text):
            contact_score += 2
            logger.info("Found phone number")
            break
    
    # Check for address
    for pattern in address_patterns:
        if re.search(pattern, text):
            contact_score += 1
            logger.info("Found physical address")
            break
    
    # Check for social media
    for pattern in social_patterns:
        if re.search(pattern, text):
            contact_score += 1
            logger.info("Found social media links")
            break
    
    # Consider valid if score is at least 2
    return contact_score >= 2


def is_in_industry(text: str, target_industry: str) -> bool:
    """
    Check if the website content matches the target industry.
    
    Args:
        text (str): The website content text
        target_industry (str): The target industry name
        
    Returns:
        bool: True if website appears to be in target industry, False otherwise
    """
    if not target_industry:
        return True
    
    # Normalize industry name
    industry_lower = target_industry.lower().strip()
    
    # Industry-specific keywords mapping
    industry_keywords = {
        'technology': ['software', 'technology', 'tech', 'IT', 'digital', 'cloud', 'SaaS', 'platform', 'app', 'application', 'system', 'data', 'AI', 'machine learning', 'computer'],
        'healthcare': ['health', 'medical', 'healthcare', 'hospital', 'clinic', 'patient', 'treatment', 'therapy', 'pharmaceutical', 'medicine', 'doctor', 'nurse', 'care'],
        'finance': ['finance', 'financial', 'banking', 'investment', 'loan', 'credit', 'mortgage', 'insurance', 'fund', 'capital', 'payment', 'fintech', 'money'],
        'real estate': ['real estate', 'property', 'housing', 'realty', 'home', 'apartment', 'commercial property', 'residential', 'rental', 'lease', 'building', 'estate'],
        'retail': ['retail', 'store', 'shop', 'ecommerce', 'e-commerce', 'online store', 'merchandise', 'product', 'consumer', 'shopping', 'sale', 'customer'],
        'manufacturing': ['manufacturing', 'production', 'factory', 'industrial', 'assembly', 'fabrication', 'machinery', 'equipment', 'supply chain', 'logistics'],
        'education': ['education', 'learning', 'school', 'university', 'college', 'training', 'course', 'student', 'teacher', 'academic', 'curriculum', 'study'],
        'consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'management', 'business consulting', 'professional services', 'expertise', 'advice', 'solutions'],
    }
    
    # Get keywords for the target industry
    keywords = []
    for industry, industry_kws in industry_keywords.items():
        if industry in industry_lower:
            keywords.extend(industry_kws)
    
    # If no predefined keywords, use the industry name itself
    if not keywords:
        keywords = [industry_lower]
        # Also add common variations
        keywords.extend([
            f"{industry_lower} company",
            f"{industry_lower} services",
            f"{industry_lower} solutions",
            f"{industry_lower} business",
        ])
    
    # Count keyword matches
    text_lower = text.lower()
    match_count = 0
    matched_keywords = set()
    
    for keyword in keywords:
        if keyword.lower() in text_lower:
            match_count += 1
            matched_keywords.add(keyword)
    
    # Log matched keywords
    if matched_keywords:
        logger.info(f"Matched industry keywords: {matched_keywords}")
    
    # Consider in industry if at least 2 keywords match or industry name appears multiple times
    industry_mentions = text_lower.count(industry_lower)
    
    return match_count >= 2 or industry_mentions >= 3


def has_required_keywords(text: str, required_keywords: List[str]) -> bool:
    """
    Check if the website contains all required keywords.
    
    Args:
        text (str): The website content text
        required_keywords (list): List of keywords that must be present
        
    Returns:
        bool: True if all required keywords are found, False otherwise
    """
    if not required_keywords:
        return True
    
    text_lower = text.lower()
    missing_keywords = []
    
    for keyword in required_keywords:
        if keyword and keyword.lower().strip() not in text_lower:
            missing_keywords.append(keyword)
    
    if missing_keywords:
        logger.info(f"Missing required keywords: {missing_keywords}")
        return False
    
    logger.info(f"All required keywords found: {required_keywords}")
    return True


def meets_custom_rules(text: str, custom_rules: str) -> bool:
    """
    Check if the website meets custom validation rules.
    
    Args:
        text (str): The website content text
        custom_rules (str): Custom validation rules text
        
    Returns:
        bool: True if custom rules are met, False otherwise
    """
    if not custom_rules:
        return True
    
    text_lower = text.lower()
    rules_lower = custom_rules.lower()
    
    # Extract key requirements from custom rules
    rule_checks = []
    
    # Check for "must have" requirements
    must_have_pattern = r'must (?:have|offer|provide|include)\s+(\w+(?:\s+\w+)*)'
    must_have_matches = re.findall(must_have_pattern, rules_lower)
    
    for requirement in must_have_matches:
        if requirement not in text_lower:
            logger.info(f"Failed custom rule: Must have '{requirement}'")
            return False
    
    # Check for "must be" requirements
    must_be_pattern = r'must be\s+(\w+(?:\s+\w+)*)'
    must_be_matches = re.findall(must_be_pattern, rules_lower)
    
    for requirement in must_be_matches:
        if requirement not in text_lower:
            logger.info(f"Failed custom rule: Must be '{requirement}'")
            return False
    
    # Check for specific terms mentioned in rules
    important_terms = {
        'enterprise': ['enterprise', 'corporate', 'business', 'B2B'],
        'case studies': ['case study', 'case studies', 'success story', 'client story', 'customer story'],
        'international': ['international', 'global', 'worldwide', 'multi-country', 'cross-border'],
        'certified': ['certified', 'certification', 'accredited', 'licensed', 'authorized'],
        'experience': ['experience', 'years', 'established', 'founded', 'since'],
        'api': ['API', 'integration', 'webhook', 'REST', 'endpoint'],
        'platform': ['platform', 'system', 'solution', 'software', 'application'],
        'support': ['support', 'customer service', 'help', 'assistance', '24/7'],
    }
    
    # Check if any important terms from rules appear in content
    rule_term_found = False
    for term, variations in important_terms.items():
        if term in rules_lower:
            for variation in variations:
                if variation.lower() in text_lower:
                    rule_term_found = True
                    logger.info(f"Found custom rule term '{term}' via '{variation}'")
                    break
    
    # If custom rules mention specific terms but none found, consider it failed
    if any(term in rules_lower for term in important_terms.keys()) and not rule_term_found:
        logger.info("Failed custom rules: Required terms not found")
        return False
    
    return True


def get_validation_score(text: str, url: str, validation_criteria: Dict[str, Any]) -> Tuple[float, Dict[str, bool]]:
    """
    Get a detailed validation score for a website.
    
    Args:
        text (str): The website content text
        url (str): The website URL  
        validation_criteria (dict): User-defined validation requirements
        
    Returns:
        tuple: (score between 0-1, dict of individual check results)
    """
    results = {}
    total_checks = 0
    passed_checks = 0
    
    # Check each criterion
    if validation_criteria.get('mustHaveWebsite', False):
        total_checks += 1
        results['has_website'] = has_active_website(text, url)
        if results['has_website']:
            passed_checks += 1
    
    if validation_criteria.get('mustHaveContactInfo', False):
        total_checks += 1
        results['has_contact'] = has_contact_information(text)
        if results['has_contact']:
            passed_checks += 1
    
    if validation_criteria.get('mustBeInIndustry', False):
        total_checks += 1
        industry = validation_criteria.get('industry', '')
        results['in_industry'] = is_in_industry(text, industry)
        if results['in_industry']:
            passed_checks += 1
    
    required_keywords = validation_criteria.get('mustHaveSpecificKeywords', [])
    if required_keywords:
        total_checks += 1
        results['has_keywords'] = has_required_keywords(text, required_keywords)
        if results['has_keywords']:
            passed_checks += 1
    
    custom_rules = validation_criteria.get('customValidationRules', '')
    if custom_rules:
        total_checks += 1
        results['meets_custom'] = meets_custom_rules(text, custom_rules)
        if results['meets_custom']:
            passed_checks += 1
    
    # Calculate score
    score = passed_checks / total_checks if total_checks > 0 else 1.0
    
    return score, results