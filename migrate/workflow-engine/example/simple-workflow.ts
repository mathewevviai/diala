/**
 * Simple Workflow Example
 * Demonstrates how to use the extracted workflow engine
 */

import {
  WorkflowExecutor,
  IWorkflowBase,
  INode,
  INodeType,
  INodeTypes,
  INodeExecutionData,
  IExecuteFunctions,
  IDataObject
} from '../core/workflow-executor';
import { ExpressionEvaluator } from '../core/expression-evaluator';
import * as NodeHelpers from '../core/node-helpers';

/**
 * Example Node Type: Start Node
 */
class StartNode implements INodeType {
  description = {
    displayName: 'Start',
    name: 'start',
    version: 1,
    description: 'Starts the workflow execution',
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        name: 'values',
        displayName: 'Values',
        type: 'fixedCollection',
        default: {},
        description: 'Initial values to start with'
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const values = this.getNodeParameter('values', 0, {}) as IDataObject;
    
    return [
      this.helpers.returnJsonArray([
        { 
          ...values,
          timestamp: new Date().toISOString() 
        }
      ])
    ];
  }
}

/**
 * Example Node Type: Transform Node
 */
class TransformNode implements INodeType {
  description = {
    displayName: 'Transform',
    name: 'transform',
    version: 1,
    description: 'Transforms input data',
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        options: [
          { name: 'Set Field', value: 'set' },
          { name: 'Remove Field', value: 'remove' },
          { name: 'Rename Field', value: 'rename' }
        ],
        default: 'set',
        description: 'The operation to perform'
      },
      {
        name: 'field',
        displayName: 'Field',
        type: 'string',
        default: '',
        description: 'The field to operate on'
      },
      {
        name: 'value',
        displayName: 'Value',
        type: 'string',
        default: '',
        description: 'The value to set (for set operation)',
        displayOptions: {
          show: { operation: ['set'] }
        }
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    const operation = this.getNodeParameter('operation', 0) as string;
    const field = this.getNodeParameter('field', 0) as string;

    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i] };
      const newItem: INodeExecutionData = {
        json: { ...item.json },
        binary: item.binary
      };

      switch (operation) {
        case 'set':
          const value = this.getNodeParameter('value', i) as string;
          newItem.json[field] = value;
          break;
        case 'remove':
          delete newItem.json[field];
          break;
        case 'rename':
          const newName = this.getNodeParameter('value', i) as string;
          if (field in newItem.json) {
            newItem.json[newName] = newItem.json[field];
            delete newItem.json[field];
          }
          break;
      }

      returnData.push(newItem);
    }

    return [returnData];
  }
}

/**
 * Example Node Type: Filter Node
 */
class FilterNode implements INodeType {
  description = {
    displayName: 'Filter',
    name: 'filter',
    version: 1,
    description: 'Filters items based on conditions',
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'conditions',
        displayName: 'Conditions',
        type: 'fixedCollection',
        default: {},
        description: 'Conditions to filter by'
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const conditions = this.getNodeParameter('conditions', 0, {}) as any;
    
    // Simple filter implementation
    const filtered = items.filter(item => {
      // This would normally evaluate complex conditions
      // Simplified for this example
      return true;
    });

    return [filtered];
  }
}

/**
 * Mock Node Types Registry
 */
class MockNodeTypes implements INodeTypes {
  private nodeTypes: Map<string, INodeType> = new Map();

  constructor() {
    this.registerNodeType('start', new StartNode());
    this.registerNodeType('transform', new TransformNode());
    this.registerNodeType('filter', new FilterNode());
  }

  registerNodeType(name: string, nodeType: INodeType): void {
    this.nodeTypes.set(name, nodeType);
  }

  getByNameAndVersion(nodeType: string, version?: number): INodeType {
    const node = this.nodeTypes.get(nodeType);
    if (!node) {
      throw new Error(`Unknown node type: ${nodeType}`);
    }
    return node;
  }
}

/**
 * Example workflow execution
 */
async function runExample() {
  console.log('Starting workflow execution example...\n');

  // Create node types registry
  const nodeTypes = new MockNodeTypes();

  // Define workflow
  const workflow: IWorkflowBase = {
    id: 'example-workflow',
    name: 'Example Workflow',
    nodes: [
      {
        name: 'Start',
        type: 'start',
        position: [100, 100],
        parameters: {
          values: {
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
          }
        }
      },
      {
        name: 'Add Timestamp',
        type: 'transform',
        position: [300, 100],
        parameters: {
          operation: 'set',
          field: 'processedAt',
          value: '={{$now.toISO()}}'
        }
      },
      {
        name: 'Update Email',
        type: 'transform',
        position: [500, 100],
        parameters: {
          operation: 'set',
          field: 'email',
          value: 'processed_{{$json.email}}'
        }
      },
      {
        name: 'Filter',
        type: 'filter',
        position: [700, 100],
        parameters: {
          conditions: {}
        }
      }
    ],
    connections: {
      'Start': {
        'main': [[{ node: 'Add Timestamp', type: 'main', index: 0 }]]
      },
      'Add Timestamp': {
        'main': [[{ node: 'Update Email', type: 'main', index: 0 }]]
      },
      'Update Email': {
        'main': [[{ node: 'Filter', type: 'main', index: 0 }]]
      }
    }
  };

  // Create workflow executor
  const executor = new WorkflowExecutor(nodeTypes, 'manual');

  // Set up event listeners
  executor.on('nodeExecuted', (event) => {
    console.log(`✓ Node executed: ${event.nodeName} (${event.executionTime}ms)`);
    console.log(`  Items processed: ${event.itemsProcessed}`);
  });

  executor.on('error', (error) => {
    console.error('Workflow error:', error);
  });

  try {
    // Execute workflow
    const result = await executor.execute(workflow);
    
    console.log('\n--- Execution Complete ---');
    console.log('Execution ID:', executor.getExecutionId());
    
    // Display results
    console.log('\n--- Results ---');
    for (const [nodeName, taskData] of Object.entries(result.resultData.runData)) {
      console.log(`\nNode: ${nodeName}`);
      const lastRun = taskData[taskData.length - 1];
      if (lastRun.data?.main?.[0]) {
        console.log('Output:', JSON.stringify(lastRun.data.main[0], null, 2));
      }
      if (lastRun.error) {
        console.log('Error:', lastRun.error.message);
      }
    }
  } catch (error) {
    console.error('Execution failed:', error);
  }
}

/**
 * Expression evaluation example
 */
function expressionExample() {
  console.log('\n\n--- Expression Evaluation Example ---\n');

  const evaluator = new ExpressionEvaluator();
  
  // Create mock data context
  const context = evaluator.createDataProxy(
    {},
    { 
      nodes: [{ 
        name: 'TestNode', 
        type: 'test',
        parameters: { testParam: 'value' }
      }] 
    },
    0,
    'TestNode',
    [
      { 
        json: { 
          name: 'John', 
          age: 30,
          email: 'john@example.com'
        } 
      }
    ]
  );

  // Test expressions
  const expressions = [
    '$json.name',
    '$json.age + 5',
    '$uppercase($json.email)',
    '$if($json.age > 25, "Adult", "Young")',
    '$now.toFormat("yyyy-MM-dd")',
    '`Hello ${$json.name}, you are ${$json.age} years old`'
  ];

  for (const expr of expressions) {
    try {
      const result = evaluator.evaluate(expr, context);
      console.log(`Expression: ${expr}`);
      console.log(`Result: ${result}\n`);
    } catch (error) {
      console.log(`Expression: ${expr}`);
      console.log(`Error: ${(error as Error).message}\n`);
    }
  }
}

// Run examples
if (require.main === module) {
  runExample().then(() => {
    expressionExample();
  });
}

export { runExample, expressionExample };