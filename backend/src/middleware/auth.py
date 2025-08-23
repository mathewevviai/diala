"""
Authentication middleware for protected API endpoints.
"""

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os

# API Key header configuration
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Bearer token configuration
bearer_scheme = HTTPBearer(auto_error=False)

# Get API key from environment
VALID_API_KEY = os.getenv("API_KEY", "demo-api-key-12345")

async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Verify API key for protected endpoints.
    
    Args:
        api_key: API key from request header
        
    Returns:
        Validated API key
        
    Raises:
        HTTPException: If API key is invalid or missing
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is required",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    if api_key != VALID_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    
    return api_key

async def verify_bearer_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme)
) -> str:
    """
    Verify JWT bearer token for user authentication.
    
    Args:
        credentials: Bearer token credentials
        
    Returns:
        Decoded user information
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # TODO: Implement JWT verification
    # For now, just return the token
    return credentials.credentials

# Dependency for protected routes
async def require_auth(
    api_key: Optional[str] = Security(api_key_header),
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme)
):
    """
    Require either API key or bearer token authentication.
    
    Returns:
        Authentication information
    """
    if api_key:
        return {"type": "api_key", "value": await verify_api_key(api_key)}
    elif bearer:
        return {"type": "bearer", "value": await verify_bearer_token(bearer)}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "ApiKey, Bearer"},
        )