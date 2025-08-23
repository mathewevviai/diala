"""
Phase 3: Extract content from websites using Jina AI Reader.

This module uses the Jina AI Reader API to extract content from each
website in the list of extracted links from Phase 2.
"""

import os
import json
import time
import logging
import requests
from pathlib import Path

try:
    from dotenv import load_dotenv
    # Load environment variables if running as standalone
    load_dotenv() # Load .env first
    load_dotenv(dotenv_path=".env.local") # Load .env.local, potentially overriding .env
except ImportError:
    # Dotenv might not be needed if environment variables are set elsewhere
    logging.warning("python-dotenv not found, using existing environment variables")

logger = logging.getLogger(__name__)

# Constants
EXTRACTED_LINKS_FILE = "data/extracted_links.json"
WEBSITE_CONTENTS_FILE = "data/website_contents.json"
JINA_API_KEY = os.getenv("JINA_API_KEY")
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds


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


def extract_content_with_jina(url):
    """
    Extract content from a website using Jina AI Reader API.
    
    Args:
        url (str): The URL to extract content from
        
    Returns:
        dict: The extracted content or None if extraction failed
    """
    if not JINA_API_KEY:
        logger.error("JINA_API_KEY environment variable not set")
        return None
    
    logger.info(f"Extracting content from: {url}")
    
    # Skip unsupported file types (Jina AI Reader doesn't handle these well)
    unsupported_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.ppt', '.pptx']
    if any(url.lower().endswith(ext) for ext in unsupported_extensions):
        logger.warning(f"Skipping unsupported file type: {url}")
        return None
    
    # Updated headers according to Jina AI documentation
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",  # Required for JSON response
        "X-With-Links-Summary": "true",  # Include links summary
        "X-With-Images-Summary": "true"  # Include images summary
    }
    
    # Updated payload according to documentation - simplified
    data = {
        "url": url
    }
    
    # Use variable retry delay with exponential backoff
    for attempt in range(MAX_RETRIES):
        try:
            # Calculate exponential backoff for retries
            retry_delay = RETRY_DELAY * (2 ** attempt) if attempt > 0 else RETRY_DELAY
            
            # Add a longer delay between requests to avoid rate limiting
            if attempt > 0:
                logger.info(f"Using exponential backoff: waiting {retry_delay} seconds before retry...")
                time.sleep(retry_delay)
            
            # Updated endpoint according to Jina AI documentation
            # The correct endpoint is https://r.jina.ai/ not https://api.jina.ai/v1/reader
            response = requests.post(
                "https://r.jina.ai/",
                headers=headers,
                json=data,
                timeout=45  # Increase timeout to 45 seconds to handle slower pages
            )
            
            response.raise_for_status()
            content = response.json()
            
            # Check if response is actually valid with content
            if "data" not in content or not content.get("data", {}).get("content"):
                logger.warning(f"Response from Jina AI Reader contains no content for URL: {url}")
                if attempt < MAX_RETRIES - 1:
                    continue
                else:
                    logger.error(f"Max retries reached for URL: {url} - empty content returned")
                    return None
            
            # Enhanced logging to show details about the extracted content
            content_length = len(str(content))
            
            # Log information about content structure
            data_keys = content.get("data", {}).keys() if "data" in content else []
            content_text = content.get("data", {}).get("content", "")
            content_text_length = len(content_text)
            title = content.get("data", {}).get("title", "Unknown Title")
            num_links = len(content.get("data", {}).get("links", {}))
            num_images = len(content.get("data", {}).get("images", {}))
            
            # Create a detailed log message
            log_message = f"""
============ SUCCESSFULLY EXTRACTED CONTENT FROM: {url} ============
Title: {title}
Content Size: {content_text_length} characters
Total JSON Size: {content_length} characters
Data Keys: {list(data_keys)}
Number of Links: {num_links}
Number of Images: {num_images}
Status Code: {content.get("code", "Unknown")}
Content Sample: {content_text[:300]}...
============================================================
"""
            logger.info(log_message)
            
            return content
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error extracting content (attempt {attempt+1}/{MAX_RETRIES}): {e}")
            
            if attempt < MAX_RETRIES - 1:
                # Calculate exponential backoff for next retry
                retry_delay = RETRY_DELAY * (2 ** attempt)
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error(f"Max retries reached for URL: {url}")
                return None


def save_website_content(url, content, links_data):
    """
    Save website content to a JSON file.
    
    Args:
        url (str): The URL of the website
        content (dict): The extracted content
        links_data (list): List of link dictionaries to update processed status
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create data directory if it doesn't exist
        Path("data").mkdir(exist_ok=True)
        
        # Check if file exists and load existing data
        if os.path.exists(WEBSITE_CONTENTS_FILE):
            with open(WEBSITE_CONTENTS_FILE, 'r') as f:
                existing_data = json.load(f)
        else:
            existing_data = {"websites": []}
        
        # Get existing URLs
        existing_urls = {website.get("url", "") for website in existing_data["websites"]}
        
        # Add new content if not already present
        if url not in existing_urls:
            website_data = {
                "url": url,
                "content": content,
                "extraction_time": time.time(),
                "validated": False
            }
            existing_data["websites"].append(website_data)
        
        # Save updated content
        with open(WEBSITE_CONTENTS_FILE, 'w') as f:
            json.dump(existing_data, f, indent=2)
        
        # Update links processed status
        for link in links_data:
            if link.get("url") == url:
                link["processed"] = True
        
        # Save updated links
        with open(EXTRACTED_LINKS_FILE, 'w') as f:
            json.dump({"links": links_data}, f, indent=2)
        
        # Enhanced logging for saved content
        total_websites = len(existing_data["websites"])
        title = content.get("data", {}).get("title", "Unknown Title")
        
        logger.info(f"""
============ SAVED WEBSITE CONTENT ============
URL: {url}
Title: {title}
Total Websites in Database: {total_websites}
Success: ✅ Content saved successfully
=============================================
""")
        return True
    
    except Exception as e:
        logger.error(f"Error saving website content: {e}")
        return False


def run(max_links=None):
    """
    Run phase 3: Extract content from websites.
    
    Args:
        max_links (int, optional): Maximum number of links to process. If None, process all links.
        
    Returns:
        dict: Statistics about the processing, including counts of success, errors, etc.
    """
    logger.info("Starting Phase 3: Extracting content from websites using Jina AI Reader")
    
    # Check if Jina API key is available
    if not JINA_API_KEY:
        logger.error("JINA_API_KEY environment variable not set. Cannot proceed with content extraction.")
        return {"success": 0, "error": 0, "skipped": 0, "total": 0}
    
    # Load extracted links from Phase 2
    links_data = load_extracted_links()
    
    if not links_data:
        logger.warning("No extracted links found. Skipping content extraction.")
        return {"success": 0, "error": 0, "skipped": 0, "total": 0}
    
    # Load existing website content database to avoid reprocessing
    existing_urls = set()
    if os.path.exists(WEBSITE_CONTENTS_FILE):
        try:
            with open(WEBSITE_CONTENTS_FILE, 'r') as f:
                existing_data = json.load(f)
                existing_websites = existing_data.get("websites", [])
                existing_urls = {website.get("url", "") for website in existing_websites}
                logger.info(f"Found {len(existing_urls)} already processed URLs in website content database")
        except Exception as e:
            logger.error(f"Error loading existing website contents: {e}")
    
    # Filter links that haven't been processed yet and are not in the website content database
    unprocessed_links = [
        link for link in links_data 
        if not link.get("processed", False) and link.get("url", "") not in existing_urls
    ]
    
    if not unprocessed_links:
        logger.info("All links have already been processed. No new content to extract.")
        return {"success": 0, "error": 0, "skipped": 0, "total": len(links_data)}
    
    # Stats for tracking progress
    stats = {
        "success": 0,  # Successfully processed
        "error": 0,    # Failed to process
        "skipped": 0,  # Skipped (no URL, etc)
        "total": len(links_data),
        "already_processed": len(existing_urls)
    }
    
    # Limit number of links if specified
    if max_links is not None and len(unprocessed_links) > max_links:
        logger.info(f"Limiting content extraction to {max_links} links (from {len(unprocessed_links)})")
        unprocessed_links = unprocessed_links[:max_links]
    else:
        logger.info(f"Processing all {len(unprocessed_links)} remaining unprocessed links")
    
    # Process each link
    for i, link in enumerate(unprocessed_links):
        url = link.get("url", "")
        
        # Log progress every 10 links
        if i % 10 == 0 and i > 0:
            logger.info(f"Progress: {i}/{len(unprocessed_links)} links processed ({i/len(unprocessed_links)*100:.1f}%)")
        
        if not url:
            logger.warning(f"Link at index {i} has no URL. Skipping.")
            stats["skipped"] += 1
            continue
        
        try:
            # Extract content using Jina AI Reader
            content = extract_content_with_jina(url)
            
            if content:
                # Save content and update link status
                save_website_content(url, content, links_data)
                stats["success"] += 1
            else:
                # Mark as processed but with error
                logger.warning(f"Failed to extract content from {url}. Marking as processed with error.")
                link["processed"] = True
                link["error"] = "Content extraction failed"
                # Save the updated link status
                with open(EXTRACTED_LINKS_FILE, 'w') as f:
                    json.dump({"links": links_data}, f, indent=2)
                stats["error"] += 1
        
        except Exception as e:
            # Handle any unexpected errors
            logger.error(f"Unexpected error processing {url}: {e}")
            # Mark as processed but with error
            link["processed"] = True
            link["error"] = f"Error: {str(e)}"
            # Save the updated link status
            with open(EXTRACTED_LINKS_FILE, 'w') as f:
                json.dump({"links": links_data}, f, indent=2)
            stats["error"] += 1
            
        # Add a minimal delay between requests
        # Just enough to avoid overwhelming the server, but not so much that it slows processing
        time.sleep(0.5)  # Half-second delay is less noticeable but still provides some rate limiting
    
    # Calculate total processed
    total_processed = stats["success"] + stats["error"] + stats["skipped"]
    remaining = len(links_data) - total_processed - (len(links_data) - len(unprocessed_links))
    
    # Create a detailed summary with statistics
    logger.info(f"""
============ PHASE 3 SUMMARY ============
🔍 PROCESSING RESULTS:
  ✅ Successfully Processed New: {stats["success"]} URLs
  ❌ Error/Failed URLs: {stats["error"]} URLs
  ⏩ Skipped URLs: {stats["skipped"]} URLs
  📊 Total Processed This Run: {total_processed} out of {len(unprocessed_links)} attempted
  🔄 Previously Processed URLs: {stats["already_processed"]} URLs

📈 SUCCESS METRICS:
  Success Rate: {int((stats["success"] / len(unprocessed_links) * 100) if len(unprocessed_links) > 0 else 0)}%
  Error Rate: {int((stats["error"] / len(unprocessed_links) * 100) if len(unprocessed_links) > 0 else 0)}%

🗄️ DATABASE STATUS:
  Remaining Unprocessed Links: {remaining}
  Total Unique URLs in Database: {stats["already_processed"] + stats["success"]} 
  Total Links in Links Database: {stats["total"]}

✅ Phase 3 completed successfully
==========================================
""")
    return stats


if __name__ == "__main__":
    # Set up logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the phase with default parameters
    run()
