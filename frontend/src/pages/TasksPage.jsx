import { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', category: 'general', dueDate: '' });
  const toast = useToast();

  useEffect(() => { loadTasks(); }, [filter.status, filter.priority]);

  const loadTasks = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.search) params.search = filter.search;
      const res = await tasksAPI.getAll(params);
      setTasks(res.data.tasks || []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTasks();
  };

  const openCreateModal = () => {
    setEditTask(null);
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', category: 'general', dueDate: '' });
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      category: task.category || 'general',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await tasksAPI.update(editTask._id, form);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(form);
        toast.success('Task created');
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      toast.error('Failed to save task');
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await tasksAPI.update(task._id, { status: newStatus });
      loadTasks();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      toast.success('Task deleted');
      loadTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const statusFilters = ['', 'todo', 'in-progress', 'done'];
  const priorityFilters = ['', 'low', 'medium', 'high', 'urgent'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">✅ Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ New Task</button>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="toolbar">
          <form onSubmit={handleSearch} className="search-bar flex-1">
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Search tasks..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              id="task-search"
            />
          </form>
          <div className="filter-chips">
            {statusFilters.map(s => (
              <button key={s || 'all'} className={`filter-chip ${filter.status === s ? 'active' : ''}`}
                onClick={() => setFilter({ ...filter, status: s })}>
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="filter-chips">
            {priorityFilters.map(p => (
              <button key={p || 'any'} className={`filter-chip ${filter.priority === p ? 'active' : ''}`}
                onClick={() => setFilter({ ...filter, priority: p })}>
                {p ? <><span className={`priority-dot ${p}`}></span>{p}</> : 'Any Priority'}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '64px' }} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No tasks found</h3>
            <p>Create your first task or adjust filters</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openCreateModal}>+ Create Task</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((task, i) => (
              <div key={task._id} className="task-item animate-fadeIn" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className={`task-check ${task.status === 'done' ? 'done' : ''}`}
                  onClick={() => toggleStatus(task)} title="Toggle done">
                  {task.status === 'done' && '✓'}
                </div>
                <div className="task-info" onClick={() => openEditModal(task)}>
                  <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                  <div className="task-meta">
                    <span><span className={`priority-dot ${task.priority}`}></span>{task.priority}</span>
                    <span>{task.category}</span>
                    {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>}
                    {task.createdBy === 'agent' && <span className="badge badge-purple">🤖 agent</span>}
                  </div>
                </div>
                <span className={`badge status-${task.status}`}>{task.status}</span>
                <div className="task-actions">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditModal(task)} title="Edit">✏️</button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteTask(task._id)} title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTask ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Title</label>
            <input id="task-title" className="form-input" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Task title" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea id="task-desc" className="form-textarea" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select id="task-priority" className="form-select" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Status</label>
              <select id="task-status" className="form-select" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="task-category">Category</label>
              <input id="task-category" className="form-input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="general" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-due">Due Date</label>
              <input id="task-due" className="form-input" type="date" value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Create'} Task</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
