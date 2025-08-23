"""
API client utilities for the FCA Broker/Affiliate Program Finder.

This module provides clients for interacting with various APIs used in the script,
including search APIs, the Jina AI Reader API, and DeepSeek AI for content analysis.
"""

import os
import json
import time
import logging
import requests
from urllib.parse import urlparse, urljoin
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Constants
JINA_API_KEY = os.getenv("JINA_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds


class JinaAIReaderClient:
    """Client for the Jina AI Reader API."""
    
    def __init__(self, api_key=None):
        """
        Initialize the Jina AI Reader client.
        
        Args:
            api_key (str, optional): The API key to use. If not provided, will use the JINA_API_KEY env var.
        """
        self.api_key = api_key or JINA_API_KEY
        
        if not self.api_key:
            logger.warning("No Jina AI Reader API key provided")
    
    def extract_content(self, url, include_raw=True, wait=5000, render=True):
        """
        Extract content from a website using Jina AI Reader API.
        
        Args:
            url (str): The URL to extract content from
            include_raw (bool, optional): Whether to include raw HTML content
            wait (int, optional): Time to wait for the page to load (in ms)
            render (bool, optional): Whether to render JavaScript
            
        Returns:
            dict: The extracted content or None if extraction failed
        """
        if not self.api_key:
            logger.error("No Jina AI Reader API key available")
            return None
        
        logger.info(f"Extracting content from: {url}")
        
        # Updated headers according to Jina AI documentation
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",  # Required for JSON response
            "X-With-Links-Summary": "true",  # Include links summary
            "X-With-Images-Summary": "true"  # Include images summary
        }
        
        data = {
            "url": url,
            "includeRaw": include_raw,
            "wait": wait,
            "render": render
        }
        
        for attempt in range(MAX_RETRIES):
            try:
                # Updated endpoint according to Jina AI documentation
                # The correct endpoint is https://r.jina.ai/ not https://api.jina.ai/v1/reader
                response = requests.post(
                    "https://r.jina.ai/",
                    headers=headers,
                    json={"url": url},  # Simplified payload according to documentation
                    timeout=30
                )
                
                response.raise_for_status()
                content = response.json()
                
                logger.info(f"Successfully extracted content from: {url}")
                # The actual content of the page will be in content["data"]["content"]
                return content
            
            except requests.exceptions.RequestException as e:
                logger.error(f"Error extracting content (attempt {attempt+1}/{MAX_RETRIES}): {e}")
                
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error(f"Max retries reached for URL: {url}")
                    return None


class SearchClient:
    """Client for search APIs."""
    
    @staticmethod
    def search_jina(query, page=1):
        """
        Search using Jina AI Search API.
        
        Args:
            query (str): The search query
            page (int): The page number (starts from 1)
            
        Returns:
            dict: The search results with organic_results list
        """
        import os
        from dotenv import load_dotenv
        
        # Load environment variables if not already loaded
        load_dotenv()
        
        # Get Jina API key from environment
        api_key = os.getenv("JINA_API_KEY")
        
        logger.info(f"Searching with Jina AI for '{query}' (page {page})")
        
        if not api_key:
            logger.error("JINA_API_KEY environment variable not set")
            return {"organic_results": []}
        
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Making Jina AI search request (attempt {attempt+1}/{MAX_RETRIES})")
                
                # Prepare the request
                url = f"https://s.jina.ai/?q={requests.utils.quote(query)}&page={page}"
                
                headers = {
                    "Accept": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "X-Respond-With": "no-content"
                }
                
                logger.info(f"Jina AI Search - URL: {url}")
                logger.info(f"Jina AI Search - Headers (without key): Accept={headers.get('Accept')}, X-Respond-With={headers.get('X-Respond-With')}")
                
                # Make the request
                response = requests.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                
                # Parse response
                response_data = response.json()
                
                logger.info(f"Jina AI Response - Status Code: {response.status_code}")
                logger.info(f"Jina AI Response - Keys: {list(response_data.keys())}")
                logger.info(f"Jina AI Response - Code: {response_data.get('code')}")
                
                # Check for successful response
                if response_data.get("code") != 200:
                    logger.error(f"Jina AI API error - Full response: {json.dumps(response_data, indent=2)}")
                    raise Exception(f"Jina AI API error: {response_data.get('status', 'Unknown error')}")
                
                # Extract search results
                search_results = response_data.get("data", [])
                
                logger.info(f"Jina AI returned {len(search_results)} results")
                
                # Format results in the expected structure
                formatted_results = []
                
                for i, result in enumerate(search_results):
                    formatted_results.append({
                        "position": i + 1,
                        "title": result.get("title", ""),
                        "link": result.get("url", ""),
                        "snippet": result.get("description", "")
                    })
                
                return {"organic_results": formatted_results}
                    
            except Exception as e:
                logger.error(f"Error using Jina AI search (attempt {attempt+1}/{MAX_RETRIES}): {e}")
                
                if attempt == MAX_RETRIES - 1:
                    logger.error("Max retries reached. Returning empty results.")
                    return {"organic_results": []}
                
                # Add delay before retry
                time.sleep(RETRY_DELAY)
        
        return {"organic_results": []}
    
    @staticmethod
    def search_serper(query, page=1):
        """
        Search Google using Serper.dev API.
        
        Args:
            query (str): The search query
            page (int): The page number (starts from 1)
            
        Returns:
            dict: The search results with organic_results list
        """
        import http.client
        import json
        import os
        from dotenv import load_dotenv
        
        # Load environment variables if not already loaded
        load_dotenv()
        
        # Get Serper API key from environment
        api_key = os.getenv("SERPER_API_KEY")
        
        logger.info(f"Searching with Serper.dev for '{query}' (page {page})")
        
        if not api_key:
            logger.error("SERPER_API_KEY environment variable not set")
            return {"organic_results": []}
        
        # Convert page to Serper's pagination (starts from 0)
        serper_page = page - 1 if page > 1 else 0
        
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Making Serper.dev API request (attempt {attempt+1}/{MAX_RETRIES})")
                
                # Setup connection to Serper.dev
                conn = http.client.HTTPSConnection("google.serper.dev")
                
                # Prepare payload with query and pagination
                payload = json.dumps({
                    "q": query,
                    "page": serper_page,
                    "gl": "uk",  # Set country to UK
                    "hl": "en"   # Set language to English
                })
                
                # Setup headers with API key
                headers = {
                    'X-API-KEY': api_key,
                    'Content-Type': 'application/json'
                }
                
                # Make the request
                conn.request("POST", "/search", payload, headers)
                
                # Get response
                res = conn.getresponse()
                data = res.read()
                
                # Parse response
                response_data = json.loads(data.decode("utf-8"))
                
                # Check for error
                if res.status != 200:
                    logger.error(f"Serper.dev API error: {response_data}")
                    raise Exception(f"Serper.dev API error: {res.status} {res.reason}")
                
                # Extract organic results
                organic_results = response_data.get("organic", [])
                
                logger.info(f"Serper.dev returned {len(organic_results)} results")
                
                # Format results in the expected structure
                formatted_results = []
                
                for i, result in enumerate(organic_results):
                    formatted_results.append({
                        "position": i + 1,
                        "title": result.get("title", ""),
                        "link": result.get("link", ""),
                        "snippet": result.get("snippet", "")
                    })
                
                return {"organic_results": formatted_results}
                    
            except Exception as e:
                logger.error(f"Error using Serper.dev search (attempt {attempt+1}/{MAX_RETRIES}): {e}")
                
                if attempt == MAX_RETRIES - 1:
                    logger.error("Max retries reached. Returning empty results.")
                    return {"organic_results": []}
        
        return {"organic_results": []}
    
    @staticmethod
    def search_custom(query, page=1):
        """
        DEPRECATED - NOT USED ANYMORE
        
        Custom search implementation as a fallback method.
        This function is no longer used as the system now uses Serper.dev API
        with exponential backoff for rate limiting instead of fallbacks.
        
        Args:
            query (str): The search query
            page (int): The page number
            
        Returns:
            dict: Empty result set - this function is never called anymore
        """
        logger.warning("search_custom() was called, but this function is deprecated and should never be used")
        return {"organic_results": []}


class DeepSeekAIClient:
    """Client for the DeepSeek API for content analysis and validation."""
    
    def __init__(self, api_key=None):
        """
        Initialize the DeepSeek AI client.
        
        Args:
            api_key (str, optional): The API key to use. If not provided, will use the DEEPSEEK_API_KEY env var.
        """
        self.api_key = api_key or DEEPSEEK_API_KEY
        
        if not self.api_key:
            logger.warning("No DeepSeek AI API key provided")
    
    def validate_content(self, text_content, validation_type="all"):
        """
        Analyze and validate text content using DeepSeek AI.
        
        Args:
            text_content (str): The text content to analyze
            validation_type (str): The type of validation to perform
                Options: "fca", "broker", "iar", "all", "partner", "partner_validation"
                
        Returns:
            dict: The validation results or None if validation failed
        """
        import logging
        logger = logging.getLogger(__name__)
        if not self.api_key:
            logger.error("No DeepSeek AI API key available")
            return None
        
        logger.info(f"Validating content using DeepSeek AI (type: {validation_type})")
        
        # Truncate text if too long to avoid token limits
        max_text_length = 10000
        if len(text_content) > max_text_length:
            logger.info(f"Text content too long ({len(text_content)} chars), truncating to {max_text_length} chars")
            text_content = text_content[:max_text_length]
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Construct different prompts based on validation type
        prompts = {
            "fca": "Analyze the following text from a finance website and determine if it shows clear evidence of FCA (Financial Conduct Authority) regulation or approval. Look for explicit mentions of FCA regulation, FCA numbers, or statements about being authorized by the FCA. Respond with JSON: {\"is_fca_approved\": true/false, \"evidence\": \"brief explanation with any FCA numbers found\"}.\n\nWebsite content:\n",
            
            "broker": "Analyze the following text from a finance website and determine if it indicates the company operates as a broker or offers an affiliate/partner program. Look for mentions of broker services, introducing clients, affiliate programs, partner programs, or commission structures. Respond with JSON: {\"is_broker_affiliate\": true/false, \"evidence\": \"brief explanation of evidence found\"}.\n\nWebsite content:\n",
            
            "iar": "Analyze the following text from a finance website and determine if it mentions IAR (Introducer Appointed Representative) relationships or similar introducer arrangements. Look for explicit mentions of IAR, appointed representatives, or introducer networks. Respond with JSON: {\"has_iar_relationship\": true/false, \"evidence\": \"brief explanation of evidence found\"}.\n\nWebsite content:\n",
            
            "all": "Analyze the following text from a finance website and determine if it meets these criteria: 1) Shows clear evidence of FCA regulation, 2) Operates as a broker or offers affiliate programs, 3) Has IAR (Introducer Appointed Representative) relationships. Respond with JSON: {\"is_fca_approved\": true/false, \"is_broker_affiliate\": true/false, \"has_iar_relationship\": true/false, \"evidence\": {\"fca\": \"evidence\", \"broker\": \"evidence\", \"iar\": \"evidence\"}}.\n\nWebsite content:\n",
            
            "partner": """You are validating whether this website qualifies as a relevant partner for a financial introducer/affiliate model. The target partners are typically Introducer Appointed Representatives (IARs), affiliate marketers, or finance/insurance providers with existing lead forms or service pitches online.

Analyze the following website content and determine:
1. Does the website appear to promote or sell financial, insurance, or credit services (including BNPL, loans, asset finance, or niche insurance)?
2. Does it offer an affiliate, introducer, or partner program?
3. Is there a clear way for a third party to refer leads or submit clients (e.g., referral form, mention of introducer commissions, broker contact)?
4. Based on this, would you classify the site as a valid target for an IAR/affiliate gateway?

Respond with JSON in this format:
{
  "site_valid": true/false,
  "reason": "Short reason explaining the decision",
  "extracted_offer": "If applicable, a short summary of what the company is offering (e.g., car insurance, BNPL for beauty salons, etc.)",
  "partnership_callout": "If applicable, copy/paste any quote from the site that references introducers, affiliates, or commission programs"
}

Website content:
"""
        }
        
        prompt = prompts.get(validation_type, prompts["all"]) + text_content
        
        data = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,  # Low temperature for more factual responses
            "max_tokens": 500
        }
        
        for attempt in range(MAX_RETRIES):
            try:
                response = requests.post(
                    "https://api.deepseek.com/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=30
                )
                
                response.raise_for_status()
                result = response.json()
                
                # Extract the actual response content
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Try to parse JSON from the response
                try:
                    # Find JSON in the response (it might be wrapped in markdown code blocks)
                    import re
                    json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
                    if json_match:
                        content = json_match.group(1)
                    
                    validation_results = json.loads(content)
                    logger.info("Successfully validated content using DeepSeek AI")
                    return validation_results
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing DeepSeek AI response as JSON: {e}")
                    # If not valid JSON, try to extract structured data manually based on validation type
                    import re
                    if validation_type == "partner":
                        # Extract partner validation results manually
                        validation_results = {
                            "site_valid": ("valid" in content.lower() and "target" in content.lower()) or "qualify" in content.lower(),
                            "reason": "Manually extracted from non-JSON response",
                            "extracted_offer": "",
                            "partnership_callout": ""
                        }
                        
                        # Try to extract some details from the content
                        offer_indicators = ["offer", "provide", "service", "product"]
                        for indicator in offer_indicators:
                            if indicator in content.lower():
                                # Find sentences containing the indicator
                                sentences = re.split(r'[.!?]', content)
                                for sentence in sentences:
                                    if indicator in sentence.lower():
                                        validation_results["extracted_offer"] = sentence.strip()
                                        break
                                if validation_results["extracted_offer"]:
                                    break
                        
                        # Look for partnership mentions
                        partnership_indicators = ["partner", "affiliate", "introducer", "commission", "refer"]
                        for indicator in partnership_indicators:
                            if indicator in content.lower():
                                # Find sentences containing the indicator
                                sentences = re.split(r'[.!?]', content)
                                for sentence in sentences:
                                    if indicator in sentence.lower():
                                        validation_results["partnership_callout"] = sentence.strip()
                                        break
                                if validation_results["partnership_callout"]:
                                    break
                    else:
                        # Standard validation extraction for FCA/broker/IAR checks
                        validation_results = {
                            "is_fca_approved": "approved" in content.lower() and "fca" in content.lower(),
                            "is_broker_affiliate": "broker" in content.lower() or "affiliate" in content.lower(),
                            "has_iar_relationship": "iar" in content.lower() or "appointed representative" in content.lower(),
                            "evidence": content
                        }
                    logger.info("Extracted validation results manually from response")
                    return validation_results
            
            except requests.exceptions.RequestException as e:
                logger.error(f"Error validating with DeepSeek AI (attempt {attempt+1}/{MAX_RETRIES}): {e}")
                
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error("Max retries reached for DeepSeek AI validation")
                    return None
        
        return None
