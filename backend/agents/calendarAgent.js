/**
 * Calendar Agent - Specialized agent for calendar/schedule management
 * Handles all event-related operations via MCP tools
 */

const registry = require('../mcp/registry');
const AgentLog = require('../models/AgentLog');

class CalendarAgent {
  constructor() {
    this.name = 'calendar-agent';
    this.capabilities = [
      'calendar.create', 'calendar.list', 'calendar.today',
      'calendar.upcoming', 'calendar.delete'
    ];
  }

  async process(intent, params, context) {
    const startTime = Date.now();
    let result = {};
    let action = '';

    try {
      switch (intent) {
        case 'create_event':
          action = 'Creating event';
          const startTime2 = params.startTime ? new Date(params.startTime) : new Date();
          const endTime = params.endTime ? new Date(params.endTime) : new Date(startTime2.getTime() + 3600000);
          
          result = await registry.executeTool('calendar.create', {
            title: params.title || 'Untitled Event',
            description: params.description || '',
            startTime: startTime2.toISOString(),
            endTime: endTime.toISOString(),
            location: params.location || '',
            type: params.type || 'meeting'
          }, context);
          break;

        case 'list_events':
          action = 'Listing events';
          result = await registry.executeTool('calendar.list', {
            startDate: params.startDate,
            endDate: params.endDate,
            type: params.type
          }, context);
          break;

        case 'today_events':
          action = 'Getting today\'s events';
          result = await registry.executeTool('calendar.today', {}, context);
          break;

        case 'upcoming_events':
          action = 'Getting upcoming events';
          result = await registry.executeTool('calendar.upcoming', {
            days: params.days || 7
          }, context);
          break;

        case 'delete_event':
          action = 'Deleting event';
          result = await registry.executeTool('calendar.delete', {
            eventId: params.eventId
          }, context);
          break;

        default:
          throw new Error(`Unknown calendar intent: ${intent}`);
      }

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

module.exports = new CalendarAgent();
