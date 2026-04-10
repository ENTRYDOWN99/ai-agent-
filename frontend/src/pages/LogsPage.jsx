import { useState, useEffect } from 'react';
import { agentAPI } from '../services/api';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('');

  useEffect(() => { loadLogs(); }, [filterAgent]);

  const loadLogs = async () => {
    try {
      const params = { limit: 50 };
      if (filterAgent) params.agent = filterAgent;
      const res = await agentAPI.getLogs(params);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const agentConfig = {
    orchestrator: { icon: '🧠', color: '#818cf8', bg: 'rgba(99,102,241,0.15)' },
    'task-agent': { icon: '✅', color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
    'calendar-agent': { icon: '📅', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)' },
    'notes-agent': { icon: '📝', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' }
  };

  const agents = ['', 'orchestrator', 'task-agent', 'calendar-agent', 'notes-agent'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Agent Logs</h1>
          <p className="page-subtitle">Track all AI agent activities</p>
        </div>
        <button className="btn btn-secondary" onClick={loadLogs}>🔄 Refresh</button>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="filter-chips">
            {agents.map(a => (
              <button key={a || 'all'} className={`filter-chip ${filterAgent === a ? 'active' : ''}`}
                onClick={() => setFilterAgent(a)}>
                {a ? `${agentConfig[a]?.icon || '🤖'} ${a}` : 'All Agents'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '48px' }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No logs found</h3>
            <p>Agent activity will appear here after you use the AI Agent</p>
          </div>
        ) : (
          <div className="card">
            {logs.map((log, i) => {
              const config = agentConfig[log.agentName] || agentConfig.orchestrator;
              return (
                <div key={log._id} className="log-item animate-fadeIn" style={{ animationDelay: `${i * 0.02}s` }}>
                  <div className="log-agent-icon" style={{ background: config.bg, color: config.color }}>
                    {config.icon}
                  </div>
                  <div className="log-content">
                    <div className="log-action">{log.action}</div>
                    <div className="log-time">
                      {log.agentName} · {timeAgo(log.createdAt)} · <span className="log-duration">{log.duration}ms</span>
                      {log.workflowId && <span style={{ marginLeft: '8px', color: 'var(--text-accent)' }}>🔗 {log.workflowId.slice(0, 8)}</span>}
                    </div>
                  </div>
                  <span className={`badge ${log.status === 'success' ? 'badge-success' : log.status === 'error' ? 'badge-danger' : log.status === 'running' ? 'badge-info' : 'badge-warning'}`}>
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
