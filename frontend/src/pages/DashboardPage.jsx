import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardAPI.getSummary();
      setData(res.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
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

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Loading your workspace...</p></div>
        </div>
        <div className="page-body">
          <div className="stats-grid">
            {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card stat-card" />)}
          </div>
        </div>
      </>
    );
  }

  const stats = data?.stats || { tasks: {}, events: {}, notes: {} };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your AI-powered workspace overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/agent')}>
          🤖 Ask Agent
        </button>
      </div>

      <div className="page-body">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card animate-fadeIn" style={{ animationDelay: '0.05s' }}>
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>✅</div>
            <div className="stat-value">{stats.tasks?.total || 0}</div>
            <div className="stat-label">Total Tasks</div>
            <div className="stat-change" style={{ color: 'var(--success)' }}>
              {stats.tasks?.done || 0} completed
            </div>
          </div>

          <div className="stat-card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>⏳</div>
            <div className="stat-value">{stats.tasks?.inProgress || 0}</div>
            <div className="stat-label">In Progress</div>
            <div className="stat-change" style={{ color: 'var(--warning)' }}>
              {stats.tasks?.todo || 0} pending
            </div>
          </div>

          <div className="stat-card animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>📅</div>
            <div className="stat-value">{stats.events?.today || 0}</div>
            <div className="stat-label">Today's Events</div>
            <div className="stat-change" style={{ color: 'var(--info)' }}>
              {stats.events?.total || 0} total
            </div>
          </div>

          <div className="stat-card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}>📝</div>
            <div className="stat-value">{stats.notes?.total || 0}</div>
            <div className="stat-label">Notes</div>
            <div className="stat-change" style={{ color: 'var(--text-accent)' }}>
              {stats.notes?.pinned || 0} pinned
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Recent Tasks */}
          <div className="card animate-fadeIn" style={{ animationDelay: '0.25s' }}>
            <div className="card-header">
              <h3 className="card-title">📋 Recent Tasks</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View All →</button>
            </div>
            {(!data?.recentTasks || data.recentTasks.length === 0) ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No tasks yet. Create one!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.recentTasks.map(task => (
                  <div key={task._id} className="task-item">
                    <div className={`task-check ${task.status === 'done' ? 'done' : ''}`}>
                      {task.status === 'done' && '✓'}
                    </div>
                    <div className="task-info">
                      <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                      <div className="task-meta">
                        <span><span className={`priority-dot ${task.priority}`}></span>{task.priority}</span>
                        {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
                      </div>
                    </div>
                    <span className={`badge status-${task.status}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Events */}
          <div className="card animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="card-header">
              <h3 className="card-title">🗓️ Today's Events</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')}>View All →</button>
            </div>
            {(!data?.todayEvents || data.todayEvents.length === 0) ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No events today. Enjoy your free time!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.todayEvents.map(event => (
                  <div key={event._id} className="event-item">
                    <div className="event-color-bar" style={{ background: event.color || '#6366f1' }}></div>
                    <div className="event-time-block">
                      <div className="time">{formatTime(event.startTime)}</div>
                    </div>
                    <div className="event-details">
                      <div className="event-title">{event.title}</div>
                      <div className="event-info">
                        {event.location && `📍 ${event.location}`}
                        {event.type && ` · ${event.type}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: '20px' }}>
          {/* Pinned Notes */}
          <div className="card animate-fadeIn" style={{ animationDelay: '0.35s' }}>
            <div className="card-header">
              <h3 className="card-title">📌 Pinned Notes</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notes')}>View All →</button>
            </div>
            {(!data?.pinnedNotes || data.pinnedNotes.length === 0) ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No pinned notes</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.pinnedNotes.map(note => (
                  <div key={note._id} className="task-item" onClick={() => navigate('/notes')}>
                    <span>📌</span>
                    <div className="task-info">
                      <div className="task-title">{note.title}</div>
                      <div className="task-meta">
                        <span>{note.category}</span>
                        <span>{formatDate(note.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agent Activity */}
          <div className="card animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="card-header">
              <h3 className="card-title">🤖 Agent Activity</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/logs')}>View All →</button>
            </div>
            {(!data?.recentLogs || data.recentLogs.length === 0) ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No agent activity yet. Try the AI Agent!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.recentLogs.slice(0, 5).map(log => (
                  <div key={log._id} className="log-item">
                    <div className="log-agent-icon" style={{
                      background: log.agentName === 'orchestrator' ? 'rgba(99,102,241,0.15)' :
                        log.agentName === 'task-agent' ? 'rgba(34,197,94,0.15)' :
                        log.agentName === 'calendar-agent' ? 'rgba(59,130,246,0.15)' :
                        'rgba(245,158,11,0.15)',
                      color: log.agentName === 'orchestrator' ? '#818cf8' :
                        log.agentName === 'task-agent' ? '#4ade80' :
                        log.agentName === 'calendar-agent' ? '#60a5fa' : '#fbbf24'
                    }}>
                      {log.agentName === 'orchestrator' ? '🧠' :
                       log.agentName === 'task-agent' ? '✅' :
                       log.agentName === 'calendar-agent' ? '📅' : '📝'}
                    </div>
                    <div className="log-content">
                      <div className="log-action">{log.action}</div>
                      <div className="log-time">{timeAgo(log.createdAt)} · <span className="log-duration">{log.duration}ms</span></div>
                    </div>
                    <span className={`badge ${log.status === 'success' ? 'badge-success' : log.status === 'error' ? 'badge-danger' : 'badge-warning'}`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
