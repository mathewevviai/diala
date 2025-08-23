"""
Validation utilities for the FCA Broker/Affiliate Program Finder.

This module provides functions for validating website content against
specific criteria to identify FCA-approved finance companies with
broker/affiliate programs.
"""

import re
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def is_fca_approved(text, url):
    """
    Check if a website is FCA approved.
    
    Args:
        text (str): The website content text
        url (str): The website URL
        
    Returns:
        bool: True if the website is FCA approved, False otherwise
    """
    # Common patterns indicating FCA approval - expanded with more variations
    fca_patterns = [
        r'(?i)authorised and regulated by the (Financial Conduct Authority|FCA)',
        r'(?i)regulated by the (Financial Conduct Authority|FCA)',
        r'(?i)FCA registered(?:number|firm)?',
        r'(?i)FCA registration(?:number|firm)?',
        r'(?i)Financial Conduct Authority\s+(?:number|registered|regulated|authorized)',
        r'(?i)FCA\s+(?:number|registered|regulated|authorized)',
        r'(?i)authorised and regulated by the FCA',
        r'(?i)FCA regulated',
        r'(?i)regulated by FCA',
        r'(?i)registered with the FCA',
        r'(?i)compliant with FCA',
        r'(?i)subject to FCA',
        r'(?i)FCA compliant',
        r'(?i)working with FCA',
        r'(?i)FCA approval',
        r'(?i)approved by the FCA',
        r'(?i)FCA authorised',
        r'(?i)authorized by the FCA',
        r'(?i)FCA permissions'
    ]
    
    # Check for FCA registration number pattern - more flexible
    fca_number_pattern = r'(?i)(?:FCA|Financial Conduct Authority|firm)\s*(?:number|ref|reference|#)[\s:]*(\d{5,7})'
    
    # Check for direct mention of FCA registration number
    fca_number_match = re.search(fca_number_pattern, text)
    if fca_number_match and fca_number_match.group(1):
        fca_number = fca_number_match.group(1)
        logger.info(f"Found FCA registration number: {fca_number}")
        return True
    
    # Check for each pattern
    for pattern in fca_patterns:
        if re.search(pattern, text):
            # Even without a specific number, the strong language about regulation is a good indicator
            logger.info(f"Found FCA approval pattern: {pattern}")
            return True
    
    # Check for ".fca.org.uk" domain which would indicate official FCA content
    if "fca.org.uk" in url:
        logger.info("URL contains fca.org.uk domain")
        return True
    
    # Check for mention of specific FCA regulations
    fca_regulations = ['CONC', 'MCOB', 'ICOBS', 'COBS', 'SYSC', 'PRIN', 'DISP']
    for regulation in fca_regulations:
        if re.search(f'(?i){regulation}', text) and re.search(r'(?i)(FCA|Financial Conduct Authority)', text):
            logger.info(f"Found FCA regulation mention: {regulation}")
            return True
    
    # Alternative check - if the text strongly mentions FCA multiple times
    fca_mentions = len(re.findall(r'(?i)\bFCA\b', text))
    financial_conduct_mentions = len(re.findall(r'(?i)\bFinancial Conduct Authority\b', text))
    
    if fca_mentions >= 3 or financial_conduct_mentions >= 2:
        logger.info(f"Multiple FCA mentions: {fca_mentions} FCA, {financial_conduct_mentions} Financial Conduct Authority")
        return True
    
    return False


def is_broker_affiliate(text, url):
    """
    Check if a website is a broker or has an affiliate program.
    
    Args:
        text (str): The website content text
        url (str): The website URL
        
    Returns:
        bool: True if the website is a broker or has an affiliate program, False otherwise
    """
    # Common patterns indicating broker status - expanded with more variations
    broker_patterns = [
        r'(?i)(?:we are|is) (?:a|an) (?:credit|loan|finance|mortgage|insurance) broker',
        r'(?i)not a lender',
        r'(?i)broker,? not a lender',
        r'(?i)introducer(?:s)?(?: of)? business',
        r'(?i)credit broker(?:age)?',
        r'(?i)finance broker(?:age)?',
        r'(?i)loan broker(?:age)?',
        r'(?i)mortgage broker(?:age)?',
        r'(?i)insurance broker(?:age)?',
        r'(?i)broker service(?:s)?',
        r'(?i)broker network',
        r'(?i)broker firm',
        r'(?i)brokerage firm',
        r'(?i)broker company',
        r'(?i)broker agency',
        r'(?i)introduce clients',
        r'(?i)introducing clients',
        r'(?i)client introduction',
        r'(?i)broker application',
        r'(?i)broker agreement',
        r'(?i)broker opportunity',
        r'(?i)broker platform'
    ]
    
    # Common patterns indicating affiliate programs - expanded with more variations
    affiliate_patterns = [
        r'(?i)affiliate pro(?:gram|gramme)',
        r'(?i)partner pro(?:gram|gramme)',
        r'(?i)partnership pro(?:gram|gramme)',
        r'(?i)referral pro(?:gram|gramme)',
        r'(?i)introducer pro(?:gram|gramme)',
        r'(?i)become (?:a|an) (?:affiliate|partner|introducer|referrer)',
        r'(?i)(?:affiliate|partner|introducer|referrer) scheme',
        r'(?i)(?:affiliate|partner|introducer|referrer) portal',
        r'(?i)(?:affiliate|partner|introducer|referrer) platform',
        r'(?i)(?:affiliate|partner|introducer|referrer) network',
        r'(?i)(?:affiliate|partner|introducer|referrer) opportunity',
        r'(?i)(?:affiliate|partner|introducer|referrer) commission',
        r'(?i)lead generation',
        r'(?i)lead referral',
        r'(?i)client referral',
        r'(?i)commission per lead',
        r'(?i)commission per referral',
        r'(?i)commission per client',
        r'(?i)earn commission',
        r'(?i)referral fee',
        r'(?i)introducer fee',
        r'(?i)refer a client',
        r'(?i)refer customers',
        r'(?i)refer clients',
        r'(?i)(?:affiliate|partner|introducer|referrer) terms',
        r'(?i)(?:affiliate|partner|introducer|referrer) login',
        r'(?i)(?:affiliate|partner|introducer|referrer) area',
        r'(?i)(?:affiliate|partner|introducer|referrer) join',
        r'(?i)(?:affiliate|partner|introducer|referrer) register',
        r'(?i)(?:affiliate|partner|introducer|referrer) sign up',
        r'(?i)(?:affiliate|partner|introducer|referrer) dashboard',
        r'(?i)partnership opportunities',
        r'(?i)business partnership',
        r'(?i)strategic partnership',
        r'(?i)partnership agreement'
    ]
    
    # Check URL for indicators - expanded with more path variations
    parsed_url = urlparse(url)
    path = parsed_url.path.lower()
    query = parsed_url.query.lower()
    
    url_indicators = [
        '/affiliate', '/affiliates', '/partners', '/partner', '/partnership', '/partnerships',
        '/referral', '/referrals', '/referrer', '/referrers', '/refer',
        '/introducer', '/introducers', '/introduce', '/introduction',
        '/broker', '/brokers', '/brokerage',
        '/intermediary', '/intermediaries',
        '/agent', '/agents', '/agency', '/agencies',
        '/earn', '/commission', '/income', '/revenue',
        '/join', '/business', '/opportunity'
    ]
    
    # Check if URL path contains any of the indicators
    for indicator in url_indicators:
        if indicator in path:
            logger.info(f"URL path contains broker/affiliate indicator: {indicator}")
            return True
    
    # Check if URL query contains any indicators 
    query_indicators = ['affiliate', 'partner', 'referral', 'introducer', 'broker', 'commission']
    for indicator in query_indicators:
        if indicator in query:
            logger.info(f"URL query contains broker/affiliate indicator: {indicator}")
            return True
    
    # Check if domain name suggests affiliation
    domain = parsed_url.netloc.lower()
    domain_indicators = ['affiliate', 'affiliates', 'partner', 'partners', 'referral', 'broker', 'brokers', 'introducer']
    for indicator in domain_indicators:
        if indicator in domain:
            logger.info(f"Domain contains broker/affiliate indicator: {indicator}")
            return True
    
    # Check broker patterns
    for pattern in broker_patterns:
        if re.search(pattern, text):
            logger.info(f"Found broker pattern: {pattern}")
            return True
    
    # Check affiliate patterns
    for pattern in affiliate_patterns:
        if re.search(pattern, text):
            logger.info(f"Found affiliate pattern: {pattern}")
            return True
    
    # Additional check - any combination of these key terms within close proximity
    proximity_terms = [
        (r'(?i)\b(?:earn|revenue|income|profit|payment)\b', r'(?i)\b(?:commission|fee|reward|incentive)\b', 50),
        (r'(?i)\b(?:refer|referral|recommend|introduction)\b', r'(?i)\b(?:client|customer|lead|prospect)\b', 50),
        (r'(?i)\b(?:broker|intermediary|agent)\b', r'(?i)\b(?:program|plan|opportunity|scheme)\b', 50),
        (r'(?i)\b(?:partnership|collaboration|relationship)\b', r'(?i)\b(?:agreement|contract|form|application)\b', 50)
    ]
    
    for pattern1, pattern2, max_distance in proximity_terms:
        matches1 = [m.start() for m in re.finditer(pattern1, text)]
        matches2 = [m.start() for m in re.finditer(pattern2, text)]
        
        for pos1 in matches1:
            for pos2 in matches2:
                if abs(pos1 - pos2) < max_distance:
                    logger.info(f"Found proximity terms: pattern1 near pattern2")
                    return True
    
    return False


def has_iar_relationship(text):
    """
    Check if a website mentions IAR (Introducer Appointed Representative) relationships.
    
    Args:
        text (str): The website content text
        
    Returns:
        bool: True if the website mentions IAR relationships, False otherwise
    """
    # Common patterns indicating IAR relationships - expanded for greater sensitivity
    iar_patterns = [
        r'(?i)Introducer Appointed Representative',
        r'(?i)Appointed Representative',
        r'(?i)(?:is|are|as) (?:an|a) (?:IAR|AR|Introducer)',
        r'(?i)IAR(?:\s+|-)(?:of|status|agreement|arrangement|relationship)',
        r'(?i)AR(?:\s+|-)(?:of|status|agreement|arrangement|relationship)',
        r'(?i)Appointed Representative(?:\s+|-)(?:of|status|agreement|arrangement|relationship)',
        r'(?i)Introducer(?:\s+|-)(?:of|status|agreement|arrangement|relationship)',
        r'(?i)acting as (?:an|a) (?:IAR|AR|Appointed Representative|Introducer)',
        r'(?i)become (?:an|a) (?:IAR|AR|Appointed Representative|Introducer)',
        r'(?i)register(?:ed)? as (?:an|a) (?:IAR|AR|Appointed Representative|Introducer)',
        r'(?i)principal(?:\s+|-)(?:firm|company|entity|business|partner)',
        r'(?i)(?:IAR|AR|Appointed Representative) (?:agreement|application|network|scheme|program)',
        r'(?i)IAR network',
        r'(?i)IAR scheme',
        r'(?i)IAR program',
        r'(?i)(?:IAR|AR) partnership',
        r'(?i)network principal',
        r'(?i)principal for (?:IAR|AR|Appointed Representative|Introducer)',
        r'(?i)(?:under|through) (?:an|a) (?:IAR|AR|Appointed Representative) arrangement',
        r'(?i)Financial Conduct Authority(?:.{0,50})(?:IAR|AR|Appointed Representative|Introducer)'
    ]
    
    # Check for each pattern
    for pattern in iar_patterns:
        if re.search(pattern, text):
            logger.info(f"Found IAR relationship pattern: {pattern}")
            return True
    
    # Check for proximity of key terms
    proximity_checks = [
        (r'(?i)\bintroducer\b', r'(?i)\bfinancial conduct authority\b', 100),
        (r'(?i)\bappointed\b', r'(?i)\brepresentative\b', 20),
        (r'(?i)\bprincipal\b', r'(?i)\bfirm\b', 50),
        (r'(?i)\bregulated\b', r'(?i)\bappointed representative\b', 100),
        (r'(?i)\bintroducer\b', r'(?i)\barrangement\b', 50),
        (r'(?i)\bFCA\b', r'(?i)\bIAR\b', 100),
        (r'(?i)\bFCA\b', r'(?i)\bAR\b', 100)
    ]
    
    for term1, term2, max_distance in proximity_checks:
        if check_proximity(text, term1, term2, max_distance):
            logger.info(f"Found IAR proximity pattern: {term1} near {term2}")
            return True
    
    # If text mentions specific IAR-related phrases
    iar_phrases = ['FCA regulatory umbrella', 'FCA permissions', 'principal firm', 
                 'regulated by our principal', 'operate under the regulatory', 
                 'under the FCA regulations', 'authorised by our principal']
    
    for phrase in iar_phrases:
        if phrase.lower() in text.lower():
            logger.info(f"Found IAR phrase: {phrase}")
            return True
    
    return False

def check_proximity(text, pattern1, pattern2, max_distance):
    """Helper function to check proximity of two patterns in text"""
    matches1 = [m.start() for m in re.finditer(pattern1, text)]
    matches2 = [m.start() for m in re.finditer(pattern2, text)]
    
    for pos1 in matches1:
        for pos2 in matches2:
            if abs(pos1 - pos2) < max_distance:
                return True
    
    return False


def contains_redirects(content, url):
    """
    Check if a website contains redirects to affiliate/broker pages.
    
    Args:
        content (dict): The website content dictionary
        url (str): The website URL
        
    Returns:
        bool: True if the website contains redirects, False otherwise
    """
    # Look for redirect links in the content
    redirect_indicators = [
        'click.linksynergy.com',
        'go.redirectingat.com',
        'prf.hn',
        'track.webgains.com',
        'awin1.com',
        'shareasale.com',
        'affiliate',
        'hop.clickbank.net',
        'redirect',
        'go.skimresources.com',
        'partners.webmasterplan.com',
        'click.linksynergy.com',
        'click.linksynergy.com',
        'anrdoezrs.net',
        'commission-junction',
        'jdoqocy.com',
        'kqzyfj.com',
        'dpbolvw.net',
        'tkqlhce.com',
        'clickserve.cc-dt.com'
    ]
    
    # Extract text content
    text = ""
    if isinstance(content, dict):
        text = content.get("text", "")
        
        # Check for links in HTML content if available
        html = content.get("raw", "")
        if html and isinstance(html, str):
            # Very basic check for redirect links in HTML
            for indicator in redirect_indicators:
                if indicator in html:
                    logger.info(f"Found redirect indicator in HTML: {indicator}")
                    return True
    
    # Check if text mentions affiliate or partner links
    affiliate_link_patterns = [
        r'(?i)affiliate link',
        r'(?i)referral link',
        r'(?i)partner link',
        r'(?i)commission(?:ed)? link',
        r'(?i)introducer link',
        r'(?i)may (?:be compensated|receive a commission|earn a commission)'
    ]
    
    for pattern in affiliate_link_patterns:
        if re.search(pattern, text):
            logger.info(f"Found affiliate link pattern: {pattern}")
            return True
    
    return False
