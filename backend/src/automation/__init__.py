"""
Automation module for embedded workflow execution.
Based on n8n workflow engine, integrated directly into Diala.
"""

from .models import Workflow, WorkflowExecution, WorkflowNode, WorkflowConnection
from .services import WorkflowExecutor, NodeRegistry
from .api import automation_router

__all__ = [
    "Workflow",
    "WorkflowExecution",
    "WorkflowNode", 
    "WorkflowConnection",
    "WorkflowExecutor",
    "NodeRegistry",
    "automation_router",
]