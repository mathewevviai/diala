"""
Data processing utilities for the FCA Broker/Affiliate Program Finder.

This module provides functions for processing and manipulating data
throughout the different phases of the script.
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse, urljoin

logger = logging.getLogger(__name__)


def save_json_data(data, file_path, indent=2):
    """
    Save data to a JSON file.
    
    Args:
        data (dict): The data to save
        file_path (str): The path to save the data to
        indent (int, optional): The indentation level for the JSON file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create directory if it doesn't exist
        directory = os.path.dirname(file_path)
        if directory:
            Path(directory).mkdir(exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=indent)
        
        logger.info(f"Saved data to {file_path}")
        return True
    
    except Exception as e:
        logger.error(f"Error saving data to {file_path}: {e}")
        return False


def load_json_data(file_path, default=None):
    """
    Load data from a JSON file.
    
    Args:
        file_path (str): The path to load the data from
        default (any, optional): The default value to return if loading fails
        
    Returns:
        dict: The loaded data or the default value
    """
    if default is None:
        default = {}
    
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}")
        return default
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        logger.info(f"Loaded data from {file_path}")
        return data
    
    except Exception as e:
        logger.error(f"Error loading data from {file_path}: {e}")
        return default


def extract_domain(url):
    """
    Extract the domain from a URL.
    
    Args:
        url (str): The URL to extract the domain from
        
    Returns:
        str: The extracted domain
    """
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        # Remove 'www.' prefix if present
        if domain.startswith('www.'):
            domain = domain[4:]
        
        return domain
    
    except Exception as e:
        logger.error(f"Error extracting domain from URL {url}: {e}")
        return ""


def normalize_url(url):
    """
    Normalize a URL by removing parameters and fragments.
    
    Args:
        url (str): The URL to normalize
        
    Returns:
        str: The normalized URL
    """
    try:
        parsed_url = urlparse(url)
        normalized_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
        
        return normalized_url
    
    except Exception as e:
        logger.error(f"Error normalizing URL {url}: {e}")
        return url


def extract_text_from_content(content):
    """
    Extract text content from Jina AI Reader response.
    
    Args:
        content (dict): The content from Jina AI Reader
        
    Returns:
        str: The extracted text content
    """
    text_content = ""
    
    # Extract text from different parts of the Jina response
    if content:
        # Extract text from text field
        text_content = content.get("text", "")
        
        # If there's no text field, try to extract from other fields
        if not text_content and "meta" in content:
            meta = content.get("meta", {})
            text_content += meta.get("description", "") + " "
            text_content += meta.get("title", "") + " "
        
        # If there's a blocks field, extract text from it
        if "blocks" in content:
            blocks = content.get("blocks", [])
            for block in blocks:
                if isinstance(block, dict):
                    text_content += block.get("text", "") + " "
    
    return text_content.strip()


def extract_contact_info(content):
    """
    Extract contact information from website content.
    
    Args:
        content (dict): The website content
        
    Returns:
        dict: The extracted contact information
    """
    contact_info = {}
    
    # Extract from text content using basic patterns
    text = extract_text_from_content(content)
    
    # Extract email addresses
    import re
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    if emails:
        contact_info["emails"] = list(set(emails))
    
    # Extract phone numbers (UK format)
    phone_pattern = r'\b(?:0|\+44)(?:\s*\d){9,11}\b'
    phones = re.findall(phone_pattern, text)
    if phones:
        contact_info["phones"] = list(set(phones))
    
    # Extract social media links
    social_media_patterns = {
        "linkedin": r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_-]+',
        "twitter": r'(?:https?:\/\/)?(?:www\.)?twitter\.com\/[A-Za-z0-9_]+',
        "facebook": r'(?:https?:\/\/)?(?:www\.)?facebook\.com\/[A-Za-z0-9_.-]+',
        "instagram": r'(?:https?:\/\/)?(?:www\.)?instagram\.com\/[A-Za-z0-9_.-]+'
    }
    
    social_media = {}
    for platform, pattern in social_media_patterns.items():
        matches = re.findall(pattern, text)
        if matches:
            social_media[platform] = list(set(matches))
    
    if social_media:
        contact_info["social_media"] = social_media
    
    return contact_info


def create_timestamp():
    """
    Create a timestamp in ISO format.
    
    Returns:
        str: The timestamp
    """
    return datetime.now().isoformat()
