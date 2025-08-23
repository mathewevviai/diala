"""
Example protected endpoints demonstrating authentication.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any

from ...middleware.auth import require_auth

router = APIRouter()

class ProtectedResponse(BaseModel):
    """Response model for protected endpoints."""
    message: str
    user: Dict[str, Any]

@router.get("/user-info", response_model=ProtectedResponse, summary="Get User Information")
async def get_user_info(auth: Dict = Depends(require_auth)):
    """
    Get authenticated user information.
    
    This endpoint requires either:
    - API Key in X-API-Key header
    - JWT Bearer token in Authorization header
    
    Returns:
        User information based on authentication method
    """
    return ProtectedResponse(
        message="Authenticated successfully",
        user=auth
    )

@router.post("/secure-action", summary="Perform Secure Action")
async def secure_action(
    data: Dict[str, Any],
    auth: Dict = Depends(require_auth)
):
    """
    Example of a protected action endpoint.
    
    Requires authentication to perform this action.
    
    Args:
        data: Action data
        auth: Authentication information (injected)
        
    Returns:
        Action result
    """
    return {
        "status": "success",
        "action": "secure_action",
        "data": data,
        "authenticated_as": auth["type"]
    }