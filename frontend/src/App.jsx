import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AgentPage from './pages/AgentPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import NotesPage from './pages/NotesPage';
import LogsPage from './pages/LogsPage';
import WorkflowsPage from './pages/WorkflowsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'float 2s ease-in-out infinite' }}>🤖</div>
          <div className="spinner" style={{ margin: '0 auto', width: '32px', height: '32px', borderColor: 'transparent', borderTopColor: 'var(--accent-primary)' }}></div>
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading AgentFlow...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={
              <PublicRoute><LoginPage /></PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute><Layout /></ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="agent" element={<AgentPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
