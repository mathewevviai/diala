"""
Phase 4: Save all website content and links to a JSON file.

This module processes and organizes the data from previous phases
and ensures continuous progress tracking.
"""

import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Constants
WEBSITE_CONTENTS_FILE = "data/website_contents.json"
EXTRACTED_LINKS_FILE = "data/extracted_links.json"
COMBINED_DATA_FILE = "data/combined_data.json"


def load_website_contents():
    """
    Load website contents from Phase 3.
    
    Returns:
        list: The website contents
    """
    if not os.path.exists(WEBSITE_CONTENTS_FILE):
        logger.error(f"Website contents file not found: {WEBSITE_CONTENTS_FILE}")
        return []
    
    try:
        with open(WEBSITE_CONTENTS_FILE, 'r') as f:
            data = json.load(f)
        
        websites = data.get("websites", [])
        logger.info(f"Loaded {len(websites)} website contents from {WEBSITE_CONTENTS_FILE}")
        return websites
    
    except Exception as e:
        logger.error(f"Error loading website contents: {e}")
        return []


def load_extracted_links():
    """
    Load extracted links from Phase 2.
    
    Returns:
        list: The extracted links
    """
    if not os.path.exists(EXTRACTED_LINKS_FILE):
        logger.error(f"Extracted links file not found: {EXTRACTED_LINKS_FILE}")
        return []
    
    try:
        with open(EXTRACTED_LINKS_FILE, 'r') as f:
            data = json.load(f)
        
        links = data.get("links", [])
        logger.info(f"Loaded {len(links)} extracted links from {EXTRACTED_LINKS_FILE}")
        return links
    
    except Exception as e:
        logger.error(f"Error loading extracted links: {e}")
        return []


def combine_data(websites, links):
    """
    Combine website contents and links data.
    
    Args:
        websites (list): List of website content dictionaries
        links (list): List of link dictionaries
        
    Returns:
        dict: The combined data
    """
    # Create a lookup dictionary for link metadata
    link_metadata = {}
    for link in links:
        url = link.get("url", "")
        if url:
            link_metadata[url] = {
                "title": link.get("title", ""),
                "snippet": link.get("snippet", ""),
                "position": link.get("position", 0),
                "domain": link.get("domain", "")
            }
    
    # Combine data
    combined_data = {
        "websites": []
    }
    
    for website in websites:
        url = website.get("url", "")
        metadata = link_metadata.get(url, {})
        
        combined_website = {
            "url": url,
            "title": metadata.get("title", ""),
            "domain": metadata.get("domain", ""),
            "snippet": metadata.get("snippet", ""),
            "search_position": metadata.get("position", 0),
            "extraction_time": website.get("extraction_time", 0),
            "content": website.get("content", {}),
            "validated": website.get("validated", False)
        }
        
        combined_data["websites"].append(combined_website)
    
    return combined_data


def save_combined_data(combined_data):
    """
    Save combined data to a JSON file.
    
    Args:
        combined_data (dict): The combined data
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create data directory if it doesn't exist
        Path("data").mkdir(exist_ok=True)
        
        # Save combined data
        with open(COMBINED_DATA_FILE, 'w') as f:
            json.dump(combined_data, f, indent=2)
        
        logger.info(f"Saved combined data for {len(combined_data['websites'])} websites to {COMBINED_DATA_FILE}")
        return True
    
    except Exception as e:
        logger.error(f"Error saving combined data: {e}")
        return False


def run():
    """
    Run phase 4: Save all website content and links.
    
    Returns:
        dict: The combined data
    """
    logger.info("Starting Phase 4: Saving all website content and links")
    
    # Load website contents from Phase 3
    websites = load_website_contents()
    
    if not websites:
        logger.warning("No website contents found. Skipping data saving.")
        return {"websites": []}
    
    # Load extracted links from Phase 2
    links = load_extracted_links()
    
    if not links:
        logger.warning("No extracted links found. Using only website content data.")
    
    # Combine data
    combined_data = combine_data(websites, links)
    
    # Save combined data
    save_combined_data(combined_data)
    
    logger.info(f"Phase 4 completed. Saved combined data for {len(combined_data['websites'])} websites.")
    return combined_data


if __name__ == "__main__":
    # Set up logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the phase
    run()
