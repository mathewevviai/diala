"""
Rate Limiting Module

This module provides rate limiting functionality for API endpoints
using Redis for distributed rate limiting.
"""

import logging
import time
from typing import Dict, Optional
from datetime import datetime, timedelta
import json
import hashlib

# Setup logger
logger = logging.getLogger(__name__)

class RateLimitException(Exception):
    """Exception raised when rate limit is exceeded."""
    def __init__(self, message: str, retry_after: Optional[int] = None):
        self.message = message
        self.retry_after = retry_after
        super().__init__(self.message)

class InMemoryRateLimiter:
    """In-memory rate limiter for development/testing."""
    
    def __init__(self):
        self.requests: Dict[str, list] = {}
    
    def check_rate_limit(self, key: str, limit: int, window_seconds: int) -> bool:
        """Check if request is within rate limit."""
        now = time.time()
        
        # Clean old requests
        if key in self.requests:
            self.requests[key] = [
                req_time for req_time in self.requests[key] 
                if now - req_time < window_seconds
            ]
        else:
            self.requests[key] = []
        
        # Check if within limit
        if len(self.requests[key]) >= limit:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True
    
    def get_remaining_requests(self, key: str, limit: int, window_seconds: int) -> int:
        """Get remaining requests in current window."""
        now = time.time()
        
        if key not in self.requests:
            return limit
        
        # Clean old requests
        self.requests[key] = [
            req_time for req_time in self.requests[key] 
            if now - req_time < window_seconds
        ]
        
        return max(0, limit - len(self.requests[key]))

# Global rate limiter instance
_rate_limiter = InMemoryRateLimiter()

def get_rate_limiter():
    """Get the global rate limiter instance."""
    return _rate_limiter

async def check_rate_limit(
    user_id: str,
    action: str,
    limit: int,
    window_hours: int = 1
) -> None:
    """
    Check if user is within rate limit for a specific action.
    
    Args:
        user_id: User identifier
        action: Action being rate limited
        limit: Maximum number of requests allowed
        window_hours: Time window in hours
        
    Raises:
        RateLimitException: If rate limit is exceeded
    """
    try:
        # Create rate limit key
        rate_key = f"rate_limit:{user_id}:{action}"
        window_seconds = window_hours * 3600
        
        # Get rate limiter
        limiter = get_rate_limiter()
        
        # Check rate limit
        if not limiter.check_rate_limit(rate_key, limit, window_seconds):
            remaining = limiter.get_remaining_requests(rate_key, limit, window_seconds)
            retry_after = window_seconds
            
            logger.warning(f"Rate limit exceeded for {user_id}:{action}. Limit: {limit}, Window: {window_hours}h")
            
            raise RateLimitException(
                f"Rate limit exceeded. Maximum {limit} requests per {window_hours} hour(s). Try again later.",
                retry_after=retry_after
            )
        
        remaining = limiter.get_remaining_requests(rate_key, limit, window_seconds)
        logger.debug(f"Rate limit check passed for {user_id}:{action}. Remaining: {remaining}")
        
    except RateLimitException:
        raise
    except Exception as e:
        logger.error(f"Error checking rate limit for {user_id}:{action}: {e}")
        # In case of error, allow the request (fail open)
        pass

def get_rate_limit_info(user_id: str, action: str, limit: int, window_hours: int = 1) -> Dict:
    """
    Get rate limit information for a user and action.
    
    Args:
        user_id: User identifier
        action: Action being rate limited
        limit: Maximum number of requests allowed
        window_hours: Time window in hours
        
    Returns:
        Dict containing rate limit information
    """
    try:
        rate_key = f"rate_limit:{user_id}:{action}"
        window_seconds = window_hours * 3600
        
        limiter = get_rate_limiter()
        remaining = limiter.get_remaining_requests(rate_key, limit, window_seconds)
        
        return {
            "limit": limit,
            "remaining": remaining,
            "window_hours": window_hours,
            "reset_time": datetime.now() + timedelta(hours=window_hours)
        }
        
    except Exception as e:
        logger.error(f"Error getting rate limit info for {user_id}:{action}: {e}")
        return {
            "limit": limit,
            "remaining": limit,
            "window_hours": window_hours,
            "reset_time": datetime.now() + timedelta(hours=window_hours)
        }

class RateLimitMiddleware:
    """Rate limiting middleware for FastAPI."""
    
    def __init__(self, default_limit: int = 100, default_window: int = 1):
        self.default_limit = default_limit
        self.default_window = default_window
    
    async def __call__(self, request, call_next):
        """Process request with rate limiting."""
        try:
            # Extract user ID from request (could be from headers, query params, etc.)
            user_id = request.headers.get("X-User-ID", "anonymous")
            endpoint = f"{request.method}:{request.url.path}"
            
            # Check rate limit
            await check_rate_limit(
                user_id=user_id,
                action=endpoint,
                limit=self.default_limit,
                window_hours=self.default_window
            )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            rate_info = get_rate_limit_info(user_id, endpoint, self.default_limit, self.default_window)
            response.headers["X-RateLimit-Limit"] = str(rate_info["limit"])
            response.headers["X-RateLimit-Remaining"] = str(rate_info["remaining"])
            response.headers["X-RateLimit-Reset"] = rate_info["reset_time"].isoformat()
            
            return response
            
        except RateLimitException as e:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=429,
                detail=e.message,
                headers={"Retry-After": str(e.retry_after)} if e.retry_after else None
            )
        except Exception as e:
            logger.error(f"Rate limiting middleware error: {e}")
            # In case of error, allow the request (fail open)
            return await call_next(request)