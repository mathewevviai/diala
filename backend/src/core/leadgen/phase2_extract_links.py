"""
Phase 2: Extract links from search results.

This module extracts all links from the search results obtained in Phase 1
and saves them to a JSON file.
"""

import os
import json
import logging
from pathlib import Path
from urllib.parse import urlparse, urljoin

logger = logging.getLogger(__name__)

# Constants
SEARCH_RESULTS_FILE = "data/search_results.json"
EXTRACTED_LINKS_FILE = "data/extracted_links.json"


def load_search_results():
    """
    Load search results from Phase 1.
    
    Returns:
        list: The search results
    """
    if not os.path.exists(SEARCH_RESULTS_FILE):
        logger.error(f"Search results file not found: {SEARCH_RESULTS_FILE}")
        return []
    
    try:
        with open(SEARCH_RESULTS_FILE, 'r') as f:
            data = json.load(f)
        
        results = data.get("results", [])
        logger.info(f"Loaded {len(results)} search results from {SEARCH_RESULTS_FILE}")
        return results
    
    except Exception as e:
        logger.error(f"Error loading search results: {e}")
        return []


def extract_links(search_results):
    """
    Extract links from search results.
    
    Args:
        search_results (list): List of search result dictionaries
        
    Returns:
        list: List of extracted links with metadata
    """
    extracted_links = []
    seen_urls = set()
    
    for result in search_results:
        url = result.get("link", "")
        
        # Skip if URL is empty or already processed
        if not url or url in seen_urls:
            continue
        
        # Parse URL to normalize
        parsed_url = urlparse(url)
        
        # Skip if not http/https
        if parsed_url.scheme not in ('http', 'https'):
            continue
        
        # Normalize URL by removing parameters and fragments
        normalized_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
        
        if normalized_url in seen_urls:
            continue
        
        seen_urls.add(normalized_url)
        seen_urls.add(url)  # Add original URL to seen set as well
        
        # Extract domain
        domain = parsed_url.netloc
        
        # Create link object
        link_obj = {
            "url": url,
            "normalized_url": normalized_url,
            "domain": domain,
            "title": result.get("title", ""),
            "snippet": result.get("snippet", ""),
            "position": result.get("position", 0),
            "processed": False
        }
        
        extracted_links.append(link_obj)
    
    logger.info(f"Extracted {len(extracted_links)} unique links from search results")
    return extracted_links


def save_extracted_links(links):
    """
    Save extracted links to a JSON file.
    
    Args:
        links (list): List of link dictionaries
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create data directory if it doesn't exist
        Path("data").mkdir(exist_ok=True)
        
        # Check if file exists and load existing data
        if os.path.exists(EXTRACTED_LINKS_FILE):
            with open(EXTRACTED_LINKS_FILE, 'r') as f:
                existing_data = json.load(f)
        else:
            existing_data = {"links": []}
        
        # Get existing URLs
        existing_urls = {link.get("url", "") for link in existing_data["links"]}
        
        # Add new links if not already present
        for link in links:
            if link.get("url", "") not in existing_urls:
                existing_data["links"].append(link)
                existing_urls.add(link.get("url", ""))
        
        # Save updated links
        with open(EXTRACTED_LINKS_FILE, 'w') as f:
            json.dump(existing_data, f, indent=2)
        
        logger.info(f"Saved {len(existing_data['links'])} extracted links to {EXTRACTED_LINKS_FILE}")
        return True
    
    except Exception as e:
        logger.error(f"Error saving extracted links: {e}")
        return False


def run():
    """
    Run phase 2: Extract links from search results.
    
    Args:
        max_links (int): Maximum number of links to process
        
    Returns:
        list: The extracted links
    """
    logger.info("Starting Phase 2: Extracting links from search results")
    
    # Load search results from Phase 1
    search_results = load_search_results()
    
    if not search_results:
        logger.warning("No search results found. Skipping link extraction.")
        return []
    
    # Extract links from search results
    extracted_links = extract_links(search_results)
    
    # Save extracted links
    save_extracted_links(extracted_links)
    
    logger.info(f"Phase 2 completed. Extracted {len(extracted_links)} links.")
    return extracted_links


if __name__ == "__main__":
    # Set up logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the phase with default parameters
    run()
