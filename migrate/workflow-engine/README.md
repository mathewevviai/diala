# Simplified Workflow Execution Engine

This is a simplified workflow execution engine extracted from n8n's core logic. It provides the essential components needed to execute node-based workflows without the full n8n infrastructure dependencies.

## Core Components

### 1. Workflow Executor (`workflow-executor.ts`)
The main execution engine that processes workflows by:
- Managing execution state and context
- Processing nodes in the correct order
- Handling node connections and data flow
- Managing execution stack and waiting executions
- Emitting execution events

Key features:
- Event-based execution monitoring
- Support for pinned data (mock data for testing)
- Execution filtering (run only specific nodes)
- Abort capability
- Error handling and recovery

### 2. Expression Evaluator (`expression-evaluator.ts`)
Handles expression evaluation within node parameters:
- JavaScript expression evaluation with sandboxed context
- Built-in helper functions (`$json`, `$node`, `$now`, etc.)
- JMESPath support for JSON queries
- Data proxy system for accessing workflow context
- Type conversions and data transformations

Key features:
- Safe expression evaluation
- Rich set of built-in functions
- DateTime handling with timezone support
- JSON path navigation
- String manipulation utilities

### 3. Node Helpers (`node-helpers.ts`)
Utility functions for working with nodes:
- Parameter handling and validation
- Display conditions evaluation
- Data transformation utilities
- Connection validation
- Error handling helpers
- Batch processing utilities

## Usage Example

```typescript
// Create node types registry
const nodeTypes = new MockNodeTypes();

// Define workflow
const workflow: IWorkflowBase = {
  id: 'my-workflow',
  name: 'My Workflow',
  nodes: [
    {
      name: 'Start',
      type: 'start',
      position: [100, 100],
      parameters: {
        values: { name: 'John', age: 30 }
      }
    },
    {
      name: 'Transform',
      type: 'transform',
      position: [300, 100],
      parameters: {
        operation: 'set',
        field: 'processed',
        value: 'true'
      }
    }
  ],
  connections: {
    'Start': {
      'main': [[{ node: 'Transform', type: 'main', index: 0 }]]
    }
  }
};

// Execute workflow
const executor = new WorkflowExecutor(nodeTypes, 'manual');
const result = await executor.execute(workflow);
```

## Key Concepts

### Nodes
Nodes are the building blocks of workflows. Each node:
- Has a unique name within the workflow
- Belongs to a specific type (e.g., 'start', 'transform', 'http')
- Contains parameters that configure its behavior
- Can be connected to other nodes

### Connections
Connections define how data flows between nodes:
- Source node output → Target node input
- Support for multiple outputs per node
- Support for multiple inputs per node
- Connection types (main, error, etc.)

### Execution Data
The execution produces:
- **Run Data**: Results from each node execution
- **Pin Data**: Mock/test data for development
- **Context Data**: Shared data between nodes
- **Metadata**: Additional execution information

### Expressions
Expressions allow dynamic values in node parameters:
- Start with `=` to indicate an expression
- Access to workflow context via `$` variables
- Support for JavaScript operations
- Built-in helper functions

## Expression Variables

- `$json`: Current item's JSON data
- `$input`: Access to all input data
- `$node`: Current node information
- `$workflow`: Workflow metadata
- `$now`: Current DateTime
- `$today`: Today's date at midnight
- `$execution`: Execution metadata
- `$itemIndex`: Current item index
- `$runIndex`: Current run index

## Built-in Functions

### String Functions
- `$lowercase(str)`: Convert to lowercase
- `$uppercase(str)`: Convert to uppercase
- `$trim(str)`: Remove whitespace
- `$replaceAll(str, search, replace)`: Replace all occurrences

### Data Functions
- `$exists(value)`: Check if value exists
- `$isEmpty(value)`: Check if value is empty
- `$toNumber(value)`: Convert to number
- `$toString(value)`: Convert to string
- `$toBoolean(value)`: Convert to boolean
- `$toJson(str)`: Parse JSON string

### Math Functions
- `$min(...values)`: Get minimum value
- `$max(...values)`: Get maximum value
- `$round(value, decimals)`: Round to decimals

### Control Functions
- `$if(condition, trueValue, falseValue)`: Conditional logic
- `$jmespath(data, expression)`: JMESPath query

## Implementing Custom Nodes

```typescript
class MyCustomNode implements INodeType {
  description = {
    displayName: 'My Custom Node',
    name: 'myCustomNode',
    version: 1,
    description: 'Does something custom',
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'myParameter',
        displayName: 'My Parameter',
        type: 'string',
        default: '',
        description: 'A custom parameter'
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const myParam = this.getNodeParameter('myParameter', i) as string;
      
      returnData.push({
        json: {
          ...items[i].json,
          processed: true,
          parameter: myParam
        }
      });
    }
    
    return [returnData];
  }
}
```

## Differences from n8n

This simplified implementation:
- Removes credential management
- Simplifies node type system
- Removes webhook/trigger complexity
- Simplifies expression sandboxing
- Removes database dependencies
- Simplifies error tracking
- Removes UI-specific features

## Integration Tips

1. **Node Types**: Implement the `INodeType` interface for custom nodes
2. **Expression Context**: Extend the expression evaluator for custom variables
3. **Event Handling**: Listen to execution events for monitoring
4. **Error Handling**: Implement proper error handling in custom nodes
5. **Data Validation**: Validate node parameters before execution

## Next Steps

To use this engine in your application:

1. Implement your custom node types
2. Create a node type registry
3. Define workflows programmatically or via JSON
4. Execute workflows and handle results
5. Integrate with your application's data flow

This simplified engine provides a solid foundation for building workflow automation into your applications without the overhead of a full workflow platform.