/**
 * Orchestrator Agent - Primary coordinating agent
 * Routes user requests to appropriate sub-agents
 * Handles multi-step workflows and coordination
 */

const { v4: uuidv4 } = require('uuid');
const taskAgent = require('./taskAgent');
const calendarAgent = require('./calendarAgent');
const notesAgent = require('./notesAgent');
const AgentLog = require('../models/AgentLog');

class OrchestratorAgent {
  constructor() {
    this.name = 'orchestrator';
    this.agents = {
      task: taskAgent,
      calendar: calendarAgent,
      notes: notesAgent
    };

    // Intent mapping - maps user commands to agent + intent
    this.intentPatterns = [
      // Task intents
      { pattern: /\b(create|add|new)\b.*\b(task|todo|to-do)\b/i, agent: 'task', intent: 'create_task' },
      { pattern: /\b(list|show|get|view)\b.*\b(task|todo|to-do)s?\b/i, agent: 'task', intent: 'list_tasks' },
      { pattern: /\b(update|edit|modify|change)\b.*\b(task|todo)\b/i, agent: 'task', intent: 'update_task' },
      { pattern: /\b(complete|finish|done|mark)\b.*\b(task|todo)\b/i, agent: 'task', intent: 'complete_task' },
      { pattern: /\b(delete|remove)\b.*\b(task|todo)\b/i, agent: 'task', intent: 'delete_task' },
      { pattern: /\b(task)\b.*\b(stats|statistics|summary|overview)\b/i, agent: 'task', intent: 'task_stats' },

      // Calendar intents
      { pattern: /\b(create|add|schedule|new)\b.*\b(event|meeting|appointment|reminder)\b/i, agent: 'calendar', intent: 'create_event' },
      { pattern: /\b(list|show|get|view)\b.*\b(event|meeting|appointment|schedule|calendar)s?\b/i, agent: 'calendar', intent: 'list_events' },
      { pattern: /\b(today|today's)\b.*\b(event|meeting|schedule|calendar|agenda)\b/i, agent: 'calendar', intent: 'today_events' },
      { pattern: /\bwhat.*(today|happening)\b/i, agent: 'calendar', intent: 'today_events' },
      { pattern: /\b(upcoming|next|future|week)\b.*\b(event|meeting|schedule)\b/i, agent: 'calendar', intent: 'upcoming_events' },
      { pattern: /\b(delete|remove|cancel)\b.*\b(event|meeting|appointment)\b/i, agent: 'calendar', intent: 'delete_event' },

      // Notes intents
      { pattern: /\b(create|add|write|new)\b.*\b(note|memo|jot)\b/i, agent: 'notes', intent: 'create_note' },
      { pattern: /\b(list|show|get|view)\b.*\b(note|memo)s?\b/i, agent: 'notes', intent: 'list_notes' },
      { pattern: /\b(search|find|look)\b.*\b(note|memo|information)\b/i, agent: 'notes', intent: 'search_notes' },
      { pattern: /\b(delete|remove)\b.*\b(note|memo)\b/i, agent: 'notes', intent: 'delete_note' },

      // Workflow intents
      { pattern: /\b(plan|organize)\b.*\b(day|today|morning)\b/i, agent: 'workflow', intent: 'plan_day' },
      { pattern: /\b(summarize|summary|recap)\b.*\b(week|weekly)\b/i, agent: 'workflow', intent: 'weekly_summary' },
      { pattern: /\b(create|start|new)\b.*\b(project)\b/i, agent: 'workflow', intent: 'create_project' },
    ];
  }

  /**
   * Parse user command and detect intent
   */
  detectIntent(command) {
    for (const { pattern, agent, intent } of this.intentPatterns) {
      if (pattern.test(command)) {
        return { agent, intent };
      }
    }
    return { agent: null, intent: null };
  }

  /**
   * Extract parameters from command text
   */
  extractParams(command, intent) {
    const params = {};
    
    // Extract title (text in quotes or after key phrases)
    const titleMatch = command.match(/["']([^"']+)["']/);
    if (titleMatch) {
      params.title = titleMatch[1];
    } else {
      // Try to extract title from natural language
      const titlePatterns = [
        /(?:called|titled|named)\s+(.+?)(?:\s+with|\s+due|\s+at|\s+on|$)/i,
        /(?:task|event|note|meeting|reminder)\s+(?:to\s+)?(.+?)(?:\s+with|\s+due|\s+at|\s+on|\s+by|$)/i
      ];
      for (const tp of titlePatterns) {
        const match = command.match(tp);
        if (match) {
          params.title = match[1].trim();
          break;
        }
      }
    }

    // Extract priority
    const priorityMatch = command.match(/\b(low|medium|high|urgent)\b\s*priority/i);
    if (priorityMatch) params.priority = priorityMatch[1].toLowerCase();

    // Extract category
    const categoryMatch = command.match(/\bcategory\s+["']?(\w+)["']?/i);
    if (categoryMatch) params.category = categoryMatch[1];

    // Extract date
    const datePatterns = [
      { pattern: /\btomorrow\b/i, transform: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; }},
      { pattern: /\bnext week\b/i, transform: () => { const d = new Date(); d.setDate(d.getDate() + 7); return d; }},
      { pattern: /\btoday\b/i, transform: () => new Date() },
      { pattern: /\bon\s+(\d{4}-\d{2}-\d{2})/i, transform: (m) => new Date(m[1]) }
    ];
    
    for (const { pattern, transform } of datePatterns) {
      const match = command.match(pattern);
      if (match) {
        const date = transform(match);
        params.dueDate = date.toISOString();
        params.startTime = date.toISOString();
        break;
      }
    }

    // Extract time for events
    const timeMatch = command.match(/\bat\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      if (timeMatch[3]?.toLowerCase() === 'pm' && hours !== 12) hours += 12;
      if (timeMatch[3]?.toLowerCase() === 'am' && hours === 12) hours = 0;
      
      const eventDate = params.startTime ? new Date(params.startTime) : new Date();
      eventDate.setHours(hours, minutes, 0, 0);
      params.startTime = eventDate.toISOString();
      
      const endDate = new Date(eventDate.getTime() + 3600000);
      params.endTime = endDate.toISOString();
    }

    // Extract search/keyword
    const searchMatch = command.match(/\b(?:search|find|look for)\s+["']?(.+?)["']?$/i);
    if (searchMatch) {
      params.search = searchMatch[1].trim();
      params.keyword = searchMatch[1].trim();
    }

    // Extract tags
    const tagMatch = command.match(/#(\w+)/g);
    if (tagMatch) {
      params.tags = tagMatch.map(t => t.replace('#', ''));
    }

    return params;
  }

  /**
   * Main method - process a user command
   */
  async execute(command, context) {
    const workflowId = uuidv4();
    context.workflowId = workflowId;
    const startTime = Date.now();

    try {
      // Log orchestrator receiving the command
      await this.logAction(context.userId, `Processing: "${command}"`, { command }, {}, 'running', workflowId, 0);

      // Detect intent
      const { agent, intent } = this.detectIntent(command);

      if (!agent || !intent) {
        const result = {
          message: 'I\'m not sure what you\'d like me to do. Try commands like:\n• "Create a task called Review PR"\n• "Show my tasks"\n• "Schedule a meeting tomorrow at 2pm"\n• "Create a note about project ideas"\n• "Plan my day"\n• "Show upcoming events"',
          suggestions: [
            'Create a task called "Review code"',
            'Show my tasks',
            'Schedule a meeting tomorrow at 3pm',
            'Create a note about project ideas',
            'Show today\'s events',
            'Plan my day'
          ]
        };
        await this.logAction(context.userId, 'No intent detected', { command }, result, 'success', workflowId, Date.now() - startTime);
        return { workflowId, ...result };
      }

      // Handle workflows (multi-step)
      if (agent === 'workflow') {
        return await this.executeWorkflow(intent, context, workflowId);
      }

      // Extract parameters
      const params = this.extractParams(command, intent);

      // Route to appropriate agent
      const agentInstance = this.agents[agent];
      const result = await agentInstance.process(intent, params, context);

      // Log orchestrator completion
      await this.logAction(context.userId, `Completed: ${result.action}`, { command, agent, intent }, result, 'success', workflowId, Date.now() - startTime);

      return {
        workflowId,
        ...result,
        message: this.formatResponse(intent, result)
      };
    } catch (error) {
      await this.logAction(context.userId, 'Error processing command', { command }, { error: error.message }, 'error', workflowId, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Execute multi-step workflows
   */
  async executeWorkflow(workflowType, context, workflowId) {
    const steps = [];

    switch (workflowType) {
      case 'plan_day': {
        // Step 1: Get today's events
        const events = await this.agents.calendar.process('today_events', {}, context);
        steps.push({ step: 1, agent: 'calendar', action: 'Fetched today\'s events', result: events });

        // Step 2: Get pending tasks
        const tasks = await this.agents.task.process('list_tasks', { status: 'todo', limit: 5 }, context);
        steps.push({ step: 2, agent: 'task', action: 'Fetched pending tasks', result: tasks });

        // Step 3: Get task stats
        const stats = await this.agents.task.process('task_stats', {}, context);
        steps.push({ step: 3, agent: 'task', action: 'Fetched task statistics', result: stats });

        const eventList = events.result || [];
        const taskList = tasks.result || [];

        return {
          workflowId,
          type: 'plan_day',
          message: `📅 **Your Day Plan**\n\n🗓️ **${eventList.length} event(s)** scheduled today\n✅ **${taskList.length} pending task(s)** to work on\n📊 Total tasks: ${stats.result?.total || 0} (${stats.result?.done || 0} completed)`,
          steps,
          data: {
            events: eventList,
            tasks: taskList,
            stats: stats.result
          }
        };
      }

      case 'weekly_summary': {
        // Step 1: Get this week's events
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const events = await this.agents.calendar.process('list_events', {
          startDate: weekStart.toISOString(),
          endDate: now.toISOString()
        }, context);
        steps.push({ step: 1, agent: 'calendar', action: 'Fetched week events', result: events });

        // Step 2: Get completed tasks this week
        const tasks = await this.agents.task.process('list_tasks', { status: 'done' }, context);
        steps.push({ step: 2, agent: 'task', action: 'Fetched completed tasks', result: tasks });

        // Step 3: Get stats
        const stats = await this.agents.task.process('task_stats', {}, context);
        steps.push({ step: 3, agent: 'task', action: 'Fetched statistics', result: stats });

        return {
          workflowId,
          type: 'weekly_summary',
          message: `📊 **Weekly Summary**\n\n🗓️ Events attended: ${(events.result || []).length}\n✅ Tasks completed: ${(tasks.result || []).length}\n📈 Overall: ${stats.result?.done || 0}/${stats.result?.total || 0} tasks done`,
          steps,
          data: {
            events: events.result || [],
            completedTasks: tasks.result || [],
            stats: stats.result
          }
        };
      }

      case 'create_project': {
        // Step 1: Create project note
        const note = await this.agents.notes.process('create_note', {
          title: 'New Project Plan',
          content: 'Project created via AgentFlow workflow.\n\n## Objectives\n- Define project scope\n- Set milestones\n- Assign resources',
          category: 'project',
          isPinned: true
        }, context);
        steps.push({ step: 1, agent: 'notes', action: 'Created project note', result: note });

        // Step 2: Create initial tasks
        const task1 = await this.agents.task.process('create_task', {
          title: 'Define project scope',
          priority: 'high',
          category: 'project'
        }, context);
        steps.push({ step: 2, agent: 'task', action: 'Created task 1', result: task1 });

        const task2 = await this.agents.task.process('create_task', {
          title: 'Set project milestones',
          priority: 'high',
          category: 'project'
        }, context);
        steps.push({ step: 3, agent: 'task', action: 'Created task 2', result: task2 });

        const task3 = await this.agents.task.process('create_task', {
          title: 'Create project timeline',
          priority: 'medium',
          category: 'project'
        }, context);
        steps.push({ step: 4, agent: 'task', action: 'Created task 3', result: task3 });

        // Step 3: Create kickoff event
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        const event = await this.agents.calendar.process('create_event', {
          title: 'Project Kickoff Meeting',
          startTime: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 3600000).toISOString(),
          type: 'meeting'
        }, context);
        steps.push({ step: 5, agent: 'calendar', action: 'Created kickoff event', result: event });

        return {
          workflowId,
          type: 'create_project',
          message: `🚀 **Project Created!**\n\n📝 Project note created & pinned\n✅ 3 initial tasks created\n🗓️ Kickoff meeting scheduled for tomorrow at 10 AM`,
          steps,
          data: {
            note: note.result,
            tasks: [task1.result, task2.result, task3.result],
            kickoffEvent: event.result
          }
        };
      }

      default:
        throw new Error(`Unknown workflow: ${workflowType}`);
    }
  }

  /**
   * Format a user-friendly response
   */
  formatResponse(intent, result) {
    if (!result.success) {
      return `❌ Error: ${result.error}`;
    }

    const data = result.result;

    switch (intent) {
      case 'create_task':
        return `✅ Task created: "${data.title}" (${data.priority} priority)`;
      case 'list_tasks':
        if (Array.isArray(data)) {
          if (data.length === 0) return '📋 No tasks found.';
          return `📋 Found ${data.length} task(s):\n${data.map((t, i) => `  ${i + 1}. ${t.title} [${t.status}] - ${t.priority}`).join('\n')}`;
        }
        return '📋 Tasks retrieved.';
      case 'complete_task':
        return `✅ Task marked as done!`;
      case 'delete_task':
        return `🗑️ Task deleted.`;
      case 'task_stats':
        return `📊 Tasks: ${data.total} total | ${data.todo} todo | ${data.inProgress} in progress | ${data.done} done | ${data.urgent} urgent`;
      case 'create_event':
        return `📅 Event created: "${data.title}"`;
      case 'list_events':
      case 'today_events':
      case 'upcoming_events':
        if (Array.isArray(data)) {
          if (data.length === 0) return '📅 No events found.';
          return `📅 Found ${data.length} event(s):\n${data.map((e, i) => `  ${i + 1}. ${e.title} - ${new Date(e.startTime).toLocaleString()}`).join('\n')}`;
        }
        return '📅 Events retrieved.';
      case 'delete_event':
        return `🗑️ Event deleted.`;
      case 'create_note':
        return `📝 Note created: "${data.title}"`;
      case 'list_notes':
      case 'search_notes':
        if (Array.isArray(data)) {
          if (data.length === 0) return '📝 No notes found.';
          return `📝 Found ${data.length} note(s):\n${data.map((n, i) => `  ${i + 1}. ${n.title} ${n.isPinned ? '📌' : ''}`).join('\n')}`;
        }
        return '📝 Notes retrieved.';
      case 'delete_note':
        return `🗑️ Note deleted.`;
      default:
        return `✅ Action completed successfully.`;
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
      console.error('Failed to log orchestrator action:', err.message);
    }
  }
}

module.exports = new OrchestratorAgent();
