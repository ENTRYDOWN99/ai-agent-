/**
 * Notes Agent - Specialized agent for note/information management
 * Handles all note-related operations via MCP tools
 */

const registry = require('../mcp/registry');
const AgentLog = require('../models/AgentLog');

class NotesAgent {
  constructor() {
    this.name = 'notes-agent';
    this.capabilities = [
      'notes.create', 'notes.list', 'notes.search', 'notes.delete'
    ];
  }

  async process(intent, params, context) {
    const startTime = Date.now();
    let result = {};
    let action = '';

    try {
      switch (intent) {
        case 'create_note':
          action = 'Creating note';
          result = await registry.executeTool('notes.create', {
            title: params.title || 'Untitled Note',
            content: params.content || '',
            category: params.category || 'general',
            tags: params.tags || [],
            isPinned: params.isPinned || false
          }, context);
          break;

        case 'list_notes':
          action = 'Listing notes';
          result = await registry.executeTool('notes.list', {
            category: params.category,
            search: params.search,
            pinned: params.pinned
          }, context);
          break;

        case 'search_notes':
          action = 'Searching notes';
          result = await registry.executeTool('notes.search', {
            keyword: params.keyword || params.search || ''
          }, context);
          break;

        case 'delete_note':
          action = 'Deleting note';
          result = await registry.executeTool('notes.delete', {
            noteId: params.noteId
          }, context);
          break;

        default:
          throw new Error(`Unknown notes intent: ${intent}`);
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

module.exports = new NotesAgent();
