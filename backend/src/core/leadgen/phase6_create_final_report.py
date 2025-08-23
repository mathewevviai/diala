"""
Phase 6: Create a final JSON file containing only validated entries.

This module filters the validated data from Phase 5 to create
a final JSON file with only the entries that meet the user-defined criteria.
"""

import os
import json
import logging
import sys
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to the Python path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    # Try relative imports first (when imported as a module)
    from .utils.api_clients import DeepSeekAIClient
except ImportError:
    # Fall back to absolute imports (when run as standalone script)
    from leadgen.utils.api_clients import DeepSeekAIClient

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Constants
VALIDATED_DATA_FILE = "data/validated_data.json"
FINAL_RESULTS_FILE = "data/final_results.json"


def load_validated_data():
    """
    Load validated data from Phase 5.
    
    Returns:
        dict: The validated data
    """
    if not os.path.exists(VALIDATED_DATA_FILE):
        logger.error(f"Validated data file not found: {VALIDATED_DATA_FILE}")
        return {"websites": []}
    
    try:
        with open(VALIDATED_DATA_FILE, 'r') as f:
            data = json.load(f)
        
        websites = data.get("websites", [])
        logger.info(f"Loaded {len(websites)} websites from validated data")
        return data
    
    except Exception as e:
        logger.error(f"Error loading validated data: {e}")
        return {"websites": []}


def filter_valid_entries(data):
    """
    Filter only valid entries from the validated data based on generic validation.
    
    Args:
        data (dict): The validated data
        
    Returns:
        list: The filtered valid entries
    """
    valid_entries = []
    
    # Get validation criteria used
    validation_criteria = data.get("validation_criteria", {})
    logger.info(f"Filtering entries based on criteria: {json.dumps(validation_criteria, indent=2)}")
    
    for website in data.get("websites", []):
        if website.get("is_valid", False):
            # Create a clean entry with essential information
            valid_entry = {
                "url": website.get("url", ""),
                "title": website.get("title", ""),
                "domain": website.get("domain", ""),
                "snippet": website.get("snippet", ""),
                "extraction_time": website.get("extraction_time", 0),
                
                # Generic validation results from Phase 5
                "validation": {
                    "validation_score": website.get("validation_results", {}).get("validation_score", 0),
                    "validation_checks": website.get("validation_results", {}).get("validation_checks", {}),
                    "meets_criteria": website.get("validation_results", {}).get("meets_criteria", False),
                    "validation_mode": website.get("validation_results", {}).get("validation_mode", "generic")
                }
            }
            
            # Extract text content
            content_obj = website.get("content", {})
            text_content = extract_text_content(content_obj, website)
            
            # Save text content if it exists
            if text_content:
                logger.info(f"Adding text content ({len(text_content)} chars) to entry: {valid_entry['url']}")
                valid_entry["text_content"] = text_content[:5000]  # Limit to 5000 chars for storage
            
            # Add AI validation evidence from Phase 5 if available
            validation_results = website.get("validation_results", {})
            if "ai_validation" in validation_results:
                valid_entry["ai_validation"] = validation_results["ai_validation"]
            
            # Extract contact information
            contact_info = extract_contact_info(content_obj, website)
            if contact_info:
                valid_entry["contact_info"] = contact_info
            
            # Add metadata
            meta = extract_metadata(content_obj)
            if meta:
                valid_entry["meta"] = meta
            
            valid_entries.append(valid_entry)
            logger.info(f"✓ Added valid entry: {valid_entry['url']} (score: {valid_entry['validation']['validation_score']:.2f})")
    
    return valid_entries


def extract_text_content(content_obj, website):
    """
    Extract text content from various possible structures.
    
    Args:
        content_obj (dict): The content object
        website (dict): The website object
        
    Returns:
        str: Extracted text content
    """
    text_content = ""
    
    # Try various extraction methods
    if isinstance(content_obj, dict):
        # Method 1: Direct text field
        if "text" in content_obj:
            text_content = content_obj.get("text", "")
        
        # Method 2: From data.content structure
        elif "data" in content_obj and isinstance(content_obj["data"], dict):
            if "content" in content_obj["data"]:
                text_content = content_obj["data"]["content"]
        
        # Method 3: From blocks
        if not text_content and "blocks" in content_obj:
            blocks = content_obj.get("blocks", [])
            block_texts = []
            for block in blocks:
                if isinstance(block, dict) and "text" in block:
                    block_texts.append(block["text"])
            text_content = " ".join(block_texts)
    
    # Fallback to website text_content field
    if not text_content:
        text_content = website.get("text_content", "")
    
    # Add title and snippet if no main content
    if not text_content:
        text_content = website.get("title", "") + " " + website.get("snippet", "")
    
    return text_content.strip()


def extract_contact_info(content_obj, website):
    """
    Extract contact information from website content.
    
    Args:
        content_obj (dict): The website content object
        website (dict): The website object
        
    Returns:
        dict: The extracted contact information
    """
    contact_info = {}
    
    # Get text content
    text = extract_text_content(content_obj, website)
    
    if not text:
        return contact_info
    
    # Extract email addresses
    import re
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    if emails:
        # Deduplicate and limit to 5 emails
        unique_emails = list(set(emails))[:5]
        contact_info["emails"] = unique_emails
    
    # Extract phone numbers (various formats)
    phone_patterns = [
        r'\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b',  # US format
        r'\b(?:\+44|0)(?:\s*\d){9,11}\b',  # UK format
        r'\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{0,4}\b',  # International
    ]
    
    phones = []
    for pattern in phone_patterns:
        found_phones = re.findall(pattern, text)
        phones.extend(found_phones)
    
    if phones:
        # Deduplicate and limit to 5 phones
        unique_phones = list(set(phones))[:5]
        contact_info["phones"] = unique_phones
    
    # Extract social media links
    social_media_patterns = {
        "linkedin": r'(?:https?://)?(?:www\.)?linkedin\.com/(?:company|in)/[\w\-]+',
        "twitter": r'(?:https?://)?(?:www\.)?twitter\.com/[\w]+',
        "facebook": r'(?:https?://)?(?:www\.)?facebook\.com/[\w\-\.]+',
        "instagram": r'(?:https?://)?(?:www\.)?instagram\.com/[\w\-\.]+',
    }
    
    social_media = {}
    for platform, pattern in social_media_patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Deduplicate and limit to 3 per platform
            social_media[platform] = list(set(matches))[:3]
    
    if social_media:
        contact_info["social_media"] = social_media
    
    return contact_info


def extract_metadata(content_obj):
    """
    Extract metadata from content object.
    
    Args:
        content_obj (dict): The content object
        
    Returns:
        dict: Extracted metadata
    """
    if not isinstance(content_obj, dict):
        return None
    
    meta = content_obj.get("meta", {})
    if not meta:
        return None
    
    return {
        "title": meta.get("title", ""),
        "description": meta.get("description", ""),
        "author": meta.get("author", ""),
        "canonical": meta.get("canonical", ""),
        "keywords": meta.get("keywords", "")
    }


def save_final_results(valid_entries, validation_criteria):
    """
    Save final results to a JSON file with validation summary.
    
    Args:
        valid_entries (list): The valid entries
        validation_criteria (dict): The validation criteria used
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create data directory if it doesn't exist
        Path("data").mkdir(exist_ok=True)
        
        # Calculate statistics
        stats = {
            "total_valid_entries": len(valid_entries),
            "with_email": len([e for e in valid_entries if e.get("contact_info", {}).get("emails")]),
            "with_phone": len([e for e in valid_entries if e.get("contact_info", {}).get("phones")]),
            "with_social": len([e for e in valid_entries if e.get("contact_info", {}).get("social_media")]),
            "average_validation_score": sum(e.get("validation", {}).get("validation_score", 0) for e in valid_entries) / len(valid_entries) if valid_entries else 0
        }
        
        # Get top scoring entries as examples
        sorted_entries = sorted(valid_entries, key=lambda x: x.get("validation", {}).get("validation_score", 0), reverse=True)
        top_examples = sorted_entries[:5] if len(sorted_entries) >= 5 else sorted_entries
        
        # Create final results object
        final_results = {
            "results": valid_entries,
            "count": len(valid_entries),
            "generated_at": datetime.now().isoformat(),
            "metadata": {
                "description": "Validated entries based on user-defined criteria",
                "version": "2.0",
                "validation_criteria": validation_criteria,
                "statistics": stats,
                "top_examples": [
                    {
                        "url": entry.get("url", ""),
                        "title": entry.get("title", ""),
                        "score": entry.get("validation", {}).get("validation_score", 0),
                        "has_contact": bool(entry.get("contact_info"))
                    }
                    for entry in top_examples
                ]
            }
        }
        
        # Save final results
        with open(FINAL_RESULTS_FILE, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        # Also save a simplified CSV-friendly version
        simplified_results = []
        for entry in valid_entries:
            simplified_entry = {
                "url": entry.get("url", ""),
                "title": entry.get("title", ""),
                "domain": entry.get("domain", ""),
                "validation_score": entry.get("validation", {}).get("validation_score", 0),
                "has_email": bool(entry.get("contact_info", {}).get("emails")),
                "has_phone": bool(entry.get("contact_info", {}).get("phones")),
                "has_social": bool(entry.get("contact_info", {}).get("social_media")),
                "primary_email": entry.get("contact_info", {}).get("emails", [""])[0] if entry.get("contact_info", {}).get("emails") else "",
                "primary_phone": entry.get("contact_info", {}).get("phones", [""])[0] if entry.get("contact_info", {}).get("phones") else ""
            }
            simplified_results.append(simplified_entry)
        
        # Save simplified results
        simplified_file = "data/valid_leads_simplified.json"
        with open(simplified_file, 'w') as f:
            json.dump({
                "leads": simplified_results,
                "count": len(simplified_results),
                "generated_at": datetime.now().isoformat()
            }, f, indent=2)
        
        logger.info(f"Saved {len(valid_entries)} validated entries to {FINAL_RESULTS_FILE}")
        logger.info(f"Saved simplified version to {simplified_file}")
        
        return True
    
    except Exception as e:
        logger.error(f"Error saving final results: {e}")
        return False


def run():
    """
    Run phase 6: Create final JSON file with validated entries.
    
    This phase processes entries that passed Phase 5's generic validation
    and creates a clean, structured output file.
    
    Returns:
        list: The final valid entries
    """
    logger.info("Starting Phase 6: Creating final JSON file with validated entries")
    
    # Load validated data from Phase 5
    data = load_validated_data()
    
    if not data.get("websites"):
        logger.warning("No websites found in validated data. Creating empty final results.")
        valid_entries = []
        validation_criteria = {}
    else:
        # Filter valid entries
        valid_entries = filter_valid_entries(data)
        validation_criteria = data.get("validation_criteria", {})
        
        # Report statistics
        total_entries = len(data.get("websites", []))
        valid_count = len(valid_entries)
        logger.info(f"Filtered {valid_count} valid entries from {total_entries} total entries")
        
        if valid_entries:
            # Show validation score distribution
            scores = [e.get("validation", {}).get("validation_score", 0) for e in valid_entries]
            avg_score = sum(scores) / len(scores)
            max_score = max(scores)
            min_score = min(scores)
            
            logger.info(f"Validation score stats: avg={avg_score:.2f}, min={min_score:.2f}, max={max_score:.2f}")
            
            # Show contact info availability
            with_email = len([e for e in valid_entries if e.get("contact_info", {}).get("emails")])
            with_phone = len([e for e in valid_entries if e.get("contact_info", {}).get("phones")])
            logger.info(f"Contact info: {with_email} with email, {with_phone} with phone")
    
    # Save final results
    save_final_results(valid_entries, validation_criteria)
    
    logger.info(f"Phase 6 completed. Created final JSON file with {len(valid_entries)} valid entries.")
    
    return valid_entries


if __name__ == "__main__":
    # Set up logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the phase
    run()