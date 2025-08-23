"""
Phase 5: Process the initial JSON file to validate each entry (Generic Version Only).

This module applies user-defined validation criteria to the combined data from Phase 4
to identify companies that meet the specified requirements.
"""

import os
import json
import logging
import sys
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Add parent directory to the Python path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import generic validation module only
try:
    # Try relative imports first (when imported as a module)
    from .utils.generic_validation import validate_website, get_validation_score
    from .utils.api_clients import DeepSeekAIClient
except ImportError:
    # Fall back to absolute imports (when run as standalone script)
    from leadgen.utils.generic_validation import validate_website, get_validation_score
    from leadgen.utils.api_clients import DeepSeekAIClient

# Load environment variables if running as standalone
load_dotenv()
load_dotenv(dotenv_path=".env.local")

logger = logging.getLogger(__name__)

# Constants
COMBINED_DATA_FILE = "data/combined_data.json"
VALIDATED_DATA_FILE = "data/validated_data.json"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")


def load_combined_data():
    """
    Load combined data from Phase 4.
    
    Returns:
        dict: The combined data
    """
    if not os.path.exists(COMBINED_DATA_FILE):
        logger.error(f"Combined data file not found: {COMBINED_DATA_FILE}")
        return {"websites": []}
    
    try:
        with open(COMBINED_DATA_FILE, 'r') as f:
            data = json.load(f)
        
        websites = data.get("websites", [])
        logger.info(f"Loaded {len(websites)} websites from combined data")
        return data
    
    except Exception as e:
        logger.error(f"Error loading combined data: {e}")
        return {"websites": []}


def extract_text_content(website: Dict[str, Any]) -> str:
    """
    Extract text content from website data.
    
    Args:
        website (dict): The website data
        
    Returns:
        str: Extracted text content
    """
    content = website.get("content", {})
    text_content = ""
    
    if content:
        # Try different extraction methods
        # 1. Direct text field
        text_content = content.get("text", "")
        
        # 2. From data.content structure
        if not text_content and isinstance(content.get("data"), dict):
            text_content = content["data"].get("content", "")
        
        # 3. From meta fields
        if "meta" in content:
            meta = content.get("meta", {})
            text_content += " " + meta.get("description", "")
            text_content += " " + meta.get("title", "")
        
        # 4. From blocks
        if "blocks" in content:
            blocks = content.get("blocks", [])
            for block in blocks:
                if isinstance(block, dict):
                    text_content += " " + block.get("text", "")
    
    # Add metadata
    text_content += " " + website.get("title", "")
    text_content += " " + website.get("snippet", "")
    
    return text_content.strip()


def validate_website_entry(website: Dict[str, Any], validation_criteria: Dict[str, Any]) -> tuple:
    """
    Validate a website against user-defined criteria.
    
    Args:
        website (dict): The website data
        validation_criteria (dict): User-defined validation criteria
        
    Returns:
        tuple: (is_valid, validation_results)
    """
    url = website.get("url", "")
    
    # Log validation criteria for debugging
    logger.info(f"Validating {url} with criteria: {json.dumps(validation_criteria, indent=2)}")
    
    # Extract text content
    text_content = extract_text_content(website)
    
    # Perform generic validation
    is_valid = validate_website(text_content, url, validation_criteria)
    
    # Get detailed validation score
    score, check_results = get_validation_score(text_content, url, validation_criteria)
    
    validation_results = {
        "validation_score": score,
        "validation_checks": check_results,
        "meets_criteria": is_valid,
        "validation_mode": "generic",
        "criteria_used": validation_criteria
    }
    
    # AI validation if available and custom rules are present
    if DEEPSEEK_API_KEY and validation_criteria.get('customValidationRules'):
        try:
            deepseek_client = DeepSeekAIClient()
            
            # Create a custom prompt based on validation criteria
            custom_prompt = f"""
            Check if this website meets the following criteria:
            - Industry: {validation_criteria.get('industry', 'Any')}
            - Required Keywords: {', '.join(validation_criteria.get('mustHaveSpecificKeywords', []))}
            - Custom Rules: {validation_criteria.get('customValidationRules', '')}
            
            Analyze the content and determine if it meets these requirements.
            """
            
            ai_validation = deepseek_client.validate_content(text_content, validation_type="custom", custom_prompt=custom_prompt)
            if ai_validation:
                validation_results["ai_validation"] = {
                    "is_valid": ai_validation.get("is_valid", False),
                    "evidence": ai_validation.get("evidence", ""),
                    "confidence": ai_validation.get("confidence", 0)
                }
                
                # Consider AI validation in final decision if confidence is high
                if validation_results["ai_validation"]["confidence"] > 0.8:
                    is_valid = is_valid and validation_results["ai_validation"]["is_valid"]
        except Exception as e:
            logger.warning(f"AI validation failed for {url}: {e}")
    
    return is_valid, validation_results


def save_validated_data(validated_data):
    """
    Save validated data to a JSON file.
    
    Args:
        validated_data (dict): The validated data
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create data directory if it doesn't exist
        Path("data").mkdir(exist_ok=True)
        
        # Save validated data
        with open(VALIDATED_DATA_FILE, 'w') as f:
            json.dump(validated_data, f, indent=2)
        
        logger.info(f"Saved validated data to {VALIDATED_DATA_FILE}")
        return True
    
    except Exception as e:
        logger.error(f"Error saving validated data: {e}")
        return False


def run(validation_criteria: Optional[Dict[str, Any]] = None):
    """
    Run phase 5: Validate website data using user-defined criteria.
    
    Args:
        validation_criteria (dict): User-defined validation criteria from frontend.
                                   REQUIRED - this phase only supports generic validation.
    
    Returns:
        dict: The validated data
    """
    logger.info("Starting Phase 5: Validating website data with user-defined criteria")
    
    # Validation criteria is required
    if not validation_criteria:
        logger.error("No validation criteria provided. This phase requires user-defined validation criteria.")
        return {"websites": [], "error": "No validation criteria provided"}
    
    logger.info(f"Using validation criteria: {json.dumps(validation_criteria, indent=2)}")
    
    # Load combined data from Phase 4
    data = load_combined_data()
    websites = data.get("websites", [])
    
    if not websites:
        logger.warning("No websites found in combined data")
        return {"websites": []}
    
    # Validate each website
    validated_websites = []
    valid_count = 0
    
    for i, website in enumerate(websites):
        url = website.get("url", "")
        logger.info(f"Validating website {i+1}/{len(websites)}: {url}")
        
        try:
            # Perform validation with user criteria
            is_valid, validation_results = validate_website_entry(website, validation_criteria)
            
            # Add validation results to website data
            website["is_valid"] = is_valid
            website["validation_results"] = validation_results
            
            if is_valid:
                valid_count += 1
                logger.info(f"✓ Valid: {url} (score: {validation_results.get('validation_score', 0):.2f})")
            else:
                logger.info(f"✗ Invalid: {url} (failed checks: {[k for k, v in validation_results.get('validation_checks', {}).items() if not v]})")
            
            validated_websites.append(website)
            
        except Exception as e:
            logger.error(f"Error validating {url}: {e}")
            website["is_valid"] = False
            website["validation_results"] = {"error": str(e)}
            validated_websites.append(website)
    
    # Create validated data structure
    validated_data = {
        "websites": validated_websites,
        "total_websites": len(validated_websites),
        "valid_websites": valid_count,
        "validation_mode": "generic",
        "validation_criteria": validation_criteria
    }
    
    # Save validated data
    save_validated_data(validated_data)
    
    logger.info(f"Phase 5 completed. Validated {len(websites)} websites, {valid_count} are valid using user-defined criteria.")
    
    return validated_data


if __name__ == "__main__":
    # Set up logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Example validation criteria from frontend
    example_criteria = {
        "mustHaveWebsite": True,
        "mustHaveContactInfo": True,
        "mustHaveSpecificKeywords": ["technology", "software", "API"],
        "mustBeInIndustry": True,
        "industry": "Technology",
        "customValidationRules": "Must offer API or integration services"
    }
    
    # Run the phase with user-defined validation
    run(validation_criteria=example_criteria)