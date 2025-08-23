"""
Hunter LeadGen API - Streamlined endpoints for lead generation searches.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import os
import json
import logging
import requests
import time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from convex import ConvexClient

# Import the new service
from src.core.leadgen.hunter_search_service import HunterSearchService, start_hunter_search_background

# Load environment variables
backend_env_path = os.path.join(os.path.dirname(__file__), "../../../.env")
load_dotenv(backend_env_path)

frontend_env_path = os.path.join(os.path.dirname(__file__), "../../../../frontend/.env.local")
load_dotenv(frontend_env_path)

router = APIRouter()
logger = logging.getLogger(__name__)

# Configure verbose logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
)

# Initialize Convex client
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
CONVEX_HTTP_URL = os.getenv("CONVEX_HTTP_URL", "http://localhost:3211")
convex_client = ConvexClient(CONVEX_URL)

# API Keys
JINA_API_KEY = os.getenv("JINA_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Active searches (for tracking and cancellation)
active_searches = {}
# Store asyncio tasks for cancellation
active_tasks = {}

class LeadSearchRequest(BaseModel):
    """Request model for starting a lead generation search."""
    search_id: str = Field(..., description="Unique search identifier for tracking")
    user_id: str = Field(..., description="User ID for rate limiting and ownership")
    search_config: Dict[str, Any] = Field(..., description="Search configuration parameters")
    
    class Config:
        json_schema_extra = {
            "example": {
                "search_id": "search_123456",
                "user_id": "user123",
                "search_config": {
                    "searchName": "Tech Startups in SF",
                    "searchObjective": "Find tech startup leads for partnership",
                    "selectedSources": ["web"],
                    "industry": "Technology",
                    "location": "San Francisco, CA",
                    "companySize": "1-50",
                    "jobTitles": ["CEO", "CTO"],
                    "keywords": "AI, machine learning",
                    "includeEmails": True,
                    "includePhones": True,
                    "includeLinkedIn": False,
                    "validationCriteria": {
                        "mustHaveWebsite": True,
                        "mustHaveContactInfo": True,
                        "mustHaveSpecificKeywords": ["API", "integration", "partner"],
                        "mustBeInIndustry": True,
                        "customValidationRules": "Must offer enterprise solutions"
                    }
                }
            }
        }


class LeadSearchResponse(BaseModel):
    """Response model for search job status."""
    status: str = Field(..., description="Job status", example="processing")
    search_id: str = Field(..., description="Search identifier")
    message: str = Field(..., description="Status message")
    progress: Optional[int] = Field(None, description="Progress percentage (0-100)")


def send_convex_update(search_id: str, progress: int, stage: str, **kwargs):
    """Send progress update to Convex via Convex client (3210)."""
    try:
        payload = {
            "searchId": search_id,
            "progress": progress,
            "currentStage": stage,
        }
        # Optionally forward summary-like fields
        if "results" in kwargs:
            payload["results"] = kwargs["results"]
        # pass auth key if configured to satisfy Convex action
        api_key = os.getenv("API_KEY")
        if api_key:
            payload["authKey"] = api_key
        convex_client.action("hunterActions:updateSearchProgress", payload)
        logger.info(f"[CONVEX UPDATE SUCCESS] {search_id}: {stage} ({progress}%)")
        return True
    except Exception as e:
        logger.error(f"[CONVEX ACTION ERROR] updateSearchProgress failed: {e}")
        return False


def send_convex_results(search_id: str, results: Dict[str, Any]):
    """Send final results to Convex using Convex client only."""
    try:
        # Convert leads to frontend format
        leads = []
        for lead in results.get("leads", []):
            # Prefer contact_info if present
            emails_list = (lead.get("contact_info", {}).get("emails") or [])
            phones_list = (lead.get("contact_info", {}).get("phones") or [])
            email_val = emails_list[0] if emails_list else None
            phone_val = phones_list[0] if phones_list else None
            formatted_lead = {
                "leadId": f"lead_{search_id}_{len(leads)}",
                "name": lead.get("company_name", "Unknown"),
                "companyName": lead.get("company_name", "Unknown"),
                "websiteUrl": lead.get("url", ""),
                "emailVerified": bool(emails_list),
                "phoneVerified": bool(phones_list),
                "confidence": lead.get("score", 0) / 100,
                "dataSource": "web",
                "jobTitle": "Contact",
                "industry": results.get("search_config", {}).get("industry", "Unknown"),
                "location": results.get("search_config", {}).get("location", "Unknown"),
            }
            if email_val:
                formatted_lead["email"] = email_val
            if phone_val:
                formatted_lead["phone"] = phone_val
            leads.append(formatted_lead)

        # Store leads via mutation
        if leads:
            convex_client.mutation("hunterActions:storeLeadResults", {
                "searchId": search_id,
                "leads": leads
            })

        # Build summary and send via action
        duration = int(results.get("stats", {}).get("duration_seconds", 0))
        summary = {
            "totalLeads": len(leads),
            "verifiedEmails": len([l for l in leads if l.get("emailVerified")]),
            "verifiedPhones": len([l for l in leads if l.get("phoneVerified")]),
            "businessWebsites": len(leads),
            "avgResponseRate": "N/A",
            "searchTime": f"{duration // 60}m {duration % 60}s",
        }
        payload = {
            "searchId": search_id,
            "progress": 100,
            "currentStage": "Completed",
            "results": summary,
            "status": "completed",
        }
        api_key = os.getenv("API_KEY")
        if api_key:
            payload["authKey"] = api_key
        convex_client.action("hunterActions:updateSearchProgress", payload)

        logger.info(f"Stored {len(leads)} leads for search {search_id}")

    except Exception as e:
        logger.error(f"Error sending results to Convex: {e}")


def send_convex_status(search_id: str, status: str, error: Optional[str] = None):
    """Update search status in Convex using Convex client."""
    try:
        payload: Dict[str, Any] = {"searchId": search_id, "status": status, "progress": 0}
        if error:
            payload["error"] = error
        api_key = os.getenv("API_KEY")
        if api_key:
            payload["authKey"] = api_key
        convex_client.action("hunterActions:updateSearchProgress", payload)
    except Exception as e:
        logger.error(f"Error updating search status: {e}")


async def process_lead_search(search_id: str, user_id: str, search_config: Dict[str, Any]):
    """Process lead search asynchronously."""
    try:
        logger.info("="*60)
        logger.info(f"[SEARCH START] ID: {search_id}, User: {user_id}")
        logger.info(f"[CONFIG] {json.dumps(search_config, indent=2)}")
        logger.info("="*60)
        
        # Store in active searches
        active_searches[search_id] = {
            "status": "processing",
            "started_at": datetime.now(),
            "user_id": user_id,
            "progress": 0,
            "leads_found": 0,
            "cancelled": False
        }
        
        # Check if search was cancelled
        if search_id in active_searches and active_searches[search_id].get("cancelled"):
            logger.info(f"[SEARCH CANCELLED] {search_id} was cancelled before starting")
            return
            
        # Initialize service
        if not JINA_API_KEY or not GROQ_API_KEY:
            raise ValueError("JINA_API_KEY and GROQ_API_KEY must be configured")
            
        service = HunterSearchService(JINA_API_KEY, OPENAI_API_KEY, GROQ_API_KEY)
        
        # Progress callback
        async def progress_callback(update: Dict[str, Any]):
            # Check if cancelled
            if search_id in active_searches and active_searches[search_id].get("cancelled"):
                logger.info(f"[SEARCH CANCELLED] {search_id} cancelled during progress update")
                raise asyncio.CancelledError("Search cancelled by user")
                
            stage = update.get("stage", "processing")
            progress = update.get("progress", 0)
            message = update.get("message", "")
            leads_found = update.get("leads_found", 0)
            
            logger.info(f"[PROGRESS] Search {search_id}: {message} ({progress}%, {leads_found} leads)")
            
            # Update active search
            if search_id in active_searches:
                active_searches[search_id]["progress"] = progress
                active_searches[search_id]["leads_found"] = leads_found
                active_searches[search_id]["last_update"] = datetime.now()
            
            # Send to Convex
            send_convex_update(
                search_id, 
                progress, 
                message,
                totalLeads=leads_found
            )
        
        # Cancellation check function
        async def cancellation_check():
            return search_id in active_searches and active_searches[search_id].get("cancelled", False)
        
        # Run the search
        results = await service.hunt_leads(
            search_config,
            target_leads=300,
            progress_callback=progress_callback,
            cancellation_check=cancellation_check
        )
        
        # Store search config in results for reference
        results["search_config"] = search_config
        
        # Send results to Convex
        if results.get("cancelled"):
            logger.info(f"[SEARCH CANCELLED] {search_id}: Found {len(results.get('leads', []))} leads before cancellation")
            # Still send partial results if any
            if results.get('leads'):
                send_convex_results(search_id, results)
            send_convex_status(search_id, "cancelled", "Search cancelled by user")
        elif results.get("success"):
            logger.info(f"[SEARCH SUCCESS] {search_id}: {len(results.get('leads', []))} leads found")
            send_convex_results(search_id, results)
            send_convex_status(search_id, "completed")
        else:
            error = results.get("error", "Unknown error")
            logger.error(f"[SEARCH FAILED] {search_id}: {error}")
            send_convex_status(search_id, "failed", error)
        
        # Clean up
        if search_id in active_searches:
            del active_searches[search_id]
        if search_id in active_tasks:
            del active_tasks[search_id]
            
    except asyncio.CancelledError:
        logger.info(f"[SEARCH CANCELLED] {search_id} was cancelled")
        send_convex_status(search_id, "cancelled", "Search cancelled by user")
        
        if search_id in active_searches:
            del active_searches[search_id]
        if search_id in active_tasks:
            del active_tasks[search_id]
            
    except Exception as e:
        logger.error(f"[CRITICAL ERROR] Search {search_id} crashed: {str(e)}", exc_info=True)
        send_convex_status(search_id, "failed", str(e))
        
        if search_id in active_searches:
            del active_searches[search_id]
        if search_id in active_tasks:
            del active_tasks[search_id]


@router.post("/search", response_model=LeadSearchResponse, summary="Start Lead Generation Search")
async def start_lead_search(
    request: LeadSearchRequest,
    background_tasks: BackgroundTasks
):
    """
    Start a new lead generation search.
    
    The search runs asynchronously and updates progress via Convex webhooks.
    """
    logger.info(f"[API REQUEST] Starting lead search {request.search_id} for user {request.user_id}")
    
    # Validate API keys
    if not JINA_API_KEY or not GROQ_API_KEY:
        logger.error("API keys (Jina, Groq) are not configured.")
        raise HTTPException(
            status_code=500,
            detail="Search service not properly configured. Missing API keys."
        )
    
    # Check if search already exists
    if request.search_id in active_searches:
        return LeadSearchResponse(
            status="processing",
            search_id=request.search_id,
            message="Search already in progress",
            progress=active_searches[request.search_id].get("progress", 0)
        )
    
    # Test Convex connectivity first
    logger.info(f"[CONVEX TEST] Using Convex client at {CONVEX_URL}")
    
    # Create search record in Convex first (call internal mutation directly to avoid action recursion)
    try:
        convex_client.mutation("hunterMutations:createLeadSearch", {
            "searchId": request.search_id,
            "userId": request.user_id,
            "searchConfig": request.search_config
        })
        logger.info(f"[CONVEX] Created search record for {request.search_id}")
    except Exception as e:
        logger.warning(f"[CONVEX] Failed to create search record via mutation: {e}")
        # Continue anyway - progress updates will create a placeholder if needed
    
    # Send initial status
    if send_convex_update(request.search_id, 0, "Initializing search..."):
        logger.info("[CONVEX TEST] Connection successful")
    else:
        logger.error("[CONVEX TEST] Connection failed - updates may not reach frontend")
        
    send_convex_status(request.search_id, "processing")
    
    # Initialize task variable
    task = None
    
    # Try new pipeline first, fallback to legacy
    use_new_pipeline = os.getenv("USE_NEW_HUNTER_PIPELINE", "true").lower() == "true"
    
    if use_new_pipeline:
        # Use new optimized pipeline with fast query generation (no external LLM here)
        try:
            # Convert search config to pipeline format (fast, local)
            pipeline_config = {
                "queries": generate_queries_from_config(request.search_config),
                "concurrency": 24,
                "batch_size": 50,
                "flush_interval": 5,
                "dedup_threshold": 86,
                "blocklist_domains": []  # Add any blocked domains
            }
            # Start new pipeline in background immediately
            start_hunter_search_background(request.search_id, pipeline_config)
            logger.info(f"[NEW PIPELINE] Started background search {request.search_id}")
            
        except Exception as e:
            logger.error(f"[NEW PIPELINE] Failed to start: {e}, falling back to legacy")
            use_new_pipeline = False
    
    if not use_new_pipeline:
        # Fallback to legacy pipeline
        task = asyncio.create_task(
            process_lead_search(
                request.search_id,
                request.user_id,
                request.search_config
            )
        )
        active_tasks[request.search_id] = task
    
        # Add cleanup callback only for legacy tasks
        def cleanup_task(future):
            if request.search_id in active_tasks:
                del active_tasks[request.search_id]
        
        task.add_done_callback(cleanup_task)
    
    return LeadSearchResponse(
        status="processing",
        search_id=request.search_id,
        message="Lead search started successfully",
        progress=0
    )


@router.get("/search/{search_id}", summary="Get Search Status")
async def get_search_status(search_id: str):
    """Get the current status of a lead generation search."""
    # Check active searches first
    if search_id in active_searches:
        search = active_searches[search_id]
        return {
            "search_id": search_id,
            "status": "processing",
            "progress": search.get("progress", 0),
            "leads_found": search.get("leads_found", 0),
            "started_at": search.get("started_at").isoformat()
        }
    
    # Check Convex for completed/failed searches
    try:
        search_data = convex_client.query("hunterQueries:getLeadSearch", {
            "searchId": search_id
        })
        
        if search_data:
            return {
                "search_id": search_id,
                "status": search_data.get("status", "unknown"),
                "progress": search_data.get("progress", 100),
                "total_leads": search_data.get("totalLeads", 0),
                "error": search_data.get("error")
            }
        else:
            raise HTTPException(status_code=404, detail="Search not found")
            
    except Exception as e:
        logger.error(f"Error getting search status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get search status")


@router.post("/search/{search_id}/cancel", summary="Cancel Lead Search")
async def cancel_lead_search(search_id: str):
    """
    Cancel an active lead generation search.
    
    This will stop all API calls and prevent further credit usage.
    """
    logger.info(f"[CANCEL REQUEST] Received cancellation request for {search_id}")
    
    # Check if search exists
    if search_id not in active_searches and search_id not in active_tasks:
        logger.warning(f"[CANCEL FAILED] Search {search_id} not found")
        raise HTTPException(status_code=404, detail="Search not found")
    
    # Mark as cancelled
    if search_id in active_searches:
        active_searches[search_id]["cancelled"] = True
        active_searches[search_id]["status"] = "cancelling"
        logger.info(f"[CANCEL] Marked {search_id} as cancelled")
    
    # Cancel the asyncio task
    if search_id in active_tasks:
        task = active_tasks[search_id]
        if not task.done():
            task.cancel()
            logger.info(f"[CANCEL] Cancelled task for {search_id}")
        else:
            logger.info(f"[CANCEL] Task for {search_id} already completed")
    
    # Update Convex
    send_convex_status(search_id, "cancelled", "Search cancelled by user")
    
    return {
        "status": "cancelled",
        "search_id": search_id,
        "message": "Search cancellation initiated"
    }


@router.get("/health", summary="Health Check")
async def health_check():
    """Health check endpoint for the Hunter LeadGen service."""
    return {
        "status": "healthy",
        "service": "Hunter LeadGen API (Streamlined)",
        "timestamp": datetime.now().isoformat(),
        "jina_configured": bool(JINA_API_KEY),
        "openai_configured": bool(OPENAI_API_KEY),
        "groq_configured": bool(GROQ_API_KEY),
        "convex_url": CONVEX_URL,
        "convex_http_url": CONVEX_HTTP_URL,
        "active_searches": len(active_searches),
        "active_search_ids": list(active_searches.keys())
    }


@router.get("/stats", summary="Get Service Statistics")
async def get_service_stats():
    """Get current service statistics."""
    # Load recent results if available
    stats = {
        "active_searches": len(active_searches),
        "recent_results": None
    }
    
    try:
        results_file = "data/hunter_results.json"
        if os.path.exists(results_file):
            with open(results_file, 'r') as f:
                recent = json.load(f)
                stats["recent_results"] = {
                    "total_leads": recent.get("total_found", 0),
                    "stats": recent.get("stats", {})
                }
    except Exception as e:
        logger.error(f"Error loading stats: {e}")
    
    return stats


@router.websocket("/ws/{search_id}")
async def websocket_endpoint(websocket: WebSocket, search_id: str):
    """
    WebSocket endpoint for real-time search monitoring and cancellation.
    
    When the WebSocket disconnects (user closes tab/refreshes), the search is automatically cancelled.
    """
    await websocket.accept()
    logger.info(f"[WEBSOCKET] Client connected for search {search_id}")
    
    try:
        # Send initial status
        if search_id in active_searches:
            await websocket.send_json({
                "type": "status",
                "search_id": search_id,
                "status": active_searches[search_id]["status"],
                "progress": active_searches[search_id].get("progress", 0),
                "leads_found": active_searches[search_id].get("leads_found", 0)
            })
        
        # Keep connection alive and monitor
        while True:
            # Wait for any message from client (ping/pong)
            data = await websocket.receive_text()
            
            # Send current status
            if search_id in active_searches:
                await websocket.send_json({
                    "type": "heartbeat",
                    "search_id": search_id,
                    "active": True
                })
            else:
                await websocket.send_json({
                    "type": "heartbeat",
                    "search_id": search_id,
                    "active": False
                })
                break
                
    except WebSocketDisconnect:
        logger.info(f"[WEBSOCKET] Client disconnected for search {search_id}")
        
        # Cancel the search on disconnect
        if search_id in active_searches and not active_searches[search_id].get("cancelled"):
            logger.info(f"[WEBSOCKET] Auto-cancelling search {search_id} due to client disconnect")
            
            # Mark as cancelled
            active_searches[search_id]["cancelled"] = True
            
            # Cancel the task
            if search_id in active_tasks:
                task = active_tasks[search_id]
                if not task.done():
                    task.cancel()
                    
            # Update Convex
            send_convex_status(search_id, "cancelled", "Search cancelled due to connection loss")
            
    except Exception as e:
        logger.error(f"[WEBSOCKET] Error for search {search_id}: {e}")
        await websocket.close()


def generate_queries_from_config(search_config: Dict[str, Any]) -> List[str]:
    """Convert legacy search config to query list for new pipeline."""
    queries = []
    
    # Extract key information
    industry = search_config.get("industry", "")
    location = search_config.get("location", "")
    keywords = search_config.get("keywords", "")
    company_size = search_config.get("companySize", "")
    job_titles = search_config.get("jobTitles", [])
    
    # Generate query variations similar to legacy system
    if industry and location:
        queries.append(f"{industry} companies {location}")
    
    if keywords:
        queries.append(f"{keywords} {location}".strip())
    
    # Business-focused queries
    business_terms = ["companies", "businesses", "firms", "services"]
    for term in business_terms[:2]:  # Use first 2
        if industry:
            query = f"{industry} {term} {location}".strip()
            queries.append(query)
    
    # Contact-focused queries
    if industry:
        queries.append(f"{industry} contact information email phone {location}".strip())
        queries.append(f"{industry} business directory {location}".strip())
    
    return [q for q in queries if q]  # Remove empty queries


@router.post("/ingest_batch", summary="Ingest Lead Batch")
async def ingest_lead_batch(payload: dict):
    """
    Endpoint for new pipeline to incrementally save lead batches.
    """
    search_id = payload.get("search_id")
    leads = payload.get("leads", [])
    
    if not search_id:
        raise HTTPException(status_code=400, detail="search_id required")
    
    logger.info(f"[INGEST BATCH] Received {len(leads)} leads for search {search_id}")
    
    try:
        # Convert leads to Convex format; backfill missing contacts via Jina Reader if needed
        convex_leads = []
        summary_emails = 0
        summary_phones = 0
        samples = []  # [(url, email, phone)]
        missing_indices = []
        for idx, lead in enumerate(leads):
            # Prefer explicit fields; fallback to enrichment extracted data
            email_val = lead.get("email") or (lead.get("enrichment", {}).get("extracted", {}).get("emails") or [None])[0]
            phone_val = lead.get("phone") or (lead.get("enrichment", {}).get("extracted", {}).get("phones") or [None])[0]
            formatted_lead = {
                "leadId": f"lead_{search_id}_{len(convex_leads)}",
                "name": lead.get("name", lead.get("company", "Unknown")),
                "companyName": lead.get("company", lead.get("name", "Unknown")),
                "websiteUrl": lead.get("url", ""),
                "emailVerified": bool(email_val) or lead.get("email_valid", False),
                "phoneVerified": bool(phone_val),
                "confidence": lead.get("meta", {}).get("score", 50) / 100,  # Convert to 0-1
                "dataSource": "web",
                "jobTitle": lead.get("enrichment", {}).get("title", "Contact"),
                "industry": lead.get("industry", "Unknown"),
                "location": lead.get("location", "Unknown"),
            }
            if email_val:
                formatted_lead["email"] = email_val
                summary_emails += 1
            if phone_val:
                formatted_lead["phone"] = phone_val
                summary_phones += 1
            if not email_val and not phone_val and formatted_lead["websiteUrl"]:
                missing_indices.append((idx, formatted_lead["websiteUrl"]))
            if (email_val or phone_val) and len(samples) < 8:
                samples.append((lead.get("url", ""), email_val, phone_val))
            convex_leads.append(formatted_lead)

        # Backfill missing contact info with Jina Reader (best-effort, limited)
        try:
            if JINA_API_KEY and missing_indices:
                from src.core.leadgen.jina_client import JinaClient  # local import to avoid cycle
                # Limit parallelism and count for performance
                max_to_backfill = min(10, len(missing_indices))
                subset = missing_indices[:max_to_backfill]
                async with JinaClient(JINA_API_KEY, max_concurrent=3) as jc:
                    tasks = [jc.read_url(url) for _, url in subset]
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                for (orig_idx, _), res in zip(subset, results):
                    try:
                        if isinstance(res, Exception) or not isinstance(res, dict):
                            continue
                        extracted = (res.get("extracted_data") or {})
                        emails = extracted.get("emails") or []
                        phones = extracted.get("phones") or []
                        if emails and not convex_leads[orig_idx].get("email"):
                            convex_leads[orig_idx]["email"] = emails[0]
                            convex_leads[orig_idx]["emailVerified"] = True
                            summary_emails += 1
                        if phones and not convex_leads[orig_idx].get("phone"):
                            convex_leads[orig_idx]["phone"] = phones[0]
                            convex_leads[orig_idx]["phoneVerified"] = True
                            summary_phones += 1
                    except Exception:
                        logger.exception("Backfill mapping error")
        except Exception:
            logger.exception("Backfill via Jina Reader failed (non-fatal)")

        # Store in Convex via existing client
        if convex_leads:
            convex_client.mutation("hunterActions:storeLeadResults", {
                "searchId": search_id,
                "leads": convex_leads
            })
        # Log a concise summary of what was ingested
        try:
            logger.info(
                f"[INGEST SUMMARY] search_id={search_id} total={len(leads)} stored={len(convex_leads)} emails={summary_emails} phones={summary_phones}"
            )
            if samples:
                for (u, e, p) in samples:
                    logger.info(f"  sample: url={u[:100]} email={e} phone={p}")
        except Exception:
            pass
        
        return {"status": "success", "ingested": len(convex_leads)}
        
    except Exception as e:
        logger.error(f"[INGEST BATCH] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


# Add discovery endpoints for new pipeline
@router.post("/discover/groq", summary="Groq Discovery")
async def discover_groq(payload: dict):
    """Discovery endpoint using Groq."""
    # For now, return empty - integrate with existing Groq validation later
    return []

@router.post("/discover/jina", summary="Jina Discovery") 
async def discover_jina(payload: dict):
    """Discovery endpoint using Jina."""
    query = payload.get("q", "")
    if not query:
        return []
    
    try:
        # Use existing Jina client for discovery
        service = HunterSearchService(JINA_API_KEY, OPENAI_API_KEY, GROQ_API_KEY)
        async with service.jina_client as client:
            # Search for the query
            result = await client.search(query, page=1)
            
            # Convert to pipeline format
            candidates = []
            for item in result.get("results", []):
                candidate = {
                    "id": f"jina_{len(candidates)}",
                    "name": item.get("title", "Unknown"),
                    "company": item.get("title", "Unknown"),
                    "url": item.get("url", ""),
                    "description": item.get("description", ""),
                    "match_score": 75,  # Default score
                    "source": "jina"
                }
                candidates.append(candidate)
            
            return candidates[:10]  # Limit to 10 results
            
    except Exception as e:
        logger.error(f"Jina discovery failed: {e}")
        return []

@router.post("/discover/thirdparty", summary="Third Party Discovery")
async def discover_thirdparty(payload: dict):
    """Discovery endpoint for third party sources."""
    # For now, return empty - can add more sources later
    return []
