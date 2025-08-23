/**
 * Core Workflow class extracted from n8n
 * Handles workflow structure, node management, and execution flow
 */

import { IConnection, IConnections, INode, INodeType, IWorkflowBase } from '../types'

export class Workflow {
  id: string
  name: string
  nodes: INode[]
  connections: IConnections
  active: boolean
  settings: any
  staticData: any
  pinData: any

  constructor(parameters: IWorkflowBase) {
    this.id = parameters.id || 'workflow'
    this.name = parameters.name || 'Untitled Workflow'
    this.nodes = parameters.nodes || []
    this.connections = parameters.connections || {}
    this.active = parameters.active || false
    this.settings = parameters.settings || {}
    this.staticData = parameters.staticData || {}
    this.pinData = parameters.pinData || {}
  }

  /**
   * Get all nodes
   */
  getNodes(): INode[] {
    return this.nodes
  }

  /**
   * Get a specific node by name
   */
  getNode(nodeName: string): INode | null {
    return this.nodes.find(node => node.name === nodeName) || null
  }

  /**
   * Get all parent nodes of a given node
   */
  getParentNodes(nodeName: string): string[] {
    const parents: string[] = []
    
    for (const [sourceNode, outputs] of Object.entries(this.connections)) {
      for (const [outputIndex, connections] of Object.entries(outputs)) {
        for (const connectionGroup of connections) {
          for (const connection of connectionGroup) {
            if (connection.node === nodeName) {
              parents.push(sourceNode)
            }
          }
        }
      }
    }
    
    return [...new Set(parents)]
  }

  /**
   * Get all child nodes of a given node
   */
  getChildNodes(nodeName: string): string[] {
    const children: string[] = []
    const nodeConnections = this.connections[nodeName]
    
    if (nodeConnections) {
      for (const [outputIndex, connections] of Object.entries(nodeConnections)) {
        for (const connectionGroup of connections) {
          for (const connection of connectionGroup) {
            children.push(connection.node)
          }
        }
      }
    }
    
    return [...new Set(children)]
  }

  /**
   * Get all start nodes (nodes without parents)
   */
  getStartNodes(): INode[] {
    const nodesWithParents = new Set<string>()
    
    for (const [sourceNode, outputs] of Object.entries(this.connections)) {
      for (const [outputIndex, connections] of Object.entries(outputs)) {
        for (const connectionGroup of connections) {
          for (const connection of connectionGroup) {
            nodesWithParents.add(connection.node)
          }
        }
      }
    }
    
    return this.nodes.filter(node => !nodesWithParents.has(node.name))
  }

  /**
   * Check if workflow has a cycle
   */
  checkForCycles(): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const hasCycleDFS = (nodeName: string): boolean => {
      visited.add(nodeName)
      recursionStack.add(nodeName)
      
      const children = this.getChildNodes(nodeName)
      for (const child of children) {
        if (!visited.has(child)) {
          if (hasCycleDFS(child)) return true
        } else if (recursionStack.has(child)) {
          return true
        }
      }
      
      recursionStack.delete(nodeName)
      return false
    }
    
    for (const node of this.nodes) {
      if (!visited.has(node.name)) {
        if (hasCycleDFS(node.name)) return true
      }
    }
    
    return false
  }

  /**
   * Get execution order using topological sort
   */
  getExecutionOrder(): string[] {
    const visited = new Set<string>()
    const executionOrder: string[] = []
    
    const visit = (nodeName: string) => {
      if (visited.has(nodeName)) return
      visited.add(nodeName)
      
      const parents = this.getParentNodes(nodeName)
      for (const parent of parents) {
        visit(parent)
      }
      
      executionOrder.push(nodeName)
    }
    
    // Start from nodes without children (end nodes)
    const endNodes = this.nodes.filter(node => 
      this.getChildNodes(node.name).length === 0
    )
    
    for (const node of endNodes) {
      visit(node.name)
    }
    
    // Visit any remaining nodes
    for (const node of this.nodes) {
      visit(node.name)
    }
    
    return executionOrder
  }

  /**
   * Get all nodes between two nodes
   */
  getNodesBetween(startNode: string, endNode: string): string[] {
    const nodesBetween = new Set<string>()
    const visited = new Set<string>()
    
    const findPath = (current: string): boolean => {
      if (current === endNode) return true
      if (visited.has(current)) return false
      
      visited.add(current)
      
      const children = this.getChildNodes(current)
      for (const child of children) {
        if (findPath(child)) {
          nodesBetween.add(current)
          return true
        }
      }
      
      return false
    }
    
    findPath(startNode)
    return Array.from(nodesBetween)
  }

  /**
   * Get pinned data for a node
   */
  getPinDataOfNode(nodeName: string): any {
    return this.pinData?.[nodeName] || null
  }

  /**
   * Validate workflow structure
   */
  validateWorkflow(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check for duplicate node names
    const nodeNames = new Set<string>()
    for (const node of this.nodes) {
      if (nodeNames.has(node.name)) {
        errors.push(`Duplicate node name: ${node.name}`)
      }
      nodeNames.add(node.name)
    }
    
    // Check for cycles
    if (this.checkForCycles()) {
      errors.push('Workflow contains cycles')
    }
    
    // Check connections reference existing nodes
    for (const [sourceNode, outputs] of Object.entries(this.connections)) {
      if (!this.getNode(sourceNode)) {
        errors.push(`Connection references non-existent source node: ${sourceNode}`)
      }
      
      for (const [outputIndex, connections] of Object.entries(outputs)) {
        for (const connectionGroup of connections) {
          for (const connection of connectionGroup) {
            if (!this.getNode(connection.node)) {
              errors.push(`Connection references non-existent target node: ${connection.node}`)
            }
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get all trigger nodes
   */
  getTriggerNodes(): INode[] {
    return this.nodes.filter(node => {
      // Check if node type indicates it's a trigger
      // This would normally check against node type definitions
      return ['webhook', 'schedule', 'trigger'].includes(node.type.toLowerCase())
    })
  }

  /**
   * Get all nodes that can be manually executed
   */
  getManualTriggerNodes(): INode[] {
    return this.nodes.filter(node => {
      return node.type === 'manualTrigger' || 
             (this.getParentNodes(node.name).length === 0 && !this.getTriggerNodes().includes(node))
    })
  }

  /**
   * Clone the workflow
   */
  clone(): Workflow {
    return new Workflow({
      id: this.id,
      name: this.name,
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections)),
      active: this.active,
      settings: JSON.parse(JSON.stringify(this.settings)),
      staticData: JSON.parse(JSON.stringify(this.staticData)),
      pinData: JSON.parse(JSON.stringify(this.pinData))
    })
  }
}