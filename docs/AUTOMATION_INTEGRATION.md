# Automation Integration

This document describes how n8n workflow automation has been integrated directly into Diala.

## Overview

Instead of running n8n as a separate Docker container, we've extracted and integrated the core workflow engine components directly into the Diala application. This provides:

- Seamless UI integration with Diala's design system
- Direct API integration without external dependencies
- Custom nodes for Diala-specific operations
- Better performance and simplified deployment

## Architecture

### Backend Components

1. **Database Models** (`backend/src/automation/models.py`)
   - `Workflow`: Stores workflow definitions
   - `WorkflowExecution`: Tracks execution history
   - `WorkflowNode`: Individual node configurations
   - `WorkflowConnection`: Node connections

2. **Execution Service** (`backend/src/automation/services.py`)
   - `WorkflowExecutor`: Handles workflow execution
   - `NodeRegistry`: Manages available node types
   - `BaseNode`: Abstract class for custom nodes

3. **API Endpoints** (`backend/src/automation/api.py`)
   - `GET /api/automation/workflows` - List workflows
   - `POST /api/automation/workflows` - Create workflow
   - `PUT /api/automation/workflows/{id}` - Update workflow
   - `DELETE /api/automation/workflows/{id}` - Delete workflow
   - `POST /api/automation/workflows/{id}/execute` - Execute workflow
   - `GET /api/automation/workflows/{id}/executions` - List executions

### Frontend Components

1. **Workflow Editor** (`frontend/src/components/automation/WorkflowEditor.tsx`)
   - Built with React Flow (@xyflow/react)
   - Drag-and-drop node creation
   - Visual connection builder
   - Matches Diala's Neobrutalist design

2. **Custom Nodes** (`frontend/src/components/automation/CustomNode.tsx`)
   - Neobrutalist styled nodes
   - Color-coded by category
   - Handle connections visually

3. **Node Panel** (`frontend/src/components/automation/NodePanel.tsx`)
   - Categorized node library
   - Drag nodes to canvas

4. **Settings Panel** (`frontend/src/components/automation/WorkflowSettings.tsx`)
   - Configure node parameters
   - Node-specific settings

## Available Nodes

### Built-in Nodes
- **Webhook**: Trigger workflows via HTTP
- **HTTP Request**: Make external API calls
- **Code**: Execute Python code
- **Make Call**: Initiate Diala voice calls

### Custom Diala Nodes
- **Make Call**: Integrate with Diala's calling service
- More nodes can be added by extending `BaseNode`

## Database Setup

Run these migrations to create the automation tables:

```sql
-- Create workflow tables
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'inactive',
    active BOOLEAN DEFAULT FALSE,
    nodes JSONB DEFAULT '[]',
    connections JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    static_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'running',
    mode VARCHAR(20) DEFAULT 'trigger',
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    execution_time INTEGER,
    data JSONB DEFAULT '{}',
    wait_till TIMESTAMP,
    error JSONB
);

-- Add indexes
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
```

## Usage

### Creating a Workflow

1. Navigate to Dashboard > Automation
2. Click "New Workflow"
3. Drag nodes from the panel to the canvas
4. Connect nodes by dragging between handles
5. Configure node settings in the right panel
6. Save the workflow

### Executing a Workflow

Workflows can be executed:
- Manually via the UI (Execute button)
- Via API call
- Through webhook triggers

### Adding Custom Nodes

1. Create a new node class in `backend/src/automation/services.py`:

```python
class MyCustomNode(BaseNode):
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> Any:
        # Your node logic here
        return output_data
    
    @classmethod
    def get_node_info(cls) -> Dict[str, Any]:
        return {
            "type": "myCustomNode",
            "name": "My Custom Node",
            "category": "action",
            # ... node configuration
        }

# Register the node
NodeRegistry.register("myCustomNode", MyCustomNode)
```

2. Add the node to the frontend panel in `NodePanel.tsx`

## Next Steps

- [ ] Implement WebSocket for real-time execution updates
- [ ] Add more Diala-specific nodes (SMS, Email, Analytics)
- [ ] Create workflow templates
- [ ] Add execution monitoring dashboard
- [ ] Implement workflow versioning
- [ ] Add collaborative editing