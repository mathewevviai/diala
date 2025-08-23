"""
Setup script to integrate automation module with the main application.
"""

from fastapi import FastAPI
from .api import automation_router

def setup_automation(app: FastAPI):
    """
    Add this to your main FastAPI app initialization.
    """
    # Register the automation router
    app.include_router(automation_router)
    
    print("✅ Automation module registered")
    print("📌 Available endpoints:")
    print("   - GET    /api/automation/nodes")
    print("   - GET    /api/automation/workflows")
    print("   - POST   /api/automation/workflows")
    print("   - GET    /api/automation/workflows/{id}")
    print("   - PUT    /api/automation/workflows/{id}")
    print("   - DELETE /api/automation/workflows/{id}")
    print("   - POST   /api/automation/workflows/{id}/execute")
    print("   - GET    /api/automation/workflows/{id}/executions")


# SQL script to create tables
CREATE_TABLES_SQL = """
-- Create workflow tables
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'inactive',
    active BOOLEAN DEFAULT FALSE,
    nodes JSONB DEFAULT '[]'::jsonb,
    connections JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    static_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'running',
    mode VARCHAR(20) DEFAULT 'trigger',
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    execution_time INTEGER,
    data JSONB DEFAULT '{}'::jsonb,
    wait_till TIMESTAMP,
    error JSONB
);

CREATE TABLE IF NOT EXISTS workflow_tag_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_tags (
    workflow_id UUID REFERENCES workflows(id),
    tag_id UUID REFERENCES workflow_tag_definitions(id),
    PRIMARY KEY (workflow_id, tag_id)
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    node_id VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    parameters JSONB DEFAULT '{}'::jsonb,
    credentials JSONB DEFAULT '{}'::jsonb,
    position JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    source_node VARCHAR(255) NOT NULL,
    source_output INTEGER DEFAULT 0,
    target_node VARCHAR(255) NOT NULL,
    target_input INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
"""

if __name__ == "__main__":
    print("Automation Module Setup")
    print("======================")
    print("\n1. Add to your FastAPI app:")
    print("   from src.automation.setup import setup_automation")
    print("   setup_automation(app)")
    print("\n2. Run the SQL script to create tables:")
    print(CREATE_TABLES_SQL)