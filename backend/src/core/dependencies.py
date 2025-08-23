"""
Common dependencies for API endpoints.
"""

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user from JWT token.
    For now, returns a mock user.
    """
    # TODO: Implement proper JWT validation
    return {"id": "user123", "email": "user@example.com"}