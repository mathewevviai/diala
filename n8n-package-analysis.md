# n8n Package Structure Analysis

## Overview
n8n is a modular workflow automation platform built with a monorepo structure. The packages are organized into several categories based on their functionality.

## Essential Packages for Embedding Workflow Editor and Execution Engine

### Core Packages (Required)

1. **`n8n-workflow` (v1.95.0)**
   - Base workflow code and data structures
   - Contains workflow execution logic, node interfaces, and data types
   - Essential for defining workflows and nodes
   - Dependencies: lodash, luxon, zod, etc.

2. **`n8n-core` (v1.97.0)**
   - Core functionality including execution engine
   - Handles node execution, credentials, and data processing
   - Manages HTTP requests, authentication, and file operations
   - Dependencies: axios, jsonwebtoken, winston, etc.

3. **`@n8n/workflow` (frontend package)**
   - Workflow UI components and canvas functionality
   - Vue.js based workflow editor
   - Node connection management and visual representation

### Frontend Editor Packages (Required for UI)

4. **`n8n-editor-ui` (v1.98.0)**
   - Main workflow editor UI built with Vue 3
   - Contains the visual workflow designer, node settings, and execution views
   - Key components:
     - Canvas components (`/components/canvas/`)
     - Node view (`/views/NodeView.vue`)
     - Workflow management views
   - Dependencies: Vue 3, Vue Flow, CodeMirror, Element Plus

5. **`@n8n/design-system` (v1.85.0)**
   - UI component library and design tokens
   - Built on Element Plus and Vue 3
   - Provides consistent styling and components
   - Dependencies: Element Plus, Tailwind CSS

### Execution Engine Packages

6. **`@n8n/task-runner` (v1.34.0)**
   - Handles isolated task execution
   - Manages JavaScript code node execution in sandboxed environment
   - WebSocket-based communication with main process

7. **`n8n` (CLI package, v1.98.0)**
   - Main application entry point
   - Contains workflow runner, execution management
   - Handles scaling, webhook processing
   - API server implementation

### Supporting Packages (Recommended)

8. **`nodes-base` (v1.96.0)**
   - Collection of built-in nodes (300+ integrations)
   - Essential if you want to use pre-built nodes
   - Can be excluded if building custom nodes only

9. **`@n8n/utils` (workspace package)**
   - Common utilities and helper functions
   - Event bus, string manipulation, retry logic

10. **`@n8n/constants` (workspace package)**
    - Shared constants across packages
    - API endpoints, instance types, execution statuses

### Data and Storage Packages

11. **`@n8n/db` (workspace package)**
    - Database entities and repositories
    - TypeORM-based data access layer
    - Supports SQLite, PostgreSQL, MySQL/MariaDB

12. **`@n8n/config` (workspace package)**
    - Configuration management
    - Environment variable handling
    - Feature flags and settings

### Optional Enhancement Packages

13. **`@n8n/nodes-langchain`**
    - AI/LLM workflow nodes
    - Integration with various AI providers

14. **`@n8n/api-types`**
    - TypeScript type definitions for API
    - DTO schemas and validation

15. **`@n8n/permissions`**
    - Role-based access control
    - Scope management for enterprise features

## Minimal Setup for Embedding

For a minimal embedded workflow editor and execution engine in Next.js, you would need:

### Essential:
1. `n8n-workflow` - Core workflow logic
2. `n8n-core` - Execution engine
3. `n8n-editor-ui` - Visual editor (adapt Vue components)
4. `@n8n/design-system` - UI components
5. `@n8n/utils` - Utilities

### For Execution:
6. `@n8n/task-runner` - Code execution
7. Selected parts of `n8n` CLI package (workflow runner)

### For Storage:
8. `@n8n/db` - If persisting workflows
9. `@n8n/config` - Configuration management

### For Nodes:
10. `nodes-base` - If using built-in nodes
11. Node type definitions from `n8n-workflow`

## Integration Considerations

1. **Vue to React Migration**: The editor UI is built with Vue 3. You'll need to either:
   - Embed Vue components in React using a wrapper
   - Rewrite the canvas components in React (significant effort)
   - Use the Vue Flow library's React equivalent

2. **Canvas Library**: n8n uses Vue Flow for the workflow canvas. Consider using React Flow for a React-based implementation.

3. **State Management**: n8n uses Pinia for state management. You'll need to adapt this to your Next.js state management solution.

4. **WebSocket Communication**: The execution engine uses WebSocket for real-time updates. Ensure your Next.js setup supports WebSocket connections.

5. **Database**: n8n supports multiple databases through TypeORM. You can use the existing database layer or implement your own.

6. **Authentication**: The editor includes authentication logic that you may need to adapt or replace with your own.

## Recommended Approach

1. Start with the core packages (`n8n-workflow`, `n8n-core`)
2. Extract and adapt the canvas components from `n8n-editor-ui`
3. Implement a minimal workflow runner based on the CLI package
4. Add node support (either built-in or custom)
5. Implement persistence if needed
6. Add real-time execution monitoring via WebSocket

This modular architecture allows you to pick and choose components based on your specific requirements for embedding n8n into your Next.js application.