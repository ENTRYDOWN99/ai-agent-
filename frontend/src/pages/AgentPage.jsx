import { useState, useRef, useEffect } from 'react';
import { agentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AgentPage() {
  const [messages, setMessages] = useState([
    {
      type: 'agent',
      content: "👋 Hi! I'm your AgentFlow AI assistant. I can help you manage tasks, events, and notes. Try commands like:\n\n• \"Create a task called Review PR with high priority\"\n• \"Show my tasks\"\n• \"Schedule a meeting tomorrow at 3pm\"\n• \"Create a note about project ideas\"\n• \"Plan my day\"\n• \"Create a new project\"",
      agent: 'orchestrator',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const suggestions = [
    'Create a task called "Review code"',
    'Show my tasks',
    'Plan my day',
    'Schedule a meeting tomorrow at 2pm',
    'Create a note about project ideas',
    'Show upcoming events',
    'Task stats',
    'Summarize my week',
    'Create a new project'
  ];

  const handleSend = async (command) => {
    const cmd = command || input.trim();
    if (!cmd) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: cmd, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await agentAPI.execute(cmd);
      const result = res.data;

      let agentMessage = {
        type: 'agent',
        content: result.message || 'Action completed.',
        agent: result.agent || 'orchestrator',
        timestamp: new Date(),
        data: result
      };

      // If it's a workflow with steps
      if (result.steps) {
        agentMessage.steps = result.steps;
        agentMessage.workflowType = result.type;
      }

      // If there are suggestions
      if (result.suggestions) {
        agentMessage.suggestions = result.suggestions;
      }

      setMessages(prev => [...prev, agentMessage]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Something went wrong';
      setMessages(prev => [...prev, {
        type: 'agent',
        content: `❌ Error: ${errorMsg}`,
        agent: 'orchestrator',
        timestamp: new Date(),
        isError: true
      }]);
      toast.error('Agent execution failed');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWorkflow = async (workflow) => {
    setMessages(prev => [...prev, { type: 'user', content: `Run workflow: ${workflow}`, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const res = await agentAPI.runWorkflow(workflow);
      setMessages(prev => [...prev, {
        type: 'agent',
        content: res.data.message || 'Workflow completed.',
        agent: 'orchestrator',
        timestamp: new Date(),
        data: res.data,
        steps: res.data.steps,
        workflowType: res.data.type
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'agent',
        content: `❌ Workflow failed: ${err.response?.data?.message || err.message}`,
        agent: 'orchestrator',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getAgentColor = (agent) => {
    switch (agent) {
      case 'orchestrator': return '#818cf8';
      case 'task-agent': return '#4ade80';
      case 'calendar-agent': return '#60a5fa';
      case 'notes-agent': return '#fbbf24';
      default: return '#818cf8';
    }
  };

  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'orchestrator': return '🧠';
      case 'task-agent': return '✅';
      case 'calendar-agent': return '📅';
      case 'notes-agent': return '📝';
      default: return '🤖';
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 AI Agent</h1>
          <p className="page-subtitle">Chat with your intelligent task assistant</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleWorkflow('plan_day')}>
            📋 Plan My Day
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleWorkflow('weekly_summary')}>
            📊 Weekly Summary
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleWorkflow('create_project')}>
            🚀 New Project
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="agent-panel" style={{ height: 'calc(100vh - 160px)' }}>
          <div className="agent-header">
            <div className="agent-status"></div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>AgentFlow Orchestrator</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Coordinating Task Agent · Calendar Agent · Notes Agent
              </div>
            </div>
          </div>

          <div className="agent-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`agent-message ${msg.type}`}>
                {msg.type === 'agent' && (
                  <div className="message-header">
                    <span>{getAgentIcon(msg.agent)}</span>
                    <span style={{ color: getAgentColor(msg.agent) }}>{msg.agent || 'orchestrator'}</span>
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                {/* Workflow steps */}
                {msg.steps && (
                  <div className="workflow-steps">
                    {msg.steps.map((step, si) => (
                      <div key={si} className="workflow-step">
                        <div className="step-number">{step.step}</div>
                        <span className="step-agent">{step.agent}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{step.action}</span>
                        <span className={`badge ${step.result?.success !== false ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto' }}>
                          {step.result?.success !== false ? '✓' : '✕'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {msg.suggestions && (
                  <div className="suggestions">
                    {msg.suggestions.map((s, si) => (
                      <button key={si} className="suggestion-chip" onClick={() => handleSend(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="agent-input-area">
            <input
              ref={inputRef}
              className="form-input"
              type="text"
              placeholder="Type a command... (e.g., 'Create a task called Review PR')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              id="agent-command-input"
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? <span className="spinner"></span> : '▶'}
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Quick commands:</div>
          <div className="suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
