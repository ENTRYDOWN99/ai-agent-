const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const orchestrator = require('../agents/orchestrator');
const AgentLog = require('../models/AgentLog');

router.use(auth);

// @route   POST /api/agent/execute
// @desc    Send a command to the orchestrator agent
router.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ message: 'Command is required' });
    }

    const context = { userId: req.user.id };
    const result = await orchestrator.execute(command, context);

    res.json(result);
  } catch (error) {
    console.error('Agent execution error:', error);
    res.status(500).json({ message: 'Agent execution failed', error: error.message });
  }
});

// @route   GET /api/agent/logs
// @desc    Get agent activity logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 30, agent, status, workflowId } = req.query;
    
    let query = { userId: req.user.id };
    if (agent) query.agentName = agent;
    if (status) query.status = status;
    if (workflowId) query.workflowId = workflowId;

    const logs = await AgentLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agent logs' });
  }
});

// @route   POST /api/agent/workflow
// @desc    Execute a named workflow
router.post('/workflow', async (req, res) => {
  try {
    const { workflow } = req.body;

    if (!workflow) {
      return res.status(400).json({ message: 'Workflow name is required' });
    }

    const context = { userId: req.user.id };

    // Map workflow names to commands
    const workflowCommands = {
      'plan_day': 'Plan my day',
      'weekly_summary': 'Summarize my week',
      'create_project': 'Create a new project'
    };

    const command = workflowCommands[workflow];
    if (!command) {
      return res.status(400).json({ 
        message: 'Unknown workflow',
        available: Object.keys(workflowCommands)
      });
    }

    const result = await orchestrator.execute(command, context);
    res.json(result);
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ message: 'Workflow execution failed', error: error.message });
  }
});

// @route   GET /api/agent/tools
// @desc    Get available MCP tools
router.get('/tools', async (req, res) => {
  try {
    const registry = require('../mcp/registry');
    const tools = registry.getToolSchemas();
    res.json(tools);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tools' });
  }
});

module.exports = router;
