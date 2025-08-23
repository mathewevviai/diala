"""
Database models for workflow automation.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional, Dict, List
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, Text, Boolean, Integer, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..core.database import Base


class WorkflowStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class ExecutionStatus(str, Enum):
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    WAITING = "waiting"
    CANCELED = "canceled"


class NodeType(str, Enum):
    TRIGGER = "trigger"
    ACTION = "action"
    LOGIC = "logic"
    OUTPUT = "output"


# Association table for workflow tags
workflow_tags = Table(
    'workflow_tags',
    Base.metadata,
    Column('workflow_id', UUID(as_uuid=True), ForeignKey('workflows.id')),
    Column('tag_id', UUID(as_uuid=True), ForeignKey('workflow_tag_definitions.id'))
)


class WorkflowTagDefinition(Base):
    __tablename__ = "workflow_tag_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7), default="#6B7280")  # Hex color
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workflows = relationship("Workflow", secondary=workflow_tags, back_populates="tags")


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default=WorkflowStatus.INACTIVE)
    active = Column(Boolean, default=False)
    
    # Workflow definition (JSON structure compatible with n8n format)
    nodes = Column(JSON, default=list)
    connections = Column(JSON, default=dict)
    settings = Column(JSON, default=dict)
    static_data = Column(JSON, default=dict)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255))  # User ID
    
    # Relations
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")
    tags = relationship("WorkflowTagDefinition", secondary=workflow_tags, back_populates="workflows")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "active": self.active,
            "nodes": self.nodes,
            "connections": self.connections,
            "settings": self.settings,
            "tags": [{"id": str(tag.id), "name": tag.name, "color": tag.color} for tag in self.tags],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    status = Column(String(20), default=ExecutionStatus.RUNNING)
    mode = Column(String(20), default="trigger")  # trigger, manual, retry
    
    # Execution data
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime)
    execution_time = Column(Integer)  # milliseconds
    
    # Results and data
    data = Column(JSON, default=dict)  # Execution data for each node
    wait_till = Column(DateTime)  # For delayed executions
    error = Column(JSON)  # Error details if failed
    
    # Relations
    workflow = relationship("Workflow", back_populates="executions")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "workflow_id": str(self.workflow_id),
            "status": self.status,
            "mode": self.mode,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "execution_time": self.execution_time,
            "data": self.data,
            "error": self.error,
        }


class WorkflowNode(Base):
    """
    Individual node configuration within a workflow.
    This is for indexing and searching nodes across workflows.
    """
    __tablename__ = "workflow_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    node_id = Column(String(255), nullable=False)  # Node ID within workflow
    type = Column(String(255), nullable=False)  # e.g., "n8n-nodes-base.httpRequest"
    name = Column(String(255), nullable=False)
    category = Column(String(50))  # trigger, action, logic, output
    
    # Node configuration
    parameters = Column(JSON, default=dict)
    credentials = Column(JSON, default=dict)
    position = Column(JSON, default=dict)  # x, y coordinates
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowConnection(Base):
    """
    Connections between nodes in a workflow.
    For analyzing workflow complexity and dependencies.
    """
    __tablename__ = "workflow_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    
    # Connection details
    source_node = Column(String(255), nullable=False)
    source_output = Column(Integer, default=0)
    target_node = Column(String(255), nullable=False)
    target_input = Column(Integer, default=0)