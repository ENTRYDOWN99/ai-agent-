import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/agent', icon: '🤖', label: 'AI Agent' },
    { path: '/tasks', icon: '✅', label: 'Tasks' },
    { path: '/calendar', icon: '📅', label: 'Calendar' },
    { path: '/notes', icon: '📝', label: 'Notes' },
  ];

  const toolItems = [
    { path: '/logs', icon: '📋', label: 'Agent Logs' },
    { path: '/workflows', icon: '⚡', label: 'Workflows' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">🤖</div>
        <h1>AgentFlow</h1>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Main</span>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <span className="nav-section-label">Tools</span>
        {toolItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role || 'user'}</div>
          </div>
        </div>
        <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
