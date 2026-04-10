/**
 * Task Agent - Specialized agent for task management
 * Handles all task-related operations via MCP tools
 */

const registry = require('../mcp/registry');
const AgentLog = require('../models/AgentLog');

class TaskAgent {
  constructor() {
    this.name = 'task-agent';
    this.capabilities = [
      'task.create', 'task.list', 'task.update', 'task.delete', 'task.stats'
    ];
  }

  /**
   * Process a task-related command
   * @param {string} intent - The detected intent
   * @param {object} params - Extracted parameters
   * @param {object} context - User context
   */
  async process(intent, params, context) {
    const startTime = Date.now();
    let result = {};
    let action = '';

    try {
      switch (intent) {
        case 'create_task':
          action = 'Creating task';
          result = await registry.executeTool('task.create', {
            title: params.title || 'Untitled Task',
            description: params.description || '',
            priority: params.priority || 'medium',
            category: params.category || 'general',
            dueDate: params.dueDate || null,
            tags: params.tags || []
          }, context);
          break;

        case 'list_tasks':
          action = 'Listing tasks';
          result = await registry.executeTool('task.list', {
            status: params.status,
            priority: params.priority,
            limit: params.limit || 10
          }, context);
          break;

        case 'update_task':
          action = 'Updating task';
          result = await registry.executeTool('task.update', {
            taskId: params.taskId,
            updates: params.updates || {}
          }, context);
          break;

        case 'complete_task':
          action = 'Completing task';
          result = await registry.executeTool('task.update', {
            taskId: params.taskId,
            updates: { status: 'done' }
          }, context);
          break;

        case 'delete_task':
          action = 'Deleting task';
          result = await registry.executeTool('task.delete', {
            taskId: params.taskId
          }, context);
          break;

        case 'task_stats':
          action = 'Getting task statistics';
          result = await registry.executeTool('task.stats', {}, context);
          break;

        default:
          throw new Error(`Unknown task intent: ${intent}`);
      }

      // Log the action
      await this.logAction(context.userId, action, params, result, 'success', context.workflowId, Date.now() - startTime);

      return {
        agent: this.name,
        action,
        ...result
      };
    } catch (error) {
      await this.logAction(context.userId, action || 'Unknown', params, { error: error.message }, 'error', context.workflowId, Date.now() - startTime);
      throw error;
    }
  }

  async logAction(userId, action, input, output, status, workflowId, duration) {
    try {
      await AgentLog.create({
        userId,
        agentName: this.name,
        action,
        input,
        output,
        status,
        workflowId,
        duration
      });
    } catch (err) {
      console.error('Failed to log agent action:', err.message);
    }
  }
}

module.exports = new TaskAgent();
