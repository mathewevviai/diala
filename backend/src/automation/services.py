"""
Core workflow execution services.
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Type
from abc import ABC, abstractmethod
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .models import Workflow, WorkflowExecution, ExecutionStatus
from ..core.logging import logger


class BaseNode(ABC):
    """Base class for all workflow nodes."""
    
    def __init__(self, node_id: str, parameters: Dict[str, Any], credentials: Optional[Dict] = None):
        self.node_id = node_id
        self.parameters = parameters
        self.credentials = credentials
        self.type = self.__class__.__name__
        
    @abstractmethod
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> Any:
        """Execute the node logic."""
        pass
    
    @classmethod
    @abstractmethod
    def get_node_info(cls) -> Dict[str, Any]:
        """Return node metadata for the editor."""
        pass


class HttpRequestNode(BaseNode):
    """HTTP Request node - makes HTTP calls."""
    
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> Any:
        async with httpx.AsyncClient() as client:
            method = self.parameters.get("method", "GET")
            url = self.parameters.get("url", "")
            headers = self.parameters.get("headers", {})
            body = self.parameters.get("body", {})
            
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                json=body if method in ["POST", "PUT", "PATCH"] else None,
            )
            
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
            }
    
    @classmethod
    def get_node_info(cls) -> Dict[str, Any]:
        return {
            "type": "httpRequest",
            "name": "HTTP Request",
            "category": "action",
            "description": "Make HTTP requests",
            "inputs": ["main"],
            "outputs": ["main"],
            "parameters": [
                {
                    "name": "method",
                    "type": "options",
                    "options": ["GET", "POST", "PUT", "DELETE", "PATCH"],
                    "default": "GET",
                },
                {
                    "name": "url",
                    "type": "string",
                    "required": True,
                },
                {
                    "name": "headers",
                    "type": "json",
                    "default": {},
                },
                {
                    "name": "body",
                    "type": "json",
                    "default": {},
                },
            ],
        }


class WebhookNode(BaseNode):
    """Webhook trigger node."""
    
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> Any:
        # Webhook nodes are handled differently as triggers
        return input_data
    
    @classmethod
    def get_node_info(cls) -> Dict[str, Any]:
        return {
            "type": "webhook",
            "name": "Webhook",
            "category": "trigger",
            "description": "Trigger workflow via webhook",
            "inputs": [],
            "outputs": ["main"],
            "parameters": [
                {
                    "name": "path",
                    "type": "string",
                    "required": True,
                },
                {
                    "name": "method",
                    "type": "options",
                    "options": ["GET", "POST", "PUT", "DELETE"],
                    "default": "POST",
                },
            ],
        }


class CodeNode(BaseNode):
    """Execute custom Python code."""
    
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> Any:
        # For security, we'll use a restricted execution environment
        # This is a simplified version - in production, use proper sandboxing
        code = self.parameters.get("code", "")
        
        # Create a restricted globals dict
        safe_globals = {
            "__builtins__": {
                "len": len,
                "str": str,
                "int": int,
                "float": float,
                "bool": bool,
                "list": list,
                "dict": dict,
                "print": print,
            },
            "input_data": input_data,
            "context": context,
        }
        
        safe_locals = {}
        
        try:
            exec(code, safe_globals, safe_locals)
            return safe_locals.get("output", input_data)
        except Exception as e:
            logger.error(f"Code execution error: {str(e)}")
            raise
    
    @classmethod
    def get_node_info(cls) -> Dict[str, Any]:
        return {
            "type": "code",
            "name": "Code",
            "category": "action",
            "description": "Execute custom Python code",
            "inputs": ["main"],
            "outputs": ["main"],
            "parameters": [
                {
                    "name": "code",
                    "type": "code",
                    "language": "python",
                    "required": True,
                },
            ],
        }


class DialaMakeCallNode(BaseNode):
    """Custom node for making calls via Diala."""
    
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> Any:
        # Integration with Diala's calling service
        phone_number = self.parameters.get("phone_number", "")
        agent_id = self.parameters.get("agent_id", "")
        initial_message = self.parameters.get("initial_message", "")
        
        # TODO: Integrate with actual Diala calling service
        return {
            "call_id": str(uuid.uuid4()),
            "phone_number": phone_number,
            "status": "initiated",
            "agent_id": agent_id,
        }
    
    @classmethod
    def get_node_info(cls) -> Dict[str, Any]:
        return {
            "type": "dialaMakeCall",
            "name": "Make Call",
            "category": "action",
            "description": "Initiate a voice call using Diala",
            "inputs": ["main"],
            "outputs": ["main"],
            "parameters": [
                {
                    "name": "phone_number",
                    "type": "string",
                    "required": True,
                },
                {
                    "name": "agent_id",
                    "type": "string",
                    "required": True,
                },
                {
                    "name": "initial_message",
                    "type": "string",
                },
            ],
        }


class NodeRegistry:
    """Registry for available workflow nodes."""
    
    _nodes: Dict[str, Type[BaseNode]] = {}
    
    @classmethod
    def register(cls, node_type: str, node_class: Type[BaseNode]):
        """Register a node type."""
        cls._nodes[node_type] = node_class
    
    @classmethod
    def get(cls, node_type: str) -> Optional[Type[BaseNode]]:
        """Get a node class by type."""
        return cls._nodes.get(node_type)
    
    @classmethod
    def list_nodes(cls) -> List[Dict[str, Any]]:
        """List all available nodes with their metadata."""
        return [node_class.get_node_info() for node_class in cls._nodes.values()]
    
    @classmethod
    def create_node(cls, node_type: str, node_id: str, parameters: Dict[str, Any], 
                   credentials: Optional[Dict] = None) -> Optional[BaseNode]:
        """Create a node instance."""
        node_class = cls.get(node_type)
        if node_class:
            return node_class(node_id, parameters, credentials)
        return None


# Register built-in nodes
NodeRegistry.register("httpRequest", HttpRequestNode)
NodeRegistry.register("webhook", WebhookNode)
NodeRegistry.register("code", CodeNode)
NodeRegistry.register("dialaMakeCall", DialaMakeCallNode)


class WorkflowExecutor:
    """Executes workflows."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.execution_data: Dict[str, Any] = {}
        
    async def execute_workflow(self, workflow_id: str, trigger_data: Optional[Dict[str, Any]] = None) -> WorkflowExecution:
        """Execute a workflow."""
        # Get workflow from database
        result = await self.db.execute(
            select(Workflow).where(Workflow.id == workflow_id)
        )
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            status=ExecutionStatus.RUNNING,
            mode="manual" if trigger_data else "trigger",
            data={},
        )
        self.db.add(execution)
        await self.db.commit()
        
        try:
            # Execute workflow
            result_data = await self._execute_nodes(workflow, trigger_data or {})
            
            # Update execution status
            execution.status = ExecutionStatus.SUCCESS
            execution.finished_at = datetime.utcnow()
            execution.data = result_data
            
        except Exception as e:
            logger.error(f"Workflow execution error: {str(e)}")
            execution.status = ExecutionStatus.ERROR
            execution.error = {"message": str(e)}
            execution.finished_at = datetime.utcnow()
            
        await self.db.commit()
        return execution
    
    async def _execute_nodes(self, workflow: Workflow, trigger_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow nodes in order."""
        nodes = workflow.nodes or []
        connections = workflow.connections or {}
        execution_data = {}
        
        # Find start nodes (triggers or nodes without inputs)
        start_nodes = self._find_start_nodes(nodes, connections)
        
        # Execute nodes using BFS
        queue = [(node, trigger_data) for node in start_nodes]
        executed = set()
        
        while queue:
            node, input_data = queue.pop(0)
            node_id = node["id"]
            
            if node_id in executed:
                continue
                
            # Create and execute node
            node_instance = NodeRegistry.create_node(
                node["type"],
                node_id,
                node.get("parameters", {}),
                node.get("credentials"),
            )
            
            if node_instance:
                try:
                    output_data = await node_instance.execute(input_data, {"workflow": workflow})
                    execution_data[node_id] = output_data
                    executed.add(node_id)
                    
                    # Queue connected nodes
                    if node_id in connections:
                        for connection in connections[node_id].get("main", [[]]):
                            for target in connection:
                                target_node = next((n for n in nodes if n["id"] == target["node"]), None)
                                if target_node:
                                    queue.append((target_node, output_data))
                                    
                except Exception as e:
                    logger.error(f"Node {node_id} execution error: {str(e)}")
                    raise
        
        return execution_data
    
    def _find_start_nodes(self, nodes: List[Dict], connections: Dict) -> List[Dict]:
        """Find nodes that should execute first."""
        # Find all nodes that are targets of connections
        target_nodes = set()
        for source_connections in connections.values():
            for output_connections in source_connections.get("main", [[]]):
                for connection in output_connections:
                    target_nodes.add(connection["node"])
        
        # Start nodes are those not targeted by any connection
        return [node for node in nodes if node["id"] not in target_nodes]