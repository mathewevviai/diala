#!/usr/bin/env python3
"""
Jina Recursive Search - Deep topic research using Jina APIs
This script performs recursive searches to build comprehensive knowledge bases.
"""

import os
import sys
import json
import asyncio
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Any, Set, Optional, Tuple
from datetime import datetime
from collections import defaultdict
import re
from urllib.parse import urlparse

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend" / "src"))

from core.leadgen.jina_client import JinaClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RecursiveSearcher:
    """Performs recursive topic research using Jina APIs."""
    
    def __init__(self, api_key: str, output_dir: str):
        self.jina_client = JinaClient(api_key, max_concurrent=5)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Tracking
        self.processed_urls: Set[str] = set()
        self.content_by_url: Dict[str, Dict[str, Any]] = {}
        self.url_graph: Dict[str, List[str]] = defaultdict(list)
        self.subtopics: Dict[str, List[str]] = defaultdict(list)
        
        # Statistics
        self.stats = {
            "start_time": datetime.now(),
            "total_searches": 0,
            "urls_processed": 0,
            "content_extracted": 0,
            "levels_completed": 0,
            "subtopics_found": set()
        }
    
    def generate_search_queries(self, topic: str, focus_areas: List[str] = None) -> List[str]:
        """Generate search query variations for comprehensive coverage."""
        queries = [topic]
        
        # Add variations
        base_terms = topic.split()
        
        # Add quoted search for exact phrase
        if len(base_terms) > 1:
            queries.append(f'"{topic}"')
        
        # Add focus area combinations
        if focus_areas:
            for focus in focus_areas:
                queries.append(f"{topic} {focus}")
                queries.append(f'"{topic}" {focus}')
        
        # Add common modifiers for different content types
        modifiers = [
            "tutorial", "guide", "documentation", "explained",
            "best practices", "examples", "overview", "introduction"
        ]
        
        for modifier in modifiers[:4]:  # Limit to avoid too many queries
            queries.append(f"{topic} {modifier}")
        
        # Add question forms
        questions = ["what is", "how to", "why use", "when to use"]
        for question in questions[:2]:
            queries.append(f"{question} {topic}")
        
        return list(dict.fromkeys(queries))  # Remove duplicates while preserving order
    
    def calculate_relevance_score(self, content: str, title: str, url: str, 
                                 topic: str, focus_keywords: List[str]) -> float:
        """Calculate relevance score for content."""
        score = 0.0
        content_lower = content.lower()
        title_lower = title.lower()
        
        # Topic presence (40% weight)
        topic_words = topic.lower().split()
        topic_matches = sum(1 for word in topic_words if word in content_lower)
        topic_score = min(1.0, topic_matches / len(topic_words)) * 0.4
        score += topic_score
        
        # Title relevance (20% weight)
        title_matches = sum(1 for word in topic_words if word in title_lower)
        title_score = min(1.0, title_matches / len(topic_words)) * 0.2
        score += title_score
        
        # Focus keyword presence (20% weight)
        if focus_keywords:
            keyword_matches = sum(1 for kw in focus_keywords if kw.lower() in content_lower)
            keyword_score = min(1.0, keyword_matches / len(focus_keywords)) * 0.2
            score += keyword_score
        else:
            score += 0.1  # Partial credit if no focus keywords
        
        # Content quality indicators (20% weight)
        quality_indicators = [
            len(content) > 500,  # Substantial content
            "example" in content_lower or "code" in content_lower,  # Has examples
            "step" in content_lower or "guide" in content_lower,  # Instructional
            re.search(r'\b\d+\.\s+', content),  # Has numbered lists
            "```" in content or "<code>" in content  # Has code blocks
        ]
        quality_score = sum(quality_indicators) / len(quality_indicators) * 0.2
        score += quality_score
        
        # Domain authority bonus
        domain = urlparse(url).netloc
        authoritative_domains = [
            "github.com", "stackoverflow.com", "medium.com",
            "dev.to", "docs.", "wiki.", ".edu", "arxiv.org"
        ]
        if any(auth in domain for auth in authoritative_domains):
            score = min(1.0, score * 1.1)  # 10% bonus
        
        return score
    
    def extract_subtopics(self, content: str, base_topic: str) -> List[str]:
        """Extract potential subtopics from content."""
        subtopics = []
        content_lower = content.lower()
        
        # Look for headers (markdown style)
        headers = re.findall(r'^#{1,3}\s+(.+)$', content, re.MULTILINE)
        for header in headers:
            if base_topic.lower() not in header.lower() and len(header.split()) <= 5:
                subtopics.append(header.strip())
        
        # Look for bold text that might indicate subtopics
        bold_text = re.findall(r'\*\*([^*]+)\*\*', content)
        for text in bold_text:
            if len(text.split()) <= 4 and base_topic.lower() not in text.lower():
                subtopics.append(text)
        
        # Look for common patterns
        patterns = [
            r'types? of (.+?)(?:\.|,|\n)',
            r'(.+?) (?:tutorial|guide|documentation)',
            r'(?:introduction to|overview of) (.+?)(?:\.|,|\n)',
            r'(.+?) (?:best practices|examples|patterns)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content_lower)
            subtopics.extend(matches)
        
        # Clean and deduplicate
        cleaned_subtopics = []
        seen = set()
        for subtopic in subtopics:
            cleaned = subtopic.strip().lower()
            if cleaned and cleaned not in seen and len(cleaned.split()) <= 5:
                seen.add(cleaned)
                cleaned_subtopics.append(subtopic.strip())
        
        return cleaned_subtopics[:10]  # Limit to top 10
    
    def filter_urls_by_relevance(self, urls: List[str], topic: str, 
                               processed: Set[str], threshold: float = 0.3) -> List[str]:
        """Filter URLs by topic relevance."""
        relevant_urls = []
        topic_words = set(topic.lower().split())
        
        for url in urls:
            if url in processed:
                continue
            
            # Skip social media and low-quality domains
            skip_domains = [
                'facebook.com', 'twitter.com', 'instagram.com', 'pinterest.com',
                'youtube.com', 'tiktok.com', 'linkedin.com/in/', 'reddit.com/user/'
            ]
            if any(domain in url for domain in skip_domains):
                continue
            
            # Calculate URL relevance
            url_lower = url.lower()
            url_score = 0.0
            
            # Check if topic words appear in URL
            url_matches = sum(1 for word in topic_words if word in url_lower)
            if url_matches > 0:
                url_score = url_matches / len(topic_words)
            
            # Boost for certain URL patterns
            if any(pattern in url_lower for pattern in ['docs', 'guide', 'tutorial', 'wiki']):
                url_score *= 1.5
            
            if url_score >= threshold:
                relevant_urls.append(url)
        
        # Sort by score and return top URLs
        return relevant_urls[:30]  # Limit per level
    
    async def search_topic(self, queries: List[str], level: int) -> List[Dict[str, Any]]:
        """Search for topic across multiple queries."""
        logger.info(f"Level {level}: Searching with {len(queries)} queries")
        
        # Search with multiple queries
        all_results = []
        for query in queries:
            self.stats["total_searches"] += 1
            logger.info(f"  Searching: '{query}'")
            
            results = await self.jina_client.search_multiple([query], pages_per_query=2)
            all_results.extend(results)
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for result in all_results:
            url = result.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(result)
        
        logger.info(f"Level {level}: Found {len(unique_results)} unique results")
        return unique_results
    
    async def extract_and_analyze_content(self, urls: List[str], topic: str, 
                                        focus_keywords: List[str], level: int) -> List[Dict[str, Any]]:
        """Extract content and analyze for relevance."""
        logger.info(f"Level {level}: Extracting content from {len(urls)} URLs")
        
        # Extract content
        content_results = await self.jina_client.read_urls(urls)
        
        analyzed_results = []
        for content_data in content_results:
            if not content_data.get("success"):
                continue
            
            url = content_data.get("url")
            self.stats["content_extracted"] += 1
            
            # Calculate relevance
            relevance_score = self.calculate_relevance_score(
                content_data.get("content", ""),
                content_data.get("title", ""),
                url,
                topic,
                focus_keywords
            )
            
            # Extract subtopics
            subtopics = self.extract_subtopics(content_data.get("content", ""), topic)
            if subtopics:
                self.stats["subtopics_found"].update(subtopics)
                for subtopic in subtopics:
                    self.subtopics[subtopic].append(url)
            
            # Extract links for next level
            links = content_data.get("links", [])
            if not links:
                # Try to extract from content
                content = content_data.get("content", "")
                links = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', content)
            
            # Store results
            result = {
                "url": url,
                "title": content_data.get("title", ""),
                "content": content_data.get("content", ""),
                "relevance_score": relevance_score,
                "subtopics": subtopics,
                "links": links,
                "level": level,
                "extracted_at": datetime.now().isoformat()
            }
            
            analyzed_results.append(result)
            self.content_by_url[url] = result
            
            # Build URL graph
            relevant_links = self.filter_urls_by_relevance(links, topic, self.processed_urls)
            self.url_graph[url] = relevant_links
        
        # Sort by relevance
        analyzed_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        logger.info(f"Level {level}: Successfully analyzed {len(analyzed_results)} pages")
        return analyzed_results
    
    async def recursive_search(self, topic: str, depth: int, focus_areas: List[str] = None,
                             relevance_threshold: float = 0.5) -> Dict[str, Any]:
        """Perform recursive search up to specified depth."""
        focus_keywords = []
        if focus_areas:
            # Split focus areas by comma and flatten
            for area in focus_areas:
                focus_keywords.extend([kw.strip() for kw in area.split(",")])
        
        all_results = []
        urls_to_process = []
        
        async with self.jina_client:
            # Level 1: Initial search
            queries = self.generate_search_queries(topic, focus_keywords)
            search_results = await self.search_topic(queries, level=1)
            
            # Extract URLs from search results
            for result in search_results:
                url = result.get("url")
                if url and url not in self.processed_urls:
                    urls_to_process.append(url)
                    self.processed_urls.add(url)
            
            # Process level 1
            if urls_to_process:
                level_results = await self.extract_and_analyze_content(
                    urls_to_process, topic, focus_keywords, level=1
                )
                all_results.extend(level_results)
                self.stats["levels_completed"] = 1
            
            # Recursive levels
            for level in range(2, depth + 1):
                logger.info(f"\nStarting Level {level} recursion")
                
                # Get URLs from previous level
                next_urls = []
                for result in level_results:
                    if result["relevance_score"] >= relevance_threshold:
                        links = self.url_graph.get(result["url"], [])
                        next_urls.extend(links)
                
                # Filter and deduplicate
                next_urls = list(set(next_urls) - self.processed_urls)
                if not next_urls:
                    logger.info(f"No new URLs to process at level {level}")
                    break
                
                # Limit URLs per level to avoid explosion
                next_urls = next_urls[:50]
                
                # Mark as processed
                for url in next_urls:
                    self.processed_urls.add(url)
                
                # Process this level
                level_results = await self.extract_and_analyze_content(
                    next_urls, topic, focus_keywords, level
                )
                all_results.extend(level_results)
                self.stats["levels_completed"] = level
                
                # Check if we have enough high-quality content
                high_quality = [r for r in all_results if r["relevance_score"] >= 0.7]
                if len(high_quality) >= 50:
                    logger.info(f"Found sufficient high-quality content, stopping at level {level}")
                    break
        
        self.stats["urls_processed"] = len(self.processed_urls)
        self.stats["end_time"] = datetime.now()
        
        return {
            "topic": topic,
            "depth_reached": self.stats["levels_completed"],
            "results": all_results,
            "stats": self.stats,
            "subtopics": dict(self.subtopics)
        }
    
    def organize_results(self, search_data: Dict[str, Any]):
        """Organize results into structured output."""
        topic = search_data["topic"]
        results = search_data["results"]
        
        # Create directory structure
        (self.output_dir / "by-relevance").mkdir(exist_ok=True)
        (self.output_dir / "by-subtopic").mkdir(exist_ok=True)
        (self.output_dir / "raw").mkdir(exist_ok=True)
        
        # Save raw results
        with open(self.output_dir / "raw" / "all_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        # Organize by relevance
        high_relevance = [r for r in results if r["relevance_score"] >= 0.7]
        medium_relevance = [r for r in results if 0.4 <= r["relevance_score"] < 0.7]
        low_relevance = [r for r in results if r["relevance_score"] < 0.4]
        
        for category, items in [
            ("high-relevance", high_relevance),
            ("medium-relevance", medium_relevance),
            ("low-relevance", low_relevance)
        ]:
            cat_dir = self.output_dir / "by-relevance" / category
            cat_dir.mkdir(exist_ok=True)
            
            # Save content files
            for i, item in enumerate(items):
                filename = f"{i+1:03d}-{self._sanitize_filename(item['title'])}.md"
                with open(cat_dir / filename, "w") as f:
                    f.write(f"# {item['title']}\n\n")
                    f.write(f"**URL:** {item['url']}\n")
                    f.write(f"**Relevance Score:** {item['relevance_score']:.2f}\n")
                    f.write(f"**Level:** {item['level']}\n\n")
                    f.write("## Content\n\n")
                    f.write(item['content'])
        
        # Organize by subtopic
        for subtopic, urls in self.subtopics.items():
            subtopic_dir = self.output_dir / "by-subtopic" / self._sanitize_filename(subtopic)
            subtopic_dir.mkdir(parents=True, exist_ok=True)
            
            # Get content for URLs
            subtopic_content = [r for r in results if r["url"] in urls]
            
            # Create README for subtopic
            with open(subtopic_dir / "README.md", "w") as f:
                f.write(f"# {subtopic}\n\n")
                f.write(f"Found {len(subtopic_content)} sources for this subtopic.\n\n")
                f.write("## Sources\n\n")
                for item in sorted(subtopic_content, key=lambda x: x["relevance_score"], reverse=True):
                    f.write(f"- [{item['title']}]({item['url']}) (Score: {item['relevance_score']:.2f})\n")
        
        # Create main README
        self._create_readme(search_data)
        
        # Save summary JSON
        summary = {
            "topic": topic,
            "search_timestamp": self.stats["start_time"].isoformat(),
            "statistics": {
                "total_searches": self.stats["total_searches"],
                "urls_processed": self.stats["urls_processed"],
                "content_extracted": self.stats["content_extracted"],
                "depth_reached": self.stats["levels_completed"],
                "processing_time_seconds": (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
            },
            "relevance_distribution": {
                "high": len(high_relevance),
                "medium": len(medium_relevance),
                "low": len(low_relevance)
            },
            "subtopics_discovered": list(self.stats["subtopics_found"]),
            "top_sources": [
                {
                    "url": r["url"],
                    "title": r["title"],
                    "relevance_score": r["relevance_score"]
                }
                for r in high_relevance[:10]
            ]
        }
        
        with open(self.output_dir / "summary.json", "w") as f:
            json.dump(summary, f, indent=2)
    
    def _sanitize_filename(self, text: str) -> str:
        """Sanitize text for use as filename."""
        # Remove invalid characters
        text = re.sub(r'[<>:"/\\|?*]', '', text)
        # Replace spaces with hyphens
        text = text.replace(' ', '-')
        # Limit length
        return text[:50]
    
    def _create_readme(self, search_data: Dict[str, Any]):
        """Create main README file."""
        topic = search_data["topic"]
        stats = search_data["stats"]
        results = search_data["results"]
        
        high_relevance = [r for r in results if r["relevance_score"] >= 0.7]
        
        readme_content = f"""# Research: {topic}

## Overview
This directory contains the results of a recursive search on "{topic}" performed on {stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}.

## Statistics
- **Search Depth:** {stats['levels_completed']} levels
- **Total Searches:** {stats['total_searches']}
- **URLs Processed:** {stats['urls_processed']}
- **Content Extracted:** {stats['content_extracted']}
- **Processing Time:** {(stats['end_time'] - stats['start_time']).total_seconds():.1f} seconds
- **Subtopics Found:** {len(stats['subtopics_found'])}

## Directory Structure
```
{self.output_dir.name}/
├── README.md                # This file
├── summary.json            # Detailed statistics and findings
├── by-relevance/           # Content organized by relevance score
│   ├── high-relevance/    # Score >= 0.7
│   ├── medium-relevance/  # Score 0.4-0.7
│   └── low-relevance/     # Score < 0.4
├── by-subtopic/           # Content organized by discovered subtopics
└── raw/                   # Raw extraction data
```

## Key Findings

### Top Sources (by relevance)
"""
        
        for i, result in enumerate(high_relevance[:10], 1):
            readme_content += f"{i}. [{result['title']}]({result['url']}) - Score: {result['relevance_score']:.2f}\n"
        
        readme_content += f"\n### Discovered Subtopics\n"
        for subtopic in sorted(stats['subtopics_found'])[:20]:
            count = len(self.subtopics.get(subtopic, []))
            readme_content += f"- {subtopic} ({count} sources)\n"
        
        readme_content += f"""
## How to Use This Research

1. **Start with high-relevance content** in `by-relevance/high-relevance/` for the most relevant information
2. **Explore subtopics** in `by-subtopic/` for specific areas of interest
3. **Check summary.json** for quick statistics and top findings
4. **Review raw data** in `raw/all_results.json` for complete extraction details

## Next Steps

Consider:
1. Running deeper searches on promising subtopics
2. Extracting specific sections from high-relevance content
3. Creating a synthesis document from the findings
4. Following up on specific sources that seem particularly valuable
"""
        
        with open(self.output_dir / "README.md", "w") as f:
            f.write(readme_content)


async def main():
    parser = argparse.ArgumentParser(description="Recursive topic search using Jina APIs")
    parser.add_argument("--topic", required=True, help="Topic to research")
    parser.add_argument("--depth", type=int, default=2, help="Search depth (1-5)")
    parser.add_argument("--focus", nargs="+", help="Focus areas for research")
    parser.add_argument("--output", help="Output directory")
    parser.add_argument("--relevance-threshold", type=float, default=0.5, 
                       help="Minimum relevance score for recursive following")
    
    args = parser.parse_args()
    
    # Get API key
    env_file = Path(__file__).parent.parent.parent.parent / "backend" / ".env"
    if not env_file.exists():
        logger.error("Backend .env file not found")
        sys.exit(1)
    
    api_key = None
    with open(env_file) as f:
        for line in f:
            if line.startswith("JINA_API_KEY="):
                api_key = line.strip().split("=", 1)[1].strip('"\'')
                break
    
    if not api_key:
        logger.error("JINA_API_KEY not found in .env file")
        sys.exit(1)
    
    # Set output directory
    if args.output:
        output_dir = args.output
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_topic = re.sub(r'[^\w\s-]', '', args.topic).strip().replace(' ', '-')[:50]
        output_dir = f"docs/research/{safe_topic}-{timestamp}"
    
    # Create searcher and run
    searcher = RecursiveSearcher(api_key, output_dir)
    
    logger.info(f"Starting recursive search for '{args.topic}'")
    logger.info(f"Depth: {args.depth}, Output: {output_dir}")
    
    try:
        results = await searcher.recursive_search(
            args.topic,
            args.depth,
            args.focus,
            args.relevance_threshold
        )
        
        logger.info("Organizing results...")
        searcher.organize_results(results)
        
        logger.info(f"\nSearch completed successfully!")
        logger.info(f"Results saved to: {output_dir}")
        logger.info(f"Total sources found: {len(results['results'])}")
        logger.info(f"High-relevance sources: {len([r for r in results['results'] if r['relevance_score'] >= 0.7])}")
        
    except Exception as e:
        logger.error(f"Search failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())