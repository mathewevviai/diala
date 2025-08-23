#!/usr/bin/env python3
"""
JinaRecursiveSearch - Deep recursive research tool using Jina Search and Reader APIs.
This script performs comprehensive research on any topic by recursively following links
and extracting content to build a knowledge base.
"""

import os
import sys
import json
import asyncio
import argparse
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Set, Optional, Tuple
from urllib.parse import urlparse, urljoin
import hashlib

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.src.core.leadgen.jina_client import JinaClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class JinaRecursiveSearcher:
    """Performs recursive search and content extraction using Jina APIs."""
    
    def __init__(self, api_key: str, output_dir: str):
        self.api_key = api_key
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize Jina client
        self.client = JinaClient(api_key=api_key, max_concurrent=5)
        
        # Track processed URLs to avoid duplicates
        self.processed_urls: Set[str] = set()
        self.failed_urls: Set[str] = set()
        
        # Store all extracted data
        self.all_results: List[Dict[str, Any]] = []
        self.content_by_url: Dict[str, Dict[str, Any]] = {}
        
        # Statistics
        self.stats = {
            "start_time": datetime.now(),
            "total_searches": 0,
            "urls_processed": 0,
            "urls_failed": 0,
            "content_extracted": 0,
            "total_depth_reached": 0,
            "subtopics_found": set()
        }
    
    def generate_search_variations(self, topic: str, focus_areas: List[str] = None) -> List[str]:
        """Generate multiple search query variations for comprehensive coverage."""
        queries = [topic]
        
        # Add variations for YouTube transcript specific searches
        if "youtube" in topic.lower() and "transcript" in topic.lower():
            base_variations = [
                "YouTube transcript generator",
                "YouTube to text converter",
                "video to transcript tool",
                "YouTube subtitles extractor",
                "YouTube caption generator",
                "convert YouTube to text",
                "YouTube video transcription service",
                "free YouTube transcript tool",
                "YouTube transcript API",
                "YouTube subtitle downloader",
                "video transcription software",
                "automatic YouTube transcription"
            ]
            queries.extend(base_variations)
            
            # Add competitive/commercial variations
            queries.extend([
                "best YouTube transcript tools 2024",
                "YouTube transcript generator comparison",
                "YouTube transcription service pricing",
                "YouTube to text converter free online",
                "YouTube transcript tools for content creators",
                "bulk YouTube transcript extraction"
            ])
        
        # Add focus area combinations
        if focus_areas:
            for focus in focus_areas:
                queries.append(f"{topic} {focus}")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_queries = []
        for q in queries:
            if q.lower() not in seen:
                seen.add(q.lower())
                unique_queries.append(q)
        
        return unique_queries[:20]  # Limit to 20 queries
    
    def calculate_relevance_score(self, content: str, url: str, topic: str) -> float:
        """Calculate relevance score for extracted content."""
        score = 0.0
        content_lower = content.lower()
        topic_words = topic.lower().split()
        
        # Check URL relevance
        url_lower = url.lower()
        for word in topic_words:
            if word in url_lower:
                score += 0.1
        
        # Check content relevance
        important_keywords = [
            "youtube", "transcript", "video", "text", "convert", 
            "generator", "tool", "service", "api", "free", "online",
            "subtitle", "caption", "transcription", "extract"
        ]
        
        for keyword in important_keywords:
            count = content_lower.count(keyword)
            if count > 0:
                score += min(0.1 * count, 0.3)  # Cap contribution per keyword
        
        # Check for pricing/feature information
        if any(term in content_lower for term in ["pricing", "price", "cost", "free", "trial", "plan"]):
            score += 0.2
        
        if any(term in content_lower for term in ["feature", "support", "language", "format", "api"]):
            score += 0.2
        
        # Normalize score to 0-1 range
        return min(score, 1.0)
    
    def extract_relevant_urls(self, content: str, base_url: str) -> List[str]:
        """Extract URLs from content that might be relevant for recursive exploration."""
        # Simple URL extraction pattern
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+[^\s<>"{}|\\^`\[\].,;:!?\'"()]'
        urls = re.findall(url_pattern, content)
        
        # Also look for relative URLs
        relative_pattern = r'href=["\']([^"\']+)["\']'
        relative_urls = re.findall(relative_pattern, content)
        
        # Convert relative URLs to absolute
        base_domain = urlparse(base_url).netloc
        for rel_url in relative_urls:
            if rel_url.startswith('/'):
                abs_url = f"https://{base_domain}{rel_url}"
                urls.append(abs_url)
            elif not rel_url.startswith('http'):
                abs_url = urljoin(base_url, rel_url)
                urls.append(abs_url)
        
        # Filter and clean URLs
        clean_urls = []
        for url in urls:
            # Remove fragments and clean up
            url = url.split('#')[0].rstrip('/')
            
            # Skip certain URL patterns
            skip_patterns = [
                'facebook.com', 'twitter.com', 'pinterest.com', 'instagram.com',
                'linkedin.com', 'youtube.com/watch', 'youtube.com/channel',
                '.pdf', '.jpg', '.png', '.gif', '.mp4', '.zip'
            ]
            
            if any(pattern in url.lower() for pattern in skip_patterns):
                continue
            
            # Only keep URLs that might be relevant
            relevant_patterns = [
                'transcript', 'convert', 'tool', 'service', 'video-to-text',
                'subtitle', 'caption', 'about', 'features', 'pricing', 'api'
            ]
            
            if any(pattern in url.lower() for pattern in relevant_patterns):
                clean_urls.append(url)
        
        return list(set(clean_urls))[:50]  # Limit to 50 URLs per page
    
    async def search_and_extract(self, queries: List[str], depth: int = 0, max_depth: int = 2) -> None:
        """Recursively search and extract content."""
        if depth > max_depth:
            return
        
        logger.info(f"\n{'='*60}")
        logger.info(f"DEPTH {depth}: Processing {len(queries)} queries")
        logger.info(f"{'='*60}")
        
        async with self.client:
            # Search phase
            if depth == 0:
                # Initial search with queries
                logger.info("Performing initial searches...")
                search_results = await self.client.search_multiple(queries, pages_per_query=2)
                self.stats["total_searches"] += len(queries) * 2
            else:
                # For deeper levels, queries are actually URLs to process
                search_results = [{"url": url, "title": "", "description": ""} for url in queries]
            
            # Extract unique URLs
            urls_to_process = []
            seen_domains = set()
            
            for result in search_results:
                url = result.get("url", "")
                if url and url not in self.processed_urls and url not in self.failed_urls:
                    domain = urlparse(url).netloc
                    # Limit to 3 URLs per domain to avoid over-crawling
                    domain_key = f"{domain}_{depth}"
                    if domain_key not in seen_domains or len([u for u in urls_to_process if urlparse(u).netloc == domain]) < 3:
                        urls_to_process.append(url)
                        seen_domains.add(domain_key)
            
            logger.info(f"Found {len(urls_to_process)} unique URLs to process")
            
            if not urls_to_process:
                return
            
            # Content extraction phase
            logger.info("Extracting content from URLs...")
            extracted_content = await self.client.read_urls(
                urls_to_process[:50],  # Limit per level
                progress_callback=self._progress_callback
            )
            
            # Process extracted content
            next_level_urls = []
            
            for i, content_data in enumerate(extracted_content):
                url = urls_to_process[i] if i < len(urls_to_process) else None
                if not url:
                    continue
                
                self.processed_urls.add(url)
                self.stats["urls_processed"] += 1
                
                if content_data.get("success") and content_data.get("content"):
                    self.stats["content_extracted"] += 1
                    
                    # Calculate relevance
                    relevance = self.calculate_relevance_score(
                        content_data.get("content", ""),
                        url,
                        "youtube transcript"
                    )
                    
                    # Store content
                    content_data["relevance_score"] = relevance
                    content_data["depth"] = depth
                    content_data["extracted_at"] = datetime.now().isoformat()
                    
                    self.content_by_url[url] = content_data
                    self.all_results.append(content_data)
                    
                    # Extract URLs for next level if relevant enough
                    if relevance > 0.3 and depth < max_depth:
                        found_urls = self.extract_relevant_urls(
                            content_data.get("content", ""),
                            url
                        )
                        next_level_urls.extend(found_urls)
                    
                    # Log high-relevance findings
                    if relevance > 0.7:
                        logger.info(f"HIGH RELEVANCE ({relevance:.2f}): {url}")
                else:
                    self.failed_urls.add(url)
                    self.stats["urls_failed"] += 1
            
            # Update max depth reached
            self.stats["total_depth_reached"] = max(self.stats["total_depth_reached"], depth)
            
            # Recursive call for next level
            if next_level_urls and depth < max_depth:
                # Filter to unprocessed URLs only
                next_urls = [
                    url for url in set(next_level_urls) 
                    if url not in self.processed_urls and url not in self.failed_urls
                ]
                
                if next_urls:
                    logger.info(f"Found {len(next_urls)} URLs for depth {depth + 1}")
                    await self.search_and_extract(next_urls[:100], depth + 1, max_depth)
    
    async def _progress_callback(self, progress: Dict[str, Any]) -> None:
        """Handle progress updates."""
        logger.info(f"Progress: {progress.get('completed')}/{progress.get('total')} "
                   f"({progress.get('percentage')}%) - {progress.get('stage')}")
    
    def organize_results(self) -> Dict[str, Any]:
        """Organize results by relevance and subtopic."""
        # Sort by relevance
        sorted_results = sorted(
            self.all_results,
            key=lambda x: x.get("relevance_score", 0),
            reverse=True
        )
        
        # Categorize by relevance
        high_relevance = [r for r in sorted_results if r.get("relevance_score", 0) > 0.7]
        medium_relevance = [r for r in sorted_results if 0.4 <= r.get("relevance_score", 0) <= 0.7]
        low_relevance = [r for r in sorted_results if r.get("relevance_score", 0) < 0.4]
        
        # Extract key information
        tools_found = []
        for result in high_relevance + medium_relevance:
            domain = urlparse(result.get("url", "")).netloc
            tool_info = {
                "domain": domain,
                "url": result.get("url"),
                "title": result.get("title", ""),
                "relevance": result.get("relevance_score", 0),
                "has_pricing": "pricing" in result.get("content", "").lower() or "price" in result.get("content", "").lower(),
                "has_api": "api" in result.get("content", "").lower(),
                "emails": result.get("extracted_data", {}).get("emails", []),
                "has_contact_form": result.get("extracted_data", {}).get("has_contact_form", False)
            }
            
            # Avoid duplicates by domain
            if not any(t["domain"] == domain for t in tools_found):
                tools_found.append(tool_info)
        
        return {
            "summary": {
                "topic": "YouTube to Transcript Tools",
                "search_timestamp": self.stats["start_time"].isoformat(),
                "statistics": {
                    "total_searches": self.stats["total_searches"],
                    "urls_processed": self.stats["urls_processed"],
                    "content_extracted": self.stats["content_extracted"],
                    "urls_failed": self.stats["urls_failed"],
                    "total_depth_reached": self.stats["total_depth_reached"],
                    "processing_time_seconds": (datetime.now() - self.stats["start_time"]).total_seconds()
                },
                "relevance_distribution": {
                    "high": len(high_relevance),
                    "medium": len(medium_relevance),
                    "low": len(low_relevance)
                }
            },
            "tools_found": tools_found[:30],  # Top 30 tools
            "by_relevance": {
                "high": high_relevance,
                "medium": medium_relevance,
                "low": low_relevance
            },
            "all_results": sorted_results
        }
    
    def save_results(self, organized_data: Dict[str, Any]) -> None:
        """Save results to structured output directory."""
        # Create subdirectories
        (self.output_dir / "by-relevance").mkdir(exist_ok=True)
        (self.output_dir / "by-relevance" / "high-relevance").mkdir(exist_ok=True)
        (self.output_dir / "by-relevance" / "medium-relevance").mkdir(exist_ok=True)
        (self.output_dir / "by-relevance" / "low-relevance").mkdir(exist_ok=True)
        (self.output_dir / "raw").mkdir(exist_ok=True)
        
        # Save summary
        with open(self.output_dir / "summary.json", "w") as f:
            json.dump(organized_data["summary"], f, indent=2)
        
        # Save tools found
        with open(self.output_dir / "tools_found.json", "w") as f:
            json.dump(organized_data["tools_found"], f, indent=2)
        
        # Save all results
        with open(self.output_dir / "all_results.json", "w") as f:
            json.dump(organized_data["all_results"], f, indent=2)
        
        # Create README
        readme_content = self._generate_readme(organized_data)
        with open(self.output_dir / "README.md", "w") as f:
            f.write(readme_content)
        
        # Save individual content files by relevance
        for relevance, results in organized_data["by_relevance"].items():
            for i, result in enumerate(results[:20]):  # Limit to 20 per category
                filename = f"{relevance}/site_{i+1}_{urlparse(result.get('url', '')).netloc.replace('.', '_')}.json"
                filepath = self.output_dir / "by-relevance" / filename
                with open(filepath, "w") as f:
                    json.dump(result, f, indent=2)
        
        logger.info(f"\nResults saved to: {self.output_dir}")
    
    def _generate_readme(self, organized_data: Dict[str, Any]) -> str:
        """Generate README.md with overview and navigation."""
        stats = organized_data["summary"]["statistics"]
        tools = organized_data["tools_found"]
        
        readme = f"""# YouTube to Transcript Tools Research Results

Generated on: {organized_data['summary']['search_timestamp']}

## Overview

This research identified and analyzed websites ranking for "YouTube to Transcript" and related keywords.

## Statistics

- **Total searches performed**: {stats['total_searches']}
- **URLs processed**: {stats['urls_processed']}
- **Content successfully extracted**: {stats['content_extracted']}
- **Failed extractions**: {stats['urls_failed']}
- **Maximum depth reached**: {stats['total_depth_reached']}
- **Processing time**: {stats['processing_time_seconds']:.1f} seconds

## Top Tools Found

### High-Relevance Tools (Score > 0.7)

"""
        
        # Add top tools
        high_relevance_tools = [t for t in tools if t["relevance"] > 0.7][:15]
        for i, tool in enumerate(high_relevance_tools, 1):
            features = []
            if tool["has_pricing"]:
                features.append("Pricing Info")
            if tool["has_api"]:
                features.append("API")
            if tool["has_contact_form"]:
                features.append("Contact Form")
            if tool["emails"]:
                features.append(f"{len(tool['emails'])} Email(s)")
            
            features_str = f" - Features: {', '.join(features)}" if features else ""
            readme += f"{i}. **{tool['domain']}** - Relevance: {tool['relevance']:.2f}{features_str}\n"
            readme += f"   - URL: {tool['url']}\n"
            if tool["title"]:
                readme += f"   - Title: {tool['title']}\n"
            readme += "\n"
        
        readme += """
## File Structure

- `summary.json` - Overall statistics and summary
- `tools_found.json` - List of all discovered tools with key information
- `all_results.json` - Complete extracted data from all URLs
- `by-relevance/` - Content organized by relevance score
  - `high-relevance/` - Most relevant tools and services
  - `medium-relevance/` - Moderately relevant results
  - `low-relevance/` - Less relevant results
- `README.md` - This file

## Key Findings

"""
        
        # Add insights
        total_tools = len(tools)
        with_pricing = len([t for t in tools if t["has_pricing"]])
        with_api = len([t for t in tools if t["has_api"]])
        with_contact = len([t for t in tools if t["emails"] or t["has_contact_form"]])
        
        readme += f"""- **Total unique tools/services found**: {total_tools}
- **Tools with pricing information**: {with_pricing} ({with_pricing/total_tools*100:.1f}%)
- **Tools with API offerings**: {with_api} ({with_api/total_tools*100:.1f}%)
- **Tools with contact information**: {with_contact} ({with_contact/total_tools*100:.1f}%)

## Next Steps

1. Review high-relevance tools for detailed feature analysis
2. Extract and compare pricing models
3. Identify market gaps and opportunities
4. Compile contact information for outreach
5. Analyze technical capabilities and integrations

## Usage

To explore the detailed findings:

```python
import json

# Load summary
with open('summary.json', 'r') as f:
    summary = json.load(f)

# Load tools list
with open('tools_found.json', 'r') as f:
    tools = json.load(f)

# Load complete results
with open('all_results.json', 'r') as f:
    all_results = json.load(f)
```
"""
        
        return readme
    
    async def run(self, topic: str, depth: int = 2, focus_areas: List[str] = None) -> None:
        """Run the recursive search."""
        logger.info(f"Starting recursive search for: {topic}")
        logger.info(f"Maximum depth: {depth}")
        logger.info(f"Output directory: {self.output_dir}")
        
        # Generate search queries
        queries = self.generate_search_variations(topic, focus_areas)
        logger.info(f"Generated {len(queries)} search queries")
        
        # Perform recursive search
        await self.search_and_extract(queries, depth=0, max_depth=depth)
        
        # Organize and save results
        logger.info("\nOrganizing results...")
        organized_data = self.organize_results()
        
        logger.info("Saving results...")
        self.save_results(organized_data)
        
        # Print summary
        logger.info("\n" + "="*60)
        logger.info("SEARCH COMPLETE!")
        logger.info("="*60)
        logger.info(f"Total URLs processed: {self.stats['urls_processed']}")
        logger.info(f"Content extracted: {self.stats['content_extracted']}")
        logger.info(f"Failed extractions: {self.stats['urls_failed']}")
        logger.info(f"Tools found: {len(organized_data['tools_found'])}")
        logger.info(f"Results saved to: {self.output_dir}")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="JinaRecursiveSearch - Deep recursive research using Jina APIs"
    )
    parser.add_argument(
        "--topic",
        type=str,
        default="YouTube to Transcript",
        help="Topic to research"
    )
    parser.add_argument(
        "--depth",
        type=int,
        default=2,
        help="Maximum recursion depth (default: 2)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output directory (default: docs/research/[topic]-[timestamp])"
    )
    parser.add_argument(
        "--focus",
        type=str,
        nargs="+",
        help="Focus areas for the search"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="Jina API key (or set JINA_API_KEY env var)"
    )
    
    args = parser.parse_args()
    
    # Get API key
    api_key = args.api_key or os.getenv("JINA_API_KEY")
    if not api_key:
        # Try to load from backend .env file
        env_path = Path(__file__).parent.parent / "backend" / ".env"
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    if line.startswith("JINA_API_KEY="):
                        api_key = line.split("=", 1)[1].strip()
                        break
    
    if not api_key:
        logger.error("No JINA_API_KEY found. Set it via --api-key or JINA_API_KEY env var")
        sys.exit(1)
    
    # Set output directory
    if args.output:
        output_dir = args.output
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_topic = re.sub(r'[^a-zA-Z0-9-]', '_', args.topic.lower())
        output_dir = f"docs/research/{safe_topic}-{timestamp}"
    
    # Create searcher and run
    searcher = JinaRecursiveSearcher(api_key, output_dir)
    await searcher.run(args.topic, args.depth, args.focus)


if __name__ == "__main__":
    asyncio.run(main())