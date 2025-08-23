"""
API endpoints for workflow automation.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel, Field
import uuid

from ..core.database import get_db
from ..core.dependencies import get_current_user
from .models import Workflow, WorkflowExecution, WorkflowStatus, ExecutionStatus
from .services import WorkflowExecutor, NodeRegistry


# Pydantic models for API
class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    nodes: List[Dict[str, Any]] = []
    connections: Dict[str, Any] = {}
    settings: Dict[str, Any] = {}


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    connections: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None
    active: Optional[bool] = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    active: bool
    nodes: List[Dict[str, Any]]
    connections: Dict[str, Any]
    settings: Dict[str, Any]
    tags: List[Dict[str, str]]
    created_at: str
    updated_at: str


class ExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    mode: str
    started_at: str
    finished_at: Optional[str]
    execution_time: Optional[int]
    data: Dict[str, Any]
    error: Optional[Dict[str, Any]]


class ExecuteWorkflowRequest(BaseModel):
    trigger_data: Optional[Dict[str, Any]] = None


class NodeInfo(BaseModel):
    type: str
    name: str
    category: str
    description: str
    inputs: List[str]
    outputs: List[str]
    parameters: List[Dict[str, Any]]


# Create router
automation_router = APIRouter(prefix="/api/automation", tags=["automation"])


@automation_router.get("/nodes", response_model=List[NodeInfo])
async def list_available_nodes():
    """Get list of all available workflow nodes."""
    return NodeRegistry.list_nodes()


@automation_router.get("/workflows", response_model=List[WorkflowResponse])
async def list_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all workflows for the current user."""
    query = select(Workflow).where(Workflow.created_by == current_user["id"])
    
    if active_only:
        query = query.where(Workflow.active == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    workflows = result.scalars().all()
    
    return [WorkflowResponse(**workflow.to_dict()) for workflow in workflows]


@automation_router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(
    workflow_data: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new workflow."""
    workflow = Workflow(
        name=workflow_data.name,
        description=workflow_data.description,
        nodes=workflow_data.nodes,
        connections=workflow_data.connections,
        settings=workflow_data.settings,
        created_by=current_user["id"],
        status=WorkflowStatus.INACTIVE,
    )
    
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    
    return WorkflowResponse(**workflow.to_dict())


@automation_router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a specific workflow."""
    result = await db.execute(
        select(Workflow).where(
            and_(
                Workflow.id == uuid.UUID(workflow_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return WorkflowResponse(**workflow.to_dict())


@automation_router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a workflow."""
    result = await db.execute(
        select(Workflow).where(
            and_(
                Workflow.id == uuid.UUID(workflow_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update fields
    update_data = workflow_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)
    
    # Update status based on active state
    if workflow.active:
        workflow.status = WorkflowStatus.ACTIVE
    else:
        workflow.status = WorkflowStatus.INACTIVE
    
    await db.commit()
    await db.refresh(workflow)
    
    return WorkflowResponse(**workflow.to_dict())


@automation_router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a workflow."""
    result = await db.execute(
        select(Workflow).where(
            and_(
                Workflow.id == uuid.UUID(workflow_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
    
    return {"message": "Workflow deleted successfully"}


@automation_router.post("/workflows/{workflow_id}/activate")
async def activate_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Activate a workflow."""
    result = await db.execute(
        select(Workflow).where(
            and_(
                Workflow.id == uuid.UUID(workflow_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow.active = True
    workflow.status = WorkflowStatus.ACTIVE
    
    await db.commit()
    
    return {"message": "Workflow activated successfully"}


@automation_router.post("/workflows/{workflow_id}/deactivate")
async def deactivate_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Deactivate a workflow."""
    result = await db.execute(
        select(Workflow).where(
            and_(
                Workflow.id == uuid.UUID(workflow_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow.active = False
    workflow.status = WorkflowStatus.INACTIVE
    
    await db.commit()
    
    return {"message": "Workflow deactivated successfully"}


@automation_router.post("/workflows/{workflow_id}/execute", response_model=ExecutionResponse)
async def execute_workflow(
    workflow_id: str,
    execution_request: ExecuteWorkflowRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Execute a workflow manually."""
    # Verify workflow ownership
    result = await db.execute(
        select(Workflow).where(
            and_(
                Workflow.id == uuid.UUID(workflow_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Execute workflow
    executor = WorkflowExecutor(db)
    execution = await executor.execute_workflow(workflow_id, execution_request.trigger_data)
    
    return ExecutionResponse(**execution.to_dict())


@automation_router.get("/workflows/{workflow_id}/executions", response_model=List[ExecutionResponse])
async def list_workflow_executions(
    workflow_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[ExecutionStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List executions for a workflow."""
    # Verify workflow ownership
    workflow_result = await db.execute(
        select(Workflow).where(
            and_(
                Workflow.id == uuid.UUID(workflow_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    workflow = workflow_result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Get executions
    query = select(WorkflowExecution).where(WorkflowExecution.workflow_id == uuid.UUID(workflow_id))
    
    if status:
        query = query.where(WorkflowExecution.status == status)
    
    query = query.order_by(WorkflowExecution.started_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    executions = result.scalars().all()
    
    return [ExecutionResponse(**execution.to_dict()) for execution in executions]


@automation_router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get details of a specific execution."""
    result = await db.execute(
        select(WorkflowExecution)
        .join(Workflow)
        .where(
            and_(
                WorkflowExecution.id == uuid.UUID(execution_id),
                Workflow.created_by == current_user["id"]
            )
        )
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return ExecutionResponse(**execution.to_dict())