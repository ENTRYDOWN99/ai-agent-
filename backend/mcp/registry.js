/**
 * MCP (Model Context Protocol) Tool Registry
 * Registers and manages all available tools that agents can use
 */

class MCPRegistry {
  constructor() {
    this.tools = new Map();
    this.toolSchemas = new Map();
  }

  /**
   * Register a new tool
   * @param {string} name - Tool name
   * @param {object} schema - Tool schema (description, parameters)
   * @param {function} handler - Tool execution handler
   */
  registerTool(name, schema, handler) {
    this.tools.set(name, handler);
    this.toolSchemas.set(name, {
      name,
      description: schema.description,
      parameters: schema.parameters || {}
    });
    console.log(`🔧 MCP Tool Registered: ${name}`);
  }

  /**
   * Execute a tool by name
   * @param {string} name - Tool name
   * @param {object} params - Tool parameters
   * @param {object} context - Execution context (userId, etc)
   */
  async executeTool(name, params, context) {
    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Tool "${name}" not found in registry`);
    }

    const startTime = Date.now();
    try {
      const result = await handler(params, context);
      return {
        success: true,
        result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get all registered tool schemas
   */
  getToolSchemas() {
    return Array.from(this.toolSchemas.values());
  }

  /**
   * Check if a tool exists
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Get tools by category prefix
   */
  getToolsByCategory(prefix) {
    return Array.from(this.toolSchemas.values())
      .filter(schema => schema.name.startsWith(prefix));
  }
}

// Singleton instance
const registry = new MCPRegistry();

module.exports = registry;
